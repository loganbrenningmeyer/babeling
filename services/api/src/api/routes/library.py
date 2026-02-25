from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import (
    AppUser,
    Document,
    DocumentPage,
    DocumentReadProgress,
    PageTranslation,
    UserDocuments,
)
from api.schemas.library import (
    LibraryDocumentOut,
    LibraryDocumentResponse,
    LibraryTranslationOut,
    LibraryTranslationResponse,
)


router = APIRouter(prefix="/library", tags=["library"])

def _get_accessible_document(
    db: Session,
    user_id: int,
    document_id: int,
) -> Document | None:
    """
    Returns Document if owned by user_id in user_documents, otherwise None
    """
    return db.execute(
        select(Document)
        .join(UserDocuments, UserDocuments.document_id == Document.id)
        .where(
            Document.id == document_id,
            UserDocuments.user_id == user_id,
        )
    ).scalar_one_or_none()

# -------------------------
# GET: /api/library/documents
# -- Fetches all of user's documents information for the library
# -------------------------
@router.get("/documents")
def get_library_documents(
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> LibraryDocumentResponse:
    """
    Load user's library
    """
    documents: list[LibraryDocumentOut] = []

    # -------------------------
    # Load library membership + shared document
    # -------------------------
    rows = db.execute(
        select(Document, UserDocuments)
        .join(UserDocuments, UserDocuments.document_id == Document.id)
        .where(UserDocuments.user_id == user.id)
        .order_by(UserDocuments.last_opened_at.desc())
    ).all()

    # -------------------------
    # Load most recent target language
    # -- Most recent PageTranslation whose document_page_id -> document_id / src_lang
    # -------------------------
    for doc, user_doc in rows:
        latest_tgt_lang = db.execute(
            select(PageTranslation.tgt_lang)
            .join(DocumentPage, DocumentPage.id == PageTranslation.document_page_id)
            .where(
                DocumentPage.document_id == doc.id,
                PageTranslation.src_lang == doc.src_lang,
                PageTranslation.tgt_lang
                != doc.src_lang,  # Source / Target languages cannot be the same
            )
            .group_by(PageTranslation.tgt_lang)
            .order_by(
                func.count(
                    PageTranslation.id
                ).desc(),  # 1. coverage first (most translations)
                func.max(
                    PageTranslation.created_at
                ).desc(),  # 2. recency second (date created)
            )
            .limit(1)  # return single target language
        ).scalar_one_or_none()

        documents.append(
            LibraryDocumentOut(
                id=doc.id,
                title=doc.title,
                src_text=doc.src_text,
                src_lang=doc.src_lang,
                last_opened_at=(
                    user_doc.last_opened_at.isoformat()
                    if user_doc.last_opened_at
                    else None
                ),
                latest_tgt_lang=latest_tgt_lang,
            )
        )

    return LibraryDocumentResponse(documents=documents)


# -------------------------
# GET: /api/library/documents/[document_id]/translations
# -- Gets a documents translations and their information
# -------------------------
@router.get("/documents/{document_id}/translations")
def get_library_document_translations(
    document_id: int,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> LibraryTranslationResponse:
    # -------------------------
    # 1) Authorize access + load document metadata
    # -------------------------
    doc = _get_accessible_document(db, user.id, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # -------------------------
    # 2) Base translation summary
    # -- one row per tgt_lang for this document
    # -- defines which translation cards exist in the library
    # -------------------------
    summary_rows = db.execute(
        select(
            PageTranslation.tgt_lang.label("tgt_lang"),
            func.count(PageTranslation.id).label("translated_pages_count"),
            func.max(PageTranslation.created_at).label("latest_translation_at"),
        )
        .join(DocumentPage, DocumentPage.id == PageTranslation.document_page_id)
        .where(
            DocumentPage.document_id == doc.id,
            PageTranslation.src_lang == doc.src_lang,
            PageTranslation.tgt_lang != doc.src_lang,
        )
        .group_by(PageTranslation.tgt_lang)
        .order_by(func.max(PageTranslation.created_at).desc())
    ).all()

    # -- No translations saved for this document yet
    if not summary_rows:
        return LibraryTranslationResponse(translations=[])
    
    # -------------------------
    # 3) Latest preview per target language
    # -- Use row_number() to pick on PageTranslation row per tgt_lang
    # -------------------------
    latest_ranked_sq = (
        select(
            PageTranslation.id.label("page_translation_id"),
            PageTranslation.tgt_lang.label("tgt_lang"),
            PageTranslation.translated_text.label("tgt_text"),
            func.row_number()
            .over(
                partition_by=PageTranslation.tgt_lang,
                order_by=(PageTranslation.created_at.desc(), PageTranslation.id.desc()),
            )
            .label("rn"),
        )
        .join(DocumentPage, DocumentPage.id == PageTranslation.document_page_id)
        .where(
            DocumentPage.document_id == doc.id,
            PageTranslation.src_lang == doc.src_lang,
            PageTranslation.tgt_lang != doc.src_lang,
        )
        .subquery()
    )

    latest_preview_rows = db.execute(
        select(
            latest_ranked_sq.c.tgt_lang,
            latest_ranked_sq.c.page_translation_id,
            latest_ranked_sq.c.tgt_text,
        ).where(latest_ranked_sq.c.rn == 1)
    ).all()

    latest_preview_by_lang = {row.tgt_lang: row for row in latest_preview_rows}

    # -------------------------
    # 4) Read progress rows for this user/document (per tgt_lang)
    # -------------------------
    progress_rows = db.execute(
        select(DocumentReadProgress).where(
            DocumentReadProgress.user_id == user.id,
            DocumentReadProgress.document_id == doc.id,
        )
    ).scalars().all()

    progress_by_lang = {row.tgt_lang: row for row in progress_rows}

    # -------------------------
    # 5) Current-page preview per language 
    # -- Join progress -> document_pages[current_page_number] -> page_translations for same tgt_lang
    # -------------------------
    current_preview_rows = db.execute(
        select(
            DocumentReadProgress.tgt_lang.label("tgt_lang"),
            PageTranslation.id.label("page_translation_id"),
            PageTranslation.translated_text.label("tgt_text"),
        )
        .join(
            DocumentPage,
            and_(
                DocumentPage.document_id == DocumentReadProgress.document_id,
                DocumentPage.page_number == DocumentReadProgress.current_page_number,
            ),
        )
        .outerjoin(
            PageTranslation,
            and_(
                PageTranslation.document_page_id == DocumentPage.id,
                PageTranslation.src_lang == doc.src_lang,
                PageTranslation.tgt_lang == DocumentReadProgress.tgt_lang,
            ),
        )
        .where(
            DocumentReadProgress.user_id == user.id,
            DocumentReadProgress.document_id == doc.id,
        )
    ).all()

    current_preview_by_lang = {
        row.tgt_lang: row
        for row in current_preview_rows
        if row.page_translation_id is not None
    }

    # -------------------------
    # 6) Assemble library response rows
    # -------------------------
    translations: list[LibraryTranslationOut] = []

    for summary in summary_rows:
        tgt_lang = summary.tgt_lang
        progress = progress_by_lang.get(tgt_lang)

        preview_row = current_preview_by_lang.get(tgt_lang) or latest_preview_by_lang.get(tgt_lang)
        if preview_row is None:
            continue

        translations.append(
            LibraryTranslationOut(
                page_translation_id=int(preview_row.page_translation_id),
                tgt_text=preview_row.tgt_text,
                tgt_lang=tgt_lang,
                last_opened_at=(
                    progress.last_read_at.isoformat()
                    if progress and progress.last_read_at
                    else None
                ),
                completed_percent=(
                    int(progress.completion_percent) if progress else 0
                ),
                current_page_number=(
                    int(progress.current_page_number) if progress else 1
                ),
            )
        )
    
    return LibraryTranslationResponse(translations=translations)
