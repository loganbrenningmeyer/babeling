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

class AlignRequest(BaseModel):
    source: str
    target: str
    src_lang: str | None = None
    tgt_lang: str | None = None

class AlignResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: int = 1

    src: AlignDomainDataPayload
    tgt: AlignDomainDataPayload
    align: AlignMapsPayload