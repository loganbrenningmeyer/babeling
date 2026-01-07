import os
import json
import torch
from google import genai
from google.genai import types
from pydantic import BaseModel


class TranslationOut(BaseModel):
    translation: str


SYSTEM_TRANSLATE_EN_FR = """You are a professional translator.
Translate from English to French.

Rules:
- Preserve meaning, tone, and register.
- Do NOT add commentary, notes, or alternatives.
- Keep punctuation, casing, numbers, and named entities consistent.
- Preserve formatting (quotes, dashes, etc.).
Return only the requested JSON.
"""


class Translator:
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
                temperature=0.2,
                max_output_tokens=256,
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        if getattr(response, "parsed", None):
            return response.parsed.translation

        data = json.loads(response.text)
        return data["translation"]

