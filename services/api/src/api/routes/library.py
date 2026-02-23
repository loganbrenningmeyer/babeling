from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, Document, DocumentPage, PageTranslation
from api.schemas.library import LibraryDocumentOut, LibraryResponse


router = APIRouter(prefix="/library", tags=["library"])

# -------------------------
# /api/library
# -------------------------
@router.get("")
def library(
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> LibraryResponse:
    """
    Load user's library
    """
    documents: list[LibraryDocumentOut] = []

    # -------------------------
    # Get all Documents with user's ID
    # -------------------------
    docs = db.execute(
        select(Document).where(
            Document.user_id == user.id,
        )
    ).scalars().all()

    # -------------------------
    # Load most recent target language
    # -- Most recent PageTranslation whose document_page_id -> document_id / src_lang
    # -------------------------
    for doc in docs:
        latest_tgt_lang = db.execute(
            select(PageTranslation.tgt_lang)
            .join(DocumentPage, DocumentPage.id == PageTranslation.document_page_id)
            .where(
                DocumentPage.document_id == doc.id,
                PageTranslation.src_lang == doc.src_lang,
                PageTranslation.tgt_lang != doc.src_lang,   # Source / Target languages cannot be the same
            )
            .group_by(PageTranslation.tgt_lang)
            .order_by(
                func.count(PageTranslation.id).desc(),          # 1. coverage first (most translations)
                func.max(PageTranslation.created_at).desc(),    # 2. recency second (date created)
            )
            .limit(1)   # return single target language
        ).scalar_one_or_none()

        documents.append(LibraryDocumentOut(
            id=doc.id,
            title=doc.title,
            src_text=doc.src_text,
            src_lang=doc.src_lang,
            created_at=doc.created_at.isoformat() if doc.created_at else None,
            latest_tgt_lang=latest_tgt_lang,
        ))

    return LibraryResponse(documents=documents)