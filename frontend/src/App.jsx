import React, { useState } from 'react';
import Reader from './components/Reader';
import ReviewSession from './components/ReviewSession';
import Library from './components/Library';

function App() {
  const [currentView, setCurrentView] = useState('reader'); 
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [currentTextId, setCurrentTextId] = useState(null); 
  const [tokens, setTokens] = useState([]);

  // ... (Garde tes fonctions handleAnalyze, handleSaveText, etc. inchangées) ...
  // Je remets juste les fonctions vides pour la lisibilité du code ici, 
  // mais garde ta logique existante !
  const handleAnalyze = async () => { /* ... ton code ... */ 
    if (!input.trim()) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      const data = await response.json();
      setTokens(data.tokens);
    } catch (err) { alert("Erreur"); }
  };
  const handleSaveText = async () => { /* ... ton code ... */ };
  const loadTextFromLibrary = (textObject) => {
    setInput(textObject.content);
    setTitle(textObject.title);
    setCurrentTextId(textObject.id); 
    setTokens([]); 
    setCurrentView('reader');
  };
  const handleNewText = () => {
    setCurrentView('reader');
    setInput("");
    setTitle("");
    setTokens([]);
    setCurrentTextId(null); 
  };

  return (
    // CONTENEUR RACINE : Hauteur 100% force, pas de scroll global
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      
      {/* 1. NAVBAR (Fixe) */}
      <nav className="flex-none h-16 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
            <span onClick={handleNewText} className="font-black text-2xl text-indigo-600 cursor-pointer">🇯🇵 JapaLearn</span>
            <div className="flex gap-2">
              <button onClick={handleNewText} className="px-3 py-1 text-sm font-bold text-gray-600 hover:text-indigo-600">📝 Nouveau</button>
              <button onClick={() => setCurrentView('library')} className="px-3 py-1 text-sm font-bold text-gray-600 hover:text-indigo-600">📚 Bibliothèque</button>
              <button onClick={() => setCurrentView('reviews')} className="px-3 py-1 text-sm font-bold text-gray-600 hover:text-indigo-600">🧠 Révisions</button>
            </div>
        </div>
      </nav>

      {/* 2. ZONE PRINCIPALE (Prend tout le reste de la place) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 overflow-hidden">
        
        {currentView === 'reader' && (
          // Cette div fait 100% de la hauteur du main
          <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             
             {!tokens.length ? (
              // VUE ÉDITEUR (Scrollable)
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">✍️ Éditeur</h2>
                    <div className="flex gap-2">
                        <button onClick={handleAnalyze} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Analyser</button>
                    </div>
                </div>
                <input type="text" className="w-full p-3 text-lg font-bold border rounded-lg mb-4" placeholder="Titre..." value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="flex-1 w-full p-4 text-lg border rounded-lg resize-none" placeholder="Collez le texte ici..." value={input} onChange={(e) => setInput(e.target.value)} />
              </div>
            ) : (
              // VUE LECTEUR (Reader)
              // On passe le relais au composant Reader qui va gérer le split screen
              <div className="h-full flex flex-col">
                 {/* Petit header interne au lecteur */}
                 <div className="flex-none h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
                    <span className="font-bold text-gray-700 truncate">{title}</span>
                    <button onClick={() => setTokens([])} className="text-xs font-bold text-gray-500 hover:text-indigo-600">✏️ MODIFIER</button>
                 </div>
                 
                 {/* LE COMPOSANT READER PREND TOUTE LA PLACE RESTANTE */}
                 <div className="flex-1 overflow-hidden">
                    <Reader tokens={tokens} />
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Bibliothèque et Révisions (Scrollables indépendamment) */}
        {currentView === 'library' && (
            <div className="h-full overflow-y-auto pr-2"><Library onLoadText={loadTextFromLibrary} /></div>
        )}
        {currentView === 'reviews' && (
            <div className="h-full overflow-y-auto pr-2"><ReviewSession /></div>
        )}

      </main>
    </div>
  );
}

export default App;
