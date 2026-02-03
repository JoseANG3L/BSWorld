import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Download, Calendar, Tag, User, Users, ArrowLeft,
    CheckCircle, ShieldCheck, MessageCircle, Facebook, Twitter, Eye,
    Image as ImageIcon, Layers, Loader2, ChevronLeft, ChevronRight, PlayCircle,
    Link as LinkIcon, Mail, Send, Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { getContentById, registerDownload, registerView } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';

// --- HELPER 1: DETECTAR YOUTUBE ---
const getYouTubeId = (url) => {
    if (!url) return null;
    // Soporta formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- HELPER 2: DETECTAR VIDEO MP4 LOCAL ---
const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
};

const DetalleContenido = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [copied, setCopied] = useState(false);
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

                // --- LÓGICA DE VISTAS CORREGIDA ---
                const viewKey = `viewed_${id}`;
                const hasViewedSession = sessionStorage.getItem(viewKey);

                // Verificamos:
                // 1. Que no se haya visto en esta sesión (sessionStorage)
                // 2. Que no se haya registrado ya en este montaje (useRef - Fix StrictMode)
                if (!hasViewedSession && !viewRegistered.current) {
                    
                    // A. Bloqueamos inmediatamente para que nadie más entre
                    viewRegistered.current = true;
                    sessionStorage.setItem(viewKey, 'true');

                    // B. Llamamos a la API (sin await bloqueante para la UI)
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

    const currentMedia = galleryItems[selectedIndex];

    const youtubeId = getYouTubeId(currentMedia);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- NAVEGACIÓN GALERÍA ---
    const handlePrev = () => {
        setSelectedIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
    };

    const handleDownload = async (url) => {
        if (!item) return;
        setDownloading(url);
        setTimeout(() => setDownloading(null), 2000);

        const COOLDOWN_TIME = 60000;
        const storageKey = `download_limit_${id}_${url}`;
        const lastDownloadTime = localStorage.getItem(storageKey);
        const now = Date.now();

        window.open(url, '_blank');

        if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) return;

        localStorage.setItem(storageKey, now.toString());
        await registerDownload(id, url);

        setItem(prev => ({
            ...prev,
            descargas: prev.descargas.map(d =>
                d.url === url ? { ...d, count: (d.count || 0) + 1 } : d
            )
        }));
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
        <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* BOTÓN VOLVER */}
                <button onClick={() => navigate(-1)} className="mb-4 md:mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
                    <ArrowLeft size={20} /> Volver al listado
                </button>

                {/* 2. ENCABEZADO (Título y Meta) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 tracking-wider">
                                {item.tipo}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
                                <ShieldCheck size={12} /> Verificado
                            </span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                <Calendar size={14} /> {new Date(item.creado).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black text-dark dark:text-dark leading-tight tracking-tight">
                            {item.titulo}
                        </h1>
                    </div>

                    {/* Stats Rápidos */}
                    <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                        <div>
                            <p className="text-md md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-end gap-2">
                                <Download size={16} /> {formatNumber(totalDownloads)}
                            </p>
                            <p className="text-xs uppercase font-bold tracking-wider">Descargas</p>
                        </div>
                        <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
                        <div>
                            <p className="text-md md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-end gap-2">
                                <Eye size={16} /> {formatNumber(item.vistas || 0)}</p>
                            <p className="text-xs uppercase font-bold tracking-wider">Vistas</p>
                        </div>
                    </div>
                </div>

                {/* 3. LAYOUT GRID PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5">

                    {/* --- COLUMNA IZQUIERDA (Contenido Visual y Texto) - 8/12 --- */}
                    <div className="lg:col-span-8 flex flex-col gap-3 md:gap-5">

                        {/* --- VISOR DE GALERÍA (IMAGEN/VIDEO + BOTONES) --- */}
                        <div>
                            <div className="rounded-2xl relative group aspect-video mb-2 shadow-md">

                                {/* 1. CASO YOUTUBE (Iframe nocookie) */}
                                {youtubeId ? (
                                    <iframe key={youtubeId} src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                        title="YouTube video player" className="w-full h-full rounded-2xl" frameBorder="0" allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                                ) : isVideo(currentMedia) ? (
                                    /* 2. CASO VIDEO MP4 */
                                    <video src={currentMedia} key={currentMedia} className="w-full h-full object-contain bg-black rounded-2xl" controls muted loop />
                                ) : (
                                    /* 3. CASO IMAGEN */
                                    <img src={currentMedia} key={currentMedia} className="w-full h-full object-cover transition-transform duration-700 rounded-2xl" alt={item.titulo} />
                                )}

                                {/* --- BOTONES DE NAVEGACIÓN (Solo si hay más de 1 item) --- */}
                                {galleryItems.length > 1 && (
                                    <>
                                        {/* Botón Izquierda */}
                                        <button onClick={handlePrev} className="absolute top-1/2 left-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10">
                                            <ChevronLeft size={24} />
                                        </button>

                                        {/* Botón Derecha */}
                                        <button onClick={handleNext} className="absolute top-1/2 right-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10">
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* --- TIRA DE MINIATURAS --- */}
                            {galleryItems.length > 1 && (
                                <div className="flex gap-1 overflow-auto scrollbar-hide snap-x">
                                    {galleryItems.map((media, index) => {
                                        const isYt = getYouTubeId(media);
                                        const isVid = isVideo(media);
                                        const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : media;

                                        return (
                                            <button key={index} onClick={() => setSelectedIndex(index)}
                                                className={clsx(
                                                    "relative h-20 w-34 shrink-0 rounded-lg border-2 transition-all cursor-pointer snap-start group/thumb",
                                                    selectedIndex === index ? "border-primary-500" : "border-transparent"
                                                )}
                                            >
                                                {/* Icono Overlay para Video/YT */}
                                                {(isYt || isVid) && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-lg">
                                                        <PlayCircle size={38} className="text-white drop-shadow-md" />
                                                    </div>
                                                )}

                                                <img src={thumbSrc} alt={`Vista ${index}`} className="w-full h-full object-cover rounded-lg" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* DESCRIPCIÓN (Igual que antes) */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 ps-0.5 pb-4 border-b border-gray-300 dark:border-gray-700">
                                <Layers size={20} className="text-primary-600 dark:text-primary-300" /> Descripción
                            </h3>
                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                                {item.descripcion || "El creador no ha proporcionado una descripción detallada, pero basándonos en las etiquetas y el título, ¡parece una aventura épica! Descárgalo y compruébalo tú mismo."}
                            </div>

                            {/* TAGS */}
                            <div className="mt-4 md:mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ps-0.5">
                                    <Tag size={16} className="text-primary-600 dark:text-primary-300" /> Etiquetas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {item.tags?.map((tag, index) => (
                                        <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                            <Tag size={10} className="text-gray-600 dark:text-gray-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* --- COLUMNA DERECHA (Sidebar Sticky) - 4/12 --- */}
                    <div className="lg:col-span-4 space-y-4 md:space-y-5">

                        {/* 1. TARJETA DE DESCARGA */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 ps-0.5">
                                <Download size={20} className="text-primary-600 dark:text-primary-300" /> Descargar Archivos
                            </h3>

                            <div className="flex flex-col gap-3">
                                {item.descargas.map((d, idx) => (
                                    <button key={idx} onClick={() => handleDownload(d.url)}
                                        className={clsx(
                                            "relative flex items-center justify-between px-4 py-3 rounded-xl transition-all w-full text-left group/item cursor-pointer",
                                            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="truncate font-bold text-sm text-white">{d.label}</span>
                                            <span className="text-[10px] flex items-center gap-1 font-medium text-primary-100">
                                                <Download size={12} /> {formatNumber(d.count || 0)} descargas
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-lg transition-colors bg-white/20">
                                            <Download size={20} className="text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* REDES SOCIALES (Dentro de la misma tarjeta sticky) */}
                            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 text-center">Compartir</p>
                                <div className="flex justify-center gap-2">
                                    <SocialButton href={socialLinks.whatsapp} icon={MessageCircle} color="text-white bg-green-600 hover:bg-green-700" />
                                    <SocialButton href={socialLinks.telegram} icon={Send} color="text-white bg-[#0088cc] hover:bg-[#007dbb]" />
                                    <SocialButton href={socialLinks.twitter} icon={Twitter} color="text-white bg-[#1DA1F2] hover:bg-[#0c85d0]" />
                                    <SocialButton href={socialLinks.facebook} icon={Facebook} color="text-white bg-[#1877F2] hover:bg-[#0c5dc7]" />
                                    <SocialButton href={socialLinks.email} icon={Mail} color="text-white bg-gray-600 hover:bg-gray-700" />
                                    <button onClick={handleCopyLink} className={clsx(
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

                        {/* 2. CREADORES Y APORTE */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">

                            {/* Creadores */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                    <Users size={16} className="text-primary-600 dark:text-primary-300" /> Créditos
                                </h4>
                                <div className="space-y-3">
                                    {item.creadores?.map((creador, i) => (
                                        <Link to={`/u/${creador.nombre}`} key={i} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100">
                                                <AvatarRenderer avatar={creador.imagen} name={creador.nombre} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{creador.nombre}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Uploader (Si existe) */}
                            {item.uploader && (
                                <div className="pt-5 border-t border-gray-300 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                        <User size={16} className="text-primary-600 dark:text-primary-300" /> Aportado por
                                    </h4>
                                    <Link to={`/u/${item.uploader.nombre}`} className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100">
                                            <AvatarRenderer avatar={item.uploader.imagen} name={item.uploader.nombre} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{item.uploader.nombre}</p>
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialButton = ({ href, icon: Icon, color }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
        className={clsx("p-3 rounded-xl transition-all hover:scale-110", color)}>
        <Icon size={20} />
    </a>
);

export default DetalleContenido;