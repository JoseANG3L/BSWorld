import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download, Calendar, Tag, Share2, ArrowLeft,
  CheckCircle, ShieldCheck, MessageCircle, Facebook, Twitter, Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import { getContentById, registerDownload } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';

const DetalleContenido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getContentById(id);
        if (!data) {
          navigate('/404');
          return;
        }
        setItem(data);
      } catch (error) {
        console.error("Error cargando detalle:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // --- LÓGICA DE DESCARGA ---
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

  // --- LÓGICA REDES SOCIALES ---
  const shareUrl = window.location.href;
  const shareText = `¡Mira este increíble mod para Minecraft: ${item?.titulo}! Descárgalo aquí:`;

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-primary-500 rounded-full mb-4"></div>
            <p className="text-gray-400 font-bold">Cargando contenido...</p>
        </div>
    </div>
  );
  
  if (!item) return null;

  return (
    <div className="animate-fade-in-up pb-20 min-h-screen bg-gray-50 dark:bg-[#121212]">

      {/* --- HERO HEADER (Estructura nueva, colores neutros) --- */}
      <div className="relative h-[400px] w-full overflow-hidden bg-gray-900">
        {/* Imagen de fondo grande */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105 opacity-60"
          style={{ backgroundImage: `url(${item.imagen})` }}
        ></div>
        {/* Overlay gradiente neutro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#121212] via-transparent to-transparent"></div>

        {/* Botón Volver Flotante (Neutro) */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-3 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md text-gray-800 dark:text-white shadow-sm hover:scale-110 transition-all border border-white/20 z-20 group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* --- COLUMNA IZQUIERDA (Sticky Sidebar) --- */}
          <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 lg:h-fit animate-fade-in-up" style={{animationDelay: '100ms'}}>
            
            {/* Imagen Principal (Card Style Neutro) */}
            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-[#1e1e1e] bg-gray-200 relative group">
              <img
                src={item.imagen}
                alt={item.titulo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Badge de Verificado (Neutro/Verde estándar) */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur text-green-600 dark:text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                 <ShieldCheck size={14} /> Verificado
              </div>
            </div>

            {/* Caja de Descargas (Colores Neutros/Primarios) */}
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-md">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Download size={16} /> Zona de Descarga
              </h3>
              
              <div className="space-y-3">
                {item.descargas.map((d, idx) => (
                    <button
                    key={idx}
                    onClick={() => handleDownload(d.url)}
                    // Volvemos al color primario sólido sin gradientes intensos
                    className="relative overflow-hidden w-full p-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-all group active:scale-[0.98] border border-primary-500"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-700/50 rounded-lg">
                                    {downloading === d.url ? <CheckCircle size={20} className="animate-bounce" /> : <Download size={20} />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-base">{d.label}</div>
                                    <div className="text-xs opacity-90 font-medium">{formatNumber(d.count || 0)} instalaciones</div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
              </div>
            </div>

            {/* Caja de Redes Sociales (Fondo Neutro) */}
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-md">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Share2 size={16} /> Compartir
                </h3>
                <div className="flex justify-between gap-2">
                    {/* Botones con sus colores de marca, pero en contenedor neutro */}
                    <SocialButton href={socialLinks.whatsapp} icon={MessageCircle} color="bg-[#25D366] hover:bg-[#1da851]" label="WhatsApp" />
                    <SocialButton href={socialLinks.twitter} icon={Twitter} color="bg-[#1DA1F2] hover:bg-[#0c85d0]" label="X" />
                    <SocialButton href={socialLinks.facebook} icon={Facebook} color="bg-[#1877F2] hover:bg-[#0c5dc7]" label="Facebook" />
                </div>
            </div>

          </div>

          {/* --- COLUMNA DERECHA (Información) --- */}
          <div className="flex-1 flex flex-col gap-8 pt-4 lg:pt-16 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            
            {/* Encabezado */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Badges Neutros */}
                <span className="px-4 py-1.5 rounded-full text-sm font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {item.tipo}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-1.5 bg-white dark:bg-[#1e1e1e] px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                    <Calendar size={14} /> {new Date(item.creado).toLocaleDateString()}
                </span>
              </div>

              {/* Título (Color estándar, sin gradiente) */}
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                  {item.titulo}
              </h1>

              {/* Estadísticas Visuales (Neutras) */}
              <div className="flex gap-8 p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 w-fit shadow-sm">
                 <div className="text-center px-2">
                    <p className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        <Download size={20} className="text-primary-500" />
                        {formatNumber(totalDownloads)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mt-1">Descargas</p>
                 </div>
                 <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
                 <div className="text-center px-2">
                    <p className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        <Eye size={20} className="text-gray-400" />
                        {formatNumber(item.vistas || 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mt-1">Vistas</p>
                 </div>
              </div>
            </div>

            {/* Creadores y Aporte (Tarjetas Neutras) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Autores Originales */}
                <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-3 tracking-wider">Creado por</p>
                    <div className="flex -space-x-3 overflow-hidden py-1">
                        {item.creadores && item.creadores.map((creador, i) => (
                        <Link to={`/u/${creador.nombre}`} key={i} className="relative hover:z-10 hover:scale-110 transition-transform cursor-pointer" title={creador.nombre}>
                            <div className="w-12 h-12 rounded-full border-2 border-white dark:border-[#1e1e1e] overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800">
                                <AvatarRenderer avatar={creador.imagen} name={creador.nombre} />
                            </div>
                        </Link>
                        ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {item.creadores.map(c => c.nombre).join(', ')}
                    </p>
                </div>

                {/* Aporte Realizado Por (Tarjeta Neutra, sin azul) */}
                {item.uploader && (
                    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-3 tracking-wider">Aporte de la comunidad</p>
                        <Link to={`/u/${item.uploader.nombre}`} className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800">
                                <AvatarRenderer avatar={item.uploader.imagen} name={item.uploader.nombre} />
                            </div>
                            <div>
                                <p className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                    {item.uploader.nombre}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Ver perfil completo</p>
                            </div>
                        </Link>
                    </div>
                )}
            </div>

            {/* Descripción y Tags (Neutros) */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <span className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                        <Tag size={20} />
                    </span>
                    Descripción
                </h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-gray-100 dark:border-gray-800">
                    {item.descripcion || "El creador no ha proporcionado una descripción detallada, pero basándonos en las etiquetas y el título, ¡parece una aventura épica! Descárgalo y compruébalo tú mismo."}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2">
                        {item.tags && item.tags.map((tag, i) => (
                            <div key={i} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-bold border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <Tag size={14} className="text-gray-400" /> {tag.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para botones sociales (Colores de marca, estilo limpio)
const SocialButton = ({ href, icon: Icon, color, label }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx("flex-1 py-3 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md", color)}
        title={`Compartir en ${label}`}
    >
        <Icon size={20} />
    </a>
);

export default DetalleContenido;