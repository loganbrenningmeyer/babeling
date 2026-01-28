import os
import json
import base64
import requests
import spacy
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from pathlib import Path

from .utils import *
from babeling_nlp.align import Aligner
from babeling_nlp.gemini import GeminiAPI
from babeling_nlp.segment import Segmenter

# -------------------------
# Paths
# -------------------------
REPO_ROOT = Path(__file__).resolve().parents[4]
CKPT_PATH = (
    REPO_ROOT / "artifacts" / "binaryalign" / "en-fr" / "model-finetune-step55000.ckpt"
)

PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


# -------------------------
# Load BinaryAlign model
# -------------------------
print("Loading Aligner...")
aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=CKPT_PATH)

# -------------------------
# Create Segmenter
# -------------------------
SRC_LANG = "en"
TGT_LANG = "fr"

segmenter = Segmenter(SRC_LANG, TGT_LANG)

# -------------------------
# Prepare GeminiAPI / French dictionary
# -------------------------
print("Creating Translator...")
system_translate = load_prompt("translate_en_fr.txt")
system_explain = load_prompt("explain_en_fr.txt")

gemini_api = GeminiAPI(system_translate=system_translate, system_explain=system_explain)

with open(REPO_ROOT / "french.jsonl", "r") as f:
    french_dict = json.load(f)

# -------------------------
# Initialize FastAPI app
# -------------------------
print("Initializing FastAPI...")
app = FastAPI()


# =========================
# Translate (/translate)
# =========================
class TranslateRequest(BaseModel):
    source: str

@app.post("/translate")
def translate(req: TranslateRequest):
    # -------------------------
    # Normalize wrapped text / Mark linebreaks <LB>
    # -------------------------
    source = mark_linebreaks(req.source)

    # -- Translate
    target = gemini_api.translate_en_fr(source)

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


@app.post("/align")
def align(req: AlignRequest):
    """
    
    
    Args:
    
    
    Returns:
    
    """
    # -------------------------
    # Split source / target into paragraphs and sentences
    # -------------------------
    src_par_sent_words = segmenter.split_par_sent_words(req.source, SRC_LANG)
    tgt_par_sent_words = segmenter.split_par_sent_words(req.target, TGT_LANG)

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
# Explain & Define (/explain)
# =========================
def define_fr(word: str):
    definition = {
        "word": word,
        "pos": "",
        "definition": "",
        "pronunciation": "",
        "infinitive": ""
    }

    try:
        dict_entry: dict = french_dict[word.lower()]
        for k in definition.keys() & dict_entry.keys():
            definition[k] = dict_entry[k]
    except Exception as e:
        pass
    
    return definition

class ExplainRequest(BaseModel):
    src_words: list[str]
    tgt_words: list[str]
    src_spaces: list[str]
    tgt_spaces: list[str]
    src_sent_ids: list[int]
    tgt_sent_ids: list[int]
    tgt_to_src: dict[int, list[int]]
    tgt_idx: int

@app.post("/explain")
def explain(req: ExplainRequest):
    explanation_data = gemini_api.explain_en_fr(
        req.src_words,
        req.tgt_words,
        req.src_spaces,
        req.tgt_spaces,
        req.src_sent_ids,
        req.tgt_sent_ids,
        req.tgt_to_src,
        req.tgt_idx,
    )
    definition_data = define_fr(req.tgt_words[req.tgt_idx])

    return {"explanation": explanation_data, "definition": definition_data}


# =========================
# Pronounce (/pronounce)
# =========================
class PronounceRequest(BaseModel):
    text: str

@app.post("/pronounce")
def pronounce(req: PronounceRequest):
    INWORLD_API_KEY = os.environ.get("INWORLD_RUNTIME_BASE64_CREDENTIAL")
    url = "https://api.inworld.ai/tts/v1/voice"

    headers = {
        "Authorization": f"Basic {INWORLD_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "text": req.text,
        "voiceId": "Hélène",
        "modelId": "inworld-tts-1.5-max"
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
    pages = segmenter.split_pages(req.text)
    return {"pages": pages}