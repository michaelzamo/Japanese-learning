from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from janome.tokenizer import Tokenizer

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation de Janome (plus simple que Fugashi)
tokenizer = Tokenizer()

class TextPayload(BaseModel):
    content: str

@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    words = []
    # Janome découpe le texte
    for token in tokenizer.tokenize(payload.content):
        # Janome renvoie la grammaire sous forme de liste séparée par des virgules
        # Ex: "Nom,Général,*,*,*,*,Livre,Hon,Hon"
        part_of_speech = token.part_of_speech.split(',')[0]
        
        # Gestion de la lecture (parfois Janome ne la trouve pas, on met la surface par défaut)
        reading = token.reading if token.reading != '*' else token.surface

        words.append({
            "surface": token.surface,       # Le mot affiché
            "lemma": token.base_form,       # La forme du dictionnaire
            "reading": reading,             # La prononciation (Katakana)
            "pos": part_of_speech,          # Nature (Nom, Verbe...)
        })
    return {"tokens": words}

@app.get("/")
def health_check():
    return {"status": "online", "engine": "janome"}

