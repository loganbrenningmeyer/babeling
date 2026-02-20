from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, UserPreferences
from api.schemas.user_preferences import UserPreferencesRequest, UserPreferencesResponse


router = APIRouter(prefix="/user_preferences", tags=["user_preferences"])

def _get_or_create_prefs(db: Session, user_id: int) -> UserPreferences:
    """
    Gets user preferences from database or creates defaults if they don't exist
    """
    row = db.execute(
        select(UserPreferences).where(
            UserPreferences.user_id == user_id,
        )
    ).scalar_one_or_none()

    # -- Prefs don't exist: Create defaults
    if row is None:
        row = UserPreferences(
            user_id=user_id,
            preferred_src_lang="en",
            preferred_tgt_lang="es",
            preferred_ui_lang="en",
        )
        db.add(row)
        db.commit()
        db.refresh(row)

    return row


def _to_response(row: UserPreferences) -> UserPreferencesResponse:
    return UserPreferencesResponse(
        preferred_src_lang=row.preferred_src_lang,
        preferred_tgt_lang=row.preferred_tgt_lang,
        preferred_ui_lang=row.preferred_ui_lang,
        theme=row.theme,
    )


# -------------------------
# GET: /api/user_preferences
# -- Returns app user's preferences or creates if it doesn't exist
# -------------------------
@router.get("")
def get_user_preferences(
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> UserPreferencesResponse:
    row = _get_or_create_prefs(db, user.id)
    return _to_response(row)


# -------------------------
# PATCH: /api/user_preferences
# -- Updates and returns app user's preferences
# -------------------------
@router.patch("")
def patch_user_preferences(
    req: UserPreferencesRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> UserPreferencesResponse: 
    row = _get_or_create_prefs(db, user.id)

    # -- Get updates sent from client
    updates = req.model_dump(exclude_unset=True)
    # -- No changes: return row
    if not updates:
        return _to_response(row)
    
    # -- Apply updates
    for key, value in updates.items():
        setattr(row, key, value)

    try:
        db.commit()
        db.refresh(row)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")
    
    return _to_response(row)


