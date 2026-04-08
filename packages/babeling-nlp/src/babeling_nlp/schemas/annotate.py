from pydantic import BaseModel


class ExplainExample(BaseModel):
    source: str
    target: str


class ExplainDefineOut(BaseModel):
    lemma: str
    pos_lemma: str
    pos_form: str
    gloss: str
    ipa_form: str
    ipa_lemma: str
    explanation: str
    examples: list[ExplainExample]
