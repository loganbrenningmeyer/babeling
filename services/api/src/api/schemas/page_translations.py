from pydantic import BaseModel


class LoadPageTranslationRequest(BaseModel):
    document_page_id: int
    src_lang: str
    tgt_lang: str    


class SavePageTranslationRequest(BaseModel):
    document_page_id: int
    src_lang: str
    tgt_lang: str
    translated_text: str
    alignment_data: dict


class PageTranslationOut(BaseModel):
    id: int
    document_page_id: int
    src_lang: str
    tgt_lang: str
    translated_text: str
    alignment_data: dict
    created_at: str | None


class PageTranslationResponse(BaseModel):
    page_translation: PageTranslationOut | None
