import os
import uuid
import requests
from datetime import datetime, timedelta  # <--- C'est cette ligne qui manquait !

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sudachipy import tokenizer
from sudachipy import dictionary
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# --- CONFIGURATION BASE DE DONNÉES (SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./vocab.db"
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # OPTIMISATION RAM : on limite le pool à 5 connexions max
    engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=0)
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

class Text(Base):
    __tablename__ = "texts"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Création automatique des tables
Base.metadata.create_all(bind=engine)

# --- API ---
app = FastAPI()

# Fonction pour gérer la session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
# Configuration CORS (Indispensable pour que le frontend communique)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Sudachi (Mode A = découpage court, C = découpage long. On prend C pour ressembler à Janome)
tokenizer_obj = dictionary.Dictionary(dict="small").create()
mode = tokenizer.Tokenizer.SplitMode.C

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

class TextSavePayload(BaseModel):
    title: str
    content: str
    
# 1. Endpoint d'analyse
@app.post("/analyze")
async def analyze_text(payload: TextPayload):
    words = []
    # Analyse avec Sudachi
    tokens = tokenizer_obj.tokenize(payload.content, mode)

    for token in tokens:
        # Sudachi renvoie les POS sous forme de liste, on prend le premier élément
        pos = token.part_of_speech()[0]

        # On ignore les espaces et caractères invisibles
        if pos == "Whitespace":
            continue

        words.append({
            "surface": token.surface(),
            "lemma": token.dictionary_form(),
            "reading": token.reading_form(), # Sudachi donne la lecture en Katakana
            "pos": pos,
        })
    return {"tokens": words}

# 2. Créer une nouvelle carte
@app.post("/cards")
def create_card(card: NewCard, db: Session = Depends(get_db)): # <--- Modifié
    # Plus de db = SessionLocal() ici !
    existing = db.query(Card).filter(Card.word == card.word).first()
    if existing:
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
    # Plus de db.close() ici !
    return new_card

# 3. Récupérer les révisions du jour
@app.get("/reviews")
def get_reviews(db: Session = Depends(get_db)): # <--- Modifié
    now = datetime.utcnow()
    reviews = db.query(Card).filter(Card.next_review <= now).all()
    return reviews
    
# 4. Soumettre une révision (SRS)
@app.post("/review")
def submit_review(payload: ReviewPayload, db: Session = Depends(get_db)): # <--- Modifié
    try:
        card = db.query(Card).filter(Card.id == payload.card_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        current_interval = int(card.interval) if card.interval is not None else 1
        current_ease = float(card.ease_factor) if card.ease_factor is not None else 2.5
        
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
        db.refresh(card)
        return {"msg": "Review saved", "next_date": card.next_review}

    except Exception as e:
        print(f"ERREUR CRITIQUE: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
        
# 5. Récupérer la définition via Jisho.org
@app.get("/definition")
def get_definition(word: str):
    # (Pas de DB ici non plus, on laisse tel quel)
    try:
        url = f"https://jisho.org/api/v1/search/words?keyword={word}"
        response = requests.get(url)
        data = response.json()
        if data['meta']['status'] == 200 and len(data['data']) > 0:
            return {"definition": ", ".join(data['data'][0]['senses'][0]['english_definitions'])}
        else:
            return {"definition": "Définition non trouvée"}
    except Exception as e:
        return {"definition": "Erreur de connexion"}

# 6. Sauvegarder un texte
@app.post("/texts")
def save_text(payload: TextSavePayload, db: Session = Depends(get_db)): # <--- C'est celle qui posait problème
    new_text = Text(
        id=str(uuid.uuid4()),
        title=payload.title if payload.title else "Texte sans titre",
        content=payload.content,
        created_at=datetime.utcnow()
    )
    db.add(new_text)
    db.commit()
    db.refresh(new_text) 
    # Grâce à Depends(get_db), la session reste ouverte jusqu'à ce que new_text soit renvoyé
    return {"msg": "Texte sauvegardé", "id": new_text.id}

# 7. Récupérer tous les textes (Bibliothèque)
@app.get("/texts")
def get_texts(db: Session = Depends(get_db)): # <--- Modifié
    texts = db.query(Text).order_by(Text.created_at.desc()).all()
    return texts
