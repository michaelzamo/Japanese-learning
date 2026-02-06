import React, { useState } from 'react';
import Reader from './components/Reader';
import ReviewSession from './components/ReviewSession';
import Library from './components/Library';

function App() {
  // Navigation : 'reader', 'reviews', 'library'
  const [currentView, setCurrentView] = useState('reader'); 
  
  // États pour le lecteur
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [currentTextId, setCurrentTextId] = useState(null); 
  const [tokens, setTokens] = useState([]);

  // --- LOGIQUE MÉTIER ---

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
    } catch (err) {
      alert("Erreur de connexion au serveur");
    }
  };

  const handleSaveText = async () => {
    if (!input.trim()) return alert("Le texte est vide !");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: currentTextId, 
          title: title || "Texte sans titre", 
          content: input 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentTextId(data.id); 
        alert(currentTextId ? "Texte mis à jour !" : "Nouveau texte sauvegardé !");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    }
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

  // Helper pour le style des boutons de navigation
  const getNavClass = (viewName) => {
    const baseClass = "px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 cursor-pointer";
    const activeClass = "bg-indigo-600 text-white shadow-md transform scale-105";
    const inactiveClass = "text-gray-500 hover:bg-gray-100 hover:text-indigo-600";
    
    // Cas spécial pour le bouton 'Nouveau'
    if (viewName === 'new') {
        if (currentView === 'reader' && currentTextId === null && tokens.length === 0) return `${baseClass} ${activeClass}`;
        return `${baseClass} ${inactiveClass}`;
    }

    if (currentView === viewName) return `${baseClass} ${activeClass}`;
    return `${baseClass} ${inactiveClass}`;
  };

  return (
    // 1. CONTENEUR GLOBAL (Fixe à 100% de l'écran, pas de scroll ici)
    <div className="h-screen w-full bg-gray-50 font-sans text-gray-900 flex flex-col overflow-hidden">
      
      {/* 2. BARRE DE NAVIGATION (Fixe) */}
      <nav className="flex-none h-16 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
            <span 
                onClick={handleNewText}
                className="font-black text-2xl text-indigo-600 cursor-pointer tracking-tight"
            >
                🇯🇵 JapaLearn
            </span>
            <div className="flex space-x-2">
              <button onClick={handleNewText} className={getNavClass('new')}>
                📝 <span className="hidden md:inline">Nouveau</span>
              </button>
              <button onClick={() => setCurrentView('library')} className={getNavClass('library')}>
                📚 <span className="hidden md:inline">Bibliothèque</span>
              </button>
              <button onClick={() => setCurrentView('reviews')} className={getNavClass('reviews')}>
                🧠 <span className="hidden md:inline">Révisions</span>
              </button>
            </div>
        </div>
      </nav>

      {/* 3. ZONE DE CONTENU PRINCIPAL */}
      {/* flex-1 : Prend tout l'espace restant */}
      {/* overflow-hidden : Empêche le contenu de déborder sur le body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 overflow-hidden relative">
        
        {/* --- VUE LECTEUR (Éditeur ou Reader) --- */}
        {currentView === 'reader' && (
          <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             
             {!tokens.length ? (
              // A. MODE ÉDITION (Saisie du texte)
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex-none flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">
                        {currentTextId ? "✍️ Modification" : "📝 Nouveau texte"}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleSaveText} className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition">
                            Sauvegarder
                        </button>
                        <button onClick={handleAnalyze} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition">
                            Analyser 🚀
                        </button>
                    </div>
                </div>
                
                <input
                  type="text"
                  className="flex-none w-full p-4 mb-4 text-xl font-bold border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition"
                  placeholder="Titre de votre texte..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Textarea qui scrolle indépendamment */}
                <textarea
                  className="flex-1 w-full p-6 text-lg leading-loose border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none resize-none shadow-inner overflow-y-auto"
                  placeholder="Collez votre texte japonais ici..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
            ) : (
              // B. MODE LECTURE (Reader avec Split View)
              <div className="h-full flex flex-col">
                {/* Header interne */}
                <div className="flex-none h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-lg font-bold text-gray-800 truncate max-w-md">{title || "Sans titre"}</h1>
                    <button 
                        onClick={() => setTokens([])} 
                        className="text-sm font-bold text-gray-500 hover:text-indigo-600 px-3 py-1 rounded-lg hover:bg-white transition"
                    >
                        ✏️ Éditer le texte
                    </button>
                </div>
                
                {/* Le Reader prend toute la place restante */}
                <div className="flex-1 overflow-hidden relative">
                    <Reader tokens={tokens} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VUE BIBLIOTHÈQUE --- */}
        {currentView === 'library' && (
            // Conteneur scrollable indépendant
            <div className="h-full overflow-y-auto pr-2 pb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2 sticky top-0 bg-gray-50 py-2 z-10">
                    📚 Ma Bibliothèque
                </h2>
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {/* --- VUE RÉVISIONS --- */}
        {currentView === 'reviews' && (
          // Conteneur scrollable indépendant
          <div className="h-full overflow-y-auto pr-2 pb-10">
              <ReviewSession />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
