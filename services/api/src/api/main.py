import json
from fastapi import FastAPI
from babeling_nlp.align import Aligner
from babeling_nlp.translate import GeminiAPI
from pydantic import BaseModel
from pathlib import Path
from collections import defaultdict

REPO_ROOT = Path(__file__).resolve().parents[4]
# parents breakdown:
# [0] main.py
# [1] api/
# [2] src/
# [3] api/
# [4] services/
# [5] babeling/

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
# Prepare GeminiAPI
# ----------
print("Creating Translator...")
gemini_api = GeminiAPI()

with open(REPO_ROOT / "french.jsonl", "r") as f:
    french_dict = json.load(f)

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
    return {"translation": gemini_api.translate_en_fr(req.source)}

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

def get_sentence_ids(words: list[str]):
    punctuation = ['.', '!', '?']

    sent_ids = []
    sent_id_to_words = defaultdict(list)
    sent_id = 0

    for i, word in enumerate(words):
        if word in punctuation:
            sent_ids.append(sent_id)
            sent_id_to_words[sent_id].append(i)
            sent_id += 1
            continue

        sent_ids.append(sent_id)
        sent_id_to_words[sent_id].append(i)

    return sent_ids, dict(sent_id_to_words)

def get_paragraph_ids(words: list[str]):
    par_ids = []
    par_id_to_words = defaultdict(list)
    par_id = 0

    for i, word in enumerate(words):
        if word == "\n":
            par_id += 1
            par_id_to_words[par_id].append(i)
            continue

        par_ids.append(par_id)
        par_id_to_words[par_id].append(i)

    return par_ids, dict(par_id_to_words)

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

    # ----------
    # Get sentence / paragraph IDs by word
    # ----------
    src_sent_ids, src_sent_id_to_words = get_sentence_ids(src_words)
    src_par_ids, src_par_id_to_words = get_paragraph_ids(src_words)

    return {
        "src_words": src_words,
        "tgt_words": tgt_words,
        "src_to_tgt": src_to_tgt,
        "tgt_to_src": tgt_to_src,
        "src_spaces": src_spaces,
        "tgt_spaces": tgt_spaces,
        "src_sent_ids": src_sent_ids,
        "src_sent_id_to_words": src_sent_id_to_words,
        "src_par_ids": src_par_ids,
        "src_par_id_to_words": src_par_id_to_words
    }

# ====================
# Explain
# ====================
class ExplainRequest(BaseModel):
    src_words: list[str]
    tgt_words: list[str]
    src_spaces: list[str]
    tgt_spaces: list[str]
    tgt_to_src: dict[int, list[int]]
    tgt_idx: int

def define_fr(word: str):
    try:
        dict_entry = french_dict[word.lower()]
        dict_entry["word"] = word
        return dict_entry
    except: 
        return None

@app.post("/explain")
def explain(req: ExplainRequest):
    return {
        "definition": define_fr(req.tgt_words[req.tgt_idx]),
        "explanation": gemini_api.explain_en_fr(
            req.src_words,
            req.tgt_words,
            req.src_spaces,
            req.tgt_spaces,
            req.tgt_to_src,
            req.tgt_idx
        ),
    }