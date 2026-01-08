from fastapi import FastAPI
from babeling_nlp.align import Aligner
from babeling_nlp.translate import Translator
from pydantic import BaseModel
from pathlib import Path

# Path to this file: services/api/src/api/main.py
API_ROOT = Path(__file__).resolve().parents[4]
# parents breakdown:
# [0] main.py
# [1] api/
# [2] src/
# [3] api/
# [4] services/
# [5] babeling/   ← we want this

REPO_ROOT = API_ROOT
CKPT_PATH = REPO_ROOT / "artifacts" / "binaryalign" / "en-fr" / "model-finetune-step55000.ckpt"

# ----------
# Create Aligner
# ----------
print("Loading Aligner...")
aligner = Aligner(
    model_name="microsoft/mdeberta-v3-base",
    ckpt_path=CKPT_PATH
)

# ----------
# Create Translator
# ----------
print("Creating Translator...")
translator = Translator()

# ----------
# Initialize FastAPI
# ----------
print("Initializing FastAPI...")
app = FastAPI()


@app.get("/hello")
def hello():
    return {"message": "Hello from Python NLP service!"}

# ====================
# Translate
# ====================
class TranslateRequest(BaseModel):
    source: str

@app.post("/translate")
def translate(req: TranslateRequest):
    return {"translation": translator.translate_en_fr(req.source)}

# ====================
# Align
# ====================
def format_alignments(alignments):
    """
    Convert defaultdict[(src_i, src_word)] -> list of dicts
    """
    formatted = []

    for (src_i, src_word), tgt_list in alignments.items():
        formatted.append({
            "src_index": src_i,
            "src_word": src_word,
            "aligned": [
                {
                    "tgt_index": tgt_i,
                    "tgt_word": tgt_word,
                    "score": float(score),
                }
                for tgt_i, tgt_word, score in tgt_list
            ],
        })

    return formatted

class AlignRequest(BaseModel):
    source: str
    target: str

@app.post("/align")
def align(req: AlignRequest):
    src_words, tgt_words, alignments = aligner.align(req.source, req.target, threshold=0.5)

    src_to_tgt = {}
    tgt_to_src = {tgt_idx: [] for tgt_idx in range(len(tgt_words))}
    
    # src_to_tgt: Source word index -> Target word indices
    for (src_idx, _), tgt_als in alignments.items():
        src_to_tgt[src_idx] = [tgt_idx for tgt_idx, _, _ in tgt_als]

    # tgt_to_src: Target word index -> Source word indices
    for src_idx, tgt_idxs in src_to_tgt.items():
        for tgt_idx in tgt_idxs:
            tgt_to_src[tgt_idx].append(src_idx) 

    return {
        "src_words": src_words,
        "tgt_words": tgt_words,
        "src_to_tgt": src_to_tgt,
        "tgt_to_src": tgt_to_src
    }
