from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from janome.tokenizer import Tokenizer
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import uuid
import requests

# --- CONFIGURATION BASE DE DONNÉES (SQLite) ---
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
    meaning = Column(String)
    
    # Champs SRS (Répétition Espacée)
    interval = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    next_review = Column(DateTime, default=datetime.utcnow)

# Création automatique des tables
Base.metadata.create_all(bind=engine)

# --- API ---
app = FastAPI()

# Configuration CORS (Indispensable pour que le frontend communique)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Moteur d'analyse japonais (Janome)
tokenizer = Tokenizer()

# Modèles Pydantic
class TextPayload(BaseModel):
    content: str

class NewCard(BaseModel):
    word: str
    reading: str
    meaning: str

class ReviewPayload(BaseModel):
    card_id: str
    rating: str  # "easy", "medium", "hard", "forgot"

# 1. Endpoint d'analyse
@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    words = []
    # Janome tokenization
    for token in tokenizer.tokenize(payload.content):
        part_of_speech = token.part_of_speech.split(',')[0]
        reading = token.reading if token.reading != '*' else token.surface
        words.append({
            "surface": token.surface,
            "lemma": token.base_form,
            "reading": reading,
            "pos": part_of_speech,
        })
    return {"tokens": words}

# 2. Créer une nouvelle carte
@app.post("/cards")
def create_card(card: NewCard):
    db = SessionLocal()
    existing = db.query(Card).filter(Card.word == card.word).first()
    if existing:
        db.close()
        return {"msg": "Mot déjà dans la liste", "id": existing.id}
    
    new_card = Card(
        id=str(uuid.uuid4()),
        word=card.word,
        reading=card.reading,
        meaning=card.meaning,
        next_review=datetime.utcnow()
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    db.close()
    return new_card

# 3. Récupérer les révisions du jour
@app.get("/reviews")
def get_reviews():
    db = SessionLocal()
    now = datetime.utcnow()
    reviews = db.query(Card).filter(Card.next_review <= now).all()
    db.close()
    return reviews

# 4. Soumettre une révision (SRS)
@app.post("/review")
def submit_review(payload: ReviewPayload):
    try:
        db = SessionLocal()
        card = db.query(Card).filter(Card.id == payload.card_id).first()

        if not card:
            db.close()
            raise HTTPException(status_code=404, detail="Card not found")

        # --- DÉBUT CORRECTION ---
        # 1. Sécuriser les valeurs (au cas où elles seraient nulles dans la BDD)
        current_interval = int(card.interval) if card.interval is not None else 1
        current_ease = float(card.ease_factor) if card.ease_factor is not None else 2.5

        # 2. Calculer les nouvelles valeurs
        new_interval = current_interval
        new_ease = current_ease

        if payload.rating == "forgot":
            new_interval = 1
            new_ease = max(1.3, current_ease - 0.2)

        elif payload.rating == "hard":
            new_interval = int(current_interval * 1.2)
            new_ease = max(1.3, current_ease - 0.15)

        elif payload.rating == "medium":
            new_interval = int(current_interval * current_ease)
            # ease factor ne change pas

        elif payload.rating == "easy":
            new_interval = int(current_interval * current_ease * 1.3)
            new_ease = current_ease + 0.15

        # 3. Mettre à jour la carte
        card.interval = max(1, new_interval) # Jamais moins de 1 jour
        card.ease_factor = new_ease
        card.next_review = datetime.utcnow() + timedelta(days=card.interval)

        db.commit()
        db.refresh(card) # Important pour rafraîchir l'objet
        db.close()

        return {"msg": "Review saved", "next_date": card.next_review}

    except Exception as e:
        # En cas de crash, on l'affiche dans le terminal backend pour comprendre
        print(f"ERREUR CRITIQUE DANS REVIEW: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. Récupérer la définition via Jisho.org
@app.get("/definition")
def get_definition(word: str):
    try:
        # On interroge l'API publique de Jisho
        url = f"https://jisho.org/api/v1/search/words?keyword={word}"
        response = requests.get(url)
        data = response.json()
        
        # On essaie d'extraire la première définition
        if data['meta']['status'] == 200 and len(data['data']) > 0:
            first_result = data['data'][0]
            
            # On récupère les sens en anglais
            senses = first_result['senses'][0]['english_definitions']
            definition = ", ".join(senses)
            
            return {"definition": definition}
        else:
            return {"definition": "Définition non trouvée"}
            
    except Exception as e:
        print(f"Erreur Jisho: {e}")
        return {"definition": "Erreur de connexion"}
