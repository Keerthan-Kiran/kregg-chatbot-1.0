from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse, Response

from app.chat.schemas import ChatRequest
from app.chat.service import process_chat_message
from app.utils.cache import is_rate_limited
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter()

# ✅ REQUIRED: allow browser preflight (NO AUTH here)
@router.options("/chat")
@router.options("/chat/stream")
def chat_options():
    return Response(status_code=200)


@router.post("/chat")
@router.post("/chat/stream")
def chat_endpoint(
    payload: ChatRequest,
    tenant: Tenant = Depends(verify_api_key),
):
    if not payload.message:
        raise HTTPException(status_code=400, detail="Message is required")

    if is_rate_limited(tenant.name):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # 🔥 IMPORTANT: process_chat_message returns a STRING
    reply = process_chat_message(
        message=payload.message,
        tenant_name=tenant.name,
        session_id=payload.session_id,
    )

    # ✅ Always return an explicit body
    return PlainTextResponse(
        content=reply,
        headers={
            "Access-Control-Expose-Headers": "x-session-id",
        },
    )
