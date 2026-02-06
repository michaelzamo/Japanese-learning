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

  // Sauvegarder le texte
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      
      {/* MENU DE NAVIGATION */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span 
                onClick={handleNewText}
                className="font-bold text-xl text-indigo-600 cursor-pointer flex items-center gap-2"
            >
                🇯🇵 JapaLearn
            </span>
            <div className="flex space-x-2">
              <button onClick={handleNewText} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentView === 'reader' && currentTextId === null ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                📝 Nouveau
              </button>
              <button onClick={() => setCurrentView('library')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentView === 'library' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                📚 Bibliothèque
              </button>
              <button onClick={() => setCurrentView('reviews')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentView === 'reviews' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                🧠 Révisions
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        
        {currentView === 'reader' && (
          <div className="h-full">
             {!tokens.length ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {currentTextId ? "Modifier le texte" : "Écrire ou coller un texte"}
                    </h2>
                    {/* Actions rapides en haut */}
                    <div className="flex gap-3">
                        <button
                        onClick={handleSaveText}
                        className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition"
                        >
                        Sauvegarder brouillon
                        </button>
                        <button
                        onClick={handleAnalyze}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition transform active:scale-95"
                        >
                        Analyser 🚀
                        </button>
                    </div>
                </div>
                
                {/* Champ Titre - Plus grand et plus visible */}
                <input
                  type="text"
                  className="w-full p-4 text-xl font-bold text-gray-800 border-2 border-transparent hover:border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-0 transition placeholder-gray-300 mb-4 bg-gray-50 focus:bg-white"
                  placeholder="Titre de votre texte..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Champ Texte - Beaucoup plus grand et lisible */}
                <div className="flex-grow relative">
                    <textarea
                    className="w-full h-[60vh] p-6 text-lg leading-relaxed text-gray-700 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-y font-medium"
                    placeholder="Collez votre texte japonais ici (Kanji, Hiragana, Katakana)..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    />
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 sticky top-20 z-20 bg-gray-50/90 backdrop-blur py-2">
                    <button 
                        onClick={() => setTokens([])} 
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition font-medium px-4 py-2 rounded-lg hover:bg-white"
                    >
                    ← Revenir à l'édition
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 truncate max-w-md">{title}</h1>
                    <div className="w-24"></div> {/* Spacer pour équilibrer */}
                </div>
                <Reader tokens={tokens} />
              </div>
            )}
          </div>
        )}

        {currentView === 'library' && (
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Ma Bibliothèque</h2>
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
