from fastapi import APIRouter

from api.schemas.annotate import (
    AnnotateRequest,
    AnnotateResponse,
    AnnotateDefinitionData,
    AnnotateUsageData,
)
from babeling_nlp.define import get_definition_candidates
from babeling_nlp.utils import mark_words, extract_text_group
from api.services.gemini import get_gemini


router = APIRouter(prefix="/annotate", tags=["annotate"])


@router.post("")
def annotate(req: AnnotateRequest):
    # -------------------------
    # Extract source / target sentence / paragraph
    # -------------------------
    sent_id = req.tgt.sent_ids[req.tgt_idx]
    par_id = req.tgt.par_ids[req.tgt_idx]

    src_sentence = extract_text_group(
        req.src.words, req.src.spaces, req.src.sent_ids, sent_id
    )
    src_paragraph = extract_text_group(
        req.src.words, req.src.spaces, req.src.par_ids, par_id
    )
    tgt_sentence = extract_text_group(
        req.tgt.words, req.tgt.spaces, req.tgt.sent_ids, sent_id
    )
    tgt_paragraph = extract_text_group(
        req.tgt.words, req.tgt.spaces, req.tgt.par_ids, par_id
    )

    # -------------------------
    # Mark source / target words in sentence
    # -------------------------
    src_idxs = set(req.tgt_to_src.get(req.tgt_idx, []))
    tgt_idxs = {req.tgt_idx}

    src_marked = mark_words(req.src.words, src_idxs, "SOURCE")
    tgt_marked = mark_words(req.tgt.words, tgt_idxs, "TARGET")

    src_marked_sent = extract_text_group(
        src_marked, req.src.spaces, req.src.sent_ids, sent_id
    )
    tgt_marked_sent = extract_text_group(
        tgt_marked, req.tgt.spaces, req.tgt.sent_ids, sent_id
    )

    # -------------------------
    # Get definition candidate info
    # -------------------------
    tgt_word = req.tgt.words[req.tgt_idx]
    candidates = get_definition_candidates(tgt_word, req.tgt_lang)

    gemini_api = get_gemini(req.src_lang, req.tgt_lang)

    res = gemini_api.annotate(
        candidates=candidates,
        tgt_word=tgt_word,
        tgt_lang=req.tgt_lang,
        src_marked_sent=src_marked_sent,
        tgt_marked_sent=tgt_marked_sent,
    )

    definition_data = res["definition"]
    usage_data = res["usage"]

    return AnnotateResponse(
        definition=AnnotateDefinitionData(
            form=definition_data["form"],
            pos_form=definition_data["pos_form"],
            ipa_form=definition_data["ipa_form"],
            lemma=definition_data["lemma"],
            pos_lemma=definition_data["pos_lemma"],
            ipa_lemma=definition_data["ipa_lemma"],
            gloss=definition_data["gloss"],
            src_sentence=src_sentence,
            src_paragraph=src_paragraph,
            tgt_sentence=tgt_sentence,
            tgt_paragraph=tgt_paragraph,
        ),
        usage=AnnotateUsageData(
            explanation=usage_data["explanation"],
            examples=usage_data["examples"],
        ),
    )
