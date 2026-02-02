import React, { useState } from 'react';
import Reader from './components/Reader';
import ReviewSession from './components/ReviewSession';
import Library from './components/Library'; // <--- Import nouveau

function App() {
  // Navigation : 'reader', 'reviews', 'library'
  const [currentView, setCurrentView] = useState('reader'); 
  
  // États pour le lecteur
  const [input, setInput] = useState("");
  const [title, setTitle] = useState(""); // <--- Nouveau champ titre
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

  // Sauvegarder le texte dans la BDD
  const handleSaveText = async () => {
    if (!input.trim()) return alert("Le texte est vide !");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title || "Texte sans titre", 
          content: input 
        }),
      });
      if (response.ok) {
        alert("Texte sauvegardé dans la bibliothèque !");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    }
  };

  // Charger un texte depuis la bibliothèque
  const loadTextFromLibrary = (textObject) => {
    setInput(textObject.content);
    setTitle(textObject.title);
    setTokens([]); // On reset l'analyse pour forcer l'utilisateur à cliquer sur Analyser (ou on pourrait lancer l'analyse auto)
    setCurrentView('reader');
    // Optionnel : Lancer l'analyse automatiquement ici si tu veux
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* MENU DE NAVIGATION */}
      <nav className="bg-white shadow-sm mb-8 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span 
                onClick={() => setCurrentView('reader')}
                className="font-bold text-xl text-indigo-600 cursor-pointer"
            >
                🇯🇵 JapaLearn
            </span>
            <div className="flex space-x-2 md:space-x-4">
              <button onClick={() => setCurrentView('reader')} className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'reader' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                📖 Lecteur
              </button>
              <button onClick={() => setCurrentView('library')} className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'library' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                📚 Bibliothèque
              </button>
              <button onClick={() => setCurrentView('reviews')} className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'reviews' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                🧠 Révisions
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENU */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        
        {currentView === 'reader' && (
          <div>
             {!tokens.length ? (
              <div className="max-w-2xl mx-auto space-y-4 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Nouveau texte</h2>
                
                {/* Champ Titre */}
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 mb-2"
                  placeholder="Titre (ex: Chapitre 1, Article News...)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Champ Texte */}
                <textarea
                  className="w-full p-4 h-40 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Collez votre texte japonais ici..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                <div className="flex gap-4 pt-2">
                    <button
                    onClick={handleAnalyze}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition"
                    >
                    Analyser maintenant
                    </button>
                    <button
                    onClick={handleSaveText}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                    Sauvegarder
                    </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setTokens([])} className="text-indigo-600 underline text-sm hover:text-indigo-800">
                    ← Modifier le texte
                    </button>
                    {/* Petit rappel du titre */}
                    <span className="font-bold text-gray-700">{title}</span>
                </div>
                <Reader tokens={tokens} />
              </div>
            )}
          </div>
        )}

        {currentView === 'library' && (
            <Library onLoadText={loadTextFromLibrary} />
        )}

        {currentView === 'reviews' && (
          <ReviewSession />
        )}

      </main>
    </div>
  );
}

export default App;
