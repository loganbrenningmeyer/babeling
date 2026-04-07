from pydantic import BaseModel
from datetime import datetime


class GlossaryContextTokenSlice(BaseModel):
    words: list[str]
    spaces: list[str]
    global_word_ids: list[int]
    highlighted_local_word_ids: list[int]

class GlossaryContextPair(BaseModel):
    src: GlossaryContextTokenSlice
    tgt: GlossaryContextTokenSlice

class GlossaryContextAlignment(BaseModel):
    sentence: GlossaryContextPair
    paragraph: GlossaryContextPair

class GlossaryDefinitionData(BaseModel):
    # -- Form (clicked word)
    form: str
    pos_form: str | None
    ipa_form: str | None
    # -- Lemma
    lemma: str | None
    pos_lemma: str | None
    ipa_lemma: str | None
    # -- Definition
    gloss: str
    # -- Text
    src_sentence: str
    src_paragraph: str
    tgt_sentence: str
    tgt_paragraph: str
    # -- Tokenized alignment snapshot
    context_alignment: GlossaryContextAlignment
    # -- Text IDs
    document_id: int
    page_id: int
    par_id: int
    sent_id: int
    word_id: int

class GlossaryExample(BaseModel):
    source: str
    target: str

class GlossaryUsageData(BaseModel):
    context_meaning: str | None = None
    explanation: str
    examples: list[GlossaryExample]

# -------------------------
# POST: /api/glossary_items
# -------------------------
class GlossarySaveRequest(BaseModel):
    src_lang: str
    tgt_lang: str
    definition: GlossaryDefinitionData
    usage: GlossaryUsageData

class GlossarySaveResponse(BaseModel):
    glossary_item_id: int
    already_exists: bool


# -------------------------
# GET: /api/glossary_items/[glossary_item_id]
# -------------------------
class GlossaryLoadResponse(BaseModel):
    glossary_item_id: int
    document_title: str
    src_lang: str
    tgt_lang: str
    definition: GlossaryDefinitionData
    usage: GlossaryUsageData
    created_at: str

# -------------------------
# GET: /api/glossary_items
# -------------------------
class GlossaryItemsLoadResponse(BaseModel):
    glossary_items: list[GlossaryLoadResponse]

# -------------------------
# DELETE: /api/glossary
# -------------------------
class GlossaryDeleteResponse(BaseModel):
    glossary_item_id: int
    ok: bool
