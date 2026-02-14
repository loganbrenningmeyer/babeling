from pydantic import BaseModel
from fastapi.responses import Response


class PronounceRequest(BaseModel):
    text: str
    tgt_lang: str