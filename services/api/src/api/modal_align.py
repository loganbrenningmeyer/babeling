import modal
from pathlib import Path
from pydantic import BaseModel
from babeling_nlp.align import Aligner
from babeling_nlp.segmenter import Segmenter
from api.utils import get_token_spaces

app = modal.App("babeling-align")

REPO_ROOT = Path(__file__).resolve().parents[4]

image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch",
        "transformers==4.57.3",
        "sentencepiece",
        "numpy",
        "google-genai",
        "spacy==3.8.0",
        "fastapi[standard]",
        "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
        "https://github.com/explosion/spacy-models/releases/download/fr_core_news_sm-3.8.0/fr_core_news_sm-3.8.0-py3-none-any.whl",
        "https://github.com/explosion/spacy-models/releases/download/it_core_news_sm-3.8.0/it_core_news_sm-3.8.0-py3-none-any.whl",
        "https://github.com/explosion/spacy-models/releases/download/es_core_news_sm-3.8.0/es_core_news_sm-3.8.0-py3-none-any.whl",
        "https://github.com/explosion/spacy-models/releases/download/de_core_news_sm-3.8.0/de_core_news_sm-3.8.0-py3-none-any.whl",
    )
    .env({"PYTHONPATH": "/app/packages/babeling-nlp/src:/app/packages/binaryalign/src:/app/services/api/src"})
    .add_local_dir(str(REPO_ROOT / "packages/babeling-nlp/src"), remote_path="/app/packages/babeling-nlp/src", copy=True)
    .add_local_dir(str(REPO_ROOT / "packages/binaryalign/src"), remote_path="/app/packages/binaryalign/src", copy=True)
    .add_local_dir(str(REPO_ROOT / "services/api/src"), remote_path="/app/services/api/src", copy=True)
    .add_local_dir(str(REPO_ROOT / "artifacts/binaryalign/en-all"), remote_path="/model", copy=True)
)

CKPT_PATH = "/model/model-pretrain-step50000.ckpt"

class AlignRequest(BaseModel):
    source: str
    target: str
    src_lang: str | None = None
    tgt_lang: str | None = None

@app.cls(gpu="A10G", image=image)
class AlignService:
    @modal.enter()
    def load(self):
        self.aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=CKPT_PATH)

    @modal.fastapi_endpoint(method="POST")
    def align(self, req: AlignRequest):
        segmenter = Segmenter(req.src_lang or "en", req.tgt_lang or "fr")
        src_par_sent_words = segmenter.split_par_sent_words(req.source, req.src_lang or "en")
        tgt_par_sent_words = segmenter.split_par_sent_words(req.target, req.tgt_lang or "fr")

        (
            src_words, tgt_words, src_alignments, tgt_alignments, src_sent_ids,
            src_sent_to_par_ids, src_sent_to_word_ids, src_par_ids,
            src_par_to_sent_ids, src_par_to_word_ids, tgt_sent_ids
        ) = self.aligner.align(src_par_sent_words, tgt_par_sent_words)

        return {
            "src_words": src_words,
            "tgt_words": tgt_words,
            "src_to_tgt": src_alignments,
            "tgt_to_src": tgt_alignments,
            "src_spaces": get_token_spaces(req.source, src_words),
            "tgt_spaces": get_token_spaces(req.target, tgt_words),
            "src_sent_ids": src_sent_ids,
            "src_sent_to_par_ids": src_sent_to_par_ids,
            "src_sent_to_word_ids": src_sent_to_word_ids,
            "src_par_ids": src_par_ids,
            "src_par_to_sent_ids": src_par_to_sent_ids,
            "src_par_to_word_ids": src_par_to_word_ids,
            "tgt_sent_ids": tgt_sent_ids,
        }
