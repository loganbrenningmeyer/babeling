from fastapi import FastAPI
from babeling_nlp.align import Aligner
from babeling_nlp.translate import Translator
from pydantic import BaseModel

class TextInput(BaseModel):
    text: str

# ----------
# Create Aligner
# ----------
aligner = Aligner(
    model_name="microsoft/mdeberta-v3-base",
    ckpt_path="checkpoints/model-finetune-step55000.ckpt"
)

# ----------
# Create Translator
# ----------
translator = Translator()

# ----------
# Initialize FastAPI
# ----------
app = FastAPI()


@app.get("/hello")
def hello():
    return {"message": "Hello from Python NLP service!"}


@app.post("/translate")
def translate(source: TextInput):
    return {"translation": translator.translate_en_fr(source.text)}
