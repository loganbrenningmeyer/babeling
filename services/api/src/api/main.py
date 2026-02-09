import os
import json
import base64
import requests
import spacy
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pathlib import Path
from sqlalchemy.orm import Session

from api.utils import *
from babeling_nlp.align import Aligner
from babeling_nlp.gemini import GeminiAPI
from babeling_nlp.segmenter import Segmenter
from babeling_nlp.define import get_definition_candidates

from api.database.db import SessionLocal, engine
from api.database.models import User


DEFAULT_SRC_LANG = "en"
DEFAULT_TGT_LANG = "fr"

LANGS = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "de": "German"
}

# -------------------------
# Paths
# -------------------------
CKPT_PATH = Path(os.environ.get("BINARYALIGN_CKPT_PATH", "/tmp/model.ckpt"))
MODAL_ALIGN_URL = os.environ.get("MODAL_ALIGN_URL") or os.environ.get("MODAL_ALIGN_DIR")

PROMPTS_DIR = Path(os.environ.get("BABELING_PROMPTS_DIR"))

def load_prompt(filename: str, src_lang: str, tgt_lang: str) -> str:
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

def resolve_langs(src_lang: str | None, tgt_lang: str | None) -> tuple[str, str]:
    src = src_lang or DEFAULT_SRC_LANG
    tgt = tgt_lang or DEFAULT_TGT_LANG

    if src not in LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported source language: {src}")
    if tgt not in LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported target language: {tgt}")

    return src, tgt

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

# -------------------------
# Initialize FastAPI app
# -------------------------
print("Initializing FastAPI...", flush=False)
app = FastAPI()


# =========================
# Translate (/translate)
# =========================
class TranslateRequest(BaseModel):
    source: str
    src_lang: str | None = None
    tgt_lang: str | None = None

@app.post("/translate")
def translate(req: TranslateRequest):
    src_lang, tgt_lang = resolve_langs(req.src_lang, req.tgt_lang)
    # -------------------------
    # Normalize wrapped text / Mark linebreaks <LB>
    # -------------------------
    source = mark_linebreaks(req.source)

    # -- Translate
    gemini_api = get_gemini(src_lang, tgt_lang)
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
    src_lang, tgt_lang = resolve_langs(req.src_lang, req.tgt_lang)
    segmenter = get_segmenter(src_lang, tgt_lang)
    src_par_sent_words = segmenter.split_par_sent_words(req.source, src_lang)
    tgt_par_sent_words = segmenter.split_par_sent_words(req.target, tgt_lang)

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
        tgt_sent_ids
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
    tgt_to_src: dict[int, list[int]]
    tgt_idx: int
    src_lang: str | None = None
    tgt_lang: str | None = None

@app.post("/define_and_explain")
def explain(req: DefineExplainRequest):
    src_lang, tgt_lang = resolve_langs(req.src_lang, req.tgt_lang)
    # -------------------------
    # Get definition candidate info
    # -------------------------
    tgt_word = req.tgt_words[req.tgt_idx]
    candidates = get_definition_candidates(tgt_word, tgt_lang)

    gemini_api = get_gemini(src_lang, tgt_lang)
    data = gemini_api.define_and_explain(
        tgt_lang,
        candidates,
        req.src_words,
        req.tgt_words,
        req.src_spaces,
        req.tgt_spaces,
        req.src_sent_ids,
        req.tgt_sent_ids,
        req.tgt_to_src,
        req.tgt_idx,
    )

    return data


# =========================
# Pronounce (/pronounce)
# =========================
class PronounceRequest(BaseModel):
    text: str
    tgt_lang: str | None = None

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

    _, tgt_lang = resolve_langs(DEFAULT_SRC_LANG, req.tgt_lang)

    payload = {
        "text": str(req.text).strip(".") + ".",
        "voiceId": VOICES[tgt_lang],
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
# Database
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users")
def create_user(name: str):
    db: Session = next(get_db())

    user = User(name=name)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "name": user.name}

@app.get("/users")
def list_users():
    db: Session = next(get_db())
    users = db.query(User).all()

    return [{"id": u.id, "name": u.name} for u in users]

@app.delete("/delete-user")
def delete_alice(name: str):
    db: Session = next(get_db())

    user = db.query(User).filter(User.name == name).first()

    db.delete(user)
    db.commit()

    return {"status": "deleted", "name": name}

@app.delete("/delete-users-table")
def delete_users_table():
    from sqlalchemy import inspect
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        raise HTTPException(status_code=404, detail="users table does not exist")

    User.__table__.drop(bind=engine)

    return {"status": "dropped", "table": "users"}