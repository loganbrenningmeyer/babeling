import hashlib
from collections import defaultdict, OrderedDict
from pathlib import Path
from fastapi import (
    APIRouter, 
    Depends, 
    File, 
    Form, 
    HTTPException, 
    Response, 
    UploadFile, 
)
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from api.database.db import get_db
from api.auth.users import get_current_app_user
from api.database.models import (
    AppUser, 
    Document, 
    DocumentImage,
    DocumentPage, 
    DocumentPageBlock,
    DocumentSection,
    PageTranslation,
    UserDocuments,
)
from api.services.segmenter import get_segmenter
from api.schemas.documents import (
    DocumentImageOut,
    DocumentLoadResponse, 
    DocumentPageOut,
    DocumentPageBlockOut,
    DocumentSaveResponse, 
    DocumentSectionOut,
    DocumentTextSaveRequest,
)

from api.parsing.epub import EpubDocument, EpubParser, EpubPage


router = APIRouter(prefix="/documents", tags=["documents"])

def _normalize_text_for_hash(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def _text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


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


def _update_document_membership(
    doc: Document,
    db: Session,
    user_id: int,
):
    """
    Checks / updates user's membership of the given document
    """
    membership = db.execute(
        select(UserDocuments).where(
            UserDocuments.user_id == user_id,
            UserDocuments.document_id == doc.id,
        )
    ).scalar_one_or_none()

    # -- Add document to user_documents
    if membership is None:
        membership = UserDocuments(
            user_id=user_id,
            document_id=doc.id,
        )
        db.add(membership)
    # -- If membership exists, update last_opened_at
    else:
        membership.last_opened_at = func.now()

    db.flush()
    db.commit()


def _derive_ordered_sections(
    epub_doc: EpubDocument,
    epub_pages: list[EpubPage],
) -> list[dict]:
    """
    Build DocumentSection rows in true reading order
    defined by the epub_pages list

    Returns items like:
    {
      "section_key": str,
      "title": str,
      "depth": int,
      "parent_title": str | None,
      "order_index": int,
      "first_page_number": int,  # 1-indexed
      "last_page_number": int,   # 1-indexed
    }
    """
    # -- Section metadata by section key
    sec_meta_by_key = {s.key: s for s in epub_doc.sections}

    ordered_secs = OrderedDict()

    for i, page in enumerate(epub_pages):
        page_number = i + 1     # 1-indexed
        sec_key = page.section_key

        if sec_key not in ordered_secs:
            sec_meta = sec_meta_by_key.get(sec_key)

            ordered_secs[sec_key] = {
                "section_key": sec_key,
                "title": (
                    sec_meta.title
                    if sec_meta and sec_meta.title
                    else page.section_title
                ),
                "depth": sec_meta.depth if sec_meta else 0,
                "parent_title": sec_meta.parent_title if sec_meta else None,
                "parent_key": sec_meta.parent_key if sec_meta else None,
                "order_index": len(ordered_secs),
                "first_page_number": page_number,
                "last_page_number": page_number,
            }
        else:
            # -- Set last page number on new section
            ordered_secs[sec_key]["last_page_number"] = page_number

    return list(ordered_secs.values())


def _save_text_document(
    *,
    text: str,
    title: str,
    src_lang: str,
    db: Session,
    user: AppUser,
) -> DocumentSaveResponse:
    """
    Splits text using `src_lang` Segmenter and saves the DocumentPages as well as
    the Document to the database
    """
    # -------------------------
    # Load Segmenter / split pages
    # -------------------------
    segmenter = get_segmenter(src_lang)
    pages = segmenter.split_pages(text, max_chars=1800)

    # -------------------------
    # Normalize text / dedupe text by hash
    # -------------------------
    normalized_text = _normalize_text_for_hash(text)
    text_hash = _text_sha256(normalized_text)

    existing_doc = db.execute(
        select(Document).where(
            Document.source_kind == "txt",
            Document.src_lang == src_lang,
            Document.src_text_hash == text_hash,
        )
    ).scalar_one_or_none()

    try:
        # -------------------------
        # If doc exists, ensure user membership / return ID
        # -------------------------
        if existing_doc is not None:
            _update_document_membership(existing_doc, db, user.id)

            return DocumentSaveResponse(document_id=existing_doc.id)
        
        # -------------------------
        # Otherwise, create Document + pages + membership
        # -------------------------
        doc = Document(
            title=title,
            source_kind="txt",
            source_filename=None,
            source_file_hash=None,
            src_text=text,
            src_text_hash=text_hash,
            src_lang=src_lang,
            total_pages=len(pages),
            epub_title=None,
            epub_author=None,
            epub_language=None,
            cover_image_id=None,
        )
        db.add(doc)
        db.flush()

        # -------------------------
        # Create synthetic DocumentSection (all text)
        # -------------------------
        section = DocumentSection(
            document_id=doc.id,
            section_key="txt:root",
            title=title,
            depth=0,
            parent_section_id=None,
            order_index=0,
            first_page_number=1,
            last_page_number=max(1, len(pages)),
        )
        db.add(section)
        db.flush()

        # -------------------------
        # Insert DocumentPages
        # -------------------------
        page_rows: list[DocumentPage] = []
        for i, page_text in enumerate(pages):
            page_row = DocumentPage(
                document_id=doc.id,
                page_number=i + 1,
                src_text=page_text,
                section_id=section.id,
                section_page_index=i,
            )
            page_rows.append(page_row)
    
        db.add_all(page_rows)
        db.flush()

        # -------------------------
        # Insert DocumentPageBlocks (one per page)
        # -------------------------
        block_rows: list[DocumentPageBlock] = []
        for page_row in page_rows:
            block_rows.append(
                DocumentPageBlock(
                    document_page_id=page_row.id,
                    block_index=0,
                    block_type="text",
                    tag="p",
                    text=page_row.src_text,
                    document_image_id=None,
                    alt=None,
                    char_start=None,
                    char_end=None,
                )
            )

        db.add_all(block_rows)

        # -------------------------
        # Create membership in UserDocuments / flush DB
        # -------------------------
        db.add(UserDocuments(user_id=user.id, document_id=doc.id))
        db.flush()
        db.commit()

        return DocumentSaveResponse(document_id=doc.id)
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")


def _save_epub_document(
    *,
    epub_doc: EpubDocument,
    file_bytes: bytes,
    source_filename: str | None,
    title: str,
    src_lang: str,
    db: Session,
    user: AppUser,
) -> DocumentSaveResponse:
    """
    Given a parsed .epub's EpubDocument information, splits into pages
    and saves the Document / DocumentPages to database
    """
    # -------------------------
    # Build EpubPages / Per-page texts + Full text
    # -------------------------
    epub_pages = epub_doc.build_pages(max_chars=1800)

    page_texts = [p.get_page_text() for p in epub_pages]
    full_src_text = "\n\n".join(t for t in page_texts if t).strip()

    # -------------------------
    # Compute text / file hashes
    # -------------------------
    src_text_hash = _text_sha256(_normalize_text_for_hash(full_src_text))
    source_file_hash = hashlib.sha256(file_bytes).hexdigest()

    # -------------------------
    # Dedupe by source_file_hash
    # -------------------------
    existing_doc = db.execute(
        select(Document).where(
            Document.source_kind == "epub",
            Document.source_file_hash == source_file_hash,
        )
    ).scalar_one_or_none()

    try:
        # -------------------------
        # If doc exists, ensure user membership / return ID
        # -------------------------
        if existing_doc is not None:
            _update_document_membership(existing_doc, db, user.id)

            return DocumentSaveResponse(document_id=existing_doc.id)
        
        # -------------------------
        # Otherwise, create Document
        # -------------------------
        doc = Document(
            title=title,
            source_kind="epub",
            source_filename=source_filename,
            source_file_hash=source_file_hash,
            src_text=full_src_text,
            src_text_hash=src_text_hash,
            src_lang=src_lang,
            total_pages=len(epub_pages),
            epub_title=epub_doc.title,
            epub_author=epub_doc.author,
            epub_language=epub_doc.language,
        )
        db.add(doc)
        db.flush()

        # -------------------------
        # Insert DocumentImages
        # -------------------------
        image_rows: list[DocumentImage] = []
        for image_key, img in epub_doc.images.items():
            if not img.data:
                continue
            row = DocumentImage(
                document_id=doc.id,
                image_key=image_key,
                href=img.href,
                media_type=img.media_type,
                byte_length=img.byte_length,
                content_sha256=hashlib.sha256(img.data).hexdigest(),
                data=img.data,
            )
            image_rows.append(row)

        db.add_all(image_rows)
        db.flush()

        # -------------------------
        # Insert Cover Image (DocumentImage)
        # -------------------------
        cover_image_db_id: int | None = None

        if epub_doc.cover_bytes:
            cover_sha = hashlib.sha256(epub_doc.cover_bytes).hexdigest()

            # -- Reuse existing inserted image if same bytes
            cover_match = next(
                (r for r in image_rows if r.content_sha256 == cover_sha),
                None,
            )
            if cover_match is not None:
                cover_image_db_id = cover_match.id
            else:
                # -- Insert dedicated cover image row
                cover_key = f"__cover__:{cover_sha[:16]}"
                cover_row = DocumentImage(
                    document_id=doc.id,
                    image_key=cover_key,
                    href="__cover__",
                    media_type=epub_doc.cover_media_type,
                    byte_length=len(epub_doc.cover_bytes),
                    content_sha256=cover_sha,
                    data=epub_doc.cover_bytes,
                )
                db.add(cover_row)
                db.flush()
                cover_image_db_id = cover_row.id

        # -- Set cover image foreign key (DocumentImage.id)
        doc.cover_image_id = cover_image_db_id
        db.flush()

        # -- Construct mapping: DocumentImage.image_key -> DocumentImage.id
        image_key_to_image_id = {r.image_key: r.id for r in image_rows}

        # -------------------------
        # Insert DocumentSections
        # -------------------------
        section_rows: list[DocumentSection] = []
        ordered_sections = _derive_ordered_sections(epub_doc, epub_pages)

        for sec in ordered_sections:
            row = DocumentSection(
                document_id=doc.id,
                section_key=sec["section_key"],
                title=sec["title"],
                depth=sec["depth"],
                parent_section_id=None,
                order_index=sec["order_index"],
                first_page_number=sec["first_page_number"],
                last_page_number=sec["last_page_number"],
            )
            section_rows.append(row)

        db.add_all(section_rows)
        db.flush()

        # -------------------------
        # Update DocumentSections parent_section_ids
        # -------------------------
        sec_row_by_key = {r.section_key: r for r in section_rows}
        sec_meta_by_key = {s["section_key"]: s for s in ordered_sections}

        for row in section_rows:
            pk = sec_meta_by_key[row.section_key].get("parent_key")
            if pk and pk in sec_row_by_key:
                row.parent_section_id = sec_row_by_key[pk].id
        db.flush()

        # -------------------------
        # Insert DocumentPages (map to DocumentSections)
        # -------------------------
        sec_id_by_key = {r.section_key: r.id for r in section_rows}
        # -- Track section pages
        curr_sec_id = None
        sec_local_index = 0

        page_rows: list[DocumentPage] = []
        for i, page in enumerate(epub_pages):
            section_id = sec_id_by_key.get(page.section_key)

            # -- Reset section page index on new section
            if section_id != curr_sec_id:
                sec_local_index = 0
                curr_sec_id = section_id

            row = DocumentPage(
                document_id=doc.id,
                page_number=i + 1,    # 1-indexed
                src_text=page.get_page_text(),
                section_id=section_id,
                section_page_index=sec_local_index,
            )
            page_rows.append(row)
            sec_local_index += 1
        
        db.add_all(page_rows)
        db.flush()

        # -------------------------
        # Insert DocumentPageBlocks
        # -------------------------
        block_rows: list[DocumentPageBlock] = []
        for page_i, page in enumerate(epub_pages):
            page_row = page_rows[page_i]
            
            for block_i, block in enumerate(page.blocks):
                # -- Text block
                if block.type == "text":
                    block_rows.append(
                        DocumentPageBlock(
                            document_page_id=page_row.id,
                            block_index=block_i,
                            block_type="text",
                            tag=block.tag,
                            text=block.text,
                            document_image_id=None,
                            alt=None,
                            char_start=None,
                            char_end=None,
                        )
                    )
                # -- Image block
                else:
                    img_fk = image_key_to_image_id.get(block.image_key)
                    if img_fk is None:
                        continue
                    block_rows.append(
                        DocumentPageBlock(
                            document_page_id=page_row.id,
                            block_index=block_i,
                            block_type="image",
                            tag=None,
                            text=None,
                            document_image_id=img_fk,
                            alt=block.alt,
                            char_start=None,
                            char_end=None,
                        )
                    )

        db.add_all(block_rows)
        db.flush()

        # -------------------------
        # Create user_documents membership
        # -------------------------
        _update_document_membership(doc, db, user.id)

        return DocumentSaveResponse(document_id=doc.id)
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")


# -------------------------
# POST: /api/documents
# -- Split raw text into pages, save Document / DocumentPages to database
# -------------------------
@router.post("")
def split_and_save(
    req: DocumentTextSaveRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> DocumentSaveResponse:
    """ """
    return _save_text_document(
        title=req.title,
        src_lang=req.src_lang,
        text=req.text,
        db=db,
        user=user,
    )


# -------------------------
# POST: /api/documents/upload
# -- Parse file and create new document
# -------------------------
@router.post("/upload")
async def create_document_with_file(
    title: str = Form(...),
    src_lang: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> DocumentSaveResponse:
    # -- Read file as bytes
    contents = await file.read()

    # =========================
    # ( .txt ): Extract raw text, split, and save
    # =========================
    if file.filename.endswith(".txt"):
        text = contents.decode("utf-8", errors="replace")

        return _save_text_document(
            text=text,
            title=title,
            src_lang=src_lang,
            db=db,
            user=user,
        )

    # =========================
    # ( .epub ): Parse with EpubParser and return EpubDocument information
    # =========================
    elif file.filename.endswith(".epub"):
        epub_doc = EpubParser().build_document(epub_bytes=contents)

        return _save_epub_document(
            epub_doc=epub_doc,
            file_bytes=contents,
            source_filename=file.filename,
            title=title,
            src_lang=src_lang,
            db=db,
            user=user,
        )

    # =========================
    # ( 400 Error ): Unsupported file type
    # =========================
    else:
        raise HTTPException(400, f"Unsupported file type: {Path(file.filename).suffix.lower()}")
    

# -------------------------
# GET: /api/documents/[documentId]
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
    # Get DocumentSections by order_index
    # -------------------------
    sections = db.execute(
        select(DocumentSection)
        .where(DocumentSection.document_id == doc.id)
        .order_by(DocumentSection.order_index.asc())
    ).scalars().all()

    # -------------------------
    # Get DocumentPages by page_number
    # -------------------------
    pages = db.execute(
        select(DocumentPage)
        .where(DocumentPage.document_id == doc.id)
        .order_by(DocumentPage.page_number.asc())
    ).scalars().all()

    # -------------------------
    # Get DocumentPageBlocks by page_number -> block_index
    # -------------------------
    page_ids = [p.id for p in pages]

    blocks = db.execute(
        select(DocumentPageBlock)
        .where(DocumentPageBlock.document_page_id.in_(page_ids))
        .order_by(
            DocumentPageBlock.document_page_id.asc(),
            DocumentPageBlock.block_index.asc(),
        )
    ).scalars().all()

    # -- Group blocks per page
    blocks_by_page: dict[int, list[DocumentPageBlock]] = defaultdict(list)
    for b in blocks:
        blocks_by_page[b.document_page_id].append(b)

    # -------------------------
    # Get DocumentImages by ID
    # -------------------------
    images = db.execute(
        select(DocumentImage)
        .where(DocumentImage.document_id == doc.id)
        .order_by(DocumentImage.id.asc())
    ).scalars().all()

    # -------------------------
    # Determine most recent target language
    # -- Most recent PageTranslation whose document_page_id -> document_id / src_lang
    # -------------------------
    latest_tgt_lang = db.execute(
        select(PageTranslation.tgt_lang)
        .join(DocumentPage, DocumentPage.id == PageTranslation.document_page_id)
        .where(
            DocumentPage.document_id == doc.id,
            PageTranslation.src_lang == doc.src_lang,
            PageTranslation.tgt_lang != doc.src_lang,
        )
        .group_by(PageTranslation.tgt_lang)
        .order_by(
            func.count(PageTranslation.id).desc(),
            func.max(PageTranslation.created_at).desc(),
        )
        .limit(1)
    ).scalar_one_or_none()

    return DocumentLoadResponse(
        document_id=doc.id,
        title=doc.title,
        author=doc.epub_author,
        source_kind=doc.source_kind,
        src_lang=doc.src_lang,
        tgt_lang=latest_tgt_lang,
        pages=[
            DocumentPageOut(
                id=p.id,
                page_number=p.page_number,
                src_text=p.src_text,
                section_id=p.section_id,
                section_page_index=p.section_page_index,
                blocks=[
                    DocumentPageBlockOut(
                        id=b.id,
                        block_index=b.block_index,
                        block_type=b.block_type,
                        tag=b.tag,
                        text=b.text,
                        document_image_id=b.document_image_id,
                        alt=b.alt,
                    )
                    for b in blocks_by_page[p.id]
                ]
            )
            for p in pages
        ],
        sections=[
            DocumentSectionOut(
                id=s.id,
                title=s.title,
                depth=s.depth,
                parent_section_id=s.parent_section_id,
                order_index=s.order_index,
                first_page_number=s.first_page_number,
                last_page_number=s.last_page_number,
            )
            for s in sections
        ],
        images=[
            DocumentImageOut(
                id=img.id,
                media_type=img.media_type,
                byte_length=img.byte_length,
            )
            for img in images
        ]
    )


# -------------------------
# GET: /api/documents/[documentId]/images/[documentImageId]
# -- Load image data for documentId / documentImageId
# -------------------------
@router.get("/{document_id}/images/{document_image_id}")
def load_image(
    document_id: int,
    document_image_id: int,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> Response:
    row = db.execute(
        select(DocumentImage)
        .join(Document, Document.id == DocumentImage.document_id)
        .join(UserDocuments, UserDocuments.document_id == Document.id)
        .where(
            DocumentImage.document_id == document_id,
            DocumentImage.id == document_image_id,
            UserDocuments.user_id == user.id,
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "Image not found")
    
    return Response(
        content=row.data,
        media_type=row.media_type or "application/octet-stream",
        headers={
            "Content-Length": str(row.byte_length),
            "ETag": row.content_sha256,
            "Cache-Control": "private, max-age=3600",
        },
    )
