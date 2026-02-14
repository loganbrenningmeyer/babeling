from fastapi import APIRouter

from api.schemas.translate import TranslateRequest, TranslateResponse
from api.utils import mark_linebreaks, remove_linebreaks
from api.services.gemini import get_gemini


router = APIRouter(prefix="/translate", tags=["translate"])

@router.post("")
def translate(req: TranslateRequest):
    # -------------------------
    # Normalize wrapped text / Mark linebreaks <LB>
    # -------------------------
    source = mark_linebreaks(req.source)

    # -- Translate
    gemini_api = get_gemini(req.src_lang, req.tgt_lang)
    target = gemini_api.translate(source)

    # -------------------------
    # Replace <LB> markers with \n
    # -------------------------
    source = remove_linebreaks(source)
    target = remove_linebreaks(target)

    return TranslateResponse(
        source=source,
        target=target,
    )