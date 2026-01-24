from app.db.database import engine, Base
from app.db import models
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import uvicorn
import os

import logging
from fastapi import Request
from fastapi.responses import JSONResponse

import time
from app.db.database import SessionLocal
from app.db.crud import log_request

# ===============================
# CONFIG
# ===============================
openai.api_key = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """
You are a professional AI customer support assistant for KREGG AI.

Rules:
- Be polite, calm, and professional at all times.
- If the user is angry or aggressive, apologize sincerely.
- Never argue with the customer.
- Always try to help or clarify.
- Keep responses concise and clear.
- End every response by asking if the user needs further help.
"""
Base.metadata.create_all(bind=engine)
# ===============================
# APP SETUP
# ===============================
logger = logging.getLogger("kregg")

app = FastAPI(
    title="KREGG AI Chatbot Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {request.url}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# ===============================
# HEALTH
# ===============================
@app.get("/")
def root():
    return {"status": "ok", "service": "KREGG AI Backend"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ===============================
# CHAT LOGIC (LLM)
# ===============================
from openai import OpenAI

client = OpenAI()

def generate_reply(user_message: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4,
            max_tokens=300,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("OPENAI ERROR:", e)
        return (
            "I’m sorry, I’m having trouble responding right now. "
            "Please try again shortly. "
            "Can I help you with anything else?"
        )

from app.chat.router import router as chat_router

app.include_router(chat_router)

@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)

    tenant_name = None
    api_key = request.headers.get("x-api-key")

    if api_key:
        db = SessionLocal()
        try:
            from app.db.models import Tenant
            tenant = db.query(Tenant).filter(Tenant.api_key == api_key).first()
            if tenant:
                tenant_name = tenant.name
        finally:
            db.close()

    db = SessionLocal()
    try:
        log_request(
            db=db,
            tenant_name=tenant_name,
            path=request.url.path,
            method=request.method,
            status_code=response.status_code,
            latency_ms=duration_ms,
        )
    finally:
        db.close()

    return response

from app.analytics.router import router as analytics_router
app.include_router(analytics_router)


# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)




