from app.rag.retriever import retrieve_context
from app.llm.openai_client import stream_llm

COMPANY_KEYWORDS = ["kregg", "company", "services", "products"]

def is_company_query(query: str) -> bool:
    return any(word in query.lower() for word in COMPANY_KEYWORDS)

def stream_rag_response(query: str):
    if is_company_query(query):
        context = retrieve_context(query)

        if not context.strip():
            yield "I could not find this information in the company documents."
            return

        prompt = f"""
Answer ONLY using the context below.
If the answer is not present, say you don't know.

Context:
{context}

Question:
{query}
"""
        yield from stream_llm(prompt)
    else:
        yield from stream_llm(query)
