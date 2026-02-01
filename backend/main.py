from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import fugashi

app = FastAPI()

# Configuration CORS pour que ton frontend Vite puisse communiquer avec le backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # À restreindre plus tard avec l'URL Render de ton frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation du tagueur (segmentation du japonais)
tagger = fugashi.Tagger()

class TextPayload(BaseModel):
    content: str

@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    words = []
    for word in tagger(payload.content):
        # On extrait les infos morphologiques de MeCab
        # word.feature contient : PartOfSpeech, POS_detail, ..., Reading, etc.
        feature = word.feature
        
        words.append({
            "surface": word.surface,      # Le texte tel qu'il apparaît
            "lemma": word.feature.lemma,  # La forme de base (dictionnaire)
            "reading": word.feature.kana, # La lecture en Katakana
            "pos": word.feature.pos1,     # Nature grammaticale (Nom, Verbe...)
        })
    return {"tokens": words}

@app.get("/")
def health_check():
    return {"status": "online", "language": "japanese"}
