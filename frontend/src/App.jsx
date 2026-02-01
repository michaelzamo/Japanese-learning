import React, { useState } from 'react';
import Reader from './components/Reader';

function App() {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState([]);

  const handleAnalyze = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    });
    const data = await response.json();
    setTokens(data.tokens);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Mon Lecteur Japonais</h1>
      
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
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Analyser le texte
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setTokens([])} className="mb-4 text-indigo-600 underline">
            Retourner à la saisie
          </button>
          <Reader tokens={tokens} />
        </div>
      )}
    </div>
  );
}
