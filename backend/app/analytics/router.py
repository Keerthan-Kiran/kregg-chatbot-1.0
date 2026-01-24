from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import RequestLog, TenantUsage
from app.utils.auth import verify_api_key
from app.db.models import Tenant

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/usage")
def get_usage(tenant: Tenant = Depends(verify_api_key)):
    db: Session = SessionLocal()
    try:
        usage = (
            db.query(TenantUsage)
            .filter(TenantUsage.tenant_id == tenant.id)
            .first()
        )

        return {
            "tenant": tenant.name,
            "total_requests": usage.total_requests if usage else 0,
            "total_tokens": usage.total_tokens if usage else 0,
            "last_activity": usage.last_activity_at if usage else None,
        }
    finally:
        db.close()


@router.get("/requests")
def recent_requests(
    tenant: Tenant = Depends(verify_api_key),
    limit: int = 20,
):
    db: Session = SessionLocal()
    try:
        logs = (
            db.query(RequestLog)
            .filter(RequestLog.tenant_name == tenant.name)
            .order_by(RequestLog.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "path": l.path,
                "method": l.method,
                "status": l.status_code,
                "latency_ms": l.latency_ms,
                "time": l.created_at,
            }
            for l in logs
        ]
    finally:
        db.close()
