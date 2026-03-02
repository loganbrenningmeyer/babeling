from pydantic import BaseModel


class AlignedSentence:
    sent_id: int
    source: str
    target: str

class AlignedParagraph:
    par_id: int
    sentences: list[AlignedSentence]