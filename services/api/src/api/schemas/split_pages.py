from pydantic import BaseModel


class SplitPagesRequest(BaseModel):
    src_lang: str
    tgt_lang: str
    text: str