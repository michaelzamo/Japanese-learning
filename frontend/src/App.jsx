import React, { useState } from 'react';
import Reader from './components/Reader';
import ReviewSession from './components/ReviewSession'; // Import du nouveau composant

function App() {
  // Navigation simple : 'reader' ou 'reviews'
  const [currentView, setCurrentView] = useState('reader'); 
  
  // États pour le lecteur
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState([]);

  const handleAnalyze = async () => {
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- MENU DE NAVIGATION (En haut) --- */}
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span className="font-bold text-xl text-indigo-600">🇯🇵 JapaLearn</span>
            <div className="flex space-x-4">
              <button 
                onClick={() => setCurrentView('reader')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'reader' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📖 Lecteur
              </button>
              <button 
                onClick={() => setCurrentView('reviews')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'reviews' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🧠 Révisions
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- CONTENU PRINCIPAL --- */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        
        {currentView === 'reader' ? (
          /* VUE LECTEUR */
          <div>
             {!tokens.length ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <textarea
                  className="w-full p-4 h-40 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Collez votre texte japonais ici..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-md"
                >
                  Analyser le texte
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <button onClick={() => setTokens([])} className="mb-4 text-indigo-600 underline text-sm hover:text-indigo-800">
                  ← Retourner à la saisie
                </button>
                <Reader tokens={tokens} />
              </div>
            )}
          </div>
        ) : (
          /* VUE RÉVISIONS */
          <ReviewSession />
        )}

      </main>
    </div>
  );
}

export default App;
