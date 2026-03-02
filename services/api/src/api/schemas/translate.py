from pydantic import BaseModel


class TranslateRequest(BaseModel):
    source_text: str
    src_lang: str
    tgt_lang: str


class TranslateSentence(BaseModel):
    sent_id: int
    source: str
    target: str

class TranslateParagraph(BaseModel):
    par_id: int
    sentences: list[TranslateSentence]

class TranslateResponse(BaseModel):
    source_text: str
    target_text: str
    paragraphs: list[TranslateParagraph]