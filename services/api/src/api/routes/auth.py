from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.schemas.auth import MeResponse
from api.database.db import get_db, engine, Base
from api.database.models import AppUser
from api.database.auth import get_current_clerk_user_id
from api.auth.users import ensure_app_user


router = APIRouter(prefix="/me", tags=["me"])

@router.get("")
def me(
    db: Session = Depends(get_db),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
) -> MeResponse:
    # -------------------------
    # Find or Create AppUser
    # -------------------------
    user: AppUser = ensure_app_user(db, clerk_user_id)

    # -------------------------
    # Return app-level identity
    # -------------------------
    return MeResponse(
        id=user.id,
        clerkUserId=user.clerk_user_id,
        lastSeenAt=user.last_seen_at.isoformat() if user.last_seen_at else None,
    )