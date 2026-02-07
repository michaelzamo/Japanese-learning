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

  // Styles boutons nav
  const getNavClass = (viewName) => {
    const active = currentView === viewName || (viewName === 'reader' && currentView === 'reader');
    return `px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`;
  };

  return (
    // CONTENEUR PRINCIPAL : Prend 100% de l'écran
    <div className="flex flex-col h-full w-full bg-gray-50 text-gray-900">
      
      {/* 1. HEADER (Fixe, ne scrolle pas) */}
      <nav className="flex-none h-16 bg-white shadow-sm border-b border-gray-200 z-50 px-4">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center">
            <span onClick={handleNewText} className="font-black text-xl md:text-2xl text-indigo-600 cursor-pointer">🇯🇵 JapaLearn</span>
            <div className="flex space-x-2">
              <button onClick={handleNewText} className={getNavClass('reader')}>📝 Nouveau</button>
              <button onClick={() => setCurrentView('library')} className={getNavClass('library')}>📚 Biblio</button>
              <button onClick={() => setCurrentView('reviews')} className={getNavClass('reviews')}>🧠 Révisions</button>
            </div>
        </div>
      </nav>

      {/* 2. ZONE DE CONTENU (Prend tout le reste de la place) */}
      {/* overflow-hidden : Empêche le contenu de déborder. C'est aux enfants de scroller. */}
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-hidden relative">
        
        {/* VUE LECTEUR / ÉDITEUR */}
        {currentView === 'reader' && (
          <div className="h-full w-full p-2 md:p-4"> 
            {!tokens.length ? (
              // --- MODE ÉDITEUR ---
              // Flex column : Header Fixe + Textarea Flexible
              <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                
                {/* Header Éditeur */}
                <div className="flex-none p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-700">{currentTextId ? "Modification" : "Nouveau texte"}</h2>
                    <div className="flex gap-2">
                        <button onClick={handleSaveText} className="px-3 py-1 text-indigo-700 bg-white border border-indigo-200 rounded-lg font-bold hover:bg-indigo-50">Sauver</button>
                        <button onClick={handleAnalyze} className="px-4 py-1 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm">Analyser</button>
                    </div>
                </div>

                {/* Champ Titre */}
                <div className="flex-none p-4 pb-0">
                    <input type="text" className="w-full p-3 text-lg font-bold border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Titre..." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* Zone de Texte (Scrollable) */}
                {/* flex-1 + min-h-0 = Magie Flexbox pour le scroll */}
                <div className="flex-1 p-4 min-h-0">
                    <textarea 
                        className="w-full h-full p-4 text-lg border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none overflow-y-auto" 
                        placeholder="Collez votre texte japonais ici..." 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                    />
                </div>
              </div>
            ) : (
              // --- MODE LECTEUR ---
              // On passe la main au composant Reader, en lui donnant 100% de hauteur
              <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                 <div className="flex-none h-12 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50">
                    <h1 className="font-bold text-gray-800 truncate">{title}</h1>
                    <button onClick={() => setTokens([])} className="text-xs font-bold text-gray-500 hover:text-indigo-600 uppercase">Modifier</button>
                 </div>
                 <div className="flex-1 overflow-hidden relative">
                    <Reader tokens={tokens} />
                 </div>
              </div>
            )}
          </div>
        )}

        {/* VUE BIBLIOTHÈQUE (Scrollable) */}
        {currentView === 'library' && (
            <div className="h-full w-full overflow-y-auto p-4 pb-20">
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {/* VUE RÉVISIONS (Scrollable) */}
        {currentView === 'reviews' && (
          <div className="h-full w-full overflow-y-auto p-4 pb-20">
              <ReviewSession />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
