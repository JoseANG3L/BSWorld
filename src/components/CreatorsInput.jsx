import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { searchUsers } from '../services/api';
import AvatarRenderer from './AvatarRenderer';

const CreatorsInput = ({ 
  creators = [], 
  onChange, 
  error = false,
  placeholder = "Buscar usuario...",
  allowExternal = true,
  withBorder = true
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(input);
        setSuggestions(results.filter(u => !creators.some(c => c.uid === u.uid)));
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [input, creators]);

  const handleSearch = (e) => setInput(e.target.value);

  const addUserCreator = (user) => {
    onChange([...creators, user]);
    setInput('');
    setShowSuggestions(false);
  };

  const addTextCreator = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onChange([...creators, { nombre: input.trim(), imagen: null, uid: null }]);
      setInput('');
      setShowSuggestions(false);
    }
    if (e.key === 'Backspace' && !input && creators.length > 0) {
      e.preventDefault();
      const lastCreator = creators[creators.length - 1];
      setInput(lastCreator.nombre);
      removeCreator(creators.length - 1);
    }
  };

  const removeCreator = (index) => {
    const newCreators = [...creators];
    newCreators.splice(index, 1);
    onChange(newCreators);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className={clsx(
        "p-2 rounded-2xl border flex flex-wrap gap-2 shadow-sm items-center transition-all duration-300 bg-white dark:bg-[#1D1F23]",
        error ? "border-red-500 dark:border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500" : withBorder ? "border-gray-300 dark:border-gray-700 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500" : "border-gray-300 dark:border-transparent focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500"
      )}>
        {creators.map((creator, idx) => (
          <div key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 shadow-sm border border-gray-300 dark:border-transparent pl-1.5 pr-2 py-1 rounded-xl group">
            <a
              href={`/u/${creator.nombre}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-6 h-6 rounded-full">
                <AvatarRenderer avatar={creator.imagen} name={creator.nombre} />
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{creator.nombre}</span>
            </a>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); removeCreator(idx); }} 
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <input 
          type="text" 
          value={input} 
          onChange={handleSearch} 
          onKeyDown={addTextCreator} 
          placeholder={placeholder} 
          className="flex-1 bg-transparent outline-none text-sm dark:text-white px-2 py-1" 
        />
      </div>
      {error && <p className="text-center md:text-left text-xs text-red-500 font-semibold mt-2">El nombre del creador es obligatorio.</p>}

      {showSuggestions && input.length > 1 && (
        <div className="absolute top-full p-1 left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 z-50 overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {suggestions.map((u) => (
                <li key={u.uid}>
                  <button 
                    type="button" 
                    onClick={() => addUserCreator(u)} 
                    className="w-full flex rounded-lg items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full">
                      <AvatarRenderer avatar={u.imagen} name={u.nombre} />
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{u.nombre || u.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (!isSearching && allowExternal && (
            <div className="p-3 text-center text-xs text-gray-400">
              Presiona <b>Enter</b> para agregarlo como creador externo.
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatorsInput;
