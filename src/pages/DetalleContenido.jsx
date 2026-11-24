import { leaveOverlayEntry, useOverlayBack } from '../hooks/useOverlayBack';
// VERSIÓN CORRECTA - SMART MARKDOWN RENDERER CON BLOQUEO DE SCROLL
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useContext } from 'react';
import { VisitContext } from '../hooks/useVisitState';
import { catalogStamp, isCatalogCurrent } from '../services/catalog';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Calendar, Tag, User, Users, ArrowLeft, Globe, Share2, ShieldCheck, MessageCircle, Facebook, Twitter, Eye, Image as ImageIcon, Layers, ChevronLeft, ChevronRight, PlayCircle, Link as LinkIcon, Mail, Send, Check, Copy, Youtube, AlertCircle, Code, Info, Heart, X, Edit, Trash2, Wrench, Map, Gamepad2, Boxes, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { deleteContent, getContentById, registerDownload, registerView, getUserPublicProfile, toggleLike, isLikedByUser, getRecommendedContent } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { canManageContent } from '../utils/contentPermissions';
import CardActionsMenu from '../components/CardActionsMenu';
import Modal from '../components/Modal';
import ContentDescription from '../components/ContentDescription';
import CommentSection from '../components/CommentSection';
import { thumbnailImageSrc, thumbUrl } from '../utils/image';
import YouTubePreview from '../components/YouTubePreview';
import { createPortal } from 'react-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIAS = {
    complemento: { nombre: 'Complemento', icon: Wrench, color: 'text-blue-600 dark:text-blue-400' },
    mapa: { nombre: 'Mapa', icon: Map, color: 'text-emerald-600 dark:text-emerald-400' },
    minijuego: { nombre: 'Minijuego', icon: Gamepad2, color: 'text-amber-600 dark:text-amber-400' },
    modpack: { nombre: 'Modpack', icon: Boxes, color: 'text-red-600 dark:text-red-400' },
    paquete: { nombre: 'Paquete', icon: Package, color: 'text-cyan-600 dark:text-cyan-400' },
    personaje: { nombre: 'Personaje', icon: User, color: 'text-purple-600 dark:text-purple-400' }
};


// --- SUB-COMPONENTE: AVATAR INTELIGENTE DE CREADOR ---
const SmartCreatorAvatar = ({ creador, className = "w-9 h-9 md:w-10 md:h-10" }) => {
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
        <div className={clsx("rounded-full overflow-hidden bg-gray-200 dark:bg-[#1D1F23] relative shrink-0", className)}>
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
            data-scroll-anchor={`recommended-${content.id}`}
            className="flex items-center gap-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/30 transition-all group"
        >
            {/* Imagen a la izquierda */}
            <div className="h-16 aspect-video shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#1D1F23] sm:h-[72px]">
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
                data-return-anchor="creators"
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
                data-scroll-anchor="uploader"
                to={profile.nombre ? `/u/${profile.nombre}` : '#'}
                className="group flex min-w-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                    <AvatarRenderer avatar={profile.imagen} name={profile.nombre} />
                </div>
                <div className="min-w-0">
                    <span className="mb-1.5 block text-xs font-medium leading-tight text-gray-500 dark:text-gray-400">Aportado por</span>
                    <span className="flex min-w-0 items-center gap-1 text-sm font-semibold leading-tight text-gray-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-400">
                        <span className="break-all">{profile.nombre}</span>
                        {profile.verificado && <ShieldCheck size={14} className="shrink-0 text-blue-500" title="Verificado" />}
                    </span>
                </div>
                <ChevronRight size={14} aria-hidden="true" className="ml-auto shrink-0 text-gray-500 group-hover:text-primary-600 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 dark:text-gray-400" />
            </Link>
        )
    );
};

const ContentCredits = ({ tipo, aporte, className }) => {
    if (!tipo && !aporte) return null;
    const category = CATEGORIAS[tipo];
    const Icon = category?.icon || Tag;
    return (
        <section className={className}>
            <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">Información del contenido</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
                {tipo && (
                    <div className="flex min-w-0 items-center gap-2">
                        <span className={clsx("grid h-7 w-7 shrink-0 place-items-center", category?.color || "text-gray-600 dark:text-gray-300")}>
                            <Icon size={15} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <span className="mb-1.5 block text-xs font-medium leading-tight text-gray-500 dark:text-gray-400">Categoría</span>
                            <span className="block break-words text-sm font-semibold leading-tight text-gray-900 dark:text-white">{category?.nombre || tipo}</span>
                        </div>
                    </div>
                )}
                {aporte && <SmartUserRow user={aporte} role="uploader" />}
            </div>
        </section>
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
    const { user, loading: authLoading } = useAuth();
    return <DetalleMod key={JSON.stringify([id, user?.id, user?.role])} id={id} user={user} authLoading={authLoading} />;
};

const DetalleMod = ({ id, user, authLoading }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const visit = useContext(VisitContext);
    const [restored] = useState(() => {
        const saved = visit?.get('contentDetail');
        if (saved?.item.id !== id || saved.stamp.version !== catalogStamp().version) return null;
        const isPublic = saved.item.estado === 'aceptado' && saved.item.visibilidad === 'publico' && !saved.item.parent_id;
        return isPublic || isCatalogCurrent(saved.stamp) ? saved : null;
    });
    const [fresh] = useState(() => isCatalogCurrent(restored?.stamp));
    const detailStamp = useRef(restored?.stamp);
    const [item, setItem] = useState(restored?.item || null);
    const [missing, setMissing] = useState(false);
    const [loading, setLoading] = useState(!restored);
    const [downloading, setDownloading] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(restored?.selectedIndex ?? 0);
    const [mainImgStage, setMainImgStage] = useState(0); // 0 miniatura, 1 original, 2 default
    const [thumbStage, setThumbStage] = useState({}); // por miniatura: 0 miniatura, 1 original, 2 default
    const [copied, setCopied] = useState(false);
    const [isLiked, setIsLiked] = useState(restored?.liked ?? false);
    const [likeLoading, setLikeLoading] = useState(Boolean(user) && (!fresh || restored?.liked == null));
    const [showCreatorsModal, setShowCreatorsModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [recommendedContent, setRecommendedContent] = useState(restored?.recommended ?? []);
    const [loadingRecommended, setLoadingRecommended] = useState(restored?.recommended == null);
    useOverlayBack(showCreatorsModal, () => setShowCreatorsModal(false));
    useOverlayBack(showShareModal, () => setShowShareModal(false));
    useOverlayBack(showLoginModal, () => setShowLoginModal(false));

    const activeThumbRef = useRef(null);
    const userId = user?.id;
    const userRole = user?.role;

    useLayoutEffect(() => {
        if (item) visit?.set('contentDetail', {
            item, selectedIndex,
            stamp: detailStamp.current,
            liked: likeLoading ? null : isLiked,
            recommended: loadingRecommended ? null : recommendedContent
        });
    }, [visit, item, selectedIndex, likeLoading, isLiked, loadingRecommended, recommendedContent]);

    useEffect(() => {
        if (missing && !authLoading) navigate('/404', { replace: true });
    }, [missing, authLoading, navigate]);

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

    useEffect(() => {
        let active = true;
        async function fetchData() {
            try {
                const stamp = fresh ? restored.stamp : catalogStamp();
                const data = fresh ? restored.item : await getContentById(id, userId, userRole);
                if (!active) return;
                if (!data) {
                    visit?.delete('contentDetail');
                    setItem(null);
                    setMissing(true);
                    return;
                }
                detailStamp.current = stamp;
                setItem(data);
                setLoading(false);

                if (userId && (!fresh || restored?.liked == null)) {
                    isLikedByUser(userId, id).then(liked => {
                        if (active) setIsLiked(liked);
                    }).finally(() => { if (active) setLikeLoading(false); });
                }

                if (!fresh || !restored?.recommended) {
                    setLoadingRecommended(!restored?.recommended);
                    getRecommendedContent(id, data.tipo, data.tags || [], 10).then(recommended => {
                        if (active) setRecommendedContent(recommended);
                    }).finally(() => { if (active) setLoadingRecommended(false); });
                }

                const viewKey = `viewed_${id}`;
                if (!sessionStorage.getItem(viewKey)) {
                    sessionStorage.setItem(viewKey, 'true');
                    registerView(id).catch(err => console.error('Error contando vista', err));
                }
            } catch (error) {
                console.error('Error cargando detalle:', error);
                if (active) setLoading(false);
            }
        }
        fetchData();
        return () => { active = false; };
    }, [id, userId, userRole, restored, fresh, visit]);

    // Reiniciar etapa de la imagen principal al cambiar de medio
    useEffect(() => { setMainImgStage(0); }, [selectedIndex]);

    // 👇 CENTRAR LA MINIATURA ACTIVA EN LA TIRA CON SCROLL
    useEffect(() => {
        const thumb = activeThumbRef.current;
        const strip = thumb?.parentElement;
        if (strip) {
            const left = strip.scrollLeft + thumb.getBoundingClientRect().left - strip.getBoundingClientRect().left;
            strip.scrollTo({ left: left - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' });
        }
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

    const handleLike = async (event) => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        if (likeLoading) return;
        setLikeLoading(true);

        // Optimistic update: actualizar UI inmediatamente
        const newLikedState = !isLiked;
        const previousLikedState = isLiked;
        const previousLikesCount = item.likes_count || 0;

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const heart = event.currentTarget.querySelector('svg');
            heart?.animate?.(
                newLikedState
                    ? [{ transform: 'scale(0.92)' }, { transform: 'scale(1.22)', offset: 0.45 }, { transform: 'scale(1)' }]
                    : [{ transform: 'scale(1)' }, { transform: 'scale(0.88)', offset: 0.4 }, { transform: 'scale(1)' }],
                { duration: newLikedState ? 280 : 180, easing: 'ease-out' }
            );
        }
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
        } finally {
            setLikeLoading(false);
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

    const canManage = canManageContent(user, item?.aporte);
    const handleDelete = async () => {
        if (!canManage || isDeleting || !item) return;
        setIsDeleting(true);
        try {
            await deleteContent(id);
            visit?.delete('contentDetail');
            showToast('El contenido se eliminó correctamente.', 'success');
            leaveOverlayEntry(() => navigate(user.role === 'admin' ? '/admin' : '/mis-mods', { replace: true }));
        } catch {
            showToast('No se pudo eliminar el contenido.', 'error');
            setIsDeleting(false);
        }
    };

    if (loading) return <LoadingSpinner variant="page" />;
    if (!item) return null;

    return (
        <div data-content-detail className={clsx("max-w-7xl mx-auto w-full flex flex-col gap-2 lg:gap-4 p-2 pb-4 lg:p-4", !restored && "animate-fade-in-up")} style={{ animationDuration: '200ms' }}>

            <div className="flex flex-col lg:flex-row gap-2 lg:gap-5">

                {/* COLUMNA IZQUIERDA - CONTENIDO PRINCIPAL (MÓVIL: TODAS LAS SECCIONES, DESKTOP: GALERÍA, HEADER, DESCRIPCIÓN, COMENTARIOS) */}
                <div className="w-full min-w-0 flex flex-col gap-5 md:gap-6">

                    {/* VISOR DE GALERÍA */}
                    <div className="w-full min-w-0 lg:order-1">
                        <div className="aspect-video bg-black relative rounded-xl overflow-hidden group">
                            {youtubeId ? (
                                <YouTubePreview key={youtubeId} videoId={youtubeId} title={`video de ${item.titulo}`} />
                            ) : isVideo(currentMedia) ? (
                                <video 
                                    src={currentMedia} 
                                    key={currentMedia} 
                                    className="block h-full w-full object-contain bg-black"
                                    controls 
                                    muted 
                                    loop 
                                />
                            ) : (
                                <img
                                    src={mainImgStage === 0 ? (thumbUrl(currentMedia, 1280) || '/default.jpg') : (mainImgStage === 1 ? thumbnailImageSrc(currentMedia) : '/default.jpg')}
                                    key={currentMedia}
                                    className="block h-full w-full object-cover bg-black transition-opacity duration-300"
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
                            <div className="flex gap-2 scrollbar-hide snap-x snap-mandatory mt-2 md:mt-3 overflow-x-auto w-full max-w-full pb-1">
                                {galleryItems.map((mediaItem, index) => {
                                    const isYt = getYouTubeId(mediaItem);
                                    const isVid = isVideo(mediaItem);
                                    const ytThumb = isYt ? `https://i.ytimg.com/vi/${isYt}/mqdefault.jpg` : null;
                                    const proxied = !isYt ? thumbUrl(mediaItem, 320) : null;
                                    const tStage = thumbStage[index] || 0;
                                    const thumbSrc = tStage === 0 ? (ytThumb || proxied || mediaItem) : (tStage === 1 && !isYt ? thumbnailImageSrc(mediaItem) : '/default.jpg');
                                    const isActive = index === selectedIndex;
                                    
                                    return (
                                        <button
                                            key={index}
                                            ref={isActive ? activeThumbRef : null}
                                            onClick={() => setSelectedIndex(index)}
                                            className={clsx(
                                                "relative flex-shrink-0 w-24 md:w-32 aspect-video rounded-lg transition-all duration-200 snap-start border shadow-sm ring-1 overflow-hidden",
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

                    {/* Título, creadores y estadísticas */}
                    <div className="lg:order-2 -mb-2 md:-mb-3">
                        <div className="-mt-2 mb-3 flex items-center justify-between gap-3 md:-mt-3">
                            <h1 className="min-w-0 break-words text-md font-bold leading-tight text-gray-900 dark:text-white md:text-lg">
                                {item.titulo}
                            </h1>
                            {canManage && (
                                <CardActionsMenu label="Opciones del contenido" actions={[
                                    { label: 'Editar', icon: Edit, onSelect: () => leaveOverlayEntry(() => navigate(`/edit/${id}`)) },
                                    { label: 'Eliminar', icon: Trash2, destructive: true, onSelect: () => setShowDeleteModal(true) }
                                ]} />
                            )}
                        </div>
                        
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:gap-x-5">
                            
                            <button 
                                onClick={() => setShowCreatorsModal(true)}
                                data-scroll-anchor="creators"
                                className="flex min-w-0 max-w-full items-center justify-self-start text-left hover:opacity-80 transition-opacity"
                            >
                                <div className="flex mr-3 relative shrink-0">
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

                                <span className="min-w-0 break-words text-sm font-bold text-gray-900 dark:text-white xl:truncate">
                                    {creadoresList.length ? creadoresList[0].nombre : 'Sin creadores'}
                                    {creadoresList.length > 1 && ` +${creadoresList.length - 1}`}
                                </span>
                            </button>

                            <button
                                aria-label="Compartir contenido"
                                onClick={() => setShowShareModal(true)}
                                className="col-start-2 row-start-1 flex items-center justify-self-end gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-800/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all xl:col-start-3"
                            >
                                <Share2 size={18} />
                            </button>

                            <div role="group" aria-label="Estadísticas del contenido"
                                className={clsx(
                                    "col-span-full mt-2 grid grid-cols-3 gap-1.5 text-center text-[13px] leading-4 font-semibold tabular-nums text-gray-700 dark:text-gray-300 sm:gap-3",
                                    "[&>*]:flex [&>*]:min-w-0 [&>*]:flex-col [&>*]:items-center [&>*]:justify-center [&>*]:gap-1 [&>*]:px-1 [&>*]:py-2 md:[&>*]:flex-row md:[&>*]:gap-1.5",
                                    "xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:mt-0 xl:grid-cols-[repeat(3,auto)] xl:gap-4 xl:whitespace-nowrap xl:[&>*]:py-0"
                                )}>
                                <div>
                                    <span className="inline-flex items-center gap-1 font-medium">
                                        <Eye size={14} aria-hidden="true" className="text-sky-600 dark:text-sky-400" />
                                        <span className="md:sr-only">Vistas</span>
                                    </span>
                                    <span>{formatNumber(item.vistas || 0)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLike}
                                    disabled={likeLoading}
                                    aria-pressed={isLiked}
                                    aria-label={`Me gusta, ${item.likes_count || 0} en total`}
                                    className="group min-h-11 w-full cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-wait [&>*]:pointer-events-none"
                                >
                                    <span className="inline-flex items-center gap-1 font-medium">
                                        <Heart size={14} aria-hidden="true" className={clsx(
                                            "origin-center text-rose-600 motion-safe:transition-[fill,transform] motion-safe:duration-150 motion-safe:group-hover:scale-110 motion-safe:group-active:scale-95 dark:text-rose-400",
                                            isLiked ? "fill-current" : "fill-transparent group-hover:fill-rose-500/15"
                                        )} />
                                        <span className="md:sr-only">Me gusta</span>
                                    </span>
                                    <span>{formatNumber(item.likes_count || 0)}</span>
                                </button>
                                <div>
                                    <span className="inline-flex items-center gap-1 font-medium">
                                        <Calendar size={14} aria-hidden="true" className="text-violet-600 dark:text-violet-400" />
                                        <span className="md:sr-only">Fecha</span>
                                    </span>
                                    <time dateTime={item.creado}>
                                        {new Date(item.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </time>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ContentDescription description={item.descripcion} />

                    <ContentCredits tipo={item.tipo} aporte={item.aporte} className="lg:hidden" />

                    {/* TARJETA DE DESCARGAS (MÓVIL: DESPUÉS DE APORTADO POR) */}
                    <div className="lg:hidden">
                        <div className="flex items-center justify-between mb-2.5">
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
                        <CommentSection key={id} contentId={id} />
                    </div>

                    {/* MODS RECOMENDADOS (MÓVIL: DESPUÉS DE COMENTARIOS) */}
                    {recommendedContent.length > 0 && (
                        <div className="lg:hidden">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
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
                <div className="hidden lg:block lg:min-w-[420px] space-y-6">
                    
                    {/* TARJETA DE DESCARGAS */}
                    <div>
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

                    <ContentCredits tipo={item.tipo} aporte={item.aporte} />

                    

                    {/* MODS RECOMENDADOS */}
                    {recommendedContent.length > 0 && (
                        <div>
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

            {showDeleteModal && canManage && (
                <Modal isOpen title="Eliminar contenido" type="warning"
                    message={`¿Seguro que deseas eliminar «${item.titulo}»? Esta acción no se puede deshacer.`}
                    confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'} showCancel
                    onConfirm={handleDelete} onClose={() => !isDeleting && setShowDeleteModal(false)} />
            )}

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
                        <div className="field-group flex items-center gap-2 rounded-lg border border-transparent bg-gray-100 p-3 dark:bg-gray-800">
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
