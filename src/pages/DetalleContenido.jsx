// VERSIÓN CORRECTA - SMART MARKDOWN RENDERER
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Download, Calendar, Tag, User, Users, ArrowLeft, Globe,
    Share2, ShieldCheck, MessageCircle, Facebook, Twitter, Eye,
    Image as ImageIcon, Layers, Loader2, ChevronLeft, ChevronRight, PlayCircle,
    Link as LinkIcon, Mail, Send, Check, Copy, Youtube, AlertCircle, Code,
    Info, Lock, Unlock
} from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkUnwrapImages from 'remark-unwrap-images';
import { getContentById, registerDownload, registerView, getUserPublicProfile } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CommentSection from '../components/CommentSection';
import { encryptionService, initializeEncryption } from '../services/encryption';

// --- COMPONENTE REUTILIZABLE: FILA DE USUARIO INTELIGENTE ---
const SmartUserRow = ({ user, role = "creator" }) => {
    const [profile, setProfile] = useState(user);

    useEffect(() => {
        if (user.uid) {
            const fetchFreshProfile = async () => {
                try {
                    const freshData = await getUserPublicProfile(user.uid);
                    if (freshData) {
                        setProfile(prev => ({
                            ...prev,
                            nombre: freshData.nombre,
                            imagen: freshData.imagen
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching user profile", error);
                }
            };
            fetchFreshProfile();
        }
    }, [user.uid]);

    const esUsuarioRegistrado = !!user.uid;
    
    let roleText = "Autor Externo";
    if (esUsuarioRegistrado) {
        roleText = role === "uploader" ? "Usuario Verificado" : "Creador Verificado";
    }

    return (
        <Link 
            to={`/u/${profile.nombre}`} 
            className="flex items-center gap-3 group p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
            <div className="w-10 h-10 shrink-0 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 relative">
                <AvatarRenderer avatar={profile.imagen} name={profile.nombre} />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                        {profile.nombre}
                    </p>
                    {esUsuarioRegistrado && (
                        <ShieldCheck size={12} className="text-blue-500" title="Verificado" />
                    )}
                </div>
                
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {roleText}
                </p>
            </div>
        </Link>
    );
};

// --- HELPERS (se mantienen igual) ---
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
    const viewRegistered = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getContentById(id);
                if (!data) {
                    navigate('/404');
                    return;
                }
                setItem(data);

                // Inicializar encriptación si el contenido está encriptado
                if (data.encrypted) {
                    try {
                        const key = await initializeEncryption();
                        setEncryptionKey(key);
                    } catch (error) {
                        console.error('Error inicializando encriptación:', error);
                    }
                }

                const viewKey = `viewed_${id}`;
                const hasViewedSession = sessionStorage.getItem(viewKey);

                if (!hasViewedSession && !viewRegistered.current) {
                    viewRegistered.current = true;
                    sessionStorage.setItem(viewKey, 'true');
                    registerView(id).catch(err => console.error("Error contando vista", err));
                }
            } catch (error) {
                console.error("Error cargando detalle:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const galleryItems = item ? [
        item.imagen,
        ...(item.galeria || [])
    ].filter(Boolean) : [];

    const currentMedia = galleryItems[selectedIndex] || '/default.jpg';
    const youtubeId = getYouTubeId(currentMedia);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
        const isEncrypted = download.encrypted || item.encrypted;
        
        setDownloading(url);
        setDecrypting(isEncrypted);
        
        try {
            let finalUrl = url;
            
            // Desencriptar URL si está encriptado
            if (isEncrypted && encryptionKey) {
                try {
                    finalUrl = await encryptionService.decryptUrl(url, encryptionKey);
                } catch (decryptError) {
                    console.error('Error desencriptando URL:', decryptError);
                    // Si falla la desencriptación, usar la URL original
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
    const shareText = `¡Mira este increíble mod: ${item?.titulo}!`;
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

    const totalDownloads = item?.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

    if (loading) return (
        <div className="h-full flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );
    if (!item) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <div className="max-w-[1800px] mx-auto px-2 md:px-4 py-4">

                {/* LAYOUT GRID PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* COLUMNA IZQUIERDA - CONTENIDO PRINCIPAL */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* VISOR DE GALERÍA MÁS PEQUEÑO */}
                        <div className="w-full">
                            <div className="rounded-xl overflow-hidden bg-black shadow-lg">
                                {youtubeId ? (
                                    <iframe 
                                        key={youtubeId} 
                                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                        title="YouTube video player" 
                                        className="w-full aspect-video" 
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
                                        className="w-full aspect-video object-cover" 
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

                            {/* TIRA DE MINIATURAS ESTILO YOUTUBE */}
                            {galleryItems.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x mt-3">
                                    {galleryItems.map((item, index) => {
                                        const isYt = getYouTubeId(item);
                                        const isVid = isVideo(item);
                                        const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : item;
                                        const isActive = index === selectedIndex;
                                        
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedIndex(index)}
                                                className={clsx(
                                                    "relative flex-shrink-0 w-24 md:w-32 aspect-video rounded-lg overflow-hidden transition-all duration-200 snap-start border-2",
                                                    isActive 
                                                        ? "border-primary-600 dark:border-primary-400 ring-2 ring-primary-500/30" 
                                                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                            >
                                                {(isYt || isVid) && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                                        <PlayCircle size={16} className="text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                                <img 
                                                    src={thumbSrc} 
                                                    alt={`Miniatura ${index + 1}`} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = "https://placehold.co/320x180?text=Error"; }}
                                                />
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-primary-600/10 dark:bg-primary-400/10 pointer-events-none"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* HEADER ESTILO YOUTUBE (DESPUÉS DE GALERÍA) */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm">
                            {/* Título Principal */}
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                {item.titulo}
                            </h1>
                            
                            {/* Información del creador y stats */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Creador */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                                        <AvatarRenderer 
                                            avatar={item.aporte?.imagen} 
                                            name={item.aporte?.nombre || 'Creador'} 
                                        />
                                    </div>
                                    <div>
                                        <Link 
                                            to={item.aporte?.uid ? `/u/${item.aporte?.uid}` : '#'}
                                            className="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
                                        >
                                            {item.aporte?.nombre || 'Creador'}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span>{formatNumber(item.vistas || 0)} vistas</span>
                                            <span>•</span>
                                            <span>{new Date(item.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats y acciones */}
                                <div className="flex items-center gap-2 md:gap-4">
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                                        <Download size={14} />
                                        <span>{formatNumber(totalDownloads)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                                        <Eye size={14} />
                                        <span>{formatNumber(item.vistas || 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-bold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                        <ShieldCheck size={12} />
                                        <span>Verificado</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPCIÓN ESTILO YOUTUBE CON BOTÓN VER MÁS */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    Descripción
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.descripcion?.length || 0} caracteres
                                </span>
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                <div className={descriptionExpanded ? '' : 'line-clamp-3'}>
                                    <MarkdownRenderer content={item.descripcion} />
                                </div>
                                {item.descripcion && item.descripcion.length > 200 && (
                                    <button
                                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                                        className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        {descriptionExpanded ? 'Mostrar menos' : 'Mostrar más'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* SECCIÓN DE COMENTARIOS*/}
                        <CommentSection contentId={id} />
                    </div>

                    {/* COLUMNA DERECHA ESTILO YOUTUBE */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* TARJETA DE DESCARGA */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Download size={18} className="text-primary-600 dark:text-primary-400" /> Descargas
                                </h3>
                                {item.encrypted && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <Lock size={10} className="text-blue-600 dark:text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Protegido</span>
                                    </div>
                                )}
                            </div>
                            {item.descargas.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {item.descargas.map((d, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleDownload(d)}
                                            disabled={downloading === d.url}
                                            className={clsx(
                                                "relative flex items-center justify-between px-4 py-3 rounded-lg transition-all w-full text-left group/item cursor-pointer border",
                                                downloading === d.url 
                                                    ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed" 
                                                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate font-medium text-sm text-gray-900 dark:text-white">{d.label}</span>
                                                    {(d.encrypted || item.encrypted) && (
                                                        <Lock size={10} className="text-blue-500" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                    <Download size={10} /> {formatNumber(d.count || 0)} descargas
                                                </span>
                                            </div>
                                            <div className="p-1.5 rounded-lg transition-colors">
                                                {downloading === d.url ? (
                                                    decrypting ? (
                                                        <Unlock size={16} className="text-primary-600 dark:text-primary-400 animate-pulse" />
                                                    ) : (
                                                        <Loader2 size={16} className="text-gray-400 animate-spin" />
                                                    )
                                                ) : (
                                                    <Download size={16} className="text-gray-500 dark:text-gray-400 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {item.descargas.length === 0 && (
                                <div className="flex flex-col gap-3 mt-2 md:mt-3">
                                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 italic">
                                        <AlertCircle size={20} />
                                        No hay descargas disponibles.
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* CREDITOS Y APORTE ESTILO YOUTUBE */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm">
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Users size={16} className="text-primary-600 dark:text-primary-400" /> Créditos
                                </h4>
                                <div className="space-y-2">
                                    {item.creadores?.map((creador, i) => (
                                        <SmartUserRow key={i} user={creador} role="creator" />
                                    ))}
                                </div>
                            </div>

                            {item.aporte && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <User size={16} className="text-primary-600 dark:text-primary-400" /> Aportado por
                                    </h4>
                                    <SmartUserRow user={item.aporte} role="uploader" />
                                </div>
                            )}
                        </div>

                        {/* REDES SOCIALES ESTILO YOUTUBE */}
                        {item.redes && item.redes.length > 0 && (
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-sm">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Globe size={16} className="text-blue-500" /> Redes y Enlaces
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
                            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                    <Tag size={16} className="text-blue-500" /> Etiquetas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {item.tags?.map((tag, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Tag size={10} className="text-gray-600 dark:text-gray-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                                {tag}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* COMPARTIR PÁGINA */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                <Share2 size={16} className="text-blue-500" /> Compartir
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
                                        "p-3 rounded-xl transition-all hover:scale-110 text-white",
                                        copied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"
                                    )}
                                    title="Copiar enlace al portapapeles"
                                >
                                    {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialButton = ({ href, icon: Icon, color }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx("p-3 rounded-xl transition-all hover:scale-110", color)}
    >
        <Icon size={20} />
    </a>
);

export default DetalleContenido;