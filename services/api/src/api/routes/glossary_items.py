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
    GlossaryItem,
    UserDocuments,
)
from api.schemas.glossary_items import (
    GlossaryDefinitionData,
    GlossaryUsageData,
    GlossarySaveRequest,
    GlossarySaveResponse,
    GlossaryLoadResponse,
    GlossaryDeleteResponse,
)


router = APIRouter(prefix="/glossary_items", tags=["glossary_items"])

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
# POST: /api/glossary_items
# -- Save new GlossaryItem to database
# -------------------------
@router.post("")
def save_glossary(
    req: GlossarySaveRequest,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> GlossarySaveResponse:
    # -------------------------
    # 1) Validate document ownership
    # -------------------------
    doc = _get_accessible_document(db, user.id, req.definition.document_id)

    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # -------------------------
    # 2) Validate page belongs to document
    # -------------------------
    page = db.execute(
        select(DocumentPage).where(
            DocumentPage.id == req.definition.page_id,
            DocumentPage.document_id == doc.id,
        )
    ).scalar_one_or_none()

    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # -------------------------
    # 3) Check if bookmark already exists
    # -------------------------
    existing = db.execute(
        select(GlossaryItem).where(
            GlossaryItem.user_id == user.id,
            GlossaryItem.document_id == req.definition.document_id,
            GlossaryItem.page_id == req.definition.page_id,
            GlossaryItem.tgt_lang == req.tgt_lang,
            GlossaryItem.word_id == req.definition.word_id,
        )
    ).scalar_one_or_none()

    if existing is not None:
        return GlossarySaveResponse(
            glossary_item_id=existing.id,
            already_exists=True,
        )
    
    # -------------------------
    # 4) If validated / new bookmark, create entry
    # -------------------------
    row = GlossaryItem(
        user_id=user.id,
        # -- Form (Clicked word)
        form=req.definition.form,
        pos_form=req.definition.pos_form,
        ipa_form=req.definition.ipa_form,
        # -- Lemma
        lemma=req.definition.lemma,
        pos_lemma=req.definition.pos_lemma,
        ipa_lemma=req.definition.ipa_lemma,
        # -- Definition
        gloss=req.definition.gloss,
        # -- Explanation / examples
        explanation=req.usage.explanation,
        examples=[e.model_dump() for e in req.usage.examples],
        # -- Source / target languages
        src_lang=req.src_lang,
        tgt_lang=req.tgt_lang,
        # -- Text IDs
        document_id=req.definition.document_id,
        page_id=req.definition.page_id,
        par_id=req.definition.par_id,
        sent_id=req.definition.sent_id,
        word_id=req.definition.word_id,
        # -- Source / target text
        src_sentence=req.definition.src_sentence,
        src_paragraph=req.definition.src_paragraph,
        tgt_sentence=req.definition.tgt_sentence,
        tgt_paragraph=req.definition.tgt_paragraph,
    )

    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save glossary item: {e}")
    
    return GlossarySaveResponse(
        glossary_item_id=row.id,
        already_exists=False,
    )


# -------------------------
# GET: /api/glossary_items/[glossary_item_id]
# -- Fetches glossary_item from database and returns data
# -------------------------
@router.get("/{glossary_item_id}")
def load_glossary(
    glossary_item_id: int,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),
) -> GlossaryLoadResponse:
    # -------------------------
    # Get GlossaryItem with matching ID
    # -------------------------
    item = db.execute(
        select(GlossaryItem).where(
            GlossaryItem.id == glossary_item_id,
            GlossaryItem.user_id == user.id,
        )
    ).scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Glossary item not found")
    
    return GlossaryLoadResponse(
        src_lang=item.src_lang,
        tgt_lang=item.tgt_lang,
        definition=GlossaryDefinitionData(
            form=item.form,
            pos_form=item.pos_form,
            ipa_form=item.ipa_form,
            lemma=item.lemma,
            pos_lemma=item.pos_lemma,
            ipa_lemma=item.ipa_lemma,
            gloss=item.gloss,
            src_sentence=item.src_sentence,
            src_paragraph=item.src_paragraph,
            tgt_sentence=item.tgt_sentence,
            tgt_paragraph=item.tgt_paragraph,
            document_id=item.document_id,
            page_id=item.page_id,
            par_id=item.par_id,
            sent_id=item.sent_id,
            word_id=item.word_id,
        ),
        usage=GlossaryUsageData(
            explanation=item.explanation,
            examples=item.examples,
        ),
    )


# -------------------------
# DELETE: /api/glossary_items/[glossary_item_id]
# -- Deletes saved glossary item by ID
# -------------------------
@router.delete("/{glossary_item_id}")
def delete_glossary(
    glossary_item_id: int,
    db: Session = Depends(get_db),
    user: AppUser = Depends(get_current_app_user),    
):
    # -------------------------
    # Get glossary item with matching ID
    # -------------------------
    item = db.execute(
        select(GlossaryItem).where(
            GlossaryItem.id == glossary_item_id,
            GlossaryItem.user_id == user.id,
        )
    ).scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=404, detail="Glossary item not found")

    # -------------------------
    # Delete glossary item by ID
    # -------------------------
    try:
        db.delete(item)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete glossary item: {e}")
    
    return GlossaryDeleteResponse(
        glossary_item_id=glossary_item_id,
        ok=True,
    )