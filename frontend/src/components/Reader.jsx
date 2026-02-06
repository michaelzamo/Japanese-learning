import React, { useState, useRef, useEffect } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Référence pour scroller automatiquement vers la définition si besoin
  const panelRef = useRef(null);

  const handleWordClick = (token) => {
    if (selectedWord === token) {
      setSelectedWord(null); // On ferme si on reclique dessus
      return;
    }
    setSelectedWord(token);
    setLoading(true);
    fetchDefinition(token.lemma);
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
    // CONTENEUR PRINCIPAL : Hauteur fixe calculée (100% écran - Header - Marges)
    // Cela empêche la page entière de scroller.
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* ZONE 1 : LE TEXTE (Partie Haute) */}
      {/* 'flex-1' signifie qu'elle prend tout l'espace disponible */}
      {/* 'overflow-y-auto' signifie que la barre de défilement est ICI, pas sur la page */}
      <div className="flex-1 overflow-y-auto p-8 transition-all duration-300">
        <div className="text-xl leading-[2.5] font-medium text-gray-800">
          {tokens.map((token, index) => {
             const isPunctuation = token.pos === "Supplementary symbol" || token.surface === "。";
             const isSelected = selectedWord === token;

             return (
              <span
                key={index}
                onClick={() => handleWordClick(token)}
                className={`
                  cursor-pointer transition-all duration-150 rounded px-[2px] mx-[1px] inline-block
                  ${isSelected ? 'bg-indigo-600 text-white shadow-sm scale-105' : ''} 
                  ${!isPunctuation && !isSelected ? 'hover:bg-indigo-100 hover:text-indigo-700' : ''}
                `}
              >
                {token.surface}
              </span>
            );
          })}
        </div>
        {/* Espace vide en bas pour le confort visuel */}
        <div className="h-20"></div>
      </div>

      {/* ZONE 2 : PANNEAU D'INFORMATION (Partie Basse) */}
      {/* S'affiche uniquement si un mot est sélectionné */}
      {selectedWord && (
        <div 
            ref={panelRef}
            className="h-72 flex-shrink-0 bg-gray-50 border-t-2 border-indigo-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex flex-col animate-slide-up"
        >
          {/* Barre de chargement */}
          {loading && <div className="h-1 w-full bg-indigo-200"><div className="h-full bg-indigo-600 animate-pulse w-1/3 mx-auto"></div></div>}

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="text-3xl font-bold text-indigo-700">{selectedWord.surface}</h3>
                    <span className="text-xl font-bold text-gray-400">/</span>
                    <p className="text-xl font-medium text-gray-800">【{selectedWord.reading}】</p>
                    <span className="bg-white border border-gray-200 text-gray-500 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider shadow-sm">
                        {selectedWord.pos}
                    </span>
                </div>
                <button 
                    onClick={() => setSelectedWord(null)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition"
                >
                    ✕
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-700 text-lg leading-relaxed">
                    {loading ? "Recherche de la définition..." : definition}
                </p>
            </div>
          </div>

          {/* Boutons d'action en bas du panneau */}
          <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
             <button 
                onClick={() => setSelectedWord(null)}
                className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
            >
                Fermer
            </button>
            <button 
                onClick={addToSRS}
                disabled={loading}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md transition flex items-center gap-2"
            >
                <span>🧠</span> Ajouter aux révisions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
