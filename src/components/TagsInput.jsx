import React, { useState } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

const TagsInput = ({ 
  tags = [], 
  onChange, 
  maxTags = 10,
  recommendedTags = ['multijugador', 'acción', 'divertido', 'combate', 'bombas', 'explosiones', 'equipos', 'scripts', 'carreras', 'terror'],
  placeholder = "Escribe y presiona Enter...",
  fixedTags = [], // Tags que no se pueden eliminar
  withBorder = true // Si true, agrega border y focus styles
}) => {
  const [input, setInput] = useState('');

  const handleAddTag = () => {
    const cleanTag = input.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && tags.length < maxTags) {
      onChange([...tags, cleanTag]);
      setInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddRecommended = (tag) => {
    if (tags.length < maxTags) {
      onChange([...tags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tags</label>
        <span className={clsx(
          "text-xs font-semibold",
          tags.length >= maxTags ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
        )}>{tags.length}/{maxTags}</span>
      </div>
      
      {/* Input inline con tags */}
      <div className={clsx(
        "p-2 rounded-2xl border border-gray-300 bg-white dark:bg-[#1D1F23] flex flex-wrap gap-2 shadow-sm items-center transition-all duration-300 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500",
        withBorder ? "dark:border-gray-700" : "dark:border-transparent"
      )}>
        {tags.map((tag, index) => (
          <span key={index} className={clsx(
            "flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-700 shadow-sm border border-gray-300 dark:border-gray-700 pr-2 py-1 rounded-xl group",
            fixedTags.includes(tag) ? "pl-2 opacity-60 cursor-not-allowed" : "pl-3"
          )}>
            {tag}
            {!fixedTags.includes(tag) && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm dark:text-white px-2 py-1"
        />
      </div>

      {/* Tags recomendados */}
      <div className="flex flex-row items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Tags recomendados:</span>
        <div className="flex flex-wrap gap-2">
          {recommendedTags
            .filter(tag => !tags.includes(tag))
            .map((recommendedTag) => (
            <button
              key={recommendedTag}
              type="button"
              onClick={() => handleAddRecommended(recommendedTag)}
              disabled={tags.length >= maxTags}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 border-2 border-dashed",
                tags.length >= maxTags
                  ? "border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
              )}
            >
              {recommendedTag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagsInput;
