from api.config import LANGS, PROMPTS_DIR
from babeling_nlp.gemini_api import GeminiAPI


_gemini: dict[tuple[str, str, str], GeminiAPI] = {}


def load_prompt(
    filename: str, src_lang: str, tgt_lang: str, ui_lang: str | None = None
) -> str:
    """
    Reads Gemini prompt .txt file and substitutes source / target languages for their tags
    """
    prompt = (PROMPTS_DIR / filename).read_text(encoding="utf-8")
    prompt = prompt.replace("<src_lang>", LANGS[src_lang])
    prompt = prompt.replace("<tgt_lang>", LANGS[tgt_lang])
    # -- If no UI language provided, default to source language for compatibility
    resolved_ui_lang = ui_lang or src_lang
    prompt = prompt.replace("<ui_lang>", LANGS[resolved_ui_lang])
    return prompt


def get_gemini(src_lang: str, tgt_lang: str, ui_lang: str | None = None) -> GeminiAPI:
    """
    Gets GeminiAPI object if cached (by src/tgt/ui language), 
    otherwise creates a new GeminiAPI instance
    """
    resolved_ui_lang = ui_lang or src_lang
    key = (src_lang, tgt_lang, resolved_ui_lang)
    if key not in _gemini:
        system_translate = load_prompt("translate_segmented.txt", src_lang, tgt_lang)
        system_explain = load_prompt(
            "annotate.txt", src_lang, tgt_lang, resolved_ui_lang
        )
        _gemini[key] = GeminiAPI(system_translate, system_explain)
    return _gemini[key]
