import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, ChevronDown, AlertCircle, Eye, User, ShieldCheck, ExternalLink, Heart, Wrench, Map, Gamepad2, Boxes, Package, X, MoreVertical, Share2, Edit3, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import LikeButton from './LikeButton';
import { useAuth } from '../context/AuthContext';
import { registerDownload, getUserPublicProfile, deleteContent } from '../services/api';
import { thumbUrl } from '../utils/image';
import { createPortal } from 'react-dom'; 
import { useToast } from '../hooks/useToast';
import Modal from './Modal';

const COOLDOWN_TIME = 3600000;

// Configuración de categorías con soporte de iconos y colores adaptados a Light/Dark
const CATEGORIAS = {
  complemento: { 
    nombre: 'Complemento', 
    icon: Wrench, 
    badgeColor: 'text-blue-300',
    borderColor: 'border-blue-500/80' 
  },
  mapa: { 
    nombre: 'Mapa', 
    icon: Map, 
    badgeColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/80' 
  },
  minijuego: { 
    nombre: 'Minijuego', 
    icon: Gamepad2, 
    badgeColor: 'text-amber-300',
    borderColor: 'border-amber-500/80' 
  },
  modpack: { 
    nombre: 'Modpack', 
    icon: Boxes, 
    badgeColor: 'text-rose-300',
    borderColor: 'border-red-500/80' 
  },
  paquete: { 
    nombre: 'Paquete', 
    icon: Package, 
    badgeColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/80' 
  },
  personaje: { 
    nombre: 'Personaje', 
    icon: User, 
    badgeColor: 'text-purple-300',
    borderColor: 'border-purple-500/80' 
  }
}; 

// --- SUB-COMPONENTE INTELIGENTE ---
const SmartUserDisplay = ({ initialUser, type = 'list', extraCount = 0, onClick }) => {
  const [userData, setUserData] = useState(() => {
    // Si es un array (para card-avatar-stack), no inicializar userData ya que no se usa
    if (Array.isArray(initialUser)) {
      return { uid: null, nombre: 'Cargando...', imagen: null, verificado: false };
    }
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
    // No hacer fetch si es un array (caso card-avatar-stack)
    if (Array.isArray(initialUser)) {
      return;
    }

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
    if (onClick) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="relative block group/avatar shrink-0 cursor-pointer"
          title={userData.nombre}
        >
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden">
            <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
          </div>
          {esVerificado && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm">
              <ShieldCheck size={10} className="text-blue-500" />
            </div>
          )}
        </button>
      );
    }
    return (
      <Link 
        to={`/u/${userData.nombre}`} 
        onClick={(e) => e.stopPropagation()}
        className="relative block group/avatar shrink-0"
        title={userData.nombre}
      >
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden">
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

  // Variante para mostrar múltiples avatares (avatar stack estilo DetalleContenido)
  if (type === 'card-avatar-stack') {
    const creators = Array.isArray(initialUser) ? initialUser : [initialUser];
    const firstCreator = creators[0];
    const extraCount = creators.length - 1;

    // Estado local para el primer creador con fetching
    const [userData, setUserData] = useState(() => {
      if (typeof firstCreator === 'string') {
        return { uid: firstCreator, nombre: firstCreator, imagen: null, verificado: false };
      }
      return {
        uid: firstCreator?.uid || firstCreator?.id || null,
        nombre: firstCreator?.nombre || firstCreator?.username || 'Desconocido',
        imagen: firstCreator?.imagen || firstCreator?.avatar || null,
        verificado: firstCreator?.verificado || false
      };
    });

    useEffect(() => {
      let isMounted = true;
      const targetUid = typeof firstCreator === 'string' ? firstCreator : (firstCreator?.uid || firstCreator?.id);

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
    }, [firstCreator]);

    return (
      <div className="flex shrink-0 relative">
        {onClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="relative block group/avatar cursor-pointer"
            title={userData.nombre}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full relative shrink-0">
              <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
            </div>
            {userData.verificado && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm">
                <ShieldCheck size={10} className="text-blue-500" />
              </div>
            )}
          </button>
        ) : (
          <Link
            to={`/u/${userData.nombre}`}
            onClick={(e) => e.stopPropagation()}
            className="relative block group/avatar"
            title={userData.nombre}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full relative shrink-0">
              <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
            </div>
            {userData.verificado && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm">
                <ShieldCheck size={10} className="text-blue-500" />
              </div>
            )}
          </Link>
        )}
      </div>
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

// --- SUB-COMPONENTE: FILA DE USUARIO INTELIGENTE ---
const SmartUserRow = ({ user }) => {
  const [profile, setProfile] = useState(() => {
    if (typeof user === 'string') {
      return { uid: user, nombre: 'Cargando...', imagen: null, verificado: false };
    }
    return {
      uid: user?.uid || user?.id || null,
      nombre: user?.nombre || user?.username || 'Creador',
      imagen: user?.imagen || user?.avatar || null,
      verificado: user?.verificado || false
    };
  });

  useEffect(() => {
    let isMounted = true;
    const targetUid = typeof user === 'string' ? user : (user?.uid || user?.id);

    if (targetUid) {
      const fetchFreshProfile = async () => {
        try {
          const freshData = await getUserPublicProfile(targetUid);
          if (freshData && isMounted) {
            setProfile({
              uid: freshData.uid,
              nombre: freshData.nombre,
              imagen: freshData.imagen,
              verificado: freshData.verificado
            });
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      };
      fetchFreshProfile();
    }
    return () => { isMounted = false; };
  }, [user]);

  return (
    <Link 
      to={profile.nombre ? `/u/${profile.nombre}` : '#'} 
      className="flex items-center gap-3 group p-2 -mx-2 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
    >
      <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden relative">
        <AvatarRenderer avatar={profile.imagen} name={profile.nombre} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors line-clamp-1">
            {profile.nombre}
          </p>
          {profile.verificado && (
            <ShieldCheck size={14} className="text-blue-500 shrink-0" title="Verificado" />
          )}
        </div>
      </div>
    </Link>
  );
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
  tipo,
  priority = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isOpenDownload, setIsOpenDownload] = useState(false);
  const downloadRef = useRef(null);
  const optionsRef = useRef(null);
  const [isOpenCredits, setIsOpenCredits] = useState(false);
  const creditosRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const [showCreatorsModal, setShowCreatorsModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const ownerId = aporte && typeof aporte === 'object' ? (aporte.uid || aporte.id) : aporte;
  const currentUserId = user?.id || user?.uid;
  const isOwner = Boolean(currentUserId && ownerId && String(currentUserId) === String(ownerId));
  const canManageContent = isOwner || Boolean(currentUserId && user?.role === 'admin');

  // Miniatura rápida (WebP 640px) con caída a original y luego a default
  const thumb = useMemo(() => thumbUrl(imagen, 640), [imagen]);
  const [imgStage, setImgStage] = useState(0);
  useEffect(() => { setImgStage(0); setImageError(false); }, [imagen]);
  const imgSrc = imgStage === 0
    ? (thumb || '/default.jpg')
    : imgStage === 1
      ? (imagen || '/default.jpg')
      : '/default.jpg';

  const [localDescargas, setLocalDescargas] = useState(descargas);
  const [isSpamming, setIsSpamming] = useState(false);

  // Estado del like compartido con el botón y la métrica de la card
  const [likeState, setLikeState] = useState({ liked: false, count: likes_count });
  const handleLikeChange = useCallback((liked, count) => {
    setLikeState({ liked, count });
  }, []);

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

  const handleShare = async () => {
    if (!id) return;
    const shareUrl = `${window.location.origin}/view/${id}`;
    optionsRef.current?.removeAttribute('open');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Enlace copiado al portapapeles.', 'success');
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: titulo || 'Contenido', url: shareUrl });
        return;
      }
      throw new Error('El navegador no permite compartir ni copiar enlaces.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Error compartiendo contenido:', error);
      showToast('No se pudo compartir el enlace.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!canManageContent || !id || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteContent(id);
      setIsDeleteModalOpen(false);
      setIsDeleted(true);
      showToast('El contenido se eliminó correctamente.', 'success');
    } catch (error) {
      console.error('Error eliminando contenido:', error);
      showToast('No se pudo eliminar el contenido.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) setIsOpenDownload(false);
      if (creditosRef.current && !creditosRef.current.contains(event.target)) setIsOpenCredits(false);
      if (optionsRef.current && !optionsRef.current.contains(event.target)) optionsRef.current.removeAttribute('open');
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setLocalDescargas(descargas);
  }, [descargas]);

  // Bloqueo de scroll cuando el modal de creadores está abierto
  useEffect(() => {
    if (showCreatorsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreatorsModal]);

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

  const categoriaInfo = CATEGORIAS[tipo] || { 
    nombre: tipo || 'Sin categoría', 
    icon: null, 
    badgeColor: 'text-gray-200', 
    borderColor: 'border-gray-300' 
  };
  const CategoriaIcon = categoriaInfo.icon;

  if (isDeleted) return null;

  return (
    <>
    <div 
      className={`group relative flex h-full flex-col rounded-xl transition-all duration-300 ${isOptionsOpen ? 'z-50' : 'z-0'}`}
    >
      {/* 1. IMAGEN */}
      <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-[#1D1F23]">
        <Link
          to={id ? `/view/${id}` : "#"}
          className="absolute inset-0 block cursor-pointer"
        >
          <img
            src={imgSrc}
            alt={titulo || 'Imagen del contenido'}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              if (imgStage < 2) {
                setImgStage(imgStage + 1);
              } else if (!imageError) {
                console.warn('Error loading image:', imagen);
                setImageError(true);
              }
            }}
          />

          {/* Badge de Categoría: Oscuro para Light, Claro para Dark + Ícono */}
          <div className="absolute top-2 left-2 z-10">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${categoriaInfo.badgeColor} bg-black/75 backdrop-blur-sm shadow-md`}>
              {CategoriaIcon && <CategoriaIcon size={12} strokeWidth={2.5} className="shrink-0" />}
              <span>{categoriaInfo.nombre}</span>
            </span>
          </div>
        </Link>

        {isSpamming && (
          <div className="absolute top-2 right-14 z-20 flex items-center gap-1.5 rounded-xl bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
            <AlertCircle size={12} /> Límite excedido
          </div>
        )}
        <LikeButton contentId={id} initialLikes={likes_count} variant="overlay" onChange={handleLikeChange} />
      </div>

      <div className="flex flex-col flex-1 px-0.5 pt-1.5 md:pt-2 pb-1 md:pb-1.5 space-y-1.5 md:space-y-2">

        {/* 2. TÍTULO EN UNA LÍNEA Y CREADOR DEBAJO */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1 min-w-0 py-0.5">
            <Link
              to={id ? `/view/${id}` : "#"}
              className="block min-w-0 flex-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <h3 className="text-base font-bold text-black dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={titulo}>
                {titulo}
              </h3>
            </Link>
            <details
              ref={optionsRef}
              onToggle={(event) => setIsOptionsOpen(event.currentTarget.open)}
              className="group/options relative shrink-0"
            >
              <summary
                aria-label={`Opciones de ${titulo || 'contenido'}`}
                className="flex cursor-pointer list-none rounded-lg px-0 py-1 -mr-1 text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white [&::-webkit-details-marker]:hidden"
              >
                <MoreVertical size={20} />
              </summary>
              <div
                role="menu"
                aria-label={`Opciones de ${titulo || 'contenido'}`}
                className="absolute right-0 top-full z-[60] mt-1.5 w-44 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl animate-fade-in-up sm:w-56 sm:border-gray-300 sm:py-2 dark:border-gray-700 dark:bg-[#1e1e1e] sm:dark:border-transparent"
                style={{ animationDuration: '200ms' }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleShare}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:px-4 sm:py-2 dark:text-gray-200 dark:hover:bg-gray-700/60"
                >
                  <Share2 size={16} /> Compartir
                </button>
                {canManageContent && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        optionsRef.current?.removeAttribute('open');
                        navigate(`/edit/${id}`);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:px-4 sm:py-2 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    >
                      <Edit3 size={16} /> Editar
                    </button>
                    <div className="my-0.5 h-px bg-gray-100 dark:bg-gray-800" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        optionsRef.current?.removeAttribute('open');
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:px-4 sm:py-2 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </>
                )}
              </div>
            </details>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {listaCreditos.length > 1 ? (
              <SmartUserDisplay
                initialUser={listaCreditos}
                type="card-avatar-stack"
                onClick={() => setShowCreatorsModal(true)}
              />
            ) : (
              <SmartUserDisplay initialUser={primerCredito} type="card-avatar" />
            )}

            {listaCreditos.length > 1 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreatorsModal(true);
                }}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left truncate"
              >
                {listaCreditos[0].nombre} ({listaCreditos.length - 1})
              </button>
            ) : (
              <SmartUserDisplay initialUser={primerCredito} type="card-byline" />
            )}
          </div>
        </div>

        {/* 4. MÉTRICAS GENERALES DE LA CARD */}
        <div className="flex justify-between items-center w-full pt-1 text-gray-500 dark:text-gray-400 text-xs font-semibold">
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 group/metric" title="Total de visualizaciones">
              <Eye size={16} className="text-gray-400 dark:text-gray-500 group-hover/metric:text-blue-500 transition-colors" />
              <span className="group-hover/metric:text-blue-600 dark:group-hover/metric:text-blue-400 transition-colors">{formatNumber(vistas)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 group/metric" title="Total de valoraciones">
              <Heart
                size={16}
                className={clsx(
                  'transition-colors duration-200',
                  likeState.liked
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-red-400/80 dark:text-red-500/80 group-hover/metric:text-red-500 group-hover/metric:fill-red-500/30'
                )}
              />
              <span className={clsx('transition-colors', likeState.liked ? 'text-rose-600 dark:text-rose-400' : 'group-hover/metric:text-red-600 dark:group-hover/metric:text-red-400')}>{formatNumber(likeState.count)}</span>
            </div>

            <div className="flex items-center gap-1.5 group/metric" title="Total de descargas globales">
              <Download size={16} className="text-primary-400/80 dark:text-primary-500/80 group-hover/metric:text-primary-500 transition-colors" />
              <span className="group-hover/metric:text-primary-600 dark:group-hover/metric:text-primary-400 transition-colors">{formatNumber(calculatedTotal)}</span>
            </div>
          </div>
        </div>

        {/* 3. BOTÓN DE DESCARGA RÁPIDA */}
        {localDescargas.length > 0 && (
          <div className="relative pt-1.5" ref={downloadRef}>
            {localDescargas.length === 1 ? (
              <a 
                href={localDescargas[0].url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => handleDownloadClick(localDescargas[0].url)}
                className="flex h-10 min-w-0 items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg w-full"
              >
                <Download size={16} strokeWidth={2.5} className="shrink-0" />
                <span className="truncate">Descargar</span>
              </a>
            ) : (
              <>
                <button 
                  type="button"
                  aria-expanded={isOpenDownload}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenDownload(!isOpenDownload);
                  }}
                  className="flex h-10 min-w-0 items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg w-full"
                >
                  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <Download size={16} strokeWidth={2.5} className="shrink-0" />
                    <span className="truncate">Descargar</span>
                    <span className="shrink-0 px-1.5 py-0.5 bg-white/20 rounded text-xs">{localDescargas.length}</span>
                  </div>
                  <ChevronDown size={16} className={clsx("shrink-0 transition-transform duration-200", isOpenDownload && "rotate-180")} />
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
                          className="flex min-h-11 sm:min-h-0 items-center justify-between px-3 sm:px-4 py-3 sm:py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group/item cursor-pointer"
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="truncate font-bold group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">{option.label}</span>
                          </div>
                          <Download size={16} className="shrink-0 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* MODAL DE CREADORES */}
      {showCreatorsModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowCreatorsModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-2 md:p-4 max-w-md w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
            style={{ animationDuration: '150ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Creadores</h3>
              <button
                onClick={() => setShowCreatorsModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Lista de creadores */}
            <div className="space-y-2">
              {listaCreditos.map((creador, idx) => (
                <SmartUserRow key={idx} user={creador} />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
      onConfirm={handleDelete}
      title="Eliminar contenido"
      message={`¿Seguro que deseas eliminar "${titulo || 'este contenido'}"? Esta acción no se puede deshacer.`}
      type="warning"
      showCancel
      confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
    />
    </>
  );
};

export default Card;
