import requests
from fastapi import APIRouter

from api.schemas.align import (
    AlignDomainDataPayload,
    AlignMapsPayload,
    AlignRequest,
    AlignResponse,
)
from binaryalign.inference import AlignmentData
from api.services.segmenter import get_segmenter
from api.services.aligner import get_aligner
from api.config import MODAL_ALIGN_URL


router = APIRouter(prefix="/align", tags=["align"])

@router.post("")
def align(req: AlignRequest) -> AlignResponse:
    # -------------------------
    # Load Model GPU if available, otherwise run locally
    # -------------------------
    if MODAL_ALIGN_URL:
        r = requests.post(MODAL_ALIGN_URL, json=req.model_dump())
        r.raise_for_status()
        return r.json()

    # -------------------------
    # Load Aligner / Segmenter
    # -------------------------
    aligner = get_aligner()

    src_segmenter = get_segmenter(req.src_lang)
    tgt_segmenter = get_segmenter(req.tgt_lang)

    # -------------------------
    # Align all corresponding source / target sentences
    # -------------------------
    res: AlignmentData = aligner.align(
        source=req.source,
        target=req.target,
        src_segmenter=src_segmenter,
        tgt_segmenter=tgt_segmenter,
        threshold=0.025,
    )

    return AlignResponse(
        src=AlignDomainDataPayload(
            words=res.src.words,
            spaces=res.src.spaces,
            sent_ids=res.src.sent_ids,
            par_ids=res.src.par_ids,
            sent_to_par_ids=res.src.sent_to_par_ids,
            par_to_sent_ids=res.src.par_to_sent_ids,
            sent_to_word_ids=res.src.sent_to_word_ids,
            par_to_word_ids=res.src.par_to_word_ids,
        ),
        tgt=AlignDomainDataPayload(
            words=res.tgt.words,
            spaces=res.tgt.spaces,
            sent_ids=res.tgt.sent_ids,
            par_ids=res.tgt.par_ids,
            sent_to_par_ids=res.tgt.sent_to_par_ids,
            par_to_sent_ids=res.tgt.par_to_sent_ids,
            sent_to_word_ids=res.tgt.sent_to_word_ids,
            par_to_word_ids=res.tgt.par_to_word_ids,
        ),
        align=AlignMapsPayload(
            src_to_tgt=res.align.src_to_tgt,
            tgt_to_src=res.align.tgt_to_src,
        ),
    )