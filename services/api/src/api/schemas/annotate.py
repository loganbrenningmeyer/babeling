from pydantic import BaseModel


class AnnotateDomainData(BaseModel):
    words: list[str]
    spaces: list[str]
    sent_ids: list[int]
    par_ids: list[int]

class AnnotateDefinitionData(BaseModel):
    # -- Form (clicked word)
    form: str
    pos_form: str
    ipa_form: str
    # -- Lemma
    lemma: str
    pos_lemma: str
    ipa_lemma: str
    # -- Definition
    gloss: str
    # -- Text
    src_sentence: str
    src_paragraph: str
    tgt_sentence: str
    tgt_paragraph: str

class AnnotateUsageData(BaseModel):
    explanation: str
    examples: list[dict[str, str]]

class AnnotateRequest(BaseModel):
    src_lang: str
    tgt_lang: str
    ui_lang: str
    src: AnnotateDomainData
    tgt: AnnotateDomainData
    tgt_to_src: dict[int, list[int]]
    tgt_idx: int

class AnnotateResponse(BaseModel):
    definition: AnnotateDefinitionData
    usage: AnnotateUsageData
