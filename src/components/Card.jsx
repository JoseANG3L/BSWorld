import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronDown, AlertCircle, Eye, User, ShieldCheck, ExternalLink, Heart, Wrench, Map, Gamepad2, Boxes, Package } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import LikeButton from './LikeButton';
import { useAuth } from '../context/AuthContext';
// Importamos la función para obtener datos frescos
import { registerDownload, getUserPublicProfile } from '../services/api'; 

const COOLDOWN_TIME = 3600000;

const CATEGORIAS = {
  complemento: { nombre: 'Complemento', icon: Wrench, color: 'text-blue-500', borderColor: 'border-blue-500/80' },
  mapa: { nombre: 'Mapa', icon: Map, color: 'text-emerald-500', borderColor: 'border-emerald-500/80' },
  minijuego: { nombre: 'Minijuego', icon: Gamepad2, color: 'text-amber-500', borderColor: 'border-amber-500/80' },
  modpack: { nombre: 'Modpack', icon: Boxes, color: 'text-red-500', borderColor: 'border-red-500/80' },
  paquete: { nombre: 'Paquete', icon: Package, color: 'text-cyan-500', borderColor: 'border-cyan-500/80' },
  personaje: { nombre: 'Personaje', icon: User, color: 'text-purple-500', borderColor: 'border-purple-500/80' }
}; 

// --- SUB-COMPONENTE INTELIGENTE ---
const SmartUserDisplay = ({ initialUser, type = 'list', extraCount = 0 }) => {
  const [userData, setUserData] = useState(() => {
    if (typeof initialUser === 'string') {
      return { uid: initialUser, nombre: 'Cargando...', imagen: null, verificado: false };
    }
    return {
      uid: initialUser?.uid || initialUser?.id || null,
      nombre: initialUser?.nombre || initialUser?.username || 'Cargando...',
      imagen: initialUser?.imagen || initialUser?.avatar || null,
      verificado: initialUser?.verificado || false
    };
  });

  useEffect(() => {
    let isMounted = true;
    const targetUid = typeof initialUser === 'string' ? initialUser : (initialUser?.uid || initialUser?.id);

    if (targetUid) {
      const fetchFresh = async () => {
        try {
          const freshProfile = await getUserPublicProfile(targetUid);
          if (freshProfile && isMounted) {
            setUserData({
               uid: freshProfile.uid,
               nombre: freshProfile.nombre,
               imagen: freshProfile.imagen,
               verificado: freshProfile.verificado
            });
          }
        } catch (error) {
          console.error("Error actualizando usuario tarjeta", error);
        }
      };
      fetchFresh();
    }
    return () => { isMounted = false; };
  }, [initialUser]);

  const esVerificado = userData.verificado;

  if (type === 'list') {
    return (
      <Link to={`/u/${userData.nombre}`} className="flex items-center gap-3 px-2 py-1.5 hover:bg-primary-300 dark:hover:bg-gray-700 transition-colors group">
        <div className="w-6 h-6 rounded-full shrink-0 relative">
            <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
        </div>
        <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                {userData.nombre}
            </span>
            {esVerificado && <ShieldCheck size={10} className="text-blue-500 shrink-0" />}
        </div>
      </Link>
    );
  }

  if (type === 'footer') {
    return (
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/65 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                <User size={10} /> Aporte
            </span>
            <Link 
                to={`/u/${userData.nombre}`}
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center gap-1.5 group/aporte"
            >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                    <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover/aporte:text-primary-600 transition-colors max-w-[90px] truncate flex items-center gap-1">
                    {userData.nombre}
                    {esVerificado && <ShieldCheck size={10} className="text-blue-500" />}
                </span>
            </Link>
        </div>
    );
  }

  if (type === 'header') {
      return (
        <>
            <div className="relative shrink-0">
                <div className="w-6 h-6 rounded-full">
                    <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
                </div>
            </div>
            <div className="flex items-center gap-1 min-w-0">
               <span className="text-sm font-semibold text-gray-700 dark:text-gray-100 truncate transition-colors group-hover/creator:text-primary-600 dark:group-hover/creator:text-primary-400">
                    {userData.nombre}
               </span>
               {esVerificado && <ShieldCheck size={12} className="text-blue-500 shrink-0" />}
               {extraCount > 0 && (
                   <span className="shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[9px] font-bold">
                       +{extraCount}
                   </span>
               )}
            </div>
        </>
      )
  }

  return null;
};

const Card = ({ 
  id, 
  imagen, 
  titulo, 
  descargas = [], 
  creadores = [], 
  tags = [], 
  aporte,
  vistas = 0,
  likes_count = 0,
  status = 'Creado',
  tipo
}) => {
  const { user } = useAuth();
  const [isOpenDownload, setIsOpenDownload] = useState(false);
  const downloadRef = useRef(null);
  const [isOpenCredits, setIsOpenCredits] = useState(false);
  const creditosRef = useRef(null);
  const [imageError, setImageError] = useState(false);

  const [localDescargas, setLocalDescargas] = useState(descargas);
  const [isSpamming, setIsSpamming] = useState(false);

  const calculatedTotal = localDescargas.reduce((acc, curr) => acc + (curr.count || 0), 0);
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      const value = num / 1000000;
      return value < 10 ? value.toFixed(1) + 'M' : Math.floor(value) + 'M';
    }
    if (num >= 1000) {
      const value = num / 1000;
      return value < 10 ? value.toFixed(1) + 'K' : Math.floor(value) + 'K';
    }
    return num.toString();
  };

  const handleDownloadClick = async (url) => {
    if (!id) return;
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
    await registerDownload(id, url, user?.id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) setIsOpenDownload(false);
      if (creditosRef.current && !creditosRef.current.contains(event.target)) setIsOpenCredits(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setLocalDescargas(descargas);
  }, [descargas]);

  const listaCreditos = useMemo(() => {
    return (Array.isArray(creadores) ? creadores : [creadores]).map(creador => {
      if (typeof creador === 'object' && creador !== null) return creador;
      return { nombre: creador, imagen: null, uid: null };
    });
  }, [creadores]);

  const primerCredito = useMemo(() => 
    listaCreditos[0] || { nombre: 'Desconocido', imagen: null }
  , [listaCreditos]);

  const totalExtra = useMemo(() => 
    Math.max(0, listaCreditos.length - 1)
  , [listaCreditos]);

  const categoriaInfo = CATEGORIAS[tipo] || { nombre: tipo || 'Sin categoría', icon: null, color: 'text-gray-500', borderColor: 'border-gray-300' };
  const CategoriaIcon = categoriaInfo.icon;

  return (
    <div 
      className={`group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent shadow-sm rounded-xl transition-all duration-300 z-0 relative h-full`}
    >
      
      {/* 1. IMAGEN */}
      <Link 
        to={id ? `/view/${id}` : "#"} 
        className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-[#1D1F23] block cursor-pointer rounded-t-xl"
      >
        <img 
          src={imageError ? '/default.jpg' : (imagen || '/default.jpg')} 
          alt={titulo || 'Imagen del contenido'}
          loading="lazy"
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: 0 }}
          onLoad={(e) => { e.target.style.opacity = 1; }}
          onError={(e) => { 
            if (!imageError) {
              console.warn('Error loading image:', imagen);
              setImageError(true);
              e.target.src = '/default.jpg'; 
              e.target.style.opacity = 1;
            }
          }}
        />

        {/* Spam Limit Alert overlay */}
        {isSpamming && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 animate-pulse">
            <AlertCircle size={12} /> Límite excedido
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 px-2.5 md:px-3 pt-2 md:pt-2.5 pb-2 space-y-1.5 md:space-y-2">
        
        {/* 2. TÍTULO */}
        <Link 
            to={id ? `/view/${id}` : "#"} 
            className="block hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
            <h3 className="text-md font-bold text-black dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={titulo}>{titulo}</h3>
        </Link>

        {/* 3. DESCARGAS DESPLEGABLE */}
        {/* <div className="relative" ref={downloadRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpenDownload(!isOpenDownload);
            }}
            className={clsx(
              "flex text-sm items-center justify-between px-3 w-full py-2.5 rounded-lg text-white font-bold shadow-md transition-all duration-150 active:scale-[0.98]",
              isOpenDownload ? "bg-primary-600" : "bg-primary-700 hover:bg-primary-600"
            )}
          >
            <div className="flex items-center gap-2">
                <Download size={18} strokeWidth={2.5} /> <span>Descargar</span>
            </div>
            <div className="flex items-center">
                <ChevronDown size={16} className={clsx("transition-transform duration-200", isOpenDownload && "rotate-180")} />
            </div>
          </button>

          {isOpenDownload && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-transparent rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
              <div className="py-1 max-h-40 overflow-y-auto">
                {localDescargas.length > 0 ? (
                  localDescargas.map((option, index) => (
                    <a key={index} href={option.url} target="_blank" rel="noopener noreferrer" onClick={() => handleDownloadClick(option.url)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group/item cursor-pointer">
                      <div className="flex flex-col truncate pr-2">
                          <span className="truncate font-bold">{option.label}</span>
                      </div>
                      <Download size={16} className="" />
                    </a>
                  ))
                ) : <span className="block px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">Sin descargas</span>}
              </div>
            </div>
          )}
        </div> */}

        {/* 4. CRÉDITOS */}
        <div className="relative" ref={creditosRef}>
          {listaCreditos.length === 1 ? (
            <Link 
              to={`/u/${primerCredito.nombre}`} 
              className="flex items-center w-fit gap-2 text-gray-700 dark:text-gray-200 group/creator hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <SmartUserDisplay initialUser={primerCredito} type="header" extraCount={0} />
            </Link>
          ) : (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpenCredits(!isOpenCredits);
                }} 
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200 group/creator hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <SmartUserDisplay initialUser={primerCredito} type="header" extraCount={totalExtra} />
              </button>
              
              {isOpenCredits && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-transparent rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-bottom py-1" style={{ animationDuration: '200ms' }}>
                  <div className="max-h-48 overflow-y-auto">
                    {listaCreditos.map((creador, index) => (
                      <SmartUserDisplay key={index} initialUser={creador} type="list" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 5. TAGS */}
        {/* {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
              </div>
            ))}
          </div>
        )} */}

        {/* 6. APORTE DE */}
        {/* {aporte && (
          <SmartUserDisplay initialUser={aporte} type="footer" />
        )} */}

        {/* 👇 NUEVO BLOQUE: MÉTRICAS GENERALES DE LA CARD */}
        <div className={`flex justify-between items-center w-full pt-2 border-t ${categoriaInfo.borderColor} text-gray-500 dark:text-gray-400 text-xs font-semibold`}>
          <div className="flex items-center gap-1.5" title="Categoría">
            {CategoriaIcon && <CategoriaIcon size={14} className={categoriaInfo.color} />}
            <span>{categoriaInfo.nombre}</span>
          </div>
          <div className="flex gap-2">
            {/* Vistas */}
            <div className="flex items-center gap-1" title="Total de visualizaciones">
              <Eye size={14} className="text-gray-400 dark:text-gray-500" />
              <span>{formatNumber(vistas)}</span>
            </div>
            
            {/* Likes */}
            <div className="flex items-center gap-1" title="Total de valoraciones">
              <Heart size={14} className="text-red-500/80 dark:text-red-400/80" />
              <span>{formatNumber(likes_count)}</span>
            </div>

            {/* Descargas totales calculadas */}
            <div className="flex items-center gap-1" title="Total de descargas globales">
              <Download size={14} className="text-primary-500/80 dark:text-primary-400/80" />
              <span>{formatNumber(calculatedTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Card;