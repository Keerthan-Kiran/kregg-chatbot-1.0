from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
import logging

from app.chat.schemas import ChatRequest
from app.chat.service import process_chat_message
from app.utils.cache import is_rate_limited
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger("kregg")


@router.post("")
@router.post("/stream")
def chat_endpoint(
    payload: ChatRequest,
    tenant: Tenant = Depends(verify_api_key),
):
    try:
        if not payload.message:
            raise HTTPException(status_code=400, detail="Message is required")

        if is_rate_limited(tenant.name):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        reply = process_chat_message(
            message=payload.message,
            tenant_name=tenant.name,
            session_id=payload.session_id,
        )

        # 🔥 CRITICAL SAFETY
        if reply is None:
            raise ValueError("process_chat_message returned None")

        if not isinstance(reply, str):
            # Handle generators / async generators / iterators
            try:
                reply = "".join(list(reply))
            except Exception:
                raise TypeError(
                    f"process_chat_message returned invalid type: {type(reply)}"
                )

        return PlainTextResponse(
            content=reply,
            headers={
                "Access-Control-Expose-Headers": "x-session-id",
            },
        )

    except Exception as e:
        logger.exception("CHAT ENDPOINT ERROR")
        return PlainTextResponse(
            content=(
                "I’m sorry, I ran into an internal issue while replying. "
                "Please try again in a moment. "
                "Can I help you with anything else?"
            ),
            status_code=500,
        )
