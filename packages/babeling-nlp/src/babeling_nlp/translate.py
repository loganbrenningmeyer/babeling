import os
import json
import torch
from google import genai
from google.genai import types
from pydantic import BaseModel


class TranslationOut(BaseModel):
    translation: str

class ExplanationOut(BaseModel):
    explanation: str


SYSTEM_TRANSLATE_EN_FR = """You are a professional translator.
Translate from English to French.

Rules:
- Preserve meaning, tone, and register.
- Do NOT add commentary, notes, or alternatives.
- Keep punctuation, casing, numbers, and named entities consistent.
- Preserve formatting (quotes, dashes, etc.).
Return only the requested JSON.
"""

SYSTEM_EXPLAIN_EN_FR = """You are a bilingual translation coach (English to French).

Explain the translation choice for the marked French word, grounded in the provided source and target text.

- The selected French word is marked by <TARGET></TARGET>
- The aligned English word(s) are marked by <SOURCE></SOURCE>
"""


class GeminiAPI:
    def __init__(self):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    def translate_en_fr(self, source: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=source,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_TRANSLATE_EN_FR,
                response_mime_type="application/json",
                response_schema=TranslationOut,
                temperature=0.1,
                max_output_tokens=1024,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        if getattr(response, "parsed", None):
            return response.parsed.translation

        data = json.loads(response.text)
        return data["translation"]
    
    def explain_en_fr(
        self,
        src_words: list[str],
        tgt_words: list[str],
        src_spaces: list[str],
        tgt_spaces: list[str],
        tgt_to_src: dict,
        tgt_idx: int
    ) -> str:
        # ----------
        # Add source / target markers
        # ----------
        tgt_words[tgt_idx] = f"<TARGET>{tgt_words[tgt_idx]}</TARGET>"
        for src_idx in tgt_to_src[tgt_idx]:
            src_words[src_idx] = f"<SOURCE>{src_words[src_idx]}</SOURCE>"
        
        # ----------
        # Construct marked source / target text
        # ----------
        source = "".join(word + space for word, space in zip(src_words, src_spaces))
        target = "".join(word + space for word, space in zip(tgt_words, tgt_spaces))

        prompt = f"""Source sentence:
        {source}

        Target sentence:
        {target}
        """

        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_EXPLAIN_EN_FR,
                response_mime_type="application/json",
                response_schema=ExplanationOut,
                temperature=0.1,
                max_output_tokens=1024,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        if getattr(response, "parsed", None):
            return response.parsed.explanation

        data = json.loads(response.text)
        return data["explanation"]

