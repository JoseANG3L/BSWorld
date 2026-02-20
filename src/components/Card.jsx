import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Tag, ChevronDown, AlertCircle, Eye, User, ShieldCheck, Edit3, Trash2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
// Importamos la función para obtener datos frescos
import { registerDownload, getUserPublicProfile } from '../services/api'; 

const COOLDOWN_TIME = 3600000; 

// --- SUB-COMPONENTE INTELIGENTE ---
// Este componente recibe un usuario, verifica si tiene UID,
// busca sus datos nuevos y renderiza el resultado.
const SmartUserDisplay = ({ initialUser, type = 'list' , extraCount = 0 }) => {
  const [userData, setUserData] = useState(initialUser);

  useEffect(() => {
    let isMounted = true;
    // Solo buscamos si tiene UID y si no hemos buscado ya (optimización básica)
    if (initialUser?.uid) {
      const fetchFresh = async () => {
        try {
          const freshProfile = await getUserPublicProfile(initialUser.uid);
          if (freshProfile && isMounted) {
            setUserData(prev => ({
               ...prev,
               nombre: freshProfile.nombre,
               imagen: freshProfile.imagen
            }));
          }
        } catch (error) {
          console.error("Error actualizando usuario tarjeta", error);
        }
      };
      fetchFresh();
    }
    return () => { isMounted = false; };
  }, [initialUser?.uid]);

  const esVerificado = !!userData.uid;

  // Renderizado A: Formato Lista (Dropdown de Créditos)
  if (type === 'list') {
    return (
      <Link to={`/u/${userData.nombre}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 border border-gray-300 dark:border-gray-600 relative">
            <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
        </div>
        <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                {userData.nombre}
            </span>
            {esVerificado && <ShieldCheck size={10} className="text-blue-500 shrink-0" />}
        </div>
      </Link>
    );
  }

  // Renderizado B: Formato Footer (Aporte)
  if (type === 'footer') {
    return (
        <div className="mt-auto pt-3 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                <User size={10} /> Aporte
            </span>
            <Link 
                to={`/u/${userData.nombre}`}
                onClick={(e) => e.stopPropagation()} // Evitar abrir vista previa si se hace clic aquí
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

  // Renderizado C: Cabecera (El primer creador visible en la card)
  if (type === 'header') {
      return (
        <>
            <div className="relative shrink-0">
                <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
                    
                    {/* {totalExtra > 0 &&
                      <div className="absolute top-0 right-0 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[#1e1e1e]">
                        +{totalExtra}
                      </div>} */}
                </div>
                {/* Nota: El badge de +Total se maneja en el padre */}
            </div>
            {/* Contenedor Flex para Nombre + Badge */}
            <div className="flex items-center gap-1.5 min-w-0">
               <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover/creator:text-primary-600 transition-colors">
                   {userData.nombre}
               </span>
               
               {/* Badge de Total Extra a la derecha del nombre */}
               {extraCount > 0 && (
                   <span className="shrink-0 w-6 h-5 flex items-center justify-center text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-700">
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
    case 'published':
      return { 
        label: 'Publicado', 
        style: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
      };
    case 'pending':
      return { 
        label: 'En Revisión', 
        style: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' 
      };
    case 'rejected':
      return { 
        label: 'Rechazado', 
        style: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
      };
    case 'draft':
      return { 
        label: 'Borrador', 
        style: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' 
      };
    case 'inactive':
      return { 
        label: 'Inactivo', 
        style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500' 
      };
    default:
      return { 
        label: 'Desconocido', 
        style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500' 
      };
  }
};

const Card = ({ 
  id, 
  imagen, 
  titulo, 
  descargas = [], 
  creditos = [], 
  tags = [], 
  aporte,
  vistas = 0,
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
  const [deletingId, setDeletingId] = useState(null);

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


    // ✅ Usar useMemo para calcular listaCreditos cuando creditos cambie
  const listaCreditos = useMemo(() => {
    return (Array.isArray(creditos) ? creditos : [creditos]).map(creador => {
      if (typeof creador === 'object' && creador !== null) return creador;
      return { nombre: creador, imagen: null, uid: null };
    });
  }, [creditos]);

  // ✅ Valores derivados que también dependen de creditos
  const primerCredito = useMemo(() => 
    listaCreditos[0] || { nombre: 'Desconocido', imagen: null }
  , [listaCreditos]);

  const totalExtra = useMemo(() => 
    Math.max(0, listaCreditos.length - 1)
  , [listaCreditos]);

  const statusConfig = getStatusConfig(status);

  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 z-0 relative h-full">
      
      {/* ESTADO: CREADO, PUBLICADO, EN PROCESO, EN REVISION, EN PENDIENTE, FINALIZADO */}
      {isEditable &&
        <div className={`text-xs font-bold text-center p-1 ${statusConfig.style} rounded-t-2xl`}>
          {statusConfig.label}
        </div>
      }

      {/* 1. IMAGEN */}
      <Link 
        to={(!isPreview && id) ? `/view/${id}` : "#"} 
        className={clsx("relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 block cursor-pointer", isPreview && "cursor-default", !isEditable && "rounded-t-2xl")}
        onClick={(e) => isPreview && e.preventDefault()}
      >
        <img 
          src={imagen || '/default.jpg'} 
          alt={titulo}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = '/default.jpg'; }}
        />
        <div className={clsx(
            "absolute top-2 right-2 px-2 py-1 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5 text-xs font-bold shadow-sm z-10 transition-colors duration-300",
            isSpamming ? "bg-red-600 text-white" : "bg-black/60 text-white"
        )}>
            {isSpamming ? <AlertCircle size={12}/> : <Eye size={12} className="text-primary-400" />}
            {formatNumber(vistas)}
        </div>
        <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300" />

        {/* --- CAPA DE ACCIONES (OVERLAY) --- */}
        {/* Esta capa aparece encima de la card */}
        {isEditable && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-20">
          
            {/* Botón Editar */}
            <button
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                navigate(`/subir?edit=${id}`);
              }}
              className="p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700"
              title="Editar Contenido"
              >
              <Edit3 size={18} />
            </button>

            {/* Botón Eliminar */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Llamamos a la función que pasó el padre (MisMods)
                    if (handleDelete) handleDelete(id, titulo);
                }}
                className="p-2 bg-white dark:bg-gray-800 text-red-500 rounded-xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700"
                disabled={isDeleting}
                title="Eliminar"
            >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>

          </div>
        )}

      </Link>

      <div className="flex flex-col flex-1 px-3 pt-3 pb-3">
        
        {/* 2. TÍTULO */}
        <Link 
            to={(!isPreview && id) ? `/view/${id}` : "#"} 
            className={clsx("block mb-2", !isPreview && "hover:text-primary-600 dark:hover:text-primary-400 transition-colors")}
            onClick={(e) => isPreview && e.preventDefault()}
        >
            <h3 className="text-md font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-600 transition-colors" title={titulo}>{titulo}</h3>
        </Link>

        {/* 3. DESCARGAS */}
        <div className="relative mb-2" ref={downloadRef}>
          <button 
            onClick={() => setIsOpenDownload(!isOpenDownload)}
            className={clsx(
              "flex text-sm items-center justify-between px-3 w-full py-2.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md active:scale-95 group/btn",
              isOpenDownload ? "bg-primary-700 ring-2 ring-primary-300 dark:ring-primary-600" : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            <div className="flex items-center gap-2">
                <Download size={18} strokeWidth={2.5} /> <span>Descargar</span>
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <span className="text-xs font-medium opacity-90 group-hover/btn:opacity-100">{formatNumber(calculatedTotal)}</span>
                <ChevronDown size={16} className={clsx("transition-transform duration-200", isOpenDownload && "rotate-180")} />
            </div>
          </button>

          {isOpenDownload && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top" style={{ animationDuration: '200ms' }}>
              <div className="py-1 max-h-40 overflow-y-auto">
                {localDescargas.length > 0 ? (
                  localDescargas.map((option, index) => (
                    <a key={index} href={option.url} target="_blank" rel="noopener noreferrer" onClick={() => handleDownloadClick(option.url)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group/item cursor-pointer">
                      <div className="flex flex-col truncate pr-2">
                          <span className="truncate font-bold">{option.label}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-300 transition-colors flex items-center gap-1">
                            <Download size={10} /> {formatNumber(option.count || 0)} {option.count > 1 ? 'descargas' : 'descarga'}
                          </span>
                      </div>
                      <Download size={16} className="shrink-0 text-gray-500 dark:text-gray-400 group-hover/item:text-primary-500 dark:group-hover/item:text-primary-300 transition-colors" />
                    </a>
                  ))
                ) : <span className="block px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">Sin descargas</span>}
              </div>
            </div>
          )}
        </div>

        {/* 4. CRÉDITOS (Con Búsqueda Inteligente) */}
        <div className="relative mb-2.5" ref={creditosRef}>
          <button onClick={() => setIsOpenCredits(!isOpenCredits)} className="flex items-center gap-2 w-full px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-left group/creator">
            
            {/* Usamos el sub-componente en modo header para el primero */}
            <SmartUserDisplay initialUser={primerCredito} type="header" extraCount={totalExtra} />
            
            <ChevronDown size={14} className={clsx("ml-auto text-gray-400 transition-transform", isOpenCredits && "rotate-180")} />
          </button>
          
          {isOpenCredits && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-bottom py-1" style={{ animationDuration: '200ms' }}>
              <div className="max-h-48 overflow-y-auto">
                {listaCreditos.map((creador, index) => (
                  // Usamos el sub-componente en modo list para el dropdown
                  <SmartUserDisplay key={index} initialUser={creador} type="list" />
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

        {/* 6. APORTE DE (Con Búsqueda Inteligente) */}
        {aporte && (
            <SmartUserDisplay initialUser={aporte} type="footer" />
        )}

      </div>
    </div>
  );
};

export default Card;