import React, { useState, useRef, useEffect } from 'react';
import { Download, User, Tag, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const Card = ({ image, title, downloads = [], creator, tags }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 z-0 relative">
      
      {/* 1. IMAGEN */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-t-2xl">
        <img 
          src={image || 'default.jpg'} 
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => { e.target.src = 'default.jpg'; }}
        />
        <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300" />
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-col flex-1 px-3 pt-1.5 pb-3.5 md:px-4 md:pt-2.5 md:pb-4">
        
        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-1.5 md:mb-2.5 line-clamp-1" title={title}>
          {title}
        </h3>

        {/* 2. BOTÓN DROPDOWN DE DESCARGA */}
        <div className="relative mb-3.5" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              "flex text-md items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md active:scale-95",
              isOpen 
                ? "bg-primary-700 ring-2 ring-primary-300 dark:ring-primary-600" 
                : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            <Download size={18} strokeWidth={2.5} />
            <span>Descargar</span>
            <ChevronDown 
              size={18} 
              className={clsx("transition-transform duration-200", isOpen && "rotate-180")} 
            />
          </button>

          {/* MENÚ DESPLEGABLE */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-md z-50 overflow-hidden origin-top">
              <div className="py-1">
                {downloads.length > 0 ? (
                  downloads.map((option, index) => (
                    <a 
                      key={index}
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                      <span>{option.label}</span>
                      <Download size={14} className="opacity-50" />
                    </a>
                  ))
                ) : (
                  <span className="block px-4 py-3 text-sm text-gray-500 text-center italic">
                    No hay descargas disponibles
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. CREADOR */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <User size={14} className="text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">{creator}</span>
        </div>

        {/* 4. TAGS */}
        <div className="mt-auto flex flex-wrap gap-2">
          {tags && tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Card;