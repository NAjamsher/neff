import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

# ── What is happening here ────────────────────────────────────────────────────
# 1. We load all fitness knowledge documents from the knowledge folder
# 2. We convert each document chunk into a vector (embedding)
#    A vector is just a list of 384 numbers that represent the meaning of text
#    Similar meaning = similar numbers = close in vector space
# 3. We store all vectors in FAISS index
# 4. When user asks a question:
#    - Convert question to vector
#    - Find closest vectors in FAISS (most relevant documents)
#    - Return those documents as context for the AI
# ─────────────────────────────────────────────────────────────────────────────

# Load the sentence transformer model
# This model converts text → vectors (embeddings)
# all-MiniLM-L6-v2 is small, fast, and works well for semantic search
model = SentenceTransformer('all-MiniLM-L6-v2')

# Global FAISS index and document store
# These are loaded once when the app starts
faiss_index = None
document_chunks = []


def load_knowledge_base():
    """
    Load all .txt files from the knowledge folder.
    Split them into chunks.
    Convert chunks to vectors.
    Store in FAISS index.
    """
    global faiss_index, document_chunks

    knowledge_dir = Path(__file__).parent.parent / "knowledge"

    if not knowledge_dir.exists():
        print("Knowledge base directory not found")
        return

    all_chunks = []

    # Read every .txt file in the knowledge folder
    for file_path in knowledge_dir.glob("*.txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Split into chunks of ~3 sentences each
        # Why chunks? Because we want to find the most relevant
        # SECTION of a document, not the whole document
        sentences = content.split('\n')
        chunk = []
        for line in sentences:
            line = line.strip()
            if not line:
                continue
            chunk.append(line)
            # Every 3 lines = one chunk
            if len(chunk) >= 3:
                chunk_text = ' '.join(chunk)
                all_chunks.append({
                    "text": chunk_text,
                    "source": file_path.stem  # filename without .txt
                })
                # Overlap: keep last line for context continuity
                chunk = [chunk[-1]]

        # Add remaining lines as final chunk
        if chunk:
            all_chunks.append({
                "text": ' '.join(chunk),
                "source": file_path.stem
            })

    if not all_chunks:
        print("No documents found in knowledge base")
        return

    document_chunks = all_chunks

    # Convert all chunks to vectors (embeddings)
    # This is where the magic happens
    # "Protein is important for muscle" and "Protein helps build muscle"
    # will have very similar vectors even though the words are different
    texts = [chunk["text"] for chunk in all_chunks]
    print(f"Building FAISS index from {len(texts)} knowledge chunks...")

    embeddings = model.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings).astype('float32')

    # Create FAISS index
    # IndexFlatL2 = finds nearest vectors using L2 (Euclidean) distance
    # dimension = 384 (size of all-MiniLM-L6-v2 vectors)
    dimension = embeddings.shape[1]
    faiss_index = faiss.IndexFlatL2(dimension)

    # Add all embeddings to the index
    faiss_index.add(embeddings)

    print(f"FAISS index built with {faiss_index.ntotal} vectors")


def search_knowledge_base(query: str, top_k: int = 3) -> str:
    """
    Search the knowledge base for content relevant to the query.

    How it works:
    1. Convert the query to a vector
    2. Find the top_k closest vectors in FAISS
    3. Return the corresponding text chunks

    Example:
    Query: "How much protein do I need?"
    FAISS finds: chunks about protein requirements, MPS, protein sources
    Returns: Those chunks as a string for the AI to use
    """
    global faiss_index, document_chunks

    if faiss_index is None or not document_chunks:
        return ""

    # Convert query to vector
    query_vector = model.encode([query])
    query_vector = np.array(query_vector).astype('float32')

    # Search FAISS for top_k most similar chunks
    distances, indices = faiss_index.search(query_vector, top_k)

    # Build result string
    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(document_chunks):
            chunk = document_chunks[idx]
            results.append(
                f"[{chunk['source'].replace('_', ' ').title()}]\n{chunk['text']}"
            )

    return "\n\n".join(results)


def is_knowledge_base_loaded() -> bool:
    return faiss_index is not None and len(document_chunks) > 0