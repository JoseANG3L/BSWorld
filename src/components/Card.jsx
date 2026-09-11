import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronDown, AlertCircle, Eye, User, ShieldCheck, ExternalLink, Heart, Wrench, Map, Gamepad2, Boxes, Package } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import LikeButton from './LikeButton';
import { useAuth } from '../context/AuthContext';
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

  // Variante específica para el avatar circular principal del card
  if (type === 'card-avatar') {
    return (
      <Link 
        to={`/u/${userData.nombre}`} 
        onClick={(e) => e.stopPropagation()}
        className="relative block group/avatar shrink-0 mt-1" 
        title={userData.nombre}
      >
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full">
          <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
        </div>
        {esVerificado && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm">
            <ShieldCheck size={10} className="text-blue-500" />
          </div>
        )}
      </Link>
    );
  }

  // Variante para mostrar el nombre con verificación al lado del título
  if (type === 'card-byline') {
    return (
      <Link 
        to={`/u/${userData.nombre}`}
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
      >
        <span>{userData.nombre}</span>
        {esVerificado && <ShieldCheck size={11} className="text-blue-500 shrink-0" />}
      </Link>
    );
  }

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
    );
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
  const [isHovered, setIsHovered] = useState(false);

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
      if (typeof creador === 'object' && creador !== null) {
        return {
          nombre: creador.nombre || creador.username || 'Desconocido',
          imagen: creador.imagen || creador.avatar || null,
          uid: creador.uid || creador.id || null
        };
      }
      return { nombre: creador, imagen: null, uid: null };
    });
  }, [creadores]);

  const primerCredito = useMemo(() => {
    return listaCreditos[0] || { nombre: 'Desconocido', imagen: null, uid: null };
  }, [listaCreditos]);

  const categoriaInfo = CATEGORIAS[tipo] || { nombre: tipo || 'Sin categoría', icon: null, color: 'text-gray-500', borderColor: 'border-gray-300' };

  return (
    <div 
      className={`group flex flex-col rounded-xl transition-all duration-300 z-0 relative h-full`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fondo con blur de la imagen */}
      <div className={`absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-xl transition-transform duration-500 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}>
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out ${isHovered ? 'dark:opacity-30 opacity-20' : 'opacity-0'} -z-10`}
          style={{ 
            backgroundImage: `url(${imageError ? '/default.jpg' : (imagen || '/default.jpg')})`,
            filter: 'blur(40px) brightness(0.8)',
            transform: 'scale(1.2)'
          }}
        />
      </div>
      
      {/* 1. IMAGEN */}
      <Link 
        to={id ? `/view/${id}` : "#"} 
        className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-[#1D1F23] block cursor-pointer rounded-t-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/20 group-hover:to-transparent transition-all duration-300 z-10" />
        <img 
          src={imageError ? '/default.jpg' : (imagen || '/default.jpg')} 
          alt={titulo || 'Imagen del contenido'}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
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

        {isSpamming && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm z-20 animate-pulse">
            <AlertCircle size={12} /> Límite excedido
          </div>
        )}

        <div className="absolute top-2 left-2 z-10">
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${categoriaInfo.color} bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md`}>
            {categoriaInfo.nombre}
          </span>
        </div>
      </Link>

      <div className="flex flex-col flex-1 px-1 pt-1.5 md:pt-2 pb-1.5 md:pb-2 space-y-1.5 md:space-y-2">
        
        {/* 2. LAYOUT HORIZONTAL: AVATAR INTELIGENTE + TÍTULO */}
        <div className="flex items-start gap-2">
          {/* Avatar dinámico mediante SmartUserDisplay */}
          <SmartUserDisplay initialUser={primerCredito} type="card-avatar" />
          
          {/* Título y Nombre del Creador */}
          <div className="flex-1 min-w-0">
            <Link 
              to={id ? `/view/${id}` : "#"} 
              className="block hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <h3 className="text-base font-bold text-black dark:text-white line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={titulo}>
                {titulo}
              </h3>
            </Link>
            
            {/* Nombre del creador con datos frescos y verificación */}
            <div className="-mt-1">
              <SmartUserDisplay initialUser={primerCredito} type="card-byline" />
            </div>
          </div>
        </div>

        {/* 3. BOTÓN DE DESCARGA RÁPIDA */}
        {localDescargas.length > 0 && (
          <div className="relative" ref={downloadRef}>
            {localDescargas.length === 1 ? (
              <a 
                href={localDescargas[0].url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => handleDownloadClick(localDescargas[0].url)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg w-full"
              >
                <Download size={16} strokeWidth={2.5} />
                <span>Descargar</span>
              </a>
            ) : (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenDownload(!isOpenDownload);
                  }}
                  className="inline-flex items-center justify-between px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg w-full"
                >
                  <div className="flex items-center gap-2">
                    <Download size={16} strokeWidth={2.5} />
                    <span>Descargar</span>
                    <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{localDescargas.length}</span>
                  </div>
                  <ChevronDown size={16} className={clsx("transition-transform duration-200", isOpenDownload && "rotate-180")} />
                </button>

                {isOpenDownload && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-transparent rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-bottom" style={{ animationDuration: '200ms' }}>
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {localDescargas.map((option, index) => (
                        <a 
                          key={index} 
                          href={option.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={() => handleDownloadClick(option.url)} 
                          className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group/item cursor-pointer"
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="truncate font-bold group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">{option.label}</span>
                          </div>
                          <Download size={16} className="text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 4. MÉTRICAS GENERALES DE LA CARD */}
        <div className="flex justify-between items-center w-full pt-3 border-t border-gray-200 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-semibold">
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 group/metric" title="Total de visualizaciones">
              <Eye size={16} className="text-gray-400 dark:text-gray-500 group-hover/metric:text-blue-500 transition-colors" />
              <span className="group-hover/metric:text-blue-600 dark:group-hover/metric:text-blue-400 transition-colors">{formatNumber(vistas)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 group/metric" title="Total de valoraciones">
              <Heart size={16} className="text-red-400/80 dark:text-red-500/80 group-hover/metric:text-red-500 transition-colors" />
              <span className="group-hover/metric:text-red-600 dark:group-hover/metric:text-red-400 transition-colors">{formatNumber(likes_count)}</span>
            </div>

            <div className="flex items-center gap-1.5 group/metric" title="Total de descargas globales">
              <Download size={16} className="text-primary-400/80 dark:text-primary-500/80 group-hover/metric:text-primary-500 transition-colors" />
              <span className="group-hover/metric:text-primary-600 dark:group-hover/metric:text-primary-400 transition-colors">{formatNumber(calculatedTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Card;