from pydantic import BaseModel


class TranslateRequest(BaseModel):
    source: str
    src_lang: str | None = None
    tgt_lang: str | None = None

class TranslateResponse(BaseModel):
    source: str
    target: str