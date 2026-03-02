from pydantic import BaseModel, ConfigDict


class AlignDomainDataPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    words: list[str]
    spaces: list[str]
    sent_ids: list[int]
    par_ids: list[int]
    sent_to_par_ids: dict[int, int]
    sent_to_word_ids: dict[int, list[int]]
    par_to_sent_ids: dict[int, list[int]]
    par_to_word_ids: dict[int, list[int]]

class AlignMapsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    src_to_tgt: dict[int, list[int]]
    tgt_to_src: dict[int, list[int]]


class AlignRequestSentence(BaseModel):
    sent_id: int
    source: str
    target: str 

class AlignRequestParagraph(BaseModel):
    par_id: int
    sentences: list[AlignRequestSentence]

class AlignRequest(BaseModel):
    paragraphs: list[AlignRequestParagraph]
    src_lang: str
    tgt_lang: str

class AlignResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    src: AlignDomainDataPayload
    tgt: AlignDomainDataPayload
    align: AlignMapsPayload