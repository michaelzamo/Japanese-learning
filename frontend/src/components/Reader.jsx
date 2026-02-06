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
    // H-FULL est obligatoire pour remplir le parent
    <div className="h-full w-full flex flex-col bg-white relative">
      
      {/* ZONE 1 : LE TEXTE */}
      {/* flex-1 : Prend tout l'espace */}
      {/* min-h-0 : Force le navigateur à accepter de réduire cette zone si besoin (débloque le scroll) */}
      {/* overflow-y-auto : Active la scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-white transition-all">
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
        {/* Padding géant en bas pour que le dernier mot ne soit jamais caché derrière le panneau */}
        <div className="h-40"></div>
      </div>

      {/* ZONE 2 : LE PANNEAU */}
      {/* flex-none : Garde sa taille fixe */}
      {selectedWord && (
        <div className="flex-none h-72 bg-gray-50 border-t-4 border-indigo-100 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20 flex flex-col">
          
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="text-3xl font-bold text-indigo-700 mr-3">{selectedWord.surface}</span>
                    <span className="text-xl text-gray-600">【{selectedWord.reading}】</span>
                </div>
                <button onClick={() => setSelectedWord(null)} className="text-gray-400 hover:text-gray-600 font-bold p-2">✕</button>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed bg-white p-3 border rounded-lg shadow-sm">
                {loading ? "Recherche..." : definition}
            </p>
          </div>

          <div className="p-3 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
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
