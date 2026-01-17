import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Tag, ChevronDown, Users } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer'; // <--- 1. IMPORTAR

const Card = ({ imagen, titulo, descargas = [], creadores = [], tags, isPreview = false }) => {
  const [isOpenDownload, setIsOpenDownload] = useState(false);
  const downloadRef = useRef(null);

  const [isOpenCreators, setIsOpenCreators] = useState(false);
  const creatorsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setIsOpenDownload(false);
      }
      if (creatorsRef.current && !creatorsRef.current.contains(event.target)) {
        setIsOpenCreators(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalizar lista de creadores
  const listaCreadores = (Array.isArray(creadores) ? creadores : [creadores]).map(creador => {
    if (typeof creador === 'object' && creador !== null) return creador;
    return {
      nombre: creador,
      imagen: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creador}`
    };
  });

  const primerCreador = listaCreadores[0];
  const totalExtra = listaCreadores.length - 1;

  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 z-0 relative hover:shadow-xl hover:border-gray-400 dark:hover:border-gray-600">
      
      {/* IMAGEN */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-t-2xl">
        <img 
          src={imagen || 'https://via.placeholder.com/640x360'} 
          alt={titulo}
          loading="lazy"
          referrerPolicy="no-referrer" crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = '/default.jpg'; }}
        />
        <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300" />
      </div>

      <div className="flex flex-col flex-1 px-3 pt-3 pb-4">
        
        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2 line-clamp-1" title={titulo}>
          {titulo}
        </h3>

        {/* BOTÓN DESCARGA */}
        <div className="relative mb-2" ref={downloadRef}>
          <button 
            onClick={() => setIsOpenDownload(!isOpenDownload)}
            className={clsx(
              "flex text-sm items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md active:scale-95",
              isOpenDownload ? "bg-primary-700 ring-2 ring-primary-300 dark:ring-primary-600" : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            <Download size={18} strokeWidth={2.5} />
            <span>Descargar</span>
            <ChevronDown size={18} className={clsx("transition-transform duration-200", isOpenDownload && "rotate-180")} />
          </button>

          {isOpenDownload && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
              <div className="py-1">
                {descargas.length > 0 ? (
                  descargas.map((option, index) => (
                    <a key={index} href={option.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="truncate mr-2">{option.label}</span>
                      <Download size={14} className="opacity-50 shrink-0" />
                    </a>
                  ))
                ) : (
                  <span className="block px-4 py-3 text-sm text-gray-500 text-center italic">Sin descargas</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- SECCIÓN CREADORES --- */}
        <div className="relative mb-2.5" ref={creatorsRef}>
          
          <button 
            onClick={() => setIsOpenCreators(!isOpenCreators)}
            className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group/creator"
          >
            {/* 2. AVATAR PRINCIPAL CON RENDERER */}
            <div className="relative shrink-0">
                <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <AvatarRenderer 
                        avatar={primerCreador.imagen} 
                        name={primerCreador.nombre} 
                    />
                </div>
                
                {/* Badge de contador (+2) */}
                {totalExtra > 0 && (
                  <div className="absolute -top-1 -right-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#1e1e1e]">
                    +{totalExtra}
                  </div>
                )}
            </div>

            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover/creator:text-primary-600 transition-colors">
                 {primerCreador.nombre}
               </span>
               {totalExtra > 0 && (
                 <span className="text-[10px] text-gray-400 font-medium truncate">
                   y {totalExtra} {totalExtra === 1 ? 'colaborador' : 'colaboradores'} más
                 </span>
               )}
            </div>

            <ChevronDown size={14} className={clsx("ml-auto text-gray-400 transition-transform", isOpenCreators && "rotate-180")} />
          </button>

          {/* LISTA DESPLEGABLE */}
          {isOpenCreators && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-bottom p-1" style={{ animationDuration: '200ms' }}>
              <p className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                Creadores
              </p>
              
              <div className="max-h-48 overflow-y-auto">
                {listaCreadores.map((creador, index) => (
                  <Link 
                    key={index}
                    to={`/u/${creador.nombre}`}
                    target={isPreview ? "_blank" : undefined}
                    rel={isPreview ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    {/* 3. AVATAR EN LISTA CON RENDERER */}
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                        <AvatarRenderer 
                            avatar={creador.imagen} 
                            name={creador.nombre} 
                        />
                    </div>
                    
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">
                      {creador.nombre}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TAGS */}
        <div className="mt-auto flex flex-wrap gap-2">
          {tags && tags.map((tag, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <Tag size={10} className="text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Card;