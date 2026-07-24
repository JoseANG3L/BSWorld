// VERSIÓN CORRECTA - SMART MARKDOWN RENDERER CON BLOQUEO DE SCROLL
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Download, Calendar, Tag, User, Users, ArrowLeft, Globe,
    Share2, ShieldCheck, MessageCircle, Facebook, Twitter, Eye,
    Image as ImageIcon, Layers, Loader2, ChevronLeft, ChevronRight, PlayCircle,
    Link as LinkIcon, Mail, Send, Check, Copy, Youtube, AlertCircle, Code,
    Info, Lock, Unlock, Heart, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { getContentById, registerDownload, registerView, getUserPublicProfile, toggleLike, isLikedByUser, getRecommendedContent } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import { encryptionService, initializeEncryption } from '../services/encryption';
import { createPortal } from 'react-dom';

// --- SUB-COMPONENTE: AVATAR INTELIGENTE DE CREADOR ---
const SmartCreatorAvatar = ({ creador, className = "w-10 h-10 md:w-11 md:h-11" }) => {
    const [userData, setUserData] = useState(() => ({
        nombre: creador?.nombre || creador?.username || (typeof creador === 'string' ? creador : 'Creador'),
        imagen: creador?.imagen || creador?.avatar || null,
        uid: creador?.uid || creador?.id || (typeof creador === 'string' ? creador : null)
    }));

    useEffect(() => {
        let isMounted = true;
        const targetUid = creador?.uid || creador?.id || (typeof creador === 'string' ? creador : null);

        if (targetUid) {
            getUserPublicProfile(targetUid).then(fresh => {
                if (fresh && isMounted) {
                    setUserData({
                        nombre: fresh.nombre,
                        imagen: fresh.imagen,
                        uid: fresh.uid
                    });
                }
            }).catch(err => console.error("Error obteniendo avatar creador", err));
        }
        return () => { isMounted = false; };
    }, [creador]);

    return (
        <div className={clsx("rounded-full overflow-hidden bg-gray-200 dark:bg-[#191B1E] border-2 border-white dark:border-[#1e1e1e] relative shrink-0", className)}>
            <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
        </div>
    );
};

// --- SUB-COMPONENTE: ITEM HORIZONTAL DE CONTENIDO RECOMENDADO ---
const RecommendedItem = ({ content }) => {
    const creadoresList = useMemo(() => {
        if (!content?.creadores) return [];
        return (Array.isArray(content.creadores) ? content.creadores : [content.creadores]).map(c => {
            if (typeof c === 'object' && c !== null) return c;
            return { nombre: c, imagen: null, uid: null };
        });
    }, [content?.creadores]);

    const primerCreador = creadoresList[0] || { nombre: 'Desconocido', imagen: null, uid: null };

    const [creatorData, setCreatorData] = useState(() => ({
        nombre: primerCreador.nombre || 'Desconocido',
        imagen: primerCreador.imagen || null,
        uid: primerCreador.uid || null
    }));

    useEffect(() => {
        let isMounted = true;
        const targetUid = primerCreador.uid || primerCreador.id;

        if (targetUid) {
            getUserPublicProfile(targetUid).then(fresh => {
                if (fresh && isMounted) {
                    setCreatorData({
                        nombre: fresh.nombre,
                        imagen: fresh.imagen,
                        uid: fresh.uid
                    });
                }
            }).catch(err => console.error("Error obteniendo avatar creador recomendado", err));
        }
        return () => { isMounted = false; };
    }, [primerCreador]);

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <Link 
            to={`/view/${content.id}`}
            className="flex items-center gap-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/30 transition-all group"
        >
            {/* Imagen a la izquierda */}
            <div className="h-20 aspect-video shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#191B1E]">
                <img 
                    src={content.imagen || '/default.jpg'} 
                    alt={content.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => { e.target.src = '/default.jpg'; }}
                />
            </div>

            {/* Información a la derecha */}
            <div className="flex flex-col min-w-0 flex-1">
                {/* Título */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {content.titulo}
                </h4>

                {/* Creador con avatar */}
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-[#191B1E]">
                        <AvatarRenderer avatar={creatorData.imagen} name={creatorData.nombre} />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {creatorData.nombre}
                    </span>
                    {creadoresList.length > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                            +{creadoresList.length - 1}
                        </span>
                    )}
                </div>

                {/* Vistas y fecha */}
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                        <span>{formatNumber(content.vistas || 0)} vistas</span>
                    </div>
                    •
                    <div className="flex items-center gap-1">
                        <span>
                            {new Date(content.creado).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- SUB-COMPONENTE: FILA DE USUARIO INTELIGENTE ---
const SmartUserRow = ({ user, role = "creator", showRole = true, type = "default" }) => {
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
        type === "list" ? (
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
        ) : (
            <Link 
                to={profile.nombre ? `/u/${profile.nombre}` : '#'} 
                className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
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
        )
    );
};

// --- HELPERS ---
const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
};

const getSocialConfig = (url) => {
    const lower = url ? url.toLowerCase() : '';
    
    if (lower.includes('discord')) return { 
        icon: MessageCircle,
        color: "bg-[#5865F2] hover:bg-[#4752c4] text-white",
        label: "Discord"
    };
    if (lower.includes('twitter') || lower.includes('x.com')) return { 
        icon: Twitter, 
        color: "bg-[#1DA1F2] hover:bg-[#0c85d0] text-white", 
        label: "Twitter" 
    };
    if (lower.includes('youtube') || lower.includes('youtu.be')) return { 
        icon: Youtube, 
        color: "bg-[#FF0000] hover:bg-[#cc0000] text-white", 
        label: "YouTube" 
    };
    if (lower.includes('facebook')) return { 
        icon: Facebook, 
        color: "bg-[#1877F2] hover:bg-[#0c5dc7] text-white", 
        label: "Facebook" 
    };
    if (lower.includes('whatsapp')) return { 
        icon: MessageCircle, 
        color: "bg-[#25D366] hover:bg-[#128C7E] text-white", 
        label: "WhatsApp" 
    };
    if (lower.includes('telegram') || lower.includes('t.me')) return { 
        icon: Send, 
        color: "bg-[#0088cc] hover:bg-[#007dbb] text-white", 
        label: "Telegram" 
    };
    if (lower.includes('instagram')) return { 
        icon: ImageIcon, 
        color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white hover:opacity-90", 
        label: "Instagram" 
    };
    
    return { 
        icon: Globe, 
        color: "bg-gray-700 hover:bg-gray-900 text-white dark:bg-gray-600 dark:hover:bg-gray-500", 
        label: "Web" 
    };
};

// --- COMPONENTE PRINCIPAL ---
const DetalleContenido = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [decrypting, setDecrypting] = useState(false);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [showCreatorsModal, setShowCreatorsModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [recommendedContent, setRecommendedContent] = useState([]);
    const [loadingRecommended, setLoadingRecommended] = useState(false);
    const [descriptionOverflow, setDescriptionOverflow] = useState(false);
    const descriptionRef = useRef(null);
    const viewRegistered = useRef(false);

    // 👇 BLOQUEO DE SCROLL EN EL BODY CUANDO EL MODAL ESTÁ ABIERTO
    useEffect(() => {
        if (showCreatorsModal || showShareModal || showLoginModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showCreatorsModal, showShareModal, showLoginModal]);

    // 👇 VERIFICAR SI LA DESCRIPCIÓN DESBORDA EL CONTENEDOR
    useEffect(() => {
        if (descriptionRef.current && item?.descripcion) {
            const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
            setDescriptionOverflow(isOverflowing);
        }
    }, [item?.descripcion]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getContentById(id);
                if (!data) {
                    navigate('/404');
                    return;
                }
                setItem(data);

                if (user) {
                    const liked = await isLikedByUser(user.id, id);
                    setIsLiked(liked);
                }

                try {
                    const key = await initializeEncryption();
                    setEncryptionKey(key);
                } catch (error) {
                    console.error('Error inicializando encriptación:', error);
                }

                const viewKey = `viewed_${id}`;
                const hasViewedSession = sessionStorage.getItem(viewKey);

                if (!hasViewedSession && !viewRegistered.current) {
                    viewRegistered.current = true;
                    sessionStorage.setItem(viewKey, 'true');
                    registerView(id).catch(err => console.error("Error contando vista", err));
                }

                // Cargar contenido recomendado
                setLoadingRecommended(true);
                try {
                    const recommended = await getRecommendedContent(id, data.tipo, data.tags || [], 10);
                    setRecommendedContent(recommended);
                } catch (error) {
                    console.error("Error cargando contenido recomendado:", error);
                } finally {
                    setLoadingRecommended(false);
                }
            } catch (error) {
                console.error("Error cargando detalle:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, user]);

    const galleryItems = item ? [
        item.imagen,
        ...(item.galeria || [])
    ].filter(Boolean) : [];

    const currentMedia = galleryItems[selectedIndex] || '/default.jpg';
    const youtubeId = getYouTubeId(currentMedia);

    // Lista normalizada de creadores
    const creadoresList = useMemo(() => {
        if (!item?.creadores) return [];
        return (Array.isArray(item.creadores) ? item.creadores : [item.creadores]).map(c => {
            if (typeof c === 'object' && c !== null) return c;
            return { nombre: c, imagen: null, uid: null };
        });
    }, [item?.creadores]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform) => {
        if (socialLinks[platform]) {
            window.open(socialLinks[platform], '_blank', 'width=600,height=400');
        }
    };

    const handleLike = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        // Optimistic update: actualizar UI inmediatamente
        const newLikedState = !isLiked;
        const previousLikedState = isLiked;
        const previousLikesCount = item.likes_count || 0;

        setIsLiked(newLikedState);
        setItem(prev => ({
            ...prev,
            likes_count: newLikedState ? previousLikesCount + 1 : Math.max(0, previousLikesCount - 1)
        }));

        try {
            const liked = await toggleLike(user.id, id);

            // Verificar que el resultado coincida con el optimistic update
            if (liked !== newLikedState) {
                // Revertir si hay discrepancia
                setIsLiked(liked);
                setItem(prev => ({
                    ...prev,
                    likes_count: liked ? previousLikesCount + 1 : Math.max(0, previousLikesCount - 1)
                }));
            }
        } catch (error) {
            console.error('Error al dar like:', error);
            // Revertir en caso de error
            setIsLiked(previousLikedState);
            setItem(prev => ({
                ...prev,
                likes_count: previousLikesCount
            }));
        }
    };

    const handlePrev = () => {
        setSelectedIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
    };

    const handleDownload = async (download) => {
        if (!item) return;
        
        const url = download.url;
        const isEncrypted = download.encrypted;
        
        setDownloading(url);
        setDecrypting(isEncrypted);
        
        try {
            let finalUrl = url;
            
            if (isEncrypted && encryptionKey) {
                try {
                    finalUrl = await encryptionService.decryptUrl(url, encryptionKey);
                } catch (decryptError) {
                    console.error('Error desencriptando URL:', decryptError);
                    finalUrl = url;
                }
            }

            const COOLDOWN_TIME = 60000;
            const storageKey = `download_limit_${id}_${url}`;
            const lastDownloadTime = localStorage.getItem(storageKey);
            const now = Date.now();

            window.open(finalUrl, '_blank');

            if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) return;

            localStorage.setItem(storageKey, now.toString());
            await registerDownload(id, url);

            setItem(prev => ({
                ...prev,
                descargas: prev.descargas.map(d =>
                    d.url === url ? { ...d, count: (d.count || 0) + 1 } : d
                )
            }));
        } catch (error) {
            console.error('Error en descarga:', error);
        } finally {
            setTimeout(() => {
                setDownloading(null);
                setDecrypting(false);
            }, 2000);
        }
    };

    const shareUrl = window.location.href;
    const shareText = `¡Mira este increíble contenido: ${item?.titulo}!`;
    const socialLinks = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        email: `mailto:?subject=${encodeURIComponent(item?.titulo)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );
    if (!item) return null;

    return (
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 p-2 lg:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>

            {/* COLUMNA IZQUIERDA - CONTENIDO PRINCIPAL */}
            <div className="w-full flex flex-col gap-4">

                {/* VISOR DE GALERÍA */}
                <div className="w-full">
                    <div className="bg-black relative rounded-xl overflow-hidden group">
                        {youtubeId ? (
                            <iframe 
                                key={youtubeId} 
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                title="YouTube video player" 
                                className="w-full aspect-video bg-black" 
                                frameBorder="0" 
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                        ) : isVideo(currentMedia) ? (
                            <video 
                                src={currentMedia} 
                                key={currentMedia} 
                                className="w-full aspect-video object-contain bg-black" 
                                controls 
                                muted 
                                loop 
                            />
                        ) : (
                            <img 
                                src={currentMedia} 
                                key={currentMedia} 
                                className="w-full aspect-video object-cover bg-black" 
                                alt={item.titulo} 
                            />
                        )}

                        {galleryItems.length > 1 && (
                            <>
                                <button 
                                    onClick={handlePrev} 
                                    className="absolute top-1/2 left-4 -translate-y-1/2 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/20 z-10"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button 
                                    onClick={handleNext} 
                                    className="absolute top-1/2 right-4 -translate-y-1/2 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/20 z-10"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* TIRA DE MINIATURAS */}
                    {galleryItems.length > 1 && (
                        <div className="flex gap-2 scrollbar-hide snap-x mt-2 md:mt-4 overflow-x-auto">
                            {galleryItems.map((mediaItem, index) => {
                                const isYt = getYouTubeId(mediaItem);
                                const isVid = isVideo(mediaItem);
                                const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : mediaItem;
                                const isActive = index === selectedIndex;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className={clsx(
                                            "relative flex-shrink-0 w-24 md:w-36 aspect-video rounded-lg transition-all duration-200 snap-start border shadow-sm ring-1 overflow-hidden",
                                            isActive 
                                                ? "ring-primary-500 border-primary-500"
                                                : "ring-transparent border-transparent hover:ring-primary-500 hover:border-primary-500"
                                        )}
                                    >
                                        {(isYt || isVid) && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                                                <PlayCircle size={16} className="text-white drop-shadow-md" />
                                            </div>
                                        )}
                                        <img 
                                            src={thumbSrc} 
                                            alt={`Miniatura ${index + 1}`} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = "https://placehold.co/320x180?text=Error"; }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* HEADER ESTILO YOUTUBE (ÚNICAMENTE CREADORES) */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-2 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
                    <h1 className="text-md md:text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                        {item.titulo}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        <button 
                            onClick={() => setShowCreatorsModal(true)}
                            className="flex items-center text-left hover:opacity-80 transition-opacity"
                        >
                            <div className="flex mr-3">
                                {creadoresList.slice(0, 2).map((creador, idx) => (
                                    <div key={idx} className={clsx(idx > 0 && "-ml-3")}>
                                        <SmartCreatorAvatar creador={creador} />
                                    </div>
                                ))}
                                {creadoresList.length > 2 && (
                                    <div className="relative z-10 w-7 h-7 md:w-8 md:h-8 -ml-3 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-[#1e1e1e] flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                                        +{creadoresList.length - 2}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center flex-wrap text-sm font-bold text-gray-900 dark:text-white">
                                    {creadoresList.length > 0 ? (
                                        creadoresList.map((creador, idx) => {
                                            const esUltimo = idx === creadoresList.length - 1;
                                            const esPenultimo = idx === creadoresList.length - 2;

                                            return (
                                                <React.Fragment key={idx}>
                                                    <span>{creador.nombre || 'Creador'}</span>
                                                    {!esUltimo && (
                                                        <span>
                                                            {esPenultimo ? '\u00A0y\u00A0' : ',\u00A0'}
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <span>Desconocido</span>
                                    )}
                                </div>
                                
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    <span>{formatNumber(item.vistas || 0)} vistas</span>
                                    <span className="mx-1.5">•</span>
                                    <span>{new Date(item.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </button>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleLike}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-150 active:scale-95 hover:opacity-80",
                                    isLiked 
                                        ? "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" 
                                        : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                                )}
                            >
                                <Heart 
                                    size={18} 
                                    className={clsx(isLiked && "fill-current transition-colors duration-150")} 
                                />
                                <span>{formatNumber(item.likes_count || 0)}</span>
                            </button>
                            
                            <button 
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* DESCRIPCIÓN CON BOTÓN VER MÁS */}
                <div 
                    onClick={() => descriptionOverflow && !descriptionExpanded && setDescriptionExpanded(true)}
                    className={clsx(
                        "bg-white dark:bg-[#1e1e1e] rounded-lg p-2 md:p-4 shadow-sm border border-gray-300 dark:border-transparent transition-colors", 
                        descriptionOverflow && !descriptionExpanded && "cursor-pointer hover:bg-gray-50/60 dark:hover:bg-[#222]"
                    )}
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            Descripción
                        </h3>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        <div 
                            ref={descriptionRef}
                            className={clsx(
                                "transition-all duration-300 overflow-hidden",
                                descriptionExpanded ? "" : "max-h-20 select-none"
                            )}
                        >
                            <MarkdownRenderer content={item.descripcion} />
                        </div>
                        
                        {descriptionOverflow && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDescriptionExpanded(!descriptionExpanded);
                                }}
                                className="mt-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                {descriptionExpanded ? 'Mostrar menos' : 'Mostrar más'}
                            </button>
                        )}
                    </div>
                </div>

                {/* SECCIÓN DE COMENTARIOS */}
                <CommentSection contentId={id} />
            </div>

            {/* COLUMNA DERECHA */}
            <div className="lg:min-w-[420px] xl:min-w-[480px] 2xl:min-w-[520px] space-y-4">
                
                {/* TARJETA DE DESCARGAS */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            Descargas
                        </h3>
                    </div>
                    {item.descargas && item.descargas.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {item.descargas.map((d, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => handleDownload(d)}
                                    disabled={downloading === d.url}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2 rounded-lg transition-colors w-full text-left border",
                                        downloading === d.url 
                                            ? "bg-white dark:bg-[#2e3238] border-gray-300 dark:border-transparent cursor-not-allowed" 
                                            : "bg-white dark:bg-[#2e3238] border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    <div className="flex flex-col truncate pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-bold text-sm text-gray-700 dark:text-gray-200">{d.label}</span>
                                            {d.encrypted && (
                                                <Lock size={12} className="text-blue-500 shrink-0" />
                                            )}
                                        </div>
                                        <span className="text-[11px] flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <Download size={10} /> {formatNumber(d.count || 0)} descargas
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        {downloading === d.url ? (
                                            decrypting ? (
                                                <Unlock size={16} className="text-primary-600 dark:text-primary-400 animate-pulse" />
                                            ) : (
                                                <Loader2 size={16} className="text-gray-400 animate-spin" />
                                            )
                                        ) : (
                                            <Download size={16} className="text-gray-500 dark:text-gray-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-2">
                            <AlertCircle size={16} />
                            <span className="text-sm">No hay descargas disponibles.</span>
                        </div>
                    )}
                </div>
                
                {/* CRÉDITOS Y APORTE SEPARADOS (COLUMNA DERECHA) */}
                {item.aporte && (
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                            Aportado por
                        </h4>
                        <SmartUserRow user={item.aporte} role="uploader" />
                    </div>
                )}
                        

                {/* REDES Y ENLACES */}
                {item.redes && item.redes.length > 0 && (
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                            Enlaces Externos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {item.redes.map((link, idx) => {
                                const config = getSocialConfig(link.url);
                                const IconComponent = config.icon;
                                return (
                                    <SocialButton key={idx} href={link.url} icon={IconComponent} color={config.color} />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ETIQUETAS */}
                {item.tags && item.tags.length > 0 && (
                    <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                            Etiquetas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                                <div 
                                    key={index} 
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-50 dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700"
                                >
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                        {tag}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODS RECOMENDADOS */}
                {recommendedContent.length > 0 && (
                    <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                            Mods Recomendados
                        </h4>
                        {loadingRecommended ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 size={20} className="animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recommendedContent.map((content) => (
                                    <RecommendedItem key={content.id} content={content} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                

                {/* COMPARTIR */}
                {/* <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Share2 size={16} className="text-primary-600 dark:text-primary-400" /> Compartir
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <SocialButton href={socialLinks.whatsapp} icon={MessageCircle} color="text-white bg-green-600 hover:bg-green-700" />
                        <SocialButton href={socialLinks.telegram} icon={Send} color="text-white bg-[#0088cc] hover:bg-[#007dbb]" />
                        <SocialButton href={socialLinks.twitter} icon={Twitter} color="text-white bg-[#1DA1F2] hover:bg-[#0c85d0]" />
                        <SocialButton href={socialLinks.facebook} icon={Facebook} color="text-white bg-[#1877F2] hover:bg-[#0c5dc7]" />
                        <SocialButton href={socialLinks.email} icon={Mail} color="text-white bg-gray-600 hover:bg-gray-700" />
                        <button 
                            onClick={handleCopyLink} 
                            className={clsx(
                                "p-3 rounded-xl transition-colors text-white",
                                copied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"
                            )}
                            title="Copiar enlace"
                        >
                            {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                        </button>
                    </div>
                </div> */}
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
                        
                        {/* Lista de creadores */}
                        <div className="space-y-2">
                            {creadoresList.map((creador, idx) => (
                                <SmartUserRow key={idx} user={creador} role="creator" showRole={false} type="list" />
                            ))}
                        </div>
                    </div>
                </div>,
                document.body // 👈 Lo inyecta directamente en el body de la página
            )}

            {/* MODAL DE COMPARTIR */}
            {showShareModal && createPortal(
                <div
                    className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => setShowShareModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
                        style={{ animationDuration: '150ms' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compartir</h3>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Botones de redes sociales */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <button
                                onClick={() => handleShare('whatsapp')}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                                <MessageCircle size={24} />
                                <span className="text-xs font-medium">WhatsApp</span>
                            </button>
                            <button
                                onClick={() => handleShare('telegram')}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0088cc] hover:bg-[#007dbb] text-white transition-colors"
                            >
                                <Send size={24} />
                                <span className="text-xs font-medium">Telegram</span>
                            </button>
                            <button
                                onClick={() => handleShare('twitter')}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1DA1F2] hover:bg-[#0c85d0] text-white transition-colors"
                            >
                                <Twitter size={24} />
                                <span className="text-xs font-medium">Twitter</span>
                            </button>
                            <button
                                onClick={() => handleShare('facebook')}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2] hover:bg-[#0c5dc7] text-white transition-colors"
                            >
                                <Facebook size={24} />
                                <span className="text-xs font-medium">Facebook</span>
                            </button>
                            <button
                                onClick={() => handleShare('email')}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                            >
                                <Mail size={24} />
                                <span className="text-xs font-medium">Email</span>
                            </button>
                            <button
                                onClick={handleCopyLink}
                                className={clsx(
                                    "flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-colors",
                                    copied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"
                                )}
                            >
                                {copied ? <Check size={24} /> : <LinkIcon size={24} />}
                                <span className="text-xs font-medium">{copied ? 'Copiado' : 'Copiar'}</span>
                            </button>
                        </div>

                        {/* Enlace para copiar */}
                        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <input
                                type="text"
                                value={window.location.href}
                                readOnly
                                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE LOGIN */}
            {showLoginModal && createPortal(
                <div
                    className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => setShowLoginModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 md:p-8 max-w-sm w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
                        style={{ animationDuration: '150ms' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={20} className="text-gray-500 dark:text-gray-400" />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                                <Heart size={32} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Inicia sesión para dar like
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Necesitas tener una cuenta para interactuar con el contenido
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    navigate('/login');
                                    setShowLoginModal(false);
                                }}
                                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <LogIn size={18} />
                                <span>Iniciar sesión</span>
                            </button>
                            <button
                                onClick={() => {
                                    navigate('/register');
                                    setShowLoginModal(false);
                                }}
                                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                            >
                                Crear cuenta
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const SocialButton = ({ href, icon: Icon, color }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx("p-3 rounded-xl transition-all hover:scale-105", color)}
    >
        <Icon size={18} />
    </a>
);

export default DetalleContenido;