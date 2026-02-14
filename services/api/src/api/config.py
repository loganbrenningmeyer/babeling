import os
from pathlib import Path


# -------------------------
# Supported / Default Languages
# -------------------------
LANGS = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "it": "Italian",
    "de": "German"
}
DEFAULT_SRC_LANG = "en"
DEFAULT_TGT_LANG = "fr"

# -------------------------
# Paths / URLs
# -------------------------
# -- Gemini translate / annotate prompts
PROMPTS_DIR = Path(os.environ.get("BABELING_PROMPTS_DIR"))
# -- BinaryAlign model
CKPT_PATH = Path(os.environ.get("BINARYALIGN_CKPT_PATH", "/tmp/model.ckpt"))
# -- Modal GPU url
MODAL_ALIGN_URL = os.environ.get("MODAL_ALIGN_URL") or os.environ.get("MODAL_ALIGN_DIR")

# -------------------------
# Pronounce
# -------------------------
INWORLD_API_KEY = os.environ.get("INWORLD_RUNTIME_BASE64_CREDENTIAL")
VOICES = {
    "en": "Dennis",
    "fr": "Hélène",
    "es": "Miguel",
    "it": "Orietta",
    "de": "Josef",
}