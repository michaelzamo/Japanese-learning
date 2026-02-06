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

  // Analyse du texte
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
    // Scroll en haut de page automatiquement
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewText = () => {
    setCurrentView('reader');
    setInput("");
    setTitle("");
    setTokens([]);
    setCurrentTextId(null); 
  };

  // Helper pour les classes des boutons (évite la répétition et le décalage)
  const getNavClass = (viewName) => {
    const baseClass = "px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2";
    const activeClass = "bg-indigo-600 text-white shadow-md transform scale-105";
    const inactiveClass = "text-gray-500 hover:bg-gray-100 hover:text-indigo-600";
    
    // Logique spécifique pour le bouton 'Nouveau' qui doit être actif si on est en mode reader sans ID
    if (viewName === 'new' && currentView === 'reader' && currentTextId === null) {
        return `${baseClass} ${activeClass}`;
    }
    // Logique pour les autres onglets standards
    if (currentView === viewName) {
        return `${baseClass} ${activeClass}`;
    }
    return `${baseClass} ${inactiveClass}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* MENU DE NAVIGATION - FIXE EN HAUT */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span 
                onClick={handleNewText}
                className="font-black text-2xl text-indigo-600 cursor-pointer tracking-tight"
            >
                🇯🇵 JapaLearn
            </span>
            <div className="flex space-x-1 md:space-x-2">
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
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        
        {currentView === 'reader' && (
          <div className="h-full">
             {!tokens.length ? (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-700">
                        {currentTextId ? "✍️ Modification" : "📝 Nouveau texte"}
                    </h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={handleSaveText} className="flex-1 md:flex-none px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold transition">
                            Sauvegarder
                        </button>
                        <button onClick={handleAnalyze} className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition transform active:scale-95">
                            Analyser
                        </button>
                    </div>
                </div>
                
                <input
                  type="text"
                  className="w-full p-4 text-xl font-bold text-gray-800 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:outline-none transition placeholder-gray-300 bg-gray-50 focus:bg-white"
                  placeholder="Titre..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    className="w-full h-[60vh] p-6 text-lg leading-loose text-gray-700 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:outline-none transition resize-y font-medium shadow-inner"
                    placeholder="Collez votre texte japonais ici..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-20 z-30">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lecture en cours</span>
                        <h1 className="text-xl font-bold text-gray-800 truncate max-w-xs md:max-w-md">{title || "Sans titre"}</h1>
                    </div>
                    <button 
                        onClick={() => setTokens([])} 
                        className="text-gray-500 hover:text-indigo-600 transition font-medium px-3 py-1 rounded-lg hover:bg-gray-50 text-sm"
                    >
                    ✏️ Éditer
                    </button>
                </div>
                
                {/* Le composant Reader gère l'affichage du texte */}
                <Reader tokens={tokens} />
              </div>
            )}
          </div>
        )}

        {currentView === 'library' && (
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2 flex items-center gap-2">📚 Ma Bibliothèque</h2>
                <Library onLoadText={loadTextFromLibrary} />
            </div>
        )}

        {currentView === 'reviews' && (
          <ReviewSession />
        )}

      </main>
    </div>
  );
}

export default App;
