from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse

from app.chat.schemas import ChatRequest
from app.chat.service import process_chat_message
from app.utils.cache import is_rate_limited
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
@router.post("/stream")
def chat_endpoint(
    payload: ChatRequest,
    tenant: Tenant = Depends(verify_api_key),
):
    if not payload.message:
        raise HTTPException(status_code=400, detail="Message is required")

    if is_rate_limited(tenant.name):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    reply = process_chat_message(
        message=payload.message,
        tenant_name=tenant.name,
        session_id=payload.session_id,
    )

    return PlainTextResponse(content=reply)
