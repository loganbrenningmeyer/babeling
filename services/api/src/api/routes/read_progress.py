from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import (
    AppUser,
    Document,
    DocumentReadProgress,
    UserDocuments,
)
from api.schemas.read_progress import (
    SaveReadProgressRequest,
    SaveReadProgressResponse,
)


router = APIRouter(prefix="/read_progress", tags=["read_progress"])

def _get_user_document_membership(
    db: Session,
    user_id: int,
    document_id: int,
) -> UserDocuments | None:
    """
    Verifies that the user has access to the document by ID
    """
    return db.execute(
        select(UserDocuments).where(
            UserDocuments.user_id == user_id,
            UserDocuments.document_id == document_id,
        )
    ).scalar_one_or_none()

# -------------------------
# POST: /api/read_progress
# -- Updates user's document reading progress
# -------------------------
@router.post("")
def save_read_progress(
    req: SaveReadProgressRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> SaveReadProgressResponse:
    # -------------------------
    # 1) Verify document ownership
    # -------------------------
    membership = _get_user_document_membership(db, user.id, req.document_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # -------------------------
    # 2) Load total pages from Document metadata
    # -------------------------
    total_pages_raw = db.execute(
        select(Document.total_pages).where(Document.id == req.document_id)
    ).scalar_one_or_none()

    if total_pages_raw is None:
        raise HTTPException(status_code=404, detail="Document not found")

    total_pages = int(total_pages_raw or 0)

    if total_pages <= 0:
        raise HTTPException(status_code=400, detail="Document has no pages")
    
    if req.current_page_number < 1 or req.current_page_number > total_pages:
        raise HTTPException(status_code=400, detail="Invalid current_page_number")
    
    # -- Compute completion %
    completion_percent = int((req.current_page_number * 100) / total_pages)
    completion_percent = max(0, min(100, completion_percent))
    now = datetime.now(timezone.utc)

    # -------------------------
    # 3) Upsert read progress
    # -------------------------
    row = db.execute(
        select(DocumentReadProgress).where(
             DocumentReadProgress.user_id == user.id,
             DocumentReadProgress.document_id == req.document_id,
             DocumentReadProgress.tgt_lang == req.tgt_lang,
        )
    ).scalar_one_or_none()

    try:
        if row is None:
            row = DocumentReadProgress(
                user_id=user.id,
                document_id=req.document_id,
                tgt_lang=req.tgt_lang,
                current_page_number=req.current_page_number,
                completion_percent=completion_percent,
                started_at=now,
                last_read_at=now,
                completed_at=now if req.current_page_number == total_pages else None,
            )
            db.add(row)
        else:
            row.current_page_number = req.current_page_number
            row.completion_percent = completion_percent
            row.last_read_at = now
            if req.current_page_number == total_pages and row.completed_at is None:
                row.completed_at = now
        
        # -------------------------
        # 4) Keep library recency in sync
        # -------------------------
        membership.last_opened_at = now

        db.commit()
        db.refresh(row)

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save read progress: {str(e)}",
        )
    
    return SaveReadProgressResponse(
        document_id=row.document_id,
        tgt_lang=row.tgt_lang,
        current_page_number=row.current_page_number,
        completion_percent=row.completion_percent,
        total_pages=total_pages,
        last_read_at=row.last_read_at.isoformat() if row.last_read_at else None,
        completed_at=row.completed_at.isoformat() if row.completed_at else None,
    )
