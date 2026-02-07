import React, { useState } from 'react';

const Reader = ({ tokens }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWordClick = (token) => {
    if (selectedWord === token) { setSelectedWord(null); return; }
    setSelectedWord(token);
    setLoading(true);
    fetchDefinition(token.lemma);
  };

  const fetchDefinition = async (word) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/definition?word=${word}`);
      const data = await res.json();
      setDefinition(data.definition);
    } catch (err) { setDefinition("Erreur"); } 
    finally { setLoading(false); }
  };

  const addToSRS = async () => {
    if (!selectedWord) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: selectedWord.surface, reading: selectedWord.reading, meaning: definition }),
      });
      alert("Ajouté !"); setSelectedWord(null);
    } catch (error) { alert("Erreur"); }
  };

  return (
    // Structure Flex Verticale qui remplit 100% du parent
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* --- ZONE DU TEXTE (Haut) --- */}
      {/* flex-1 : Prend tout l'espace disponible */}
      {/* min-h-0 : CRUCIAL pour le scroll Flexbox */}
      {/* overflow-y-auto : La barre de défilement apparaît ICI */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 transition-all duration-300">
        <div className="text-xl leading-[2.5] font-medium text-gray-800">
          {tokens.map((token, index) => {
             const isSelected = selectedWord === token;
             return (
              <span
                key={index}
                onClick={() => handleWordClick(token)}
                className={`
                  cursor-pointer rounded px-1 mx-[1px] inline-block transition-colors
                  ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-indigo-100 hover:text-indigo-700'}
                `}
              >
                {token.surface}
              </span>
            );
          })}
        </div>
        {/* Marge en bas pour que le texte ne colle pas au panneau */}
        <div className="h-24"></div>
      </div>

      {/* --- ZONE DU PANNEAU (Bas) --- */}
      {/* S'affiche uniquement si un mot est sélectionné */}
      {selectedWord && (
        <div className="flex-none h-72 bg-gray-50 border-t-4 border-indigo-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20 flex flex-col">
          
          {/* Header Panneau */}
          <div className="flex justify-between items-start p-4 border-b border-gray-200 bg-white">
             <div>
                <span className="text-2xl font-bold text-indigo-700 mr-2">{selectedWord.surface}</span>
                <span className="text-lg text-gray-500">【{selectedWord.reading}】</span>
             </div>
             <button onClick={() => setSelectedWord(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
          </div>

          {/* Définition (Scrollable si trop longue) */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <p className="text-gray-700 text-lg leading-relaxed">
                {loading ? "Recherche..." : definition}
            </p>
          </div>

          {/* Actions (Fixes en bas) */}
          <div className="p-3 bg-white border-t border-gray-200 flex justify-end gap-3 flex-none">
             <button onClick={() => setSelectedWord(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded font-medium">Fermer</button>
             <button onClick={addToSRS} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                <span>🧠</span> Ajouter
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
