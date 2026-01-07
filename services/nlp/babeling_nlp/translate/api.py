import os
import json
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

def translate_en_fr(client, source: str) -> str:
    response = client.models.generate_content(
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


def main():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    source = "The Wanderer continued its quiet magic, always by her side, its plain canvas holding infinite wonders."
    translation = translate_en_fr(client, source)
    
    print(f"source: {source}")
    print(f"translation: {translation}")

if __name__ == "__main__":
    main()
