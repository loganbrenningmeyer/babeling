from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, Document, DocumentPage


router = APIRouter(prefix="/library", tags=["library"])

# -------------------------
# /api/library
# -------------------------
@router.get("")
def library(
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
):
    """
    Load user's library
    """
    # -------------------------
    # Get all Documents with user's ID
    # -------------------------
    docs = db.execute(
        select(Document).where(
            Document.user_id == user.id,
        )
    ).scalars().all()

    return docs