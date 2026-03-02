import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from textwrap import dedent

from babeling_nlp.define import get_lemma_ipa, get_form_ipa
from babeling_nlp.utils import mark_words, extract_text_group
from babeling_nlp.schemas.translate import (
    TranslationRequestPayload,
    TranslationResponsePayload,
)
from babeling_nlp.schemas.annotate import ExplainExample, ExplainDefineOut


class GeminiAPI:
    def __init__(self, system_translate: str, system_explain: str):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.system_translate = system_translate
        self.system_explain = system_explain

    def translate_text(self, source: str) -> str:
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=source,
            config=types.GenerateContentConfig(
                system_instruction=self.system_translate,
                temperature=0.1,
                max_output_tokens=4096,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        return response.text.strip()
    
    def translate_segmented(self, request: TranslationRequestPayload):
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=request.model_dump_json(),
            config=types.GenerateContentConfig(
                system_instruction=self.system_translate,
                response_mime_type="application/json",
                response_schema=TranslationResponsePayload,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        if hasattr(response, "parsed"):
            return response.parsed
        else:
            return TranslationResponsePayload.model_validate_json(response.text)

    def annotate(
        self,
        candidates: list[dict],
        tgt_word: str,
        tgt_lang: str,
        src_marked_sent: str,
        tgt_marked_sent: str,
    ) -> dict:
        # -------------------------
        # Construct explanation / definition disambigutation prompt
        # -------------------------
        prompt = dedent(
            f"""
            [Source sentence]
            {src_marked_sent}

            [Target sentence]
            {tgt_marked_sent}

            [Dictionary candidates (JSON)]
            {json.dumps(candidates, ensure_ascii=False)}

            Select the best candidate and return ONLY valid JSON following the system instructions.
        """
        ).strip()

        # -------------------------
        # Query Gemini for explanation / definition disambiguation
        # -------------------------
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=self.system_explain,
                response_mime_type="application/json",
                response_schema=ExplainDefineOut,
                temperature=0.1,
                max_output_tokens=256,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        if getattr(response, "parsed", None):
            data = response.parsed.model_dump()
        else:
            data = json.loads(response.text)

        # -------------------------
        # Query database for lemma / form IPA
        # -------------------------
        ipa_lemma = get_lemma_ipa(data["lemma"], data["pos_lemma"], tgt_lang)
        ipa_form = get_form_ipa(tgt_word, tgt_lang, data["lemma"], data["pos_form"])

        ipa_lemma = data["ipa_lemma"] if ipa_lemma is None else f"/{ipa_lemma}/"
        ipa_form = data["ipa_form"] if ipa_form is None else f"/{ipa_form}/"

        return {
            "definition": {
                "form": tgt_word,
                "pos_form": data.get("pos_form"),
                "ipa_form": ipa_form,
                "lemma": data.get("lemma"),
                "pos_lemma": data.get("pos_lemma"),
                "ipa_lemma": ipa_lemma,
                "gloss": data.get("gloss"),
            },
            "usage": {
                "explanation": data.get("explanation"),
                "examples": data.get("examples"),
            },
        }
