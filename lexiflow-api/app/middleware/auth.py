import logging

from fastapi import Header, HTTPException
from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

supabase_admin = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


def get_current_user(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Authorization token missing")

    try:
        response = supabase_admin.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return str(response.user.id)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Auth error")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
