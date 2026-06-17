# RAG service with graceful fallback
# FAISS and sentence-transformers run locally only
# In production, AI coach works without RAG

try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
    from pathlib import Path
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

model = None
faiss_index = None
document_chunks = []


def load_knowledge_base():
    global model, faiss_index, document_chunks

    if not FAISS_AVAILABLE:
        print("RAG disabled - FAISS not available in this environment")
        return

    from pathlib import Path
    import numpy as np

    model = SentenceTransformer('all-MiniLM-L6-v2')
    knowledge_dir = Path(__file__).parent.parent / "knowledge"

    if not knowledge_dir.exists():
        print("Knowledge base directory not found")
        return

    all_chunks = []
    for file_path in knowledge_dir.glob("*.txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        sentences = content.split('\n')
        chunk = []
        for line in sentences:
            line = line.strip()
            if not line:
                continue
            chunk.append(line)
            if len(chunk) >= 3:
                all_chunks.append({
                    "text": ' '.join(chunk),
                    "source": file_path.stem
                })
                chunk = [chunk[-1]]

        if chunk:
            all_chunks.append({
                "text": ' '.join(chunk),
                "source": file_path.stem
            })

    if not all_chunks:
        return

    document_chunks = all_chunks
    texts = [chunk["text"] for chunk in all_chunks]
    print(f"Building FAISS index from {len(texts)} knowledge chunks...")

    embeddings = model.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings).astype('float32')

    dimension = embeddings.shape[1]
    faiss_index = faiss.IndexFlatL2(dimension)
    faiss_index.add(embeddings)

    print(f"FAISS index built with {faiss_index.ntotal} vectors")


def search_knowledge_base(query: str, top_k: int = 3) -> str:
    if not FAISS_AVAILABLE or faiss_index is None or not document_chunks:
        return ""

    import numpy as np
    query_vector = model.encode([query])
    query_vector = np.array(query_vector).astype('float32')

    distances, indices = faiss_index.search(query_vector, top_k)

    results = []
    for idx in indices[0]:
        if idx < len(document_chunks):
            chunk = document_chunks[idx]
            results.append(
                f"[{chunk['source'].replace('_', ' ').title()}]\n{chunk['text']}"
            )

    return "\n\n".join(results)


def is_knowledge_base_loaded() -> bool:
    return FAISS_AVAILABLE and faiss_index is not None and len(document_chunks) > 0