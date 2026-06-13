"""
RAG Service
===========
Orchestrates: retrieve chunks → build prompt → call LLM → return answer.
"""
from app.rag.retrieve import retrieve, build_context
from app.services import llm_service
from app.services.patient_service import get_patient
from app.services.visit_service import get_visits_for_patient


PATIENT_SUMMARY_SYSTEM = """You are DentalCopilot, an expert dental clinical assistant.
Your job is to generate clear, concise patient summaries for dentists.
Always be factual. If information is missing, say so explicitly.
Format: use short paragraphs, no markdown headers."""


RAG_QUERY_SYSTEM = """You are DentalCopilot, an expert dental clinical assistant.
Answer questions using ONLY the provided context. If the answer is not in the context, say:
'I could not find this information in the available documents.'
Be concise and clinical."""


async def generate_patient_summary(patient_id: str) -> str:
    """
    Feature: Patient Summary Generator
    Reads patient data + visit history → asks LLM to summarise.
    """
    patient = await get_patient(patient_id)
    visits = await get_visits_for_patient(patient_id, limit=20)

    visit_text = ""
    if visits:
        visit_lines = []
        for v in visits:
            visit_lines.append(
                f"- {v['date'].strftime('%Y-%m-%d') if hasattr(v['date'], 'strftime') else str(v['date'])[:10]}: {v['diagnosis']} → {v['treatment']}"
                + (f" (Notes: {v['notes']})" if v.get("notes") else "")
            )
        visit_text = "Visit history:\n" + "\n".join(visit_lines)
    else:
        visit_text = "No visits on record."

    conditions = ", ".join(patient.get("conditions", [])) or "None reported"
    allergies = ", ".join(patient.get("allergies", [])) or "None reported"

    prompt = f"""Generate a clinical summary for this patient.

Patient: {patient['name']}, {patient['age']} years old, {patient['gender']}
Phone: {patient['phone']}
Medical conditions: {conditions}
Known allergies: {allergies}

{visit_text}

Provide:
1. Brief patient overview
2. Dental history summary
3. Key risk factors
4. Recommended follow-up actions
"""
    return await llm_service.generate(prompt, system=PATIENT_SUMMARY_SYSTEM)


async def rag_query(query: str, patient_id: str | None = None) -> dict:
    """
    Feature: General RAG Q&A over uploaded documents.
    Returns answer + source chunks used.
    """
    chunks = await retrieve(query, patient_id=patient_id, top_k=5)
    if not chunks:
        return {
            "answer": "No relevant documents found. Please upload relevant records first.",
            "sources": [],
        }

    context = build_context(chunks)
    prompt = f"""Context from patient documents:

{context}

Question: {query}

Answer:"""

    answer = await llm_service.generate(prompt, system=RAG_QUERY_SYSTEM)
    sources = [c["metadata"].get("file_name", "unknown") for c in chunks]

    return {"answer": answer, "sources": list(set(sources))}


async def insurance_query(query: str, patient_id: str) -> dict:
    """
    Feature: Insurance Coverage Q&A
    Scoped to insurance documents for a specific patient.
    """
    # Retrieve from ChromaDB filtered by patient + file_type=insurance
    from app.rag.ingest import get_chroma_collection, get_embedder

    embedder = get_embedder()
    query_embedding = embedder.encode([query], normalize_embeddings=True).tolist()[0]
    chroma_col = get_chroma_collection()

    results = chroma_col.query(
        query_embeddings=[query_embedding],
        n_results=5,
        where={"$and": [{"patient_id": patient_id}, {"file_type": "insurance"}]},
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    if results and results["documents"] and results["documents"][0]:
        for text, meta, dist in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        ):
            chunks.append({"text": text, "metadata": meta, "distance": dist})

    if not chunks:
        return {
            "answer": "No insurance documents found for this patient. Please upload insurance PDFs first.",
            "sources": [],
        }

    context = build_context(chunks)
    prompt = f"""Insurance document excerpts:

{context}

Insurance question: {query}

Answer based only on the documents above:"""

    answer = await llm_service.generate(prompt, system=RAG_QUERY_SYSTEM, temperature=0.1)
    sources = [c["metadata"].get("file_name", "unknown") for c in chunks]
    return {"answer": answer, "sources": list(set(sources))}
