// VERSIÓN CORRECTA - SMART MARKDOWN RENDERER CON BLOQUEO DE SCROLL
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Calendar, Tag, User, Users, ArrowLeft, Globe, Share2, ShieldCheck, MessageCircle, Facebook, Twitter, Eye, Image as ImageIcon, Layers, ChevronLeft, ChevronRight, PlayCircle, Link as LinkIcon, Mail, Send, Check, Copy, Youtube, AlertCircle, Code, Info, Heart, X, Edit, Wrench, Map, Gamepad2, Boxes, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { getContentById, registerDownload, registerView, getUserPublicProfile, toggleLike, isLikedByUser, getRecommendedContent } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import { thumbUrl } from '../utils/image';
import { createPortal } from 'react-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIAS = {
    complemento: { nombre: 'Complemento', icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-400 dark:border-blue-800' },
    mapa: { nombre: 'Mapa', icon: Map, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-400 dark:border-emerald-800' },
    minijuego: { nombre: 'Minijuego', icon: Gamepad2, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-400 dark:border-amber-800' },
    modpack: { nombre: 'Modpack', icon: Boxes, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-400 dark:border-red-800' },
    paquete: { nombre: 'Paquete', icon: Package, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20', borderColor: 'border-cyan-400 dark:border-cyan-800' },
    personaje: { nombre: 'Personaje', icon: User, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-400 dark:border-purple-800' }
};


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
        <div className={clsx("rounded-full overflow-hidden bg-gray-200 dark:bg-[#1D1F23] border-2 border-white dark:border-[#1e1e1e] relative shrink-0", className)}>
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

    return (
        <Link 
            to={`/view/${content.id}`}
            className="flex items-center gap-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/30 transition-all group"
        >
            {/* Imagen a la izquierda */}
            <div className="h-20 aspect-video shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#1D1F23]">
                <img
                    src={content.imagen || '/default.jpg'}
                    alt={content.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
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
                    <div className="w-4 h-4 shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-[#1D1F23]">
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
    const [mainImgStage, setMainImgStage] = useState(0); // 0 miniatura, 1 original, 2 default
    const [thumbStage, setThumbStage] = useState({}); // por miniatura: 0 miniatura, 1 original, 2 default
    const [copied, setCopied] = useState(false);
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
    const activeThumbRef = useRef(null);
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
            // Pequeño retraso para permitir que el MarkdownRenderer se renderice completamente
            const timer = setTimeout(() => {
                if (descriptionRef.current) {
                    const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
                    setDescriptionOverflow(isOverflowing);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [item?.descripcion]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getContentById(id, user?.id, user?.role);
                if (!data) {
                    navigate('/404');
                    return;
                }
                setItem(data);

                if (user) {
                    const liked = await isLikedByUser(user.id, id);
                    setIsLiked(liked);
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

    // Reiniciar etapa de la imagen principal al cambiar de medio
    useEffect(() => { setMainImgStage(0); }, [selectedIndex]);

    // 👇 CENTRAR LA MINIATURA ACTIVA EN LA TIRA CON SCROLL
    useEffect(() => {
        activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedIndex]);

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

        setDownloading(url);

        try {
            const COOLDOWN_TIME = 60000;
            const storageKey = `download_limit_${id}_${url}`;
            const lastDownloadTime = localStorage.getItem(storageKey);
            const now = Date.now();

            window.open(url, '_blank');

            if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) return;

            localStorage.setItem(storageKey, now.toString());
            await registerDownload(id, url, user?.id);

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

    const estado = item?.estado || item?.status || 'borrador';
    const isOwner = user?.id === (item?.aporte?.uid || item?.aporte);
    const canEdit = isOwner && (estado === 'borrador' || estado === 'draft');

    if (loading) return <LoadingSpinner variant="page" />;
    if (!item) return null;

    return (
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-2 lg:gap-4 p-2 pb-4 lg:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>

            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">

                {/* COLUMNA IZQUIERDA - CONTENIDO PRINCIPAL (MÓVIL: TODAS LAS SECCIONES, DESKTOP: GALERÍA, HEADER, DESCRIPCIÓN, COMENTARIOS) */}
                <div className="w-full min-w-0 flex flex-col gap-2 md:gap-4">

                    {/* VISOR DE GALERÍA */}
                    <div className="w-full min-w-0 lg:order-1">
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
                                    src={mainImgStage === 0 ? (thumbUrl(currentMedia, 1280) || '/default.jpg') : (mainImgStage === 1 ? currentMedia : '/default.jpg')}
                                    key={currentMedia}
                                    className="w-full aspect-video object-cover bg-black transition-opacity duration-300"
                                    style={{ opacity: 0 }}
                                    alt={item.titulo}
                                    loading="lazy"
                                    decoding="async"
                                    fetchPriority="high"
                                    onLoad={(e) => { e.target.style.opacity = 1; }}
                                    onError={(e) => {
                                        if (mainImgStage < 2) {
                                            setMainImgStage(mainImgStage + 1);
                                        } else {
                                            e.target.style.opacity = 1;
                                        }
                                    }}
                                />
                            )}

                            {galleryItems.length > 1 && (
                                <>
                                    <button 
                                        onClick={handlePrev} 
                                        className="absolute top-1/2 left-2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-10"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button 
                                        onClick={handleNext} 
                                        className="absolute top-1/2 right-2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-s z-10"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* TIRA DE MINIATURAS */}
                        {galleryItems.length > 1 && (
                            <div className="flex gap-2 scrollbar-hide snap-x snap-mandatory mt-2 md:mt-4 overflow-x-auto w-full max-w-full pb-1">
                                {galleryItems.map((mediaItem, index) => {
                                    const isYt = getYouTubeId(mediaItem);
                                    const isVid = isVideo(mediaItem);
                                    const ytThumb = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : null;
                                    const proxied = !isYt ? thumbUrl(mediaItem, 320) : null;
                                    const tStage = thumbStage[index] || 0;
                                    const thumbSrc = ytThumb || (tStage === 0 ? (proxied || mediaItem) : (tStage === 1 ? mediaItem : '/default.jpg'));
                                    const isActive = index === selectedIndex;
                                    
                                    return (
                                        <button
                                            key={index}
                                            ref={isActive ? activeThumbRef : null}
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
                                                className="w-full h-full object-cover transition-opacity duration-300"
                                                style={{ opacity: 0 }}
                                                loading="lazy"
                                                decoding="async"
                                                onLoad={(e) => { e.target.style.opacity = 1; }}
                                                onError={(e) => {
                                                    if (tStage < 2) {
                                                        setThumbStage(prev => ({ ...prev, [index]: tStage + 1 }));
                                                    } else {
                                                        e.target.style.opacity = 1;
                                                    }
                                                }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* HEADER ESTILO YOUTUBE (ÚNICAMENTE CREADORES) */}
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent lg:order-2">
                        <h1 className="text-md md:text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                            {item.titulo}
                        </h1>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            <button 
                                onClick={() => setShowCreatorsModal(true)}
                                className="flex items-center text-left hover:opacity-80 transition-opacity"
                            >
                                <div className="flex mr-3 relative">
                                    {creadoresList.length > 0 && (
                                        <div className="relative">
                                            <SmartCreatorAvatar creador={creadoresList[0]} />
                                            {creadoresList.length > 1 && (
                                                <div 
                                                    className="absolute -bottom-1 -right-1 z-10 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-600 dark:bg-primary-500 border-2 border-white dark:border-[#1e1e1e] flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-sm"
                                                    title={`+${creadoresList.length - 1} creador${creadoresList.length - 1 > 1 ? 'es' : ''}`}
                                                >
                                                    +{creadoresList.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center flex-wrap text-sm font-bold text-gray-900 dark:text-white">
                                        {creadoresList.length > 0 ? (
                                            creadoresList.length > 1 ? (
                                                <span>{creadoresList[0].nombre} +{creadoresList.length - 1}</span>
                                            ) : (
                                                <span>{creadoresList[0].nombre}</span>
                                            )
                                        ) : (
                                            <span>Sin creadores</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <span>{formatNumber(item.vistas || 0)} vistas</span>
                                        <span className="mx-1.5">•</span>
                                        <span>{new Date(item.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            </button>

                            <div className="flex items-center gap-1">
                                {/* Botón editar para creador en borrador */}
                                {canEdit && (
                                    <Link 
                                        to={`/subir/${id}`}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all active:scale-95"
                                    >
                                        <Edit size={18} />
                                        <span>Editar</span>
                                    </Link>
                                )}

                                <button 
                                    onClick={handleLike}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-150",
                                        isLiked 
                                            ? "text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50" 
                                            : "text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
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
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-800/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPCIÓN CON BOTÓN VER MÁS */}
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent lg:order-3">
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
                        </div>
                        
                        {item?.descripcion && (
                            <button
                                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                                className="mt-3 mb-1 text-sm font-medium text-primary-600 dark:text-primary-400"
                            >
                                {descriptionExpanded ? 'Mostrar menos' : 'Mostrar más'}
                            </button>
                        )}
                    </div>

                    {/* CATEGORÍA (MÓVIL: DESPUÉS DE DESCRIPCIÓN) */}
                    {item.tipo && (() => {
                        const categoriaInfo = CATEGORIAS[item.tipo] || { 
                            nombre: item.tipo || 'Sin categoría', 
                            icon: null, 
                            color: 'text-gray-500', 
                            bgColor: 'bg-gray-50 dark:bg-gray-900/20', 
                            borderColor: 'border-gray-200 dark:border-gray-800' 
                        };
                        const CategoriaIcon = categoriaInfo.icon;
                        return (
                            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent lg:hidden">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                    Categoría
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <div className={`flex items-center shadow-sm gap-1.5 px-3 py-2 rounded-full ${categoriaInfo.bgColor} border ${categoriaInfo.borderColor}`}>
                                        {CategoriaIcon && <CategoriaIcon size={16} className={categoriaInfo.color} />}
                                        <span className={`text-sm font-semibold tracking-wider ${categoriaInfo.color}`}>
                                            {categoriaInfo.nombre}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* CRÉDITOS Y APORTE SEPARADOS (MÓVIL: DESPUÉS DE CATEGORÍA) */}
                    {item.aporte && (
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent lg:hidden">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                Aportado por
                            </h4>
                            <SmartUserRow user={item.aporte} role="uploader" />
                        </div>
                    )}

                    {/* TARJETA DE DESCARGAS (MÓVIL: DESPUÉS DE APORTADO POR) */}
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent lg:hidden">
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
                                                ? "bg-primary-600 dark:bg-primary-700 border-primary-600 dark:border-primary-700 cursor-not-allowed" 
                                                : "bg-primary-600 dark:bg-primary-700 border-primary-600 dark:border-primary-700 hover:bg-primary-700 dark:hover:bg-primary-800"
                                        )}
                                    >
                                        <div className="flex flex-col truncate pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-bold text-sm text-white">{d.label}</span>
                                            </div>
                                            <span className="text-[11px] flex items-center gap-1 text-white/80">
                                                {formatNumber(d.count || 0)} descargas
                                            </span>
                                        </div>
                                        <div className="shrink-0">
                                            {downloading === d.url ? (
                                                <LoadingSpinner variant="inline" size={17} />
                                            ) : (
                                                <Download size={17} className="text-white" />
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

                    {/* SECCIÓN DE COMENTARIOS */}
                    <div className="lg:order-4">
                        <CommentSection contentId={id} />
                    </div>

                    {/* MODS RECOMENDADOS (MÓVIL: DESPUÉS DE COMENTARIOS) */}
                    {recommendedContent.length > 0 && (
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent lg:hidden">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                                También te puede gustar
                            </h4>
                            {loadingRecommended ? (
                                <div className="flex items-center justify-center py-4">
                                    <LoadingSpinner variant="inline" size={20} />
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
                </div>

                {/* COLUMNA DERECHA (SOLO DESKTOP) */}
                <div className="hidden lg:block lg:min-w-[420px] xl:min-w-[480px] 2xl:min-w-[500px] space-y-3 md:space-y-4">
                    
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
                                                ? "bg-primary-600 dark:bg-primary-700 border-primary-600 dark:border-primary-700 cursor-not-allowed" 
                                                : "bg-primary-600 dark:bg-primary-700 border-primary-600 dark:border-primary-700 hover:bg-primary-700 dark:hover:bg-primary-800"
                                        )}
                                    >
                                        <div className="flex flex-col truncate pr-2">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-bold text-sm text-white">{d.label}</span>
                                            </div>
                                            <span className="text-[11px] flex items-center gap-1 text-white/80">
                                                {formatNumber(d.count || 0)} descargas
                                            </span>
                                        </div>
                                        <div className="shrink-0">
                                            {downloading === d.url ? (
                                                <LoadingSpinner variant="inline" size={17} />
                                            ) : (
                                                <Download size={17} className="text-white" />
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

                    {/* CATEGORÍA */}
                    {item.tipo && (() => {
                        const categoriaInfo = CATEGORIAS[item.tipo] || { 
                            nombre: item.tipo || 'Sin categoría', 
                            icon: null, 
                            color: 'text-gray-500', 
                            bgColor: 'bg-gray-50 dark:bg-gray-900/20', 
                            borderColor: 'border-gray-200 dark:border-gray-800' 
                        };
                        const CategoriaIcon = categoriaInfo.icon;
                        return (
                            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-lg shadow-sm border border-gray-300 dark:border-transparent">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                    Categoría
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <div className={`flex items-center shadow-sm gap-1.5 px-3 py-2 rounded-full ${categoriaInfo.bgColor} border ${categoriaInfo.borderColor}`}>
                                        {CategoriaIcon && <CategoriaIcon size={16} className={categoriaInfo.color} />}
                                        <span className={`text-sm font-semibold tracking-wider ${categoriaInfo.color}`}>
                                            {categoriaInfo.nombre}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* CRÉDITOS Y APORTE SEPARADOS (COLUMNA DERECHA) */}
                    {item.aporte && (
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                Aportado por
                            </h4>
                            <SmartUserRow user={item.aporte} role="uploader" />
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
                                    <LoadingSpinner variant="inline" size={20} />
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
