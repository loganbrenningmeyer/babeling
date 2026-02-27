from pydantic import BaseModel


class DocumentSaveResponse(BaseModel):
    document_id: int


# -------------------------
# POST: /api/documents
# -- Save raw text as document to database
# -------------------------
class DocumentTextSaveRequest(BaseModel):
    title: str
    src_lang: str
    text: str


# -------------------------
# GET: /api/documents
# -- Load document from database
# -------------------------
class DocumentImageOut(BaseModel):
    id: int
    media_type: str | None
    byte_length: int


class DocumentPageBlockOut(BaseModel):
    id: int
    block_index: int    
    block_type: str     # "text" | "image"
    tag: str | None
    text: str | None
    document_image_id: int | None
    alt: str | None


class DocumentSectionOut(BaseModel):
    id: int
    title: str  
    depth: int
    parent_section_id: int | None
    order_index: int
    first_page_number: int
    last_page_number: int


class DocumentPageOut(BaseModel):
    id: int
    page_number: int
    src_text: str
    section_id: int | None
    section_page_index: int | None
    blocks: list[DocumentPageBlockOut]


class DocumentLoadResponse(BaseModel):
    document_id: int
    title: str
    source_kind: str
    src_lang: str
    tgt_lang: str | None
    pages: list[DocumentPageOut]
    sections: list[DocumentSectionOut]
    images: list[DocumentImageOut]
