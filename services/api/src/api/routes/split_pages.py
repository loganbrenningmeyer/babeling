from fastapi import APIRouter

from api.schemas.split_pages import SplitPagesRequest
from api.services.segmenter import get_segmenter


router = APIRouter(prefix="/split_pages", tags=["split_pages"])

@router.post("")
def split_pages(req: SplitPagesRequest):
    segmenter = get_segmenter(req.src_lang, req.tgt_lang)
    pages = segmenter.split_pages(req.text)
    return {"pages": pages}