"""
RAG Retrieval
=============
Query ChromaDB → return top-k relevant chunks with metadata.
"""
from app.rag.ingest import get_chroma_collection, get_embedder


async def retrieve(
    query: str,
    patient_id: str | None = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Retrieve top-k chunks relevant to `query`.
    Optionally filter by patient_id.
    Returns list of {text, metadata, distance} dicts.
    """
    embedder = get_embedder()
    query_embedding = embedder.encode([query], normalize_embeddings=True).tolist()[0]

    chroma_col = get_chroma_collection()

    where_filter = {"patient_id": patient_id} if patient_id else None

    results = chroma_col.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    if results and results["documents"]:
        for text, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({"text": text, "metadata": meta, "distance": dist})

    return chunks


def build_context(chunks: list[dict]) -> str:
    """Concatenate retrieved chunks into a single context string for the LLM."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk["metadata"].get("file_name", "unknown")
        parts.append(f"[Source {i}: {source}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)
