# Image Python légère
FROM python:3.11-slim

WORKDIR /app

# Copier les dépendances et installer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

# Lancer l'application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
