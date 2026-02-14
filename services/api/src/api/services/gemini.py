from api.config import LANGS, PROMPTS_DIR
from babeling_nlp.gemini import GeminiAPI


_gemini: dict[tuple[str, str], GeminiAPI] = {}

def load_prompt(filename: str, src_lang: str, tgt_lang: str) -> str:
    """
    Reads Gemini prompt .txt file and substitutes source / target languages for their tags
    """
    prompt = (PROMPTS_DIR / filename).read_text(encoding="utf-8")
    prompt = prompt.replace("<source>", LANGS[src_lang]).replace("<src_lang>", src_lang)
    prompt = prompt.replace("<target>", LANGS[tgt_lang]).replace("<tgt_lang>", tgt_lang)
    return prompt

def get_gemini(src_lang: str, tgt_lang: str) -> GeminiAPI:
    key = (src_lang, tgt_lang)
    if key not in _gemini:
        system_translate = load_prompt("translate.txt", src_lang, tgt_lang)
        system_explain = load_prompt("annotate.txt", src_lang, tgt_lang)
        _gemini[key] = GeminiAPI(system_translate, system_explain)
    return _gemini[key]