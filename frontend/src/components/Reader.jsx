import React, { useState, useEffect } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState("Chargement...");

  // Quand un mot est sélectionné, on cherche sa définition
  useEffect(() => {
    if (selectedWord) {
      setDefinition("Recherche de la traduction...");
      fetchDefinition(selectedWord.lemma); // On cherche la forme "dictionnaire" (lemma)
    }
  }, [selectedWord]);

  const fetchDefinition = async (word) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/definition?word=${word}`);
      const data = await res.json();
      setDefinition(data.definition);
    } catch (err) {
      setDefinition("Impossible de charger la définition");
    }
  };

  const addToSRS = async (word) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.surface,
          reading: word.reading,
          meaning: definition // On utilise la définition trouvée !
        }),
      });
      if (response.ok) {
        alert(`"${word.surface}" ajouté aux révisions !`);
        setSelectedWord(null);
      } else {
        alert("Ce mot est déjà dans ta liste.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="p-6 leading-loose text-xl bg-white rounded-lg shadow">
      {/* Texte */}
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

      {/* Popup */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-3xl font-bold text-gray-800">{selectedWord.surface}</h3>
                    <p className="text-sm text-blue-600 font-bold">【{selectedWord.reading}】</p>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {selectedWord.pos}
                </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <p className="text-gray-700 italic">{definition}</p>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => addToSRS(selectedWord)}
                className="bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Ajouter à mes révisions
              </button>
              <button 
                onClick={() => setSelectedWord(null)}
                className="text-gray-500 text-sm py-2 hover:text-gray-700"
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
