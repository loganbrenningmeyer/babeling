import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import (
    AppUser, 
    Document, 
    DocumentPage, 
    PageTranslation,
    UserDocuments,
)
from api.services.segmenter import get_segmenter
from api.schemas.documents import (
    DocumentRequest,
    DocumentResponse,
    DocumentPageOut,
    DocumentSplitResponse,
    DocumentLoadResponse,
)


router = APIRouter(prefix="/documents", tags=["documents"])

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
# /api/documents/split
# -- Split document into pages
# -------------------------
@router.post("/split")
def split(req: DocumentRequest) -> DocumentSplitResponse:
    # -------------------------
    # Load Segmenter and split pages
    # -------------------------
    segmenter = get_segmenter(req.src_lang)
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

    existing_doc = db.execute(
        select(Document).where(
            Document.src_lang == req.src_lang,
            Document.src_text_hash == text_hash,
        )
    ).scalar_one_or_none()

    try:
        # -------------------------
        # If doc exists, ensure user membership
        # -------------------------
        if existing_doc is not None:
            membership = db.execute(
                select(UserDocuments).where(
                    UserDocuments.user_id == user.id,
                    UserDocuments.document_id == existing_doc.id,
                )
            ).scalar_one_or_none()

            # -- Add document to user_documents
            if membership is None:
                membership = UserDocuments(
                    user_id=user.id,
                    document_id=existing_doc.id,
                )
                db.add(membership)
                db.flush()
                db.commit()
            # -- If membership exists, update last_opened_at
            else:
                membership.last_opened_at = func.now()
                db.commit()

            # -------------------------
            # Return existing saved Document / DocumentPages
            # -------------------------
            existing_pages = db.execute(
                select(DocumentPage)
                .where(DocumentPage.document_id == existing_doc.id)
                .order_by(DocumentPage.page_number.asc())
            ).scalars().all()
            
            return DocumentResponse(
                document_id=existing_doc.id,
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
        # Otherwise, create Document + pages + membership
        # -------------------------
        pages = segmenter.split_pages(req.text, max_chars=2500)

        doc = Document(
            title=req.title,
            total_pages=len(pages),
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
        
        # -------------------------
        # Create user_documents membership
        # -------------------------
        membership = UserDocuments(
            user_id=user.id,
            document_id=doc.id,
        )
        db.add(membership)
        db.flush()
        db.commit()

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
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")



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
    # Authorize via user_documents ownership
    # -------------------------
    doc = _get_accessible_document(db, user.id, document_id)

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

    # -------------------------
    # Load most recent target language
    # -- Most recent PageTranslation whose document_page_id -> document_id / src_lang
    # -------------------------
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

    return DocumentLoadResponse(
        document_id=doc.id,
        title=doc.title,
        src_lang=doc.src_lang,
        tgt_lang=latest_tgt_lang,
        pages=[
            DocumentPageOut(
                id=p.id,
                page_number=p.page_number,
                src_text=p.src_text,
            )
            for p in pages
        ],
    )