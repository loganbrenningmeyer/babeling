import os
import base64
import requests
from fastapi import FastAPI, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timezone

# -------------------------
# Translation / Alignment / Definitions
# -------------------------
from api.utils import *
from babeling_nlp.align import Aligner
from babeling_nlp.gemini import GeminiAPI
from babeling_nlp.segmenter import Segmenter
from babeling_nlp.define import get_definition_candidates

# -------------------------
# Clerk / Database
# -------------------------
from api.database.db import get_db, engine, Base
from api.database.models import AppUser
from api.database.auth import get_current_clerk_user_id


# =========================
# Initialize FastAPI / CORS Middleware
# =========================
print("Initializing FastAPI...", flush=False)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["CORS_ORIGINS"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Languages / Paths / URL Constants
# =========================
DEFAULT_SRC_LANG = "en"
DEFAULT_TGT_LANG = "fr"

LANGS = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "de": "German"
}

# -- BinaryAlign model
CKPT_PATH = Path(os.environ.get("BINARYALIGN_CKPT_PATH", "/tmp/model.ckpt"))
# -- Modal GPU url
MODAL_ALIGN_URL = os.environ.get("MODAL_ALIGN_URL") or os.environ.get("MODAL_ALIGN_DIR")
# -- Gemini prompt files
PROMPTS_DIR = Path(os.environ.get("BABELING_PROMPTS_DIR"))


def load_prompt(filename: str, src_lang: str, tgt_lang: str) -> str:
    """
    Reads Gemini prompt .txt file and substitutes source / target languages for their tags
    """
    prompt = (PROMPTS_DIR / filename).read_text(encoding="utf-8")
    prompt = prompt.replace("<source>", LANGS[src_lang]).replace("<src_lang>", src_lang)
    prompt = prompt.replace("<target>", LANGS[tgt_lang]).replace("<tgt_lang>", tgt_lang)
    return prompt

# -------------------------
# Load BinaryAlign model
# -------------------------
aligner = None
if not MODAL_ALIGN_URL:
    print("Loading Aligner...", flush=False)
    aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=CKPT_PATH)

# -------------------------
# Create default Segmenter (used for split_pages)
# -------------------------
print("Loading Default Segmenter...", flush=False)
default_segmenter = Segmenter(DEFAULT_SRC_LANG, DEFAULT_TGT_LANG)

# -------------------------
# Gemini / Segmenter caches
# -------------------------
_segmenters: dict[tuple[str, str], Segmenter] = {}
_gemini: dict[tuple[str, str], GeminiAPI] = {}


def get_segmenter(src_lang: str, tgt_lang: str) -> Segmenter:
    key = (src_lang, tgt_lang)
    if key not in _segmenters:
        _segmenters[key] = Segmenter(src_lang, tgt_lang)
    return _segmenters[key]

def get_gemini(src_lang: str, tgt_lang: str) -> GeminiAPI:
    key = (src_lang, tgt_lang)
    if key not in _gemini:
        system_translate = load_prompt("translate.txt", src_lang, tgt_lang)
        system_explain = load_prompt("explain.txt", src_lang, tgt_lang)
        _gemini[key] = GeminiAPI(system_translate, system_explain)
    return _gemini[key]

# =========================
# Translate (/translate)
# =========================
class TranslateRequest(BaseModel):
    source: str
    src_lang: str | None = None
    tgt_lang: str | None = None

@app.post("/translate")
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

    return {"source": source, "target": target}


# =========================
# Align (/align)
# =========================
class AlignRequest(BaseModel):
    source: str
    target: str
    src_lang: str | None = None
    tgt_lang: str | None = None


@app.post("/align")
def align(req: AlignRequest):
    # -------------------------
    # Load Model GPU if available, otherwise run locally
    # -------------------------
    if MODAL_ALIGN_URL:
        r = requests.post(MODAL_ALIGN_URL, json=req.model_dump())
        r.raise_for_status()
        return r.json()
    global aligner
    if aligner is None:
        aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=CKPT_PATH)

    # -------------------------
    # Split source / target into paragraphs and sentences
    # -------------------------
    segmenter = get_segmenter(req.src_lang, req.tgt_lang)
    src_par_sent_words = segmenter.split_par_sent_words(req.source, req.src_lang)
    tgt_par_sent_words = segmenter.split_par_sent_words(req.target, req.tgt_lang)

    # -------------------------
    # Align sentences
    # -------------------------
    (
        src_words,
        tgt_words,
        src_alignments,
        tgt_alignments,
        src_sent_ids,
        src_sent_to_par_ids,
        src_sent_to_word_ids,
        src_par_ids,
        src_par_to_sent_ids,
        src_par_to_word_ids,
        tgt_sent_ids,
        tgt_par_ids,
    ) = aligner.align(src_par_sent_words, tgt_par_sent_words)

    # -------------------------
    # Determine spacing after words
    # -------------------------
    src_spaces = get_token_spaces(req.source, src_words)
    tgt_spaces = get_token_spaces(req.target, tgt_words)

    return {
        "src_words": src_words,
        "tgt_words": tgt_words,
        "src_to_tgt": src_alignments,
        "tgt_to_src": tgt_alignments,
        "src_spaces": src_spaces,
        "tgt_spaces": tgt_spaces,
        "src_sent_ids": src_sent_ids,
        "src_sent_to_par_ids": src_sent_to_par_ids,
        "src_sent_to_word_ids": src_sent_to_word_ids,
        "src_par_ids": src_par_ids,
        "src_par_to_sent_ids": src_par_to_sent_ids,
        "src_par_to_word_ids": src_par_to_word_ids,
        "tgt_sent_ids": tgt_sent_ids,
        "tgt_par_ids": tgt_par_ids,
    }


# =========================
# Deefine & Explain (/define_and_explain)
# =========================
class DefineExplainRequest(BaseModel):
    src_words: list[str]
    tgt_words: list[str]
    src_spaces: list[str]
    tgt_spaces: list[str]
    src_sent_ids: list[int]
    tgt_sent_ids: list[int]
    tgt_par_ids: list[int]
    tgt_to_src: dict[int, list[int]]
    tgt_idx: int
    src_lang: str
    tgt_lang: str

@app.post("/define_and_explain")
def define_and_explain(req: DefineExplainRequest):
    # -------------------------
    # Get definition candidate info
    # -------------------------
    tgt_word = req.tgt_words[req.tgt_idx]
    candidates = get_definition_candidates(tgt_word, req.tgt_lang)

    gemini_api = get_gemini(req.src_lang, req.tgt_lang)

    return gemini_api.define_and_explain(
        candidates,
        req.tgt_lang,
        req.src_words,
        req.tgt_words,
        req.src_spaces,
        req.tgt_spaces,
        req.src_sent_ids,
        req.tgt_sent_ids,
        req.tgt_par_ids,
        req.tgt_to_src,
        req.tgt_idx,
    )


# =========================
# Pronounce (/pronounce)
# =========================
class PronounceRequest(BaseModel):
    text: str
    tgt_lang: str

@app.post("/pronounce")
def pronounce(req: PronounceRequest):
    INWORLD_API_KEY = os.environ.get("INWORLD_RUNTIME_BASE64_CREDENTIAL")

    VOICES = {
        "en": "Dennis",
        "fr": "Hélène",
        "es": "Miguel",
        "it": "Orietta",
        "de": "Josef"
    }

    url = "https://api.inworld.ai/tts/v1/voice"

    headers = {
        "Authorization": f"Basic {INWORLD_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "text": str(req.text).strip(".") + ".",
        "voiceId": VOICES[req.tgt_lang],
        "modelId": "inworld-tts-1.5-max",
        "temperature": 0.01,
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    data = response.json()

    audio_bytes = base64.b64decode(data["audioContent"])

    return Response(
        content=audio_bytes,
        media_type="audio/wav"
    )


# =========================
# Split Pages (/split_pages)
# =========================
class SplitPagesRequest(BaseModel):
    text: str

@app.post("/split_pages")
def split_pages(req: SplitPagesRequest):
    pages = default_segmenter.split_pages(req.text)
    return {"pages": pages}


# =========================
# Clerk Authentication
# =========================
@app.get("/me")
def me(
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: Session = Depends(get_db),
):
    # -------------------------
    # Find existing user
    # -------------------------
    user = db.execute(
        select(AppUser).where(AppUser.clerk_user_id == clerk_user_id)
    ).scalar_one_or_none()

    # -------------------------
    # Create user if missing
    # -------------------------
    if user is None:
        user = AppUser(clerk_user_id=clerk_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)

    # -------------------------
    # Update user last_seen_at
    # -------------------------
    user.last_seen_at = datetime.now(timezone.utc)
    db.commit()

    # -------------------------
    # Return app-level identity
    # -------------------------
    return {
        "id": user.id,
        "clerkUserId": user.clerk_user_id,
        "lastSeenAt": user.last_seen_at.isoformat() if user.last_seen_at else None,
    }