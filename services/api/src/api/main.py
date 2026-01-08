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
def get_token_spaces(sentence, tokens):
    i = 0
    spaces = []

    for token in tokens:
        start = sentence.find(token, i)
        end = start + len(token)

        j = end
        while j < len(sentence) and sentence[j].isspace():
            j += 1

        spaces.append(sentence[end:j])

        i = j

    return spaces

class AlignRequest(BaseModel):
    source: str
    target: str

@app.post("/align")
def align(req: AlignRequest):
    src_words, tgt_words, alignments = aligner.align(req.source, req.target, threshold=0.1)

    # ----------
    # Create word index mappings
    # ----------
    src_to_tgt = {}
    tgt_to_src = {tgt_idx: [] for tgt_idx in range(len(tgt_words))}
    
    # src_to_tgt: Source word index -> Target word indices
    for (src_idx, _), tgt_als in alignments.items():
        src_to_tgt[src_idx] = [tgt_idx for tgt_idx, _, _ in tgt_als]

    # tgt_to_src: Target word index -> Source word indices
    for src_idx, tgt_idxs in src_to_tgt.items():
        for tgt_idx in tgt_idxs:
            tgt_to_src[tgt_idx].append(src_idx) 

    # ----------
    # Determine spacing after words
    # ----------
    src_spaces = get_token_spaces(req.source, src_words)
    tgt_spaces = get_token_spaces(req.target, tgt_words)

    return {
        "src_words": src_words,
        "tgt_words": tgt_words,
        "src_to_tgt": src_to_tgt,
        "tgt_to_src": tgt_to_src,
        "src_spaces": src_spaces,
        "tgt_spaces": tgt_spaces
    }
