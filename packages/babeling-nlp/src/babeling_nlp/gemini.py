import os
import io
import json
import wave
from google import genai
from google.genai import types
from pydantic import BaseModel


class ExplainExample(BaseModel):
    fr: str
    en: str

class ExplanationOut(BaseModel):
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

    def translate_en_fr(self, source: str) -> str:
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

    def explain_en_fr(
        self,
        src_words: list[str],
        tgt_words: list[str],
        src_spaces: list[str],
        tgt_spaces: list[str],
        src_sent_ids: list[int],
        tgt_sent_ids: list[int],
        tgt_to_src: dict,
        tgt_idx: int,
    ) -> dict:
        # ----------
        # Add source / target markers
        # ----------
        src_mark_idxs = set(tgt_to_src.get(tgt_idx, []))
        tgt_mark_idxs = {tgt_idx}

        sent_id = tgt_sent_ids[tgt_idx]

        src_marked = mark_words(src_words, src_spaces, src_mark_idxs, "SOURCE")
        tgt_marked = mark_words(tgt_words, tgt_spaces, tgt_mark_idxs, "TARGET")

        src_sent = [w for i, w in zip(src_sent_ids, src_marked) if i == sent_id]
        tgt_sent = [w for i, w in zip(tgt_sent_ids, tgt_marked) if i == sent_id]

        source = "".join(src_sent)
        target = "".join(tgt_sent)

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

    def pronounce(self, text: str, num_attempts: int=10):
        for attempt in range(num_attempts):
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash-preview-tts",
                    contents=f"Prononce en français (France, fr-FR): {text}",
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name='Erinome',
                                )
                            )
                        ),
                    )
                )

                pcm = response.candidates[0].content.parts[0].inline_data.data

                # -------------------------
                # Wrap PCM frames into a WAV container
                # -------------------------
                buf = io.BytesIO()
                with wave.open(buf, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(pcm)
                print(f"[Success]: Attempt {attempt + 1} / {num_attempts}", flush=False)
                return buf.getvalue()
            except:
                print(f"[Error]: Attempt {attempt + 1} / {num_attempts}", flush=False)
                continue

        raise RuntimeError(f"Gemini TTS returned no audio after {num_attempts} attempts.")