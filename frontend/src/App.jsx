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

  // --- ACTIONS ---
  const handleAnalyze = async () => {
    if (!input.trim()) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      const data = await response.json();
      setTokens(data.tokens);
    } catch (err) { alert("Erreur serveur"); }
  };

  const handleSaveText = async () => {
    if (!input.trim()) return alert("Texte vide !");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentTextId, title: title || "Sans titre", content: input }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTextId(data.id); 
        alert("Sauvegardé !");
      }
    } catch (err) { alert("Erreur sauvegarde"); }
  };

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

  const getNavClass = (viewName) => {
    const baseClass = "px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap";
    const activeClass = "bg-indigo-600 text-white shadow-md";
    const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-indigo-600";
    if (viewName === 'reader' && currentView === 'reader') return `${baseClass} ${activeClass}`;
    if (currentView === viewName) return `${baseClass} ${activeClass}`;
    return `${baseClass} ${inactiveClass}`;
  };

  return (
    // ROOT: Prend tout l'écran, pas de scroll ici.
    <div className="h-full w-full bg-gray-50 font-sans text-gray-900 flex flex-col overflow-hidden">
      
      {/* NAVBAR */}
      <nav className="flex-none h-16 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
            <span onClick={handleNewText} className="font-black text-xl md:text-2xl text-indigo-600 cursor-pointer">
                🇯🇵 JapaLearn
            </span>
            <div className="flex space-x-2">
              <button onClick={handleNewText} className={getNavClass('reader')}>📝 Nouveau</button>
              <button onClick={() => setCurrentView('library')} className={getNavClass('library')}>📚 Bibliothèque</button>
              <button onClick={() => setCurrentView('reviews')} className={getNavClass('reviews')}>🧠 Révisions</button>
            </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      {/* IMPORTANT : J'ai retiré le padding global (p-4) ici ! */}
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-hidden relative flex flex-col">
        
        {/* VUE LECTEUR */}
        {currentView === 'reader' && (
          // On remet un peu de margin (m-4) pour que ce ne soit pas collé, mais on gère la hauteur avec calc
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden m-2 md:m-4">
             {!tokens.length ? (
              // ÉDITEUR
              <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0">
                <div className="flex-none flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">{currentTextId ? "Modification" : "Nouveau texte"}</h2>
                    <div className="flex gap-2">
                        <button onClick={handleSaveText} className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold">Sauvegarder</button>
                        <button onClick={handleAnalyze} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">Analyser</button>
                    </div>
                </div>
                <input type="text" className="flex-none w-full p-4 mb-4 text-xl font-bold border-2 border-gray-100 rounded-xl outline-none" placeholder="Titre..." value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="flex-1 w-full p-6 text-lg leading-loose border-2 border-gray-100 rounded-xl outline-none resize-none shadow-inner overflow-y-auto" placeholder="Collez le texte ici..." value={input} onChange={(e) => setInput(e.target.value)} />
              </div>
            ) : (
              // LECTEUR / SPLIT VIEW
              <div className="h-full w-full flex flex-col overflow-hidden">
                <div className="flex-none h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-lg font-bold text-gray-800 truncate">{title}</h1>
                    <button onClick={() => setTokens([])} className="text-sm font-bold text-gray-500 hover:text-indigo-600 px-3 py-1 rounded-lg hover:bg-white">✏️ Éditer</button>
                </div>
                {/* Conteneur du Reader */}
                <div className="flex-1 overflow-hidden relative w-full h-full">
                    <Reader tokens={tokens} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* VUE BIBLIOTHÈQUE - Ici on ajoute du padding car c'est une page normale */}
        {currentView === 'library' && (
            <div className="h-full w-full overflow-y-auto p-4 pb-20 scroll-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 sticky top-0 bg-gray-50 py-2 z-10">📚 Ma Bibliothèque</h2>
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {/* VUE RÉVISIONS - Ici on ajoute du padding */}
        {currentView === 'reviews' && (
          <div className="h-full w-full overflow-y-auto p-4 pb-20 scroll-smooth">
              <ReviewSession />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
