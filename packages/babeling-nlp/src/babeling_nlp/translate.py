import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel


class TranslationOut(BaseModel):
    translation: str


class ExplanationOut(BaseModel):
    explanation: str
    examples: list[str]


def mark_words(words, spaces, mark_idxs, tag):
    out = []
    for i, (word, space) in enumerate(zip(words, spaces)):
        if i in mark_idxs:
            out.append(f"<{tag}>{word}</{tag}>{space}")
        else:
            out.append(word + space)

    return "".join(out)


class GeminiAPI:
    def __init__(self, system_translate: str, system_explain: str):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.system_translate = system_translate
        self.system_explain = system_explain

    def translate_en_fr(self, source: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=source,
            config=types.GenerateContentConfig(
                system_instruction=self.system_translate,
                response_mime_type="application/json",
                response_schema=TranslationOut,
                temperature=0.1,
                max_output_tokens=1024,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
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
        tgt_idx: int,
    ) -> str:
        # ----------
        # Add source / target markers
        # ----------
        src_mark_idxs = set(tgt_to_src.get(tgt_idx, []))
        tgt_mark_idxs = {tgt_idx}

        source = mark_words(src_words, src_spaces, src_mark_idxs, "SOURCE")
        target = mark_words(tgt_words, tgt_spaces, tgt_mark_idxs, "TARGET")

        # ----------
        # Construct prompt
        # ----------
        prompt = f"[Source sentence]\n{source}\n\n[Target sentence]\n{target}"

        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=self.system_explain,
                response_mime_type="application/json",
                response_schema=ExplanationOut,
                temperature=0.1,
                max_output_tokens=256,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        if getattr(response, "parsed", None):
            return {
                "explanation": response.parsed.explanation,
                "examples": response.parsed.examples,
            }

        data = json.loads(response.text)
        return {"explanation": data["explanation"], "examples": data["examples"]}
