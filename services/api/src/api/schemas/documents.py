from pydantic import BaseModel


# -------------------------
# /api/documents
# -------------------------
class DocumentRequest(BaseModel):
    title: str
    src_lang: str
    tgt_lang: str
    text: str

class DocumentPageOut(BaseModel):
    id: int
    page_number: int
    src_text: str

class DocumentResponse(BaseModel):
    document_id: int
    pages: list[DocumentPageOut]


# -------------------------
# /api/documents/split
# -------------------------
class DocumentSplitResponse(BaseModel):
    pages: list[str]