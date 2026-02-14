import base64
import requests
from fastapi import APIRouter
from fastapi.responses import Response

from api.schemas.pronounce import PronounceRequest
from api.config import INWORLD_API_KEY, VOICES


router = APIRouter(prefix="/pronounce", tags=["pronounce"])

@router.post("")
def pronounce(req: PronounceRequest):
    url = "https://api.inworld.ai/tts/v1/voice"

    headers = {
        "Authorization": f"Basic {INWORLD_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "text": str(req.text).strip(".") + ".",
        "voiceId": VOICES[req.tgt_lang],
        "modelId": "inworld-tts-1.5-max",
        "temperature": 0.01,
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    data = response.json()

    audio_bytes = base64.b64decode(data["audioContent"])

    return Response(content=audio_bytes, media_type="audio/wav")