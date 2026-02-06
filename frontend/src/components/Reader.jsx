import React, { useState, useEffect } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState("Chargement...");

  // Gestion du verrouillage du scroll et chargement
  useEffect(() => {
    if (selectedWord) {
      // 1. On bloque le scroll
      document.body.style.overflow = 'hidden';
      // 2. On lance la recherche
      setDefinition("Recherche de la traduction...");
      fetchDefinition(selectedWord.lemma);
    } else {
      // Si on ferme, on débloque le scroll
      document.body.style.overflow = 'unset';
    }
    
    // Nettoyage au cas où le composant est démonté
    return () => { document.body.style.overflow = 'unset'; }
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
          meaning: definition 
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
    <>
      {/* Zone de Texte (Le livre) */}
      <div className="p-8 leading-[2.5] text-xl bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-800 font-medium">
        <div className="flex flex-wrap items-baseline">
          {tokens.map((token, index) => {
             const isPunctuation = token.pos === "Supplementary symbol" || token.surface === "。";
             
             return (
              <span
                key={index}
                onClick={() => setSelectedWord(token)}
                className={`
                  cursor-pointer transition-all duration-200 rounded px-[2px] mx-[1px]
                  ${!isPunctuation ? 'hover:bg-indigo-100 hover:text-indigo-700 border-b-2 border-transparent hover:border-indigo-300' : ''}
                `}
              >
                {token.surface}
              </span>
            );
          })}
        </div>
      </div>

      {/* POPUP MODAL (Correction Z-Index et Position) */}
      {selectedWord && (
        <div 
            className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedWord(null)}
        >
          
          {/* Contenu de la carte */}
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()} // Empêche de fermer si on clique DANS la carte
          >
            
            {/* En-tête coloré */}
            <div className="bg-indigo-600 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-4xl font-bold mb-1">{selectedWord.surface}</h3>
                        <p className="text-xl opacity-90 font-medium">【{selectedWord.reading}】</p>
                    </div>
                    <span className="bg-indigo-500/50 border border-indigo-400 text-white text-xs px-2 py-1 rounded uppercase tracking-wide">
                        {selectedWord.pos}
                    </span>
                </div>
            </div>
            
            {/* Corps de la définition */}
            <div className="p-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 min-h-[80px] max-h-[200px] overflow-y-auto">
                    <p className="text-gray-700 text-lg leading-relaxed">{definition}</p>
                </div>

                <div className="grid gap-3">
                    <button 
                        onClick={() => addToSRS(selectedWord)}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        <span>🧠</span> Ajouter aux révisions
                    </button>
                    <button 
                        onClick={() => setSelectedWord(null)}
                        className="w-full bg-white text-gray-500 py-3 rounded-xl font-semibold hover:bg-gray-50 border border-gray-200 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reader;
