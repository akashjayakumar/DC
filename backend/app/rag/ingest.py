from __future__ import annotations
"""
RAG Ingestion Pipeline
======================
Flow:  PDF / TXT  →  extract text  →  chunk  →  embed  →  ChromaDB
No LangChain — uses pypdf and sentence-transformers directly.
"""
from typing import Optional
from pathlib import Path
from bson import ObjectId

import chromadb
from chromadb.config import Settings as ChromaSettings
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.db.mongo import get_documents_collection

# ── Singletons (loaded once per process) ──────────────────────────────────

_embedder: SentenceTransformer | None = None
_chroma_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None

COLLECTION_NAME = "dental_documents"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _embedder


def get_chroma_collection() -> chromadb.Collection:
    global _chroma_client, _collection
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    if _collection is None:
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


# ── Text Splitting Logic ──────────────────────────────────────────────────

def simple_recursive_text_splitter(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: list[str] = ["\n\n", "\n", " ", ""],
) -> list[str]:
    """
    A simple recursive text splitter that mimics LangChain's RecursiveCharacterTextSplitter.
    """
    final_chunks = []

    def split(text_to_split: str, current_separators: list[str]):
        if len(text_to_split) <= chunk_size:
            final_chunks.append(text_to_split)
            return

        if not current_separators:
            # No more separators, just hard cut
            for i in range(0, len(text_to_split), chunk_size - chunk_overlap):
                final_chunks.append(text_to_split[i : i + chunk_size])
            return

        separator = current_separators[0]
        remaining_separators = current_separators[1:]

        if separator == "":
            # Hard split
            for i in range(0, len(text_to_split), chunk_size - chunk_overlap):
                final_chunks.append(text_to_split[i : i + chunk_size])
            return

        parts = text_to_split.split(separator)
        current_chunk = ""

        for part in parts:
            if len(current_chunk) + len(part) + (len(separator) if current_chunk else 0) <= chunk_size:
                if current_chunk:
                    current_chunk += separator
                current_chunk += part
            else:
                if current_chunk:
                    final_chunks.append(current_chunk)
                
                # If part itself is too large, split it further
                if len(part) > chunk_size:
                    split(part, remaining_separators)
                    current_chunk = ""
                else:
                    current_chunk = part

        if current_chunk:
            final_chunks.append(current_chunk)

    split(text, separators)
    return final_chunks


# ── Main ingest function ───────────────────────────────────────────────────

async def ingest_document(document_id: str) -> int:
    """
    Ingest a document into ChromaDB.
    Returns the number of chunks stored.
    """
    col = get_documents_collection()
    doc = await col.find_one({"_id": ObjectId(document_id)})
    if not doc:
        raise ValueError(f"Document {document_id} not found in MongoDB")

    file_path = Path(settings.upload_dir) / doc["file_name"]
    if not file_path.exists():
        raise FileNotFoundError(f"File not found on disk: {file_path}")

    # ── 1. Extract text ────────────────────────────────────────────────────
    full_text = ""
    if doc["mime_type"] == "application/pdf":
        try:
            reader = PdfReader(str(file_path))
            full_text = "\n".join(page.extract_text() for page in reader.pages)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    else:
        try:
            full_text = file_path.read_text(encoding="utf-8")
        except Exception as e:
            raise ValueError(f"Failed to read text file: {str(e)}")

    # ── 2. Chunk ───────────────────────────────────────────────────────────
    chunks = simple_recursive_text_splitter(
        full_text,
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    if not chunks:
        return 0

    # ── 3. Embed ───────────────────────────────────────────────────────────
    embedder = get_embedder()
    embeddings = embedder.encode(chunks, normalize_embeddings=True).tolist()

    # ── 4. Store in ChromaDB ───────────────────────────────────────────────
    chroma_col = get_chroma_collection()
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "document_id": document_id,
            "patient_id": doc["patient_id"],
            "file_type": doc["file_type"],
            "file_name": doc["original_name"],
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]
    chroma_col.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)

    # ── 5. Update MongoDB record ───────────────────────────────────────────
    await col.update_one(
        {"_id": doc["_id"]},
        {"$set": {"extracted_text": full_text[:5000], "ingested_to_chroma": True}},
    )

    return len(chunks)
