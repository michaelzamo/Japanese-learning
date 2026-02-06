import React, { useState } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(false);

  // Fonction appelée au clic sur un mot
  const handleWordClick = (token) => {
    // Si on clique sur le même mot, on ferme le panneau
    if (selectedWord && selectedWord === token) {
      closePanel();
      return;
    }

    setSelectedWord(token);
    setLoading(true);
    fetchDefinition(token.lemma);
  };

  const closePanel = () => {
    setSelectedWord(null);
    setDefinition("");
  };

  const fetchDefinition = async (word) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/definition?word=${word}`);
      const data = await res.json();
      setDefinition(data.definition);
    } catch (err) {
      setDefinition("Impossible de charger la définition");
    } finally {
      setLoading(false);
    }
  };

  const addToSRS = async () => {
    if (!selectedWord) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: selectedWord.surface,
          reading: selectedWord.reading,
          meaning: definition 
        }),
      });
      if (response.ok) {
        alert(`"${selectedWord.surface}" ajouté aux révisions !`);
        closePanel(); // On ferme après l'ajout
      } else {
        alert("Ce mot est déjà dans ta liste.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="relative">
      {/* Zone de Texte (Le livre) 
         Note : pb-80 ajoute un grand espace vide en bas pour que le texte 
         ne soit jamais caché par le panneau quand on scrolle tout en bas.
      */}
      <div className="p-8 leading-[2.5] text-xl bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-800 font-medium pb-80 min-h-[50vh]">
        <div className="flex flex-wrap items-baseline">
          {tokens.map((token, index) => {
             const isPunctuation = token.pos === "Supplementary symbol" || token.surface === "。";
             const isSelected = selectedWord === token;

             return (
              <span
                key={index}
                onClick={() => handleWordClick(token)}
                className={`
                  cursor-pointer transition-all duration-200 rounded px-[2px] mx-[1px]
                  ${isSelected ? 'bg-indigo-600 text-white shadow-md transform scale-105' : ''} 
                  ${!isPunctuation && !isSelected ? 'hover:bg-indigo-100 hover:text-indigo-700 border-b-2 border-transparent hover:border-indigo-300' : ''}
                `}
              >
                {token.surface}
              </span>
            );
          })}
        </div>
      </div>

      {/* PANNEAU DOCKÉ EN BAS (Bottom Panel) */}
      {selectedWord && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[100] animate-slide-up">
          
          {/* Barre de progression de chargement (optionnel mais sympa) */}
          {loading && <div className="h-1 w-full bg-indigo-100"><div className="h-full bg-indigo-500 animate-pulse"></div></div>}

          <div className="max-w-5xl mx-auto p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            
            {/* Partie Gauche : Info du mot */}
            <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-indigo-700">{selectedWord.surface}</h3>
                    <span className="text-xl font-bold text-gray-400">/</span>
                    <p className="text-xl font-medium text-gray-800">【{selectedWord.reading}】</p>
                    <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">
                        {selectedWord.pos}
                    </span>
                </div>
                
                <p className="text-gray-600 leading-relaxed text-lg">
                    {loading ? "Recherche de la définition..." : definition}
                </p>
            </div>

            {/* Partie Droite : Actions */}
            <div className="flex gap-3 w-full md:w-auto shrink-0">
                <button 
                    onClick={addToSRS}
                    disabled={loading}
                    className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <span>🧠</span> Ajouter
                </button>
                <button 
                    onClick={closePanel}
                    className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-700 transition"
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
