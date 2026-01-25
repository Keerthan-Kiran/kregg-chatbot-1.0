from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse

from app.chat.schemas import ChatRequest
from app.chat.service import process_chat_message
from app.utils.cache import is_rate_limited
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter()

# ✅ HANDLE CORS PREFLIGHT (CRITICAL)
@router.options("/chat")
@router.options("/chat/stream")
def chat_options():
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "https://kregg-chatbot-100.vercel.app",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-session-id",
            "Access-Control-Allow-Credentials": "true",
        },
    )

@router.post("/chat")
@router.post("/chat/stream")
def chat_endpoint(
    payload: ChatRequest,
    tenant: Tenant = Depends(verify_api_key),  # ✅ AUTH
):
    # ✅ RATE LIMIT
    if is_rate_limited(tenant.name):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please slow down."
        )

    try:
        return StreamingResponse(
            process_chat_message(
                message=payload.message,
                tenant_name=tenant.name,
                session_id=payload.session_id,
            ),
            media_type="text/plain",
            headers={
                # ✅ REQUIRED FOR BROWSER
                "Access-Control-Allow-Origin": "https://kregg-chatbot-100.vercel.app",
                "Access-Control-Allow-Credentials": "true",

                # ✅ REQUIRED FOR FRONTEND TO READ SESSION
                "Access-Control-Expose-Headers": "x-session-id",
            },
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Chat service unavailable. Please try again later.",
        )
