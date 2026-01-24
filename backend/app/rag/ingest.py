import os
import pickle
import faiss
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

PDF_DIR = "data/pdfs"
INDEX_DIR = "app/rag/index"
os.makedirs(INDEX_DIR, exist_ok=True)

model = SentenceTransformer("all-MiniLM-L6-v2")

documents = []

for file in os.listdir(PDF_DIR):
    if file.endswith(".pdf"):
        reader = PdfReader(os.path.join(PDF_DIR, file))
        for page in reader.pages:
            text = page.extract_text()
            if text:
                documents.append(text.strip())

embeddings = model.encode(documents)

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

with open(f"{INDEX_DIR}/index.faiss", "wb") as f:
    pickle.dump(index, f)

with open(f"{INDEX_DIR}/docs.pkl", "wb") as f:
    pickle.dump(documents, f)

print("✅ RAG index built successfully")
