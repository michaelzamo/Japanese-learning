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

  // --- ACTIONS (Identiques à avant) ---
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
    // CONTENEUR RACINE : h-full force la hauteur à 100% du parent (body)
    <div className="h-full w-full bg-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* NAVBAR : Flex-none (taille fixe) */}
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

      {/* MAIN : Flex-1 (Prend tout l'espace restant). overflow-hidden ici pour gérer le scroll dans les enfants */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 overflow-hidden relative">
        
        {/* CAS 1 : LECTEUR (Doit gérer son propre scroll interne pour le Split View) */}
        {currentView === 'reader' && (
          <div className="h-full w-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             {!tokens.length ? (
              // ÉDITEUR (Scrollable)
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex-none flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">{currentTextId ? "Modification" : "Nouveau texte"}</h2>
                    <div className="flex gap-2">
                        <button onClick={handleSaveText} className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold">Sauvegarder</button>
                        <button onClick={handleAnalyze} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">Analyser</button>
                    </div>
                </div>
                <input type="text" className="flex-none w-full p-4 mb-4 text-xl font-bold border-2 border-gray-100 rounded-xl outline-none" placeholder="Titre..." value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea className="flex-1 w-full p-6 text-lg leading-loose border-2 border-gray-100 rounded-xl outline-none resize-none shadow-inner" placeholder="Collez le texte ici..." value={input} onChange={(e) => setInput(e.target.value)} />
              </div>
            ) : (
              // LECTEUR ANALYSÉ (Split View)
              <div className="h-full flex flex-col">
                <div className="flex-none h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-lg font-bold text-gray-800 truncate">{title}</h1>
                    <button onClick={() => setTokens([])} className="text-sm font-bold text-gray-500 hover:text-indigo-600 px-3 py-1 rounded-lg hover:bg-white">✏️ Éditer</button>
                </div>
                {/* Le composant Reader prendra 100% de cet espace */}
                <div className="flex-1 overflow-hidden relative">
                    <Reader tokens={tokens} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CAS 2 & 3 : BIBLIOTHÈQUE & RÉVISIONS (Doivent scroller ici) */}
        {/* On ajoute 'overflow-y-auto' ici car ce sont des listes qui dépassent l'écran */}
        {currentView === 'library' && (
            <div className="h-full w-full overflow-y-auto pr-2 pb-20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 bg-gray-50 py-2 sticky top-0 z-10">📚 Ma Bibliothèque</h2>
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {currentView === 'reviews' && (
          <div className="h-full w-full overflow-y-auto pr-2 pb-20">
              <ReviewSession />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
