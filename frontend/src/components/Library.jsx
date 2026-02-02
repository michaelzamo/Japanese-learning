import React, { useState, useEffect } from 'react';

const Library = ({ onLoadText }) => {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/texts`);
      if (res.ok) {
        const data = await res.json();
        setTexts(data);
      }
    } catch (error) {
      console.error("Erreur chargement bibliothèque:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Chargement de la bibliothèque...</div>;

  if (texts.length === 0) {
    return (
      <div className="text-center p-10 text-gray-500">
        Ta bibliothèque est vide. Sauvegarde un texte après l'avoir analysé !
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
      {texts.map((text) => (
        <div 
          key={text.id} 
          onClick={() => onLoadText(text)}
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-indigo-300 group"
        >
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 mb-2 truncate">
            {text.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-3 mb-4">
            {text.content}
          </p>
          <div className="text-xs text-gray-400">
            Ajouté le {new Date(text.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Library;
