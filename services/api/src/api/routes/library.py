from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, Document, DocumentPage, PageTranslation


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

    out = []
    for doc in docs:
        first_page_id = db.execute(
            select(DocumentPage.id)
            .where(DocumentPage.document_id == doc.id)
            .order_by(DocumentPage.page_number.asc())
        ).scalars().first()

        latest_tgt_lang = None
        if first_page_id is not None:
            latest_tgt_lang = db.execute(
                select(PageTranslation.tgt_lang)
                .where(
                    PageTranslation.document_page_id == first_page_id,
                    PageTranslation.src_lang == doc.src_lang,
                )
                .order_by(PageTranslation.id.desc())
            ).scalars().first()

        out.append({
            "id": doc.id,
            "title": doc.title,
            "src_text": doc.src_text,
            "src_lang": doc.src_lang,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "latest_tgt_lang": latest_tgt_lang,
        })

    return out
