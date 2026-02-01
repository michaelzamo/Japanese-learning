import React, { useState } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
const addToSRS = async (word) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.surface,
          reading: word.reading,
          meaning: "Définition à ajouter manuellement pour l'instant" 
        }),
      });
      if (response.ok) {
        alert(`"${word.surface}" ajouté aux révisions !`);
        setSelectedWord(null); // Ferme le popup
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion au serveur");
    }
};
  return (
    <div className="p-6 leading-loose text-xl bg-white rounded-lg shadow">
      {/* Affichage du texte segmenté */}
      <div className="flex flex-wrap gap-x-1">
        {tokens.map((token, index) => (
          <span
            key={index}
            onClick={() => setSelectedWord(token)}
            className="cursor-pointer hover:bg-yellow-200 transition-colors border-b border-transparent hover:border-yellow-400"
          >
            {token.surface}
          </span>
        ))}
      </div>

      {/* Popup / Modal d'informations */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl">
            <h3 className="text-3xl font-bold text-gray-800">{selectedWord.surface}</h3>
            <p className="text-sm text-blue-600 mb-2">【{selectedWord.reading}】</p>
            
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Grammaire :</strong> {selectedWord.pos}</p>
              <p><strong>Forme de base :</strong> {selectedWord.lemma}</p>
              {/* La définition viendra de ton API dictionnaire plus tard */}
              <p className="italic text-gray-500 italic text-sm">Définition bientôt disponible...</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
<button 
  onClick={() => addToSRS(selectedWord)}
  className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
>
  Ajouter à mes révisions
</button>
              <button 
                onClick={() => setSelectedWord(null)}
                className="text-gray-500 text-sm py-1"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
