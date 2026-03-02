from pydantic import BaseModel

from api.services.segmenter import get_segmenter
from api.services.gemini import get_gemini
from babeling_nlp.schemas.translate import (
    InputSentence,
    InputParagraph,
    TranslationRequestPayload,
    TranslationResponsePayload,
)
from api.schemas.translate import (
    TranslateSentence,
    TranslateParagraph,
    TranslateResponse,
)


def build_target_text(response: TranslationResponsePayload) -> str:
    paragraphs: list[str] = []

    for par in response.paragraphs:
        sent_texts = [
            sent.target.strip()
            for sent in par.sentences
            if sent.target.strip()
        ]

        if sent_texts:
            paragraphs.append(" ".join(sent_texts))

    return "\n\n".join(paragraphs)


def build_translate_paragraphs(
    request: TranslationRequestPayload,
    response: TranslationResponsePayload,
) -> list[TranslateParagraph]:
    paragraphs: list[TranslateParagraph] = []

    for src_par, tgt_par in zip(request.paragraphs, response.paragraphs):
        sentences: list[TranslateSentence] = []

        for src_sent, tgt_sent in zip(src_par.sentences, tgt_par.sentences):
            sentences.append(
                TranslateSentence(
                    sent_id=src_sent.sent_id,
                    source=src_sent.source,
                    target=tgt_sent.target,
                )
            )

        paragraphs.append(
            TranslateParagraph(
                par_id=src_par.par_id,
                sentences=sentences,
            )
        )

    return paragraphs


def validate_alignment(request: TranslationRequestPayload, response: TranslationResponsePayload) -> bool:
    # -------------------------
    # Check paragraph alignment
    # -------------------------
    src_par_ids = [par.par_id for par in request.paragraphs]
    tgt_par_ids = [par.par_id for par in response.paragraphs]

    if src_par_ids != tgt_par_ids:
        return False

    # -------------------------
    # Check sentence alignment per paragraph
    # -------------------------
    for src_par, tgt_par in zip(request.paragraphs, response.paragraphs):
        src_sent_ids = [sent.sent_id for sent in src_par.sentences]
        tgt_sent_ids = [sent.sent_id for sent in tgt_par.sentences]

        if src_sent_ids != tgt_sent_ids:
            return False
        
    return True


def build_translation_request(source_text: str, src_lang: str) -> TranslationRequestPayload:
    # -------------------------
    # Load Segmenter / split into paragraphs & sentences
    # -------------------------
    segmenter = get_segmenter(src_lang)

    # -- Split text -> paragraphs
    src_pars = segmenter.split_pars(source_text)

    # -- Split paragraphs -> sentences
    par_sents = []
    for par in src_pars:
        sents = segmenter.split_sents(par)
        par_sents.append(sents)

    return TranslationRequestPayload(
        paragraphs=[
            InputParagraph(
                par_id=par_id,
                sentences=[
                    InputSentence(
                        sent_id=sent_id,
                        source=sent,
                    )
                    for sent_id, sent in enumerate(par)
                ],
            )
            for par_id, par in enumerate(par_sents)
        ]
    )


def run_translation_pipeline(source_text: str, src_lang: str, tgt_lang: str) -> TranslateResponse:
    # -------------------------
    # Build TranslationRequestPayload
    # -------------------------
    request = build_translation_request(source_text, src_lang)

    # -------------------------
    # Load Gemini model / translate
    # -------------------------
    gemini = get_gemini(src_lang, tgt_lang)
    response: TranslationResponsePayload = gemini.translate_segmented(request)

    # -------------------------
    # Validate paragraph / sentence alignment
    # -------------------------
    is_aligned = validate_alignment(request, response)
    if not is_aligned:
        raise ValueError("Translated response is not aligned with source text paragraphs or sentences")

    # -------------------------
    # Build translation response information
    # -------------------------
    target_text = build_target_text(response)
    paragraphs = build_translate_paragraphs(request, response)

    return TranslateResponse(
        source_text=source_text,
        target_text=target_text,
        paragraphs=paragraphs,
    )
    




    