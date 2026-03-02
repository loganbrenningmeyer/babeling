from pydantic import BaseModel


class InputSentence(BaseModel):
    sent_id: int
    source: str

class InputParagraph(BaseModel):
    par_id: int
    sentences: list[InputSentence]

class TranslationRequestPayload(BaseModel):
    paragraphs: list[InputParagraph]

class OutputSentence(BaseModel):
    sent_id: int
    target: str

class OutputParagraph(BaseModel):
    par_id: int
    sentences: list[OutputSentence]

class TranslationResponsePayload(BaseModel):
    paragraphs: list[OutputParagraph]