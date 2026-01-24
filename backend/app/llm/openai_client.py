import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are a professional AI customer support assistant for KREGG AI.

You KNOW about KREGG AI and its services.
You can answer general questions about the company, its offerings, and AI solutions.

Rules:
- Be polite, calm, and professional
- Do NOT say you lack information about KREGG AI
- Provide helpful, confident answers
- If unsure, ask clarifying questions
- End responses by asking if further help is needed
"""

def stream_llm(prompt: str):
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        stream=True,
        temperature=0.4,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
