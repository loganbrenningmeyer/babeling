import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import AppUser, Document, DocumentPage
from api.services.segmenter import get_segmenter
from api.schemas.documents import (
    DocumentRequest,
    DocumentResponse,
    DocumentPageOut,
    DocumentSplitResponse,
    DocumentLoadResponse,
)


router = APIRouter(prefix="/documents", tags=["documents"])

# -------------------------
# /api/documents/split
# -- Split document into pages
# -------------------------
@router.post("/split")
def split(req: DocumentRequest) -> DocumentSplitResponse:
    # -------------------------
    # Load Segmenter and split pages
    # -------------------------
    segmenter = get_segmenter(req.src_lang, req.tgt_lang)
    pages = segmenter.split_pages(req.text)

    return DocumentSplitResponse(pages=pages)


# -------------------------
# /api/documents
# -- Split document into pages, save Document / DocumentPages to database
# -------------------------
def normalize_text_for_hash(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()

def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@router.post("")
def split_and_save(
    req: DocumentRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> DocumentResponse:
    """ """
    # -- Load Segmenter
    segmenter = get_segmenter(req.src_lang)

    # -------------------------
    # Normalize text / dedupe text by hash
    # -------------------------
    normalized_text = normalize_text_for_hash(req.text)
    text_hash = text_sha256(normalized_text)

    existing = db.execute(
        select(Document).where(
            Document.user_id == user.id,
            Document.src_text_hash == text_hash,
        )
    ).scalar_one_or_none()

    # -------------------------
    # Return existing saved Document / DocumentPages
    # -------------------------
    if existing is not None:
        existing_pages = db.execute(
            select(DocumentPage)
            .where(DocumentPage.document_id == existing.id)
            .order_by(DocumentPage.page_number.asc())
        ).scalars().all()
        
        return DocumentResponse(
            document_id=existing.id,
            pages=[
                DocumentPageOut(
                    id=p.id,
                    page_number=p.page_number,
                    src_text=p.src_text,
                )
                for p in existing_pages
            ]
        )

    # -------------------------
    # Create / save new Document / DocumentPages
    # -------------------------
    else:
        # -- Split text into pages by max characters per page
        pages = segmenter.split_pages(req.text, max_chars=2500)

        try:
            # -------------------------
            # Save Document to database
            # -------------------------
            doc = Document(
                user_id=user.id,
                title=req.title,
                src_text=req.text,
                src_text_hash=text_hash,
                src_lang=req.src_lang,
            )
            db.add(doc)
            db.flush()

            # -------------------------
            # Save DocumentPages to database
            # -------------------------
            page_rows: list[DocumentPage] = []

            for i, page in enumerate(pages):
                row = DocumentPage(
                    document_id=doc.id,
                    page_number=i + 1,      # 1-indexed page number
                    src_text=page,
                )
                page_rows.append(row)

            db.add_all(page_rows)
            db.flush()
            db.commit()

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")

    return DocumentResponse(
        document_id=doc.id,
        pages=[
            DocumentPageOut(
                id=p.id,
                page_number=p.page_number,
                src_text=p.src_text,
            )
            for p in page_rows
        ]
    )


# -------------------------
# /api/documents/[documentId]
# -- Load a document and its translations
# -------------------------
@router.get("/{document_id}")
def load_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> DocumentLoadResponse:
    # -------------------------
    # Get Document with matching ID from database
    # -------------------------
    doc = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user.id,
        )
    ).scalar_one_or_none()

    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # -------------------------
    # Get DocumentPages
    # -------------------------
    pages = db.execute(
        select(DocumentPage)
        .where(DocumentPage.document_id == doc.id)
        .order_by(DocumentPage.page_number.asc())
    ).scalars().all()

    return DocumentLoadResponse(
        document_id=doc.id,
        title=doc.title,
        src_lang=doc.src_lang,
        pages=[
            DocumentPageOut(
                id=p.id,
                page_number=p.page_number,
                src_text=p.src_text,
            )
            for p in pages
        ],
    )