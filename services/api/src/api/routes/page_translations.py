from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, Document, DocumentPage, PageTranslation
from api.schemas.page_translations import (
    PageTranslationOut,
    PageTranslationRequest,
    PageTranslationResponse,
)


router = APIRouter(prefix="/page_translations", tags=["page_translations"])


def _serialize_page_translation(row: PageTranslation) -> PageTranslationOut:
    return PageTranslationOut(
        id=row.id,
        document_page_id=row.document_page_id,
        src_lang=row.src_lang,
        tgt_lang=row.tgt_lang,
        translated_text=row.translated_text,
        alignment_data=row.alignment_data,
        created_at=row.created_at.isoformat() if row.created_at else None,
    )


def _assert_page_access(
    db: Session,
    user: AppUser,
    document_page_id: int,
) -> None:
    # -------------------------
    # Validate document page ownership
    # -------------------------
    page_id = db.execute(
        select(DocumentPage.id)
        .join(Document, Document.id == DocumentPage.document_id)
        .where(
            DocumentPage.id == document_page_id,
            Document.user_id == user.id,
        )
    ).scalar_one_or_none()

    if page_id is None:
        raise HTTPException(status_code=404, detail="Document page not found")


# -------------------------
# /api/page_translations
# -- Load page translation for source/target language pair
# -------------------------
@router.get("")
def get_page_translation(
    document_page_id: int = Query(...),
    src_lang: str = Query(...),
    tgt_lang: str = Query(...),
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> PageTranslationResponse:
    _assert_page_access(db, user, document_page_id)

    row = db.execute(
        select(PageTranslation)
        .where(
            PageTranslation.document_page_id == document_page_id,
            PageTranslation.src_lang == src_lang,
            PageTranslation.tgt_lang == tgt_lang,
        )
        .order_by(PageTranslation.id.desc())
    ).scalars().first()

    if row is None:
        return PageTranslationResponse(page_translation=None)

    return PageTranslationResponse(page_translation=_serialize_page_translation(row))


# -------------------------
# /api/page_translations
# -- Save page translation for source/target language pair
# -------------------------
@router.post("")
def upsert_page_translation(
    req: PageTranslationRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> PageTranslationResponse:
    _assert_page_access(db, user, req.document_page_id)

    row = db.execute(
        select(PageTranslation)
        .where(
            PageTranslation.document_page_id == req.document_page_id,
            PageTranslation.src_lang == req.src_lang,
            PageTranslation.tgt_lang == req.tgt_lang,
        )
        .order_by(PageTranslation.id.desc())
    ).scalars().first()

    try:
        if row is None:
            row = PageTranslation(
                document_page_id=req.document_page_id,
                src_lang=req.src_lang,
                tgt_lang=req.tgt_lang,
                translated_text=req.translated_text,
                alignment_data=req.alignment_data,
            )
            db.add(row)
            db.flush()
        else:
            row.translated_text = req.translated_text
            row.alignment_data = req.alignment_data
            db.flush()

        db.commit()
        db.refresh(row)

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save page translation: {str(e)}",
        )

    return PageTranslationResponse(page_translation=_serialize_page_translation(row))
