import React, { useState, useEffect } from 'react';

const ReviewSession = () => {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Charger les révisions au démarrage
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`);
      const data = await res.json();
      setReviews(data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setLoading(false);
    }
  };

  // 2. Envoyer le résultat (SRS)
  const handleRate = async (rating) => {
    const currentCard = reviews[currentIndex];
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: currentCard.id,
          rating: rating
        }),
      });

      // Passer à la carte suivante
      setShowAnswer(false);
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Session terminée : on vide la liste pour afficher l'écran de fin
        setReviews([]); 
      }
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      alert("Erreur technique : Regarde la console (F12) pour les détails."); // <-- Ajout
    }
  };

  // --- RENDU VISUEL ---

  if (loading) return <div className="text-center p-10">Chargement des cartes...</div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center p-10 bg-green-50 rounded-xl border border-green-200">
        <h2 className="text-2xl font-bold text-green-800">🎉 Session terminée !</h2>
        <p className="text-green-700 mt-2">Aucune carte à réviser pour le moment.</p>
        <p className="text-sm text-gray-500 mt-4">Va lire un texte pour ajouter de nouveaux mots.</p>
      </div>
    );
  }

  const card = reviews[currentIndex];

  return (
    <div className="max-w-md mx-auto mt-8">
      {/* Barre de progression */}
      <div className="mb-4 text-sm text-gray-500 text-right">
        Carte {currentIndex + 1} / {reviews.length}
      </div>

      {/* La Carte */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 min-h-[300px] flex flex-col items-center justify-center p-8 relative">
        
        {/* RECTO : Le mot japonais */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">{card.word}</h2>
        </div>

        {/* VERSO : Réponse (cachée au début) */}
        {showAnswer && (
          <div className="text-center mt-6 animate-fade-in">
            <p className="text-2xl text-indigo-600 mb-2">【{card.reading}】</p>
            <p className="text-gray-700 text-lg border-t pt-4 mt-4">{card.meaning}</p>
          </div>
        )}
      </div>

      {/* Zone de Contrôle */}
      <div className="mt-6">
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg"
          >
            Voir la réponse
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleRate('forgot')}
              className="bg-red-100 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-200 border border-red-200"
            >
              Oublié
              <span className="block text-xs font-normal opacity-75">1 jour</span>
            </button>
            <button 
              onClick={() => handleRate('hard')}
              className="bg-yellow-100 text-yellow-700 py-3 rounded-lg font-semibold hover:bg-yellow-200 border border-yellow-200"
            >
              Difficile
            </button>
            <button 
              onClick={() => handleRate('easy')}
              className="bg-green-100 text-green-700 py-3 rounded-lg font-semibold hover:bg-green-200 border border-green-200"
            >
              Facile
              <span className="block text-xs font-normal opacity-75">4 jours+</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSession;
