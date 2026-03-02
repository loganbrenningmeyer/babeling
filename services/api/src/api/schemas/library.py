from pydantic import BaseModel

# -------------------------
# GET: /api/library/documents
# -------------------------
class LibraryDocumentOut(BaseModel):
    id: int
    title: str
    author: str | None
    src_text: str
    src_lang: str
    total_pages: int
    cover_image_id: int | None
    last_opened_at: str | None
    latest_tgt_lang: str | None  # null if no saved translations yet

class LibraryDocumentResponse(BaseModel):
    documents: list[LibraryDocumentOut]

# -------------------------
# GET: /api/library/documents/{document_id}/translations
# -------------------------
class LibraryTranslationOut(BaseModel):
    page_translation_id: int
    tgt_text: str
    tgt_lang: str
    last_opened_at: str | None
    completion_percent: int
    current_page_number: int
    total_pages: int

class LibraryTranslationResponse(BaseModel):
    translations: list[LibraryTranslationOut]
