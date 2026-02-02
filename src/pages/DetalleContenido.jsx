import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download, Calendar, Tag, Share2, ArrowLeft,
  CheckCircle, ShieldCheck, MessageCircle, Facebook, Twitter, Eye,
  Image as ImageIcon, Layers, User, ChevronLeft, ChevronRight, PlayCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { getContentById, registerDownload } from '../services/api';
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getContentById(id);
        if (!data) {
          navigate('/404');
          return;
        }
        setItem(data);
        setSelectedImage(data.imagen);
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
  const shareText = `¡Mira este mod: ${item?.titulo}!`;
  const socialLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const totalDownloads = item?.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]"><div className="animate-pulse w-12 h-12 bg-gray-300 rounded-full"></div></div>;
  if (!item) return null;

  return (
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* BOTÓN VOLVER */}
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
            <ArrowLeft size={20} /> Volver al listado
        </button>

        {/* 2. ENCABEZADO (Título y Meta) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-6">
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
                <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight">
                    {item.titulo}
                </h1>
            </div>
            
            {/* Stats Rápidos */}
            <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                <div className="text-right">
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totalDownloads)}</p>
                    <p className="text-xs uppercase font-bold tracking-wider">Descargas</p>
                </div>
                <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
                <div className="text-right">
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(item.vistas || 0)}</p>
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
                    <div className="rounded-2xl overflow-hidden relative group aspect-video mb-2">
                        
                        {/* 1. CASO YOUTUBE (Iframe nocookie) */}
                        {youtubeId ? (
                            <iframe
                                key={youtubeId}
                                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                title="YouTube video player"
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : isVideo(currentMedia) ? (
                            /* 2. CASO VIDEO MP4 */
                            <video 
                                src={currentMedia} 
                                className="w-full h-full object-contain bg-black" 
                                controls 
                                muted 
                                loop 
                                key={currentMedia} 
                            />
                        ) : (
                            /* 3. CASO IMAGEN */
                            <img 
                                src={currentMedia} 
                                alt={item.titulo} 
                                className="w-full h-full object-cover transition-transform duration-700" 
                                key={currentMedia}
                            />
                        )}

                        {/* --- BOTONES DE NAVEGACIÓN (Solo si hay más de 1 item) --- */}
                        {galleryItems.length > 1 && (
                            <>
                                {/* Botón Izquierda */}
                                <button 
                                    onClick={handlePrev}
                                    className="absolute top-1/2 left-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Botón Derecha */}
                                <button 
                                    onClick={handleNext}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10"
                                >
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
                                const thumbSrc = isYt 
                                    ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` // Miniatura automática de YT
                                    : media;

                                return (
                                    <button 
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className={clsx(
                                            "relative h-20 w-34 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer snap-start group/thumb",
                                            selectedIndex === index
                                                ? "border-primary-500" 
                                                : "border-transparent"
                                        )}
                                    >
                                        {/* Icono Overlay para Video/YT */}
                                        {(isYt || isVid) && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <PlayCircle size={38} className="text-white drop-shadow-md" />
                                            </div>
                                        )}

                                        <img 
                                            src={thumbSrc} 
                                            alt={`Vista ${index}`} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DESCRIPCIÓN (Igual que antes) */}
                <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 pb-4 border-b border-gray-300 dark:border-gray-700">
                        <Layers size={20} className="text-primary-600" /> Descripción
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        {item.descripcion || "El creador no ha proporcionado una descripción detallada, pero basándonos en las etiquetas y el título, ¡parece una aventura épica! Descárgalo y compruébalo tú mismo."}
                    </div>
                    
                    {/* TAGS */}
                    <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Etiquetas</h4>
                        <div className="flex flex-wrap gap-2">
                            {item.tags?.map((tag, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                    <Tag size={10} className="text-gray-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">{tag}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* --- COLUMNA DERECHA (Sidebar Sticky) - 4/12 --- */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* 1. TARJETA DE DESCARGA (Sticky) */}
                <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-xl shadow-primary-900/5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Descargar Archivos</h3>
                    
                    <div className="flex flex-col gap-3">
                        {item.descargas.map((d, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleDownload(d.url)}
                                className="group w-full relative overflow-hidden rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-lg">
                                            {downloading === d.url ? <CheckCircle size={20} className="animate-bounce"/> : <Download size={20}/>}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{d.label}</div>
                                            <div className="text-[10px] opacity-70 uppercase tracking-wide font-bold">{formatNumber(d.count || 0)} downloads</div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* REDES SOCIALES (Dentro de la misma tarjeta sticky) */}
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Compartir</p>
                        <div className="flex justify-center gap-2">
                            <SocialButton href={socialLinks.whatsapp} icon={MessageCircle} color="text-green-500 bg-green-50 hover:bg-green-100" />
                            <SocialButton href={socialLinks.twitter} icon={Twitter} color="text-blue-400 bg-blue-50 hover:bg-blue-100" />
                            <SocialButton href={socialLinks.facebook} icon={Facebook} color="text-blue-700 bg-blue-50 hover:bg-blue-100" />
                        </div>
                    </div>
                </div>

                {/* 2. CREADORES Y APORTE */}
                <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                    
                    {/* Creadores */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Créditos</h4>
                        <div className="space-y-3">
                            {item.creadores?.map((creador, i) => (
                                <Link to={`/u/${creador.nombre}`} key={i} className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100">
                                        <AvatarRenderer avatar={creador.imagen} name={creador.nombre} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{creador.nombre}</p>
                                        <p className="text-xs text-gray-500">Autor Original</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Uploader (Si existe) */}
                    {item.uploader && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Aportado por</h4>
                            <Link to={`/u/${item.uploader.nombre}`} className="flex items-center gap-3 group p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    <AvatarRenderer avatar={item.uploader.imagen} name={item.uploader.nombre} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.uploader.nombre}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Comunidad</p>
                                </div>
                                <ArrowLeft size={14} className="rotate-180 text-gray-400 group-hover:translate-x-1 transition-transform" />
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