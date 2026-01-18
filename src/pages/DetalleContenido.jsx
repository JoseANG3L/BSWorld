import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download, Calendar, Tag, Share2, ArrowLeft,
  Clock, AlertTriangle, CheckCircle, Eye, ShieldCheck
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
  const [downloading, setDownloading] = useState(null); // Para mostrar feedback visual al descargar

  // --- 1. CARGAR DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getContentById(id);
        if (!data) {
          navigate('/404'); // Redirigir si no existe
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

  // --- 2. LÓGICA DE DESCARGA (Igual a la Card) ---
  const handleDownload = async (url) => {
    if (!item) return;

    // Feedback visual
    setDownloading(url);
    setTimeout(() => setDownloading(null), 2000);

    // Lógica Anti-Spam LocalStorage
    const COOLDOWN_TIME = 60000; // 1 minuto
    const storageKey = `download_limit_${id}_${url}`;
    const lastDownloadTime = localStorage.getItem(storageKey);
    const now = Date.now();

    // Abrir enlace en nueva pestaña inmediatamente (UX First)
    window.open(url, '_blank');

    if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) {
      console.log("Cooldown activo. No se cuenta la descarga.");
      return;
    }

    // Registrar en BD
    localStorage.setItem(storageKey, now.toString());
    await registerDownload(id, url);

    // Actualizar estado local para ver el contador subir en vivo
    setItem(prev => ({
      ...prev,
      descargas: prev.descargas.map(d =>
        d.url === url ? { ...d, count: (d.count || 0) + 1 } : d
      )
    }));
  };

  // Helper para números
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // Calcular total global
  const totalDownloads = item?.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  if (!item) return null;

  return (
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>

      {/* --- HERO HEADER (Fondo difuminado) --- */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-3xl">
        {/* Fondo Borroso */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 dark:opacity-30 scale-110"
          style={{ backgroundImage: `url(${item.imagen})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-light-bg dark:from-dark-bg via-transparent to-transparent"></div>

        {/* Botón Volver */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 md:top-6 left-4 md:left-6 p-3 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md text-gray-800 dark:text-white hover:scale-110 transition-transform z-10"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto -mt-44 md:-mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* --- IMAGEN PRINCIPAL (Izquierda) --- */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#2a2a2a] bg-gray-200">
              <img
                src={item.imagen}
                alt={item.titulo}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Botones de Acción Rápida (Móvil/Desktop) */}
            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm flex flex-col gap-2">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Descargas Disponibles</div>
              {item.descargas.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDownload(d.url)}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-300 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-black/20 rounded-lg">
                      {downloading === d.url ? <CheckCircle size={20} /> : <Download size={20} />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{d.label}</div>
                      <div className="text-xs opacity-70">{formatNumber(d.count || 0)} descargas</div>
                    </div>
                  </div>
                  <Download size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* --- INFO DETALLADA (Derecha) --- */}
          <div className="w-full md:w-2/3 flex flex-col gap-6 pt-2 md:pt-12">

            {/* Título y Metadatos */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                  {item.tipo}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verificado
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                {item.titulo}
              </h1>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Download size={18} className="text-primary-500" />
                  <span className="font-bold text-gray-900 dark:text-white">{formatNumber(totalDownloads)}</span> descargas
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={18} />
                  <span>{new Date(item.creado).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Creadores */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 w-fit">
              <div className="flex -space-x-3">
                {item.creadores && item.creadores.map((creador, i) => (
                  <Link to={`/u/${creador.nombre}`} key={i} className="relative hover:scale-110 transition-transform z-0 hover:z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#1e1e1e] overflow-hidden bg-gray-200">
                      <AvatarRenderer
                        avatar={creador.imagen}
                        name={creador.nombre}
                      />
                    </div>
                  </Link>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Creado por</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.creadores.map(c => c.nombre).join(', ')}
                </p>
              </div>
            </div>

            {/* Descripción */}
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acerca de este contenido</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.descripcion || "El creador no ha proporcionado una descripción detallada para este contenido, pero basándonos en las etiquetas y el título, parece ser una adición interesante para tu colección. ¡Descárgalo y pruébalo!"}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.tags && item.tags.map((tag, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                  <Tag size={14} /> {tag}
                </div>
              ))}
            </div>

            {/* Botón Compartir */}
            <div className="mt-4 py-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("¡Enlace copiado al portapapeles!");
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm font-semibold"
              >
                <Share2 size={18} />
                Compartir esta página
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleContenido;