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
    // Le conteneur principal n'a plus besoin de classes de layout, 
    // car #root est déjà une Grid définie dans index.css
    <>
      {/* LIGNE 1 DE LA GRILLE : NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
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

      {/* LIGNE 2 DE LA GRILLE : MAIN CONTENT */}
      {/* overflow-hidden est CRUCIAL ici : c'est le cadre qui empêche le débordement global */}
      <main className="w-full max-w-7xl mx-auto overflow-hidden relative bg-gray-50">
        
        // frontend/src/App.jsx (Extrait corrigé)

        {/* VUE LECTEUR (Contient soit l'Éditeur, soit le Lecteur Analyzé) */}
        {currentView === 'reader' && (
          <div className="h-full w-full p-2 md:p-4">
             {!tokens.length ? (
              
              /* --- MODE ÉDITEUR (TEXTAREA) --- */
              /* grid-rows-[auto_auto_1fr] : Titre, Header, et le Reste pour le texte */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full grid grid-rows-[auto_auto_1fr] overflow-hidden">
                
                {/* 1. Header de l'éditeur */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-700">{currentTextId ? "Modification" : "Nouveau texte"}</h2>
                    <div className="flex gap-2">
                        <button onClick={handleSaveText} className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold">Sauvegarder</button>
                        <button onClick={handleAnalyze} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">Analyser</button>
                    </div>
                </div>

                {/* 2. Champ Titre */}
                <div className="p-4 pb-0">
                    <input type="text" className="w-full p-4 text-xl font-bold border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500" placeholder="Titre..." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* 3. Zone de Texte (Le problème était souvent ici) */}
                {/* min-h-0 est CRUCIAL ici pour que le textarea ne casse pas la grille */}
                <div className="p-4 min-h-0">
                    <textarea 
                        className="w-full h-full p-6 text-lg leading-loose border-2 border-gray-100 rounded-xl outline-none resize-none shadow-inner overflow-y-auto focus:border-indigo-500" 
                        placeholder="Collez le texte ici..." 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                    />
                </div>
              </div>

            ) : (
              
              /* --- MODE LECTEUR (SPLIT VIEW) --- */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden grid grid-rows-[auto_1fr]">
                {/* Header Lecteur */}
                <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-lg font-bold text-gray-800 truncate">{title}</h1>
                    <button onClick={() => setTokens([])} className="text-sm font-bold text-gray-500 hover:text-indigo-600 px-3 py-1 rounded-lg hover:bg-white">✏️ Éditer</button>
                </div>
                
                {/* Conteneur du Reader */}
                <div className="relative w-full h-full min-h-0 overflow-hidden">
                    <Reader tokens={tokens} />
                </div>
              </div>
            )}
          </div>
        )}


        {/* VUE BIBLIOTHÈQUE - Scrollable */}
        {currentView === 'library' && (
            <div className="h-full w-full overflow-y-auto p-4 pb-20 scroll-smooth">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 sticky top-0 bg-gray-50 py-2 z-10">📚 Ma Bibliothèque</h2>
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {/* VUE RÉVISIONS - Scrollable */}
        {currentView === 'reviews' && (
          <div className="h-full w-full overflow-y-auto p-4 pb-20 scroll-smooth">
              <ReviewSession />
          </div>
        )}

      </main>
    </>
  );
}

export default App;
