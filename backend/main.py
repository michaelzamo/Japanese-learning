import os
import uuid
import requests
from typing import Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text as SQLText
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# SudachiPy (Moteur Japonais Léger)
from sudachipy import tokenizer
from sudachipy import dictionary

# --- CONFIGURATION BASE DE DONNÉES ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vocab.db")

# Correction pour Render (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configuration du moteur (Optimisé pour la RAM)
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Pool size réduit pour économiser la mémoire sur Render Free Tier
    engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=0)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODÈLES DE DONNÉES ---

class Card(Base):
    __tablename__ = "cards"
    id = Column(String, primary_key=True, index=True)
    word = Column(String, index=True)
    reading = Column(String)
    meaning = Column(String)
    
    # SRS
    interval = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    next_review = Column(DateTime, default=datetime.utcnow)

class Text(Base):
    __tablename__ = "texts"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    content = Column(SQLText) # Utilisation de SQLText pour les longs textes
    created_at = Column(DateTime, default=datetime.utcnow)

# Création des tables
Base.metadata.create_all(bind=engine)

# --- CONFIGURATION SUDACHI (Japonais) ---
try:
    tokenizer_obj = dictionary.Dictionary(dict="small").create()
    mode = tokenizer.Tokenizer.SplitMode.C
except Exception as e:
    print(f"Erreur chargement Sudachi: {e}")

# --- API ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DÉPENDANCE DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SCHÉMAS PYDANTIC ---
class TextPayload(BaseModel):
    content: str

class NewCard(BaseModel):
    word: str
    reading: str
    meaning: str

class ReviewPayload(BaseModel):
    card_id: str
    rating: str

class TextSavePayload(BaseModel):
    id: Optional[str] = None # L'ID est optionnel (si présent = mise à jour)
    title: str
    content: str

# --- ROUTES ---

@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    words = []
    try:
        tokens = tokenizer_obj.tokenize(payload.content, mode)
        for token in tokens:
            pos = token.part_of_speech()[0]
            if pos == "Whitespace":
                continue
            
            words.append({
                "surface": token.surface(),
                "lemma": token.dictionary_form(),
                "reading": token.reading_form(),
                "pos": pos,
            })
    except Exception as e:
        print(f"Erreur analyse: {e}")
        return {"tokens": []}
        
    return {"tokens": words}

@app.get("/definition")
def get_definition(word: str):
    try:
        url = f"https://jisho.org/api/v1/search/words?keyword={word}"
        response = requests.get(url, timeout=5)
        data = response.json()
        if data['meta']['status'] == 200 and len(data['data']) > 0:
            return {"definition": ", ".join(data['data'][0]['senses'][0]['english_definitions'])}
        return {"definition": "Définition non trouvée"}
    except:
        return {"definition": "Erreur connexion"}

@app.post("/cards")
def create_card(card: NewCard, db: Session = Depends(get_db)):
    existing = db.query(Card).filter(Card.word == card.word).first()
    if existing:
        return {"msg": "Mot déjà présent", "id": existing.id}
    
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
    return new_card

@app.get("/reviews")
def get_reviews(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(Card).filter(Card.next_review <= now).all()

@app.post("/review")
def submit_review(payload: ReviewPayload, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == payload.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    current_interval = int(card.interval) if card.interval else 1
    current_ease = float(card.ease_factor) if card.ease_factor else 2.5
    
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
    elif payload.rating == "easy":
        new_interval = int(current_interval * current_ease * 1.3)
        new_ease = current_ease + 0.15

    card.interval = max(1, new_interval)
    card.ease_factor = new_ease
    card.next_review = datetime.utcnow() + timedelta(days=card.interval)
    
    db.commit()
    return {"msg": "Saved", "next_date": card.next_review}

@app.post("/texts")
def save_text(payload: TextSavePayload, db: Session = Depends(get_db)):
    # 1. Mise à jour si ID existe
    if payload.id:
        existing_text = db.query(Text).filter(Text.id == payload.id).first()
        if existing_text:
            existing_text.title = payload.title
            existing_text.content = payload.content
            existing_text.created_at = datetime.utcnow() # On remonte le texte en haut de liste
            db.commit()
            db.refresh(existing_text)
            return {"msg": "Texte mis à jour", "id": existing_text.id}

    # 2. Sinon Création
    new_text = Text(
        id=str(uuid.uuid4()),
        title=payload.title,
        content=payload.content,
        created_at=datetime.utcnow()
    )
    db.add(new_text)
    db.commit()
    return {"msg": "Texte sauvegardé", "id": new_text.id}

@app.get("/texts")
def get_texts(db: Session = Depends(get_db)):
    return db.query(Text).order_by(Text.created_at.desc()).all()
