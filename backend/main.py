from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from janome.tokenizer import Tokenizer

# --- CONFIGURATION BASE DE DONNÉES (SQLite pour l'instant) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./vocab.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODÈLE DE DONNÉES (La carte Flashcard) ---
class Card(Base):
    __tablename__ = "cards"
    id = Column(String, primary_key=True, index=True)
    word = Column(String, index=True)
    reading = Column(String)
    meaning = Column(String)  # Pour stocker la définition
    
    # Champs SRS (Répétition Espacée)
    interval = Column(Integer, default=1)   # Jours avant prochaine révision
    ease_factor = Column(Float, default=2.5) # Facilité (2.5 est le standard SM-2)
    next_review = Column(DateTime, default=datetime.utcnow) # Date prochaine révision

Base.metadata.create_all(bind=engine)

# --- API ---
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

# Modèles Pydantic (Validation des données reçues)
class TextPayload(BaseModel):
    content: str

class NewCard(BaseModel):
    word: str
    reading: str
    meaning: str

class ReviewPayload(BaseModel):
    card_id: str
    rating: str  # "easy", "medium", "hard", "forgot"

# 1. Analyse du texte (comme avant)
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

