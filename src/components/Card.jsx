import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Tag, ChevronDown, AlertCircle, Eye, User, ShieldCheck, Edit3, Trash2, Loader2, ExternalLink, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import LikeButton from './LikeButton';
// Importamos la función para obtener datos frescos
import { registerDownload, getUserPublicProfile } from '../services/api'; 

const COOLDOWN_TIME = 3600000; 

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
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-[#191B1E] shrink-0 relative">
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
                <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
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
                <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-200 dark:bg-[#191B1E]">
                    <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
               <span className="text-sm font-bold text-gray-700 dark:text-gray-100 truncate transition-colors">
                    {userData.nombre}
               </span>
               {esVerificado && <ShieldCheck size={12} className="text-blue-500 shrink-0" />}
               {extraCount > 0 && (
                   <span className="shrink-0 w-5 h-5 flex items-center justify-center text-[9px] font-bold bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-700">
                       + {extraCount}
                   </span>
               )}
            </div>
        </>
      )
  }

  return null;
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'aceptado':
    case 'published':
      return { 
        label: 'Aceptado', 
        style: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
      };
    case 'revision':
    case 'pending':
      return { 
        label: 'En Revisión', 
        style: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' 
      };
    case 'rechazado':
    case 'rejected':
      return { 
        label: 'Rechazado', 
        style: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
      };
    case 'borrador':
    case 'draft':
      return { 
        label: 'Borrador', 
        style: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#191B1E] dark:text-gray-400 dark:border-gray-700' 
      };
    case 'inactive':
      return { 
        label: 'Inactivo', 
        style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-[#191B1E] dark:text-gray-500' 
      };
    default:
      return { 
        label: 'Desconocido', 
        style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-[#191B1E] dark:text-gray-500' 
      };
  }
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
  isPreview = false,
  isEditable = false,
  handleDelete,
  isDeleting = false
}) => {
  const [isOpenDownload, setIsOpenDownload] = useState(false);
  const downloadRef = useRef(null);
  const [isOpenCredits, setIsOpenCredits] = useState(false);
  const creditosRef = useRef(null);
  const navigate = useNavigate();

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

  const statusConfig = getStatusConfig(status);

  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300 z-0 relative h-full">
      
      {/* ESTADO */}
      {isEditable && (
        <div className={`text-xs font-bold text-center p-1 ${statusConfig.style} rounded-t-xl`}>
          {statusConfig.label}
        </div>
      )}

      {/* 1. IMAGEN */}
      <Link 
        to={(!isPreview && id) ? `/view/${id}` : "#"} 
        className={clsx("relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-[#191B1E] block cursor-pointer", isPreview && "cursor-default", !isEditable && "rounded-t-lg")}
        onClick={(e) => isPreview && e.preventDefault()}
      >
        <img 
          src={imagen || '/default.jpg'} 
          alt={titulo}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = '/default.jpg'; }}
        />

        {/* Spam Limit Alert overlay */}
        {isSpamming && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 animate-pulse">
            <AlertCircle size={12} /> Límite excedido
          </div>
        )}

        {/* Capa de acciones para edición */}
        {isEditable && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-20">
            <button
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                navigate(`/subir?edit=${id}`);
              }}
              className="p-2 bg-white dark:bg-[#191B1E] text-blue-600 dark:text-blue-400 rounded-xl shadow-lg hover:bg-gray-200 dark:hover:bg-[#191B1E] transition-all border border-gray-200 dark:border-gray-700"
              title="Editar Contenido"
            >
              <Edit3 size={18} />
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (handleDelete) handleDelete(id, titulo);
              }}
              className="p-2 bg-white dark:bg-[#191B1E] text-red-500 rounded-xl shadow-lg hover:bg-gray-200 dark:hover:bg-[#191B1E] transition-all border border-gray-200 dark:border-gray-700"
              disabled={isDeleting}
              title="Eliminar"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-3 pb-3 space-y-2.5">
        
        {/* 2. TÍTULO */}
        <Link 
            to={(!isPreview && id) ? `/view/${id}` : "#"} 
            className={clsx("block", !isPreview && "hover:text-primary-600 dark:hover:text-primary-400 transition-colors")}
            onClick={(e) => isPreview && e.preventDefault()}
        >
            <h3 className="text-md font-bold text-black dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={titulo}>{titulo}</h3>
        </Link>

        {/* 3. DESCARGAS DESPLEGABLE */}
        <div className="relative" ref={downloadRef}>
          <button 
            onClick={() => setIsOpenDownload(!isOpenDownload)}
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
        </div>

        {/* 4. CRÉDITOS */}
        <div className="relative" ref={creditosRef}>
          {listaCreditos.length === 1 ? (
            <Link 
              to={`/u/${primerCredito.nombre}`} 
              className="flex items-center gap-2 w-full px-2 py-1 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left group/creator"
            >
              <SmartUserDisplay initialUser={primerCredito} type="header" extraCount={0} />
            </Link>
          ) : (
            <>
              <button onClick={() => setIsOpenCredits(!isOpenCredits)} className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left group/creator">
                <SmartUserDisplay initialUser={primerCredito} type="header" extraCount={totalExtra} />
                <ChevronDown size={14} className={clsx("ml-auto text-gray-400 transition-transform", isOpenCredits && "rotate-180")} />
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
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
              </div>
            ))}
          </div>
        )}

        {/* 6. APORTE DE */}
        {/* {aporte && (
          <SmartUserDisplay initialUser={aporte} type="footer" />
        )} */}

        {/* 👇 NUEVO BLOQUE: MÉTRICAS GENERALES DE LA CARD */}
        <div className="flex justify-between items-center w-full pt-3 border-t border-gray-100 dark:border-gray-800/60 text-gray-500 dark:text-gray-400 text-xs font-semibold">
          {/* Vistas */}
          <div className="flex items-center gap-1.5" title="Total de visualizaciones">
            <Eye size={14} className="text-gray-400 dark:text-gray-500" />
            <span>{formatNumber(vistas)}</span>
          </div>
          
          {/* Likes */}
          <div className="flex items-center gap-1.5" title="Total de valoraciones">
            <Heart size={14} className="text-red-500/80 dark:text-red-400/80 fill-current" />
            <span>{formatNumber(likes_count)}</span>
          </div>

          {/* Descargas totales calculadas */}
          <div className="flex items-center gap-1.5" title="Total de descargas globales">
            <Download size={14} className="text-primary-500/80 dark:text-primary-400/80" />
            <span>{formatNumber(calculatedTotal)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Card;