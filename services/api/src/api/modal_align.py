import modal
from pathlib import Path
from pydantic import BaseModel
from babeling_nlp.align import Aligner, AlignmentData
from binaryalign.tokenization import Segmenter

app = modal.App("babeling-align")

REPO_ROOT = Path(__file__).resolve()
while REPO_ROOT.name != "babeling" and REPO_ROOT.parent != REPO_ROOT:
    REPO_ROOT = REPO_ROOT.parent

image = modal.Image.debian_slim().pip_install(
    "torch",
    "transformers==4.57.3",
    "sentencepiece",
    "numpy",
    "protobuf",
    "google-genai",
    "spacy==3.8.0",
    "fastapi[standard]",
    "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
    "https://github.com/explosion/spacy-models/releases/download/fr_core_news_sm-3.8.0/fr_core_news_sm-3.8.0-py3-none-any.whl",
    "https://github.com/explosion/spacy-models/releases/download/it_core_news_sm-3.8.0/it_core_news_sm-3.8.0-py3-none-any.whl",
    "https://github.com/explosion/spacy-models/releases/download/es_core_news_sm-3.8.0/es_core_news_sm-3.8.0-py3-none-any.whl",
    "https://github.com/explosion/spacy-models/releases/download/de_core_news_sm-3.8.0/de_core_news_sm-3.8.0-py3-none-any.whl",
).run_commands(
    "python -c \"from transformers import AutoModel, AutoTokenizer; "
    "AutoTokenizer.from_pretrained('microsoft/mdeberta-v3-base'); "
    "AutoModel.from_pretrained('microsoft/mdeberta-v3-base')\""
).env({"PYTHONPATH": "/app/packages/babeling-nlp/src:/app/packages/binaryalign/src:/app/services/api/src"})

if (REPO_ROOT / "packages/babeling-nlp/src").is_dir():
    image = image.add_local_dir(
        str(REPO_ROOT / "packages/babeling-nlp/src"),
        remote_path="/app/packages/babeling-nlp/src",
        copy=True,
    )
if (REPO_ROOT / "packages/binaryalign/src").is_dir():
    image = image.add_local_dir(
        str(REPO_ROOT / "packages/binaryalign/src"),
        remote_path="/app/packages/binaryalign/src",
        copy=True,
    )
if (REPO_ROOT / "services/api/src").is_dir():
    image = image.add_local_dir(
        str(REPO_ROOT / "services/api/src"),
        remote_path="/app/services/api/src",
        copy=True,
    )
if (REPO_ROOT / "artifacts/binaryalign/en-all").is_dir():
    image = image.add_local_dir(
        str(REPO_ROOT / "artifacts/binaryalign/en-all"),
        remote_path="/model",
        copy=True,
    )

CKPT_PATH = "/model/model-pretrain-step50000.ckpt"

class AlignRequest(BaseModel):
    source: str
    target: str
    src_lang: str | None = None
    tgt_lang: str | None = None

@app.cls(gpu="L40S", image=image, scaledown_window=10)
class AlignService:
    @modal.enter()
    def load(self):
        self.aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=CKPT_PATH)

    @modal.fastapi_endpoint(method="POST")
    def align(self, req: AlignRequest) -> AlignmentData:
        # -------------------------
        # Load Segmenter 
        # -------------------------
        segmenter = Segmenter(req.src_lang or "en", req.tgt_lang or "fr")

        # -------------------------
        # Align all corresponding source / target sentences
        # -------------------------
        out: AlignmentData = self.aligner.align(
            source=req.source,
            target=req.target,
            src_lang=req.src_lang,
            tgt_lang=req.tgt_lang,
            segmenter=segmenter,
            threshold=0.025,
        )

        return out
