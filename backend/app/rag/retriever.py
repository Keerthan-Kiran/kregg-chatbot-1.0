import pickle
import faiss
from sentence_transformers import SentenceTransformer

INDEX_DIR = "app/rag/index"

model = SentenceTransformer("all-MiniLM-L6-v2")

with open(f"{INDEX_DIR}/index.faiss", "rb") as f:
    index = pickle.load(f)

with open(f"{INDEX_DIR}/docs.pkl", "rb") as f:
    documents = pickle.load(f)

def retrieve_context(query: str, k: int = 3) -> str:
    embedding = model.encode([query])
    _, indices = index.search(embedding, k)
    chunks = [documents[i] for i in indices[0]]
    return "\n\n".join(chunks)
