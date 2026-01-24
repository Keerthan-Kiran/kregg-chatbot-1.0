from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from uuid import UUID

from app.db.models import Tenant, ChatSession, ChatMessage

SESSION_TIMEOUT_MINUTES = 3


# --------------------------------------------------
# Tenant
# --------------------------------------------------
def get_or_create_tenant(db: Session, tenant_name: str) -> UUID:
    tenant = db.query(Tenant).filter(Tenant.name == tenant_name).first()
    if tenant:
        return tenant.id

    tenant = Tenant(name=tenant_name)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant.id


# --------------------------------------------------
# Session validation (✅ idle expiry logic)
# --------------------------------------------------
def get_valid_session(db: Session, session_id: UUID | None) -> UUID | None:
    if not session_id:
        return None

    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return None

    if session.last_activity_at < func.now() - timedelta(minutes=SESSION_TIMEOUT_MINUTES):
        # ❌ DO NOT delete
        return None

    return session.id



# --------------------------------------------------
# Chat Session
# --------------------------------------------------
def create_chat_session(db: Session, tenant_id: UUID) -> UUID:
    session = ChatSession(tenant_id=tenant_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session.id


def update_session_activity(db: Session, session_id: UUID):
    db.query(ChatSession).filter(ChatSession.id == session_id).update(
        {"last_activity_at": func.now()}
    )
    db.commit()


# --------------------------------------------------
# Messages
# --------------------------------------------------
def save_message(db: Session, session_id: UUID, role: str, content: str):
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
    )
    db.add(message)
    update_session_activity(db, session_id)
    db.commit()

from app.db.models import TenantUsage

# --------------------------------------------------
# Tenant usage tracking
# --------------------------------------------------
def increment_tenant_requests(db: Session, tenant_id: UUID):
    usage = db.query(TenantUsage).filter(
        TenantUsage.tenant_id == tenant_id
    ).first()

    if not usage:
        usage = TenantUsage(
            tenant_id=tenant_id,
            total_requests=1,
            total_tokens=0,
        )
        db.add(usage)
    else:
        usage.total_requests += 1

    db.commit()


def increment_tenant_tokens(db: Session, tenant_id: UUID, tokens: int):
    usage = db.query(TenantUsage).filter(
        TenantUsage.tenant_id == tenant_id
    ).first()

    if not usage:
        usage = TenantUsage(
            tenant_id=tenant_id,
            total_requests=0,
            total_tokens=tokens,
        )
        db.add(usage)
    else:
        usage.total_tokens += tokens

    db.commit()

from app.db.models import RequestLog

def log_request(
    db: Session,
    tenant_name: str | None,
    path: str,
    method: str,
    status_code: int,
    latency_ms: int,
):
    log = RequestLog(
        tenant_name=tenant_name,
        path=path,
        method=method,
        status_code=status_code,
        latency_ms=latency_ms,
    )
    db.add(log)
    db.commit()

from app.db.models import RequestLog

def log_request(
    db: Session,
    tenant_name: str | None,
    path: str,
    method: str,
    status_code: int,
    latency_ms: int,
):
    log = RequestLog(
        tenant_name=tenant_name,
        path=path,
        method=method,
        status_code=status_code,
        latency_ms=latency_ms,
    )
    db.add(log)
    db.commit()
