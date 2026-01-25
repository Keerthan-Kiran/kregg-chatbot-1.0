from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.chat.schemas import ChatRequest
from app.chat.service import process_chat_message
from app.utils.cache import is_rate_limited
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter()

@router.post("/chat")
@router.post("/chat/stream")
def chat_endpoint(
    payload: ChatRequest,
    tenant: Tenant = Depends(verify_api_key),
):
    if is_rate_limited(tenant.name):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    return StreamingResponse(
        process_chat_message(
            message=payload.message,
            tenant_name=tenant.name,
            session_id=payload.session_id,
        ),
        media_type="text/plain",
    )
