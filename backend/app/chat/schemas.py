from uuid import UUID
from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    tenant: str
    session_id: Optional[UUID] = None

class ChatResponse(BaseModel):
    reply: str

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatHistoryResponse(BaseModel):
    session_id: UUID
    messages: list[ChatMessageResponse]
