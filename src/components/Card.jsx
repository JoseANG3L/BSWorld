import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Tag, ChevronDown, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import { registerDownload } from '../services/api'; 

const COOLDOWN_TIME = 3600000; 

const Card = ({ id, imagen, titulo, descargas = [], creadores = [], tags, uploader, isPreview = false }) => {
  const [isOpenDownload, setIsOpenDownload] = useState(false);
  const downloadRef = useRef(null);
  const [isOpenCreators, setIsOpenCreators] = useState(false);
  const creatorsRef = useRef(null);

  const [localDescargas, setLocalDescargas] = useState(descargas);
  const [isSpamming, setIsSpamming] = useState(false);

  const calculatedTotal = localDescargas.reduce((acc, curr) => acc + (curr.count || 0), 0);
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const handleDownloadClick = async (url) => {
    if (isPreview || !id) return;
    const storageKey = `download_limit_${id}_${url}`;
    const lastDownloadTime = localStorage.getItem(storageKey);
    const now = Date.now();

    if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) {
        setIsSpamming(true);
        setTimeout(() => setIsSpamming(false), 2000);
        return; 
    }
    localStorage.setItem(storageKey, now.toString());
    const nuevosDatos = localDescargas.map(d => d.url === url ? { ...d, count: (d.count || 0) + 1 } : d);
    setLocalDescargas(nuevosDatos);
    await registerDownload(id, url);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) setIsOpenDownload(false);
      if (creatorsRef.current && !creatorsRef.current.contains(event.target)) setIsOpenCreators(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const listaCreadores = (Array.isArray(creadores) ? creadores : [creadores]).map(creador => {
    if (typeof creador === 'object' && creador !== null) return creador;
    return { nombre: creador, imagen: null };
  });
  const primerCreador = listaCreadores[0] || { nombre: 'Desconocido', imagen: null };
  const totalExtra = Math.max(0, listaCreadores.length - 1);

  // --- RENDER ---
  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 z-0 relative">
      
      {/* 1. LINK EN LA IMAGEN */}
      <Link 
        to={(!isPreview && id) ? `/view/${id}` : "#"} 
        className={clsx("relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-t-2xl block cursor-pointer", isPreview && "cursor-default")}
        onClick={(e) => isPreview && e.preventDefault()}
      >
        <img 
          src={imagen || 'https://via.placeholder.com/640x360'} 
          alt={titulo}
          loading="lazy"
          referrerPolicy="no-referrer" crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = '/default.jpg'; }}
        />
        
        <div className={clsx(
            "absolute top-2 right-2 px-2 py-1 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 transition-colors duration-300",
            isSpamming ? "bg-red-600 text-white" : "bg-black/60 text-white"
        )}>
            {isSpamming ? <AlertCircle size={12}/> : <Download size={12} className="text-primary-400" />}
            {formatNumber(calculatedTotal)}
        </div>

        <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300" />
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-3 pb-3">
        
        {/* 2. TÍTULO */}
        <Link 
            to={(!isPreview && id) ? `/view/${id}` : "#"} 
            className={clsx("block mb-2", !isPreview && "hover:text-primary-600 dark:hover:text-primary-400 transition-colors")}
            onClick={(e) => isPreview && e.preventDefault()}
        >
            <h3 className="text-md font-bold text-gray-900 dark:text-white line-clamp-1" title={titulo}>
            {titulo}
            </h3>
        </Link>

        {/* 3. BOTÓN DESCARGA */}
        <div className="relative mb-2" ref={downloadRef}>
          <button 
            onClick={() => setIsOpenDownload(!isOpenDownload)}
            className={clsx(
              "flex text-sm items-center justify-between px-3 w-full py-2.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md active:scale-95 group/btn",
              isOpenDownload ? "bg-primary-700 ring-2 ring-primary-300 dark:ring-primary-600" : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            <div className="flex items-center gap-2">
                <Download size={18} strokeWidth={2.5} />
                <span>Descargar</span>
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <span className="text-xs font-medium opacity-90 group-hover/btn:opacity-100">
                    {formatNumber(calculatedTotal)}
                </span>
                <ChevronDown size={16} className={clsx("transition-transform duration-200", isOpenDownload && "rotate-180")} />
            </div>
          </button>

          {isOpenDownload && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
              <div className="py-1">
                {localDescargas.length > 0 ? (
                  localDescargas.map((option, index) => (
                    <a 
                        key={index} href={option.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => handleDownloadClick(option.url)}
                        className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group/item cursor-pointer"
                    >
                      <div className="flex flex-col">
                          <span className="truncate font-bold">{option.label}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-300 transition-colors flex items-center gap-1">
                             <Download size={10} /> {formatNumber(option.count || 0)} descargas
                          </span>
                      </div>
                      <Download size={16} className="text-gray-500 dark:text-gray-400 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-300 transition-colors" />
                    </a>
                  ))
                ) : (
                  <span className="block px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">Sin descargas</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. CREADORES (Autores Originales) */}
        <div className="relative mb-2.5" ref={creatorsRef}>
          <button onClick={() => setIsOpenCreators(!isOpenCreators)} className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-left group/creator">
            <div className="relative shrink-0">
                <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <AvatarRenderer avatar={primerCreador.imagen} name={primerCreador.nombre} />
                </div>
                {totalExtra > 0 && <div className="absolute -top-1 -right-1 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#1e1e1e]">+{totalExtra}</div>}
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover/creator:text-primary-600 transition-colors">{primerCreador.nombre}</span>
               {totalExtra > 0 && (<span className="text-[10px] text-gray-400 font-medium truncate">y {totalExtra} más</span>)}
            </div>
            <ChevronDown size={14} className={clsx("ml-auto text-gray-400 transition-transform", isOpenCreators && "rotate-180")} />
          </button>
          {isOpenCreators && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-bottom p-1" style={{ animationDuration: '200ms' }}>
              <div className="max-h-48 overflow-y-auto">
                {listaCreadores.map((creador, index) => (
                  <Link key={index} to={`/u/${creador.nombre}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0"><AvatarRenderer avatar={creador.imagen} name={creador.nombre} /></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400">{creador.nombre}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. TAGS */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags && tags.map((tag, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <Tag size={10} className="text-gray-600 dark:text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
            </div>
          ))}
        </div>

        {/* 6. APORTE DE (Usando uploader.imagen) */}
        {uploader && uploader.nombre && (
            <div className="mt-auto pt-3 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">
                    Aporte
                </span>
                <Link 
                    to={`/u/${uploader.nombre}`}
                    onClick={(e) => isPreview && e.preventDefault()}
                    className="flex items-center gap-1.5 group/uploader"
                >
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                        {/* AQUÍ ESTÁ LA CLAVE: Pasamos uploader.imagen al Renderer */}
                        <AvatarRenderer 
                            avatar={uploader.imagen} 
                            name={uploader.nombre} 
                        />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover/uploader:text-primary-600 transition-colors max-w-[90px] truncate">
                        {uploader.nombre}
                    </span>
                </Link>
            </div>
        )}

      </div>
    </div>
  );
};

export default Card;