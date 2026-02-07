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
    // STRUCTURE GRID : Ligne 1 (Navbar) AUTO, Ligne 2 (Main) RESTE (1fr)
    <div className="h-screen w-screen bg-gray-50 font-sans text-gray-900 grid grid-rows-[auto_1fr] overflow-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span onClick={handleNewText} className="font-black text-xl md:text-2xl
