import json
from fastapi import FastAPI
from fastapi.responses import Response
from babeling_nlp.align import Aligner
from babeling_nlp.gemini import GeminiAPI
from pydantic import BaseModel
from pathlib import Path
from collections import defaultdict

from .utils import *

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
    source = normalize_wrapped_text(req.source)
    source = mark_linebreaks(source)

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
    (
        src_words,
        tgt_words,
        src_alignments,
        tgt_alignments,
        src_sent_ids,
        src_sent_id_to_words,
        src_par_ids,
        src_par_id_to_words,
        tgt_sent_ids
    ) = aligner.align(req.source, req.target)

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
        "src_sent_id_to_words": src_sent_id_to_words,
        "src_par_ids": src_par_ids,
        "src_par_id_to_words": src_par_id_to_words,
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
    wav_bytes = gemini_api.pronounce(req.text)
    return Response(
        content=wav_bytes,
        media_type="audio/wav"
    )
