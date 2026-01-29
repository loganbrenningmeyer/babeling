import os
import io
import json
import wave
from google import genai
from google.genai import types
from pydantic import BaseModel
from textwrap import dedent


class ExplainExample(BaseModel):
    source: str
    target: str

class ExplainDefineOut(BaseModel):
    lemma: str
    pos: str
    gloss: str
    explanation: str
    examples: list[ExplainExample]


def mark_words(words, spaces, mark_idxs, tag):
    out = []
    for i, (word, space) in enumerate(zip(words, spaces)):
        if i in mark_idxs:
            out.append(f"<{tag}>{word}</{tag}>{space}")
        else:
            out.append(word + space)

    return out


class GeminiAPI:
    def __init__(self, system_translate: str, system_explain: str):
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.system_translate = system_translate
        self.system_explain = system_explain

    def translate(self, source: str) -> str:
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

    def define_and_explain(
        self,
        candidates: list[dict],
        src_words: list[str],
        tgt_words: list[str],
        src_spaces: list[str],
        tgt_spaces: list[str],
        src_sent_ids: list[int],
        tgt_sent_ids: list[int],
        tgt_to_src: dict,
        tgt_idx: int,
    ) -> dict:
        # -------------------------
        # Add source / target markers
        # -------------------------
        src_mark_idxs = set(tgt_to_src.get(tgt_idx, []))
        tgt_mark_idxs = {tgt_idx}

        sent_id = tgt_sent_ids[tgt_idx]

        src_marked = mark_words(src_words, src_spaces, src_mark_idxs, "SOURCE")
        tgt_marked = mark_words(tgt_words, tgt_spaces, tgt_mark_idxs, "TARGET")

        src_sent = [w for i, w in zip(src_sent_ids, src_marked) if i == sent_id]
        tgt_sent = [w for i, w in zip(tgt_sent_ids, tgt_marked) if i == sent_id]

        source = "".join(src_sent)
        target = "".join(tgt_sent)

        # -------------------------
        # Construct explanation / definition disambigutation prompt
        # -------------------------
        prompt = dedent(f"""
            [Source sentence]
            {source}

            [Target sentence]
            {target}

            [Dictionary candidates (JSON)]
            {json.dumps(candidates, ensure_ascii=False)}

            Select the best candidate and return ONLY valid JSON following the system instructions.
        """).strip()
        
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

        return {
            "lemma": data.get("lemma"),
            "pos": data.get("pos"),
            "gloss": data.get("gloss"),
            "explanation": data.get("explanation"),
            "examples": data.get("examples")
        }