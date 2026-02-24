from pydantic import BaseModel

class LibraryDocumentOut(BaseModel):
    id: int
    title: str
    src_text: str
    src_lang: str
    last_opened_at: str | None
    latest_tgt_lang: str | None  # null if no saved translations yet

class LibraryResponse(BaseModel):
    documents: list[LibraryDocumentOut]
