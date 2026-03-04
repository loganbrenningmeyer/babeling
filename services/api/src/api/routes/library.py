from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

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
    # -- Only show target language that this specific user has opened/read
    # -------------------------
    for doc, user_doc in rows:
        latest_tgt_lang = db.execute(
            select(DocumentReadProgress.tgt_lang)
            .where(
                DocumentReadProgress.user_id == user.id,
                DocumentReadProgress.document_id == doc.id,
            )
            .order_by(
                DocumentReadProgress.last_read_at.desc(),
                DocumentReadProgress.id.desc(),
            )
            .limit(1)  # return single target language
        ).scalar_one_or_none()

        documents.append(
            LibraryDocumentOut(
                id=doc.id,
                title=doc.title,
                author=doc.epub_author,
                src_text=doc.src_text,
                src_lang=doc.src_lang,
                total_pages=doc.total_pages,
                cover_image_id=doc.cover_image_id,
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
    # 2) Read progress rows for this user/document (per tgt_lang)
    # -- Defines which translation cards are visible in this user's library
    # -------------------------
    progress_rows = db.execute(
        select(DocumentReadProgress).where(
            DocumentReadProgress.user_id == user.id,
            DocumentReadProgress.document_id == doc.id,
        )
        .order_by(DocumentReadProgress.last_read_at.desc(), DocumentReadProgress.id.desc())
    ).scalars().all()

    # -- User has not opened/read any translations for this document yet
    if not progress_rows:
        return LibraryTranslationResponse(translations=[])

    visible_tgt_langs = [row.tgt_lang for row in progress_rows]

    # -------------------------
    # 3) Latest preview per target language
    # -- Shared cached translations are still reusable across users
    # -- Restrict to target languages this user has actually opened/read
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
            PageTranslation.tgt_lang.in_(visible_tgt_langs),
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
    # 4) Current-page preview per language 
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
    # 5) Assemble library response rows
    # -- Use read-progress ordering so the most recently opened languages appear first
    # -------------------------
    translations: list[LibraryTranslationOut] = []

    for progress in progress_rows:
        tgt_lang = progress.tgt_lang

        preview_row = current_preview_by_lang.get(tgt_lang) or latest_preview_by_lang.get(tgt_lang)
        if preview_row is None:
            continue

        translations.append(
            LibraryTranslationOut(
                page_translation_id=int(preview_row.page_translation_id),
                tgt_text=preview_row.tgt_text,
                tgt_lang=tgt_lang,
                last_opened_at=(
                    progress.last_read_at.isoformat() if progress.last_read_at else None
                ),
                completion_percent=int(progress.completion_percent),
                current_page_number=int(progress.current_page_number),
                total_pages=doc.total_pages,
            )
        )
    
    return LibraryTranslationResponse(translations=translations)
