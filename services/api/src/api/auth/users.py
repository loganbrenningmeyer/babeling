from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from api.database.db import get_db
from api.database.auth import get_current_clerk_user_id
from api.database.models import AppUser


def get_current_app_user(
    db: Session = Depends(get_db),
    clerk_user_id: str = Depends(get_current_clerk_user_id),
) -> AppUser:
    """
    
    
    Args:
    
    
    Returns:
    
    """
    return ensure_app_user(db, clerk_user_id, touch_last_seen=True)


def ensure_app_user(
    db: Session, clerk_user_id: str, touch_last_seen: bool = True
) -> AppUser:
    """


    Args:


    Returns:

    """
    # -------------------------
    # Find existing user
    # -------------------------
    user = db.execute(
        select(AppUser).where(AppUser.clerk_user_id == clerk_user_id)
    ).scalar_one_or_none()

    # -------------------------
    # Create user if missing
    # -------------------------
    if user is None:
        user = AppUser(clerk_user_id=clerk_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)

    # -------------------------
    # Update user last_seen_at
    # -------------------------
    if touch_last_seen:
        user.last_seen_at = datetime.now(timezone.utc)
        db.commit()

    return user
