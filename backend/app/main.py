from app.db.database import engine, Base
from app.db import models
from app.db.models import Tenant
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import time
import logging

from app.db.database import SessionLocal
from app.db.crud import log_request

# ===============================
# CONFIG
# ===============================
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

logger = logging.getLogger("kregg")

# ===============================
# APP SETUP (ONLY ONCE ✅)
# ===============================
app = FastAPI(
    title="KREGG AI Chatbot Backend",
    version="1.0.0"
)

# ✅ CORRECT CORS FOR VERCEL + STREAMING
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://https://kregg-chatbot-10-v1.vercel.app",
        "https://kregg-chatbot-100.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "x-api-key",
        "x-session-id",
    ],
    expose_headers=[
        "x-session-id",   # 🔥 REQUIRED FOR BROWSER
    ],
)

# ===============================
# STARTUP
# ===============================
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    default_name = os.getenv("DEFAULT_TENANT_NAME")
    default_key = os.getenv("DEFAULT_API_KEY")

    if default_name and default_key:
        db = SessionLocal()
        try:
            tenant = db.query(Tenant).filter(Tenant.api_key == default_key).first()
            if not tenant:
                db.add(Tenant(name=default_name, api_key=default_key))
                db.commit()
                logger.info("✅ Default tenant created")
        finally:
            db.close()

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
# OPENAI
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
        logger.error(f"OPENAI ERROR: {e}")
        return (
            "I’m sorry, I’m having trouble responding right now. "
            "Please try again shortly. "
            "Can I help you with anything else?"
        )

# ===============================
# ROUTERS
# ===============================
from app.chat.router import router as chat_router
from app.analytics.router import router as analytics_router

app.include_router(chat_router)
app.include_router(analytics_router)

# ===============================
# ANALYTICS MIDDLEWARE
# ===============================
@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    start_time = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start_time) * 1000)

    tenant_name = None
    api_key = request.headers.get("x-api-key")

    if api_key:
        db = SessionLocal()
        try:
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

# ===============================
# LOCAL RUN
# ===============================
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
    )
