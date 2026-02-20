import base64
import requests
from api.config import INWORLD_API_KEY, VOICES


TEXT = "Hello, my name is Logan."


url = "https://api.inworld.ai/tts/v1/voice"

headers = {
    "Authorization": f"Basic {INWORLD_API_KEY}",
    "Content-Type": "application/json",
}

payload = {
    "text": str(TEXT).strip(".") + ".",
    "voiceId": "Dennis",
    "modelId": "inworld-tts-1.5-max",
    "temperature": 0.01,
    "timestampType": "WORD",
}

response = requests.post(url, headers=headers, json=payload)
response.raise_for_status()

data = response.json()

print(f"data: {data}")

audio_bytes = base64.b64decode(data["audioContent"])