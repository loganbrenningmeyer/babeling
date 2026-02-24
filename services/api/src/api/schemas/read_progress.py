from pydantic import BaseModel

class SaveReadProgressRequest(BaseModel):
    document_id: int
    tgt_lang: str
    current_page_number: int

class SaveReadProgressResponse(BaseModel):
    document_id: int
    tgt_lang: str
    current_page_number: int
    completion_percent: int
    total_pages: int
    last_read_at: str | None
    completed_at: str | None