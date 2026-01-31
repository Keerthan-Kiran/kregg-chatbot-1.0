import time
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.llm.openai_client import stream_llm
from app.db.crud import (
    get_or_create_tenant,
    get_valid_session,
    create_chat_session,
    save_message,
    increment_tenant_requests,
    increment_tenant_tokens,
)
from app.db.database import SessionLocal

MAX_RETRIES = 3
RETRY_DELAY = 1.5
MAX_SESSION_TOKENS = 3000


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def process_chat_message(
    message: str,
    tenant_name: str,
    session_id: Optional[UUID] = None,
) -> str:
    db: Session = SessionLocal()
    full_reply = ""
    token_count = 0

    try:
        tenant_id = get_or_create_tenant(db, tenant_name)
        increment_tenant_requests(db, tenant_id)

        valid_session_id = get_valid_session(db, session_id)
        if valid_session_id is None:
            session_id = create_chat_session(db, tenant_id)
        else:
            session_id = valid_session_id

        save_message(db, session_id, "user", message)

        for attempt in range(MAX_RETRIES):
            try:
                for token in stream_llm(message):
                    if not token.strip():
                        continue

                    tokens = estimate_tokens(token)
                    token_count += tokens

                    if token_count > MAX_SESSION_TOKENS:
                        full_reply += "\n\n⚠️ Token limit reached."
                        break

                    full_reply += token
                    increment_tenant_tokens(db, tenant_id, tokens)

                save_message(db, session_id, "assistant", full_reply)
                return full_reply

            except Exception:
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)

        return "Sorry, I couldn’t generate a response right now."

    except Exception:
        return "Sorry, something went wrong. Please try again."

    finally:
        db.close()
