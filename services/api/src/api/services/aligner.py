from pathlib import Path

from babeling_nlp.align import Aligner
from api.config import CKPT_PATH


_aligner: Aligner | None = None

def get_aligner() -> Aligner:
    global _aligner
    if _aligner is None:
        _aligner = Aligner(model_name="microsoft/mdeberta-v3-base", ckpt_path=Path(CKPT_PATH))
    return _aligner