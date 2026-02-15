from pydantic import BaseModel


# -------------------------
# /api/documents
# -------------------------
class DocumentRequest(BaseModel):
    src_lang: str
    tgt_lang: str
    text: str

class DocumentPageOut(BaseModel):
    id: int
    page_number: int
    source_text: str

class DocumentResponse(BaseModel):
    document_id: int
    pages: list[DocumentPageOut]


# -------------------------
# /api/documents/split
# -------------------------
class DocumentSplitResponse(BaseModel):
    pages: list[str]