from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Tenant


def verify_api_key(
    x_api_key: str | None = Header(default=None),
):
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )

    db: Session = SessionLocal()
    try:
        tenant = (
            db.query(Tenant)
            .filter(Tenant.api_key == x_api_key)
            .first()
        )

        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid API key",
            )

        return tenant  # ✅ tenant injected into route

    finally:
        db.close()
