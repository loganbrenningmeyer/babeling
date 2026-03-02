from fastapi import APIRouter

from api.schemas.translate import TranslateRequest, TranslateResponse
from api.utils import mark_linebreaks, remove_linebreaks
from api.services.gemini import get_gemini

from api.services.translation_pipeline import run_translation_pipeline


router = APIRouter(prefix="/translate", tags=["translate"])

@router.post("")
def translate(req: TranslateRequest) -> TranslateResponse:
    return run_translation_pipeline(req.source_text, req.src_lang, req.tgt_lang)
