import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicContent } from '../services/api';
import { clsx } from 'clsx';

const Carousel = ({ title, limit = 6, tipo = null, autoPlayInterval = 5000 }) => {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getPublicContent();
        const filtered = tipo 
          ? data.filter(item => item.tipo === tipo)
          : data;
        setItems(filtered.slice(0, limit));
      } catch (error) {
        console.error('Error fetching carousel items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [limit, tipo]);

  // Auto-play seguro con reset al cambiar manualmente
  useEffect(() => {
    if (loading || items.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [loading, items.length, autoPlayInterval, isPaused, currentIndex]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[40vh] md:min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );

  if (items.length === 0) return null;

  return (
    <div 
      className="flex flex-col animate-fade-in-up w-full overflow-hidden relative"
      style={{ animationDuration: '200ms' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[280px] md:h-[380px] w-full group">
        
        {/* IMÁGENES CON ANIMACIÓN DE DESVANECIMIENTO ABSOLUTO */}
        {items.map((item, index) => (
          <div
            key={item.id}
            className={clsx(
              "absolute inset-0 w-full h-full transition-all duration-700 ease-in-out",
              index === currentIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
            )}
          >
            <img
              src={item.imagen || '/default.jpg'}
              alt={item.titulo}
              className="w-full h-full object-cover select-none"
              onError={(e) => { e.target.src = '/default.jpg'; }}
            />
          </div>
        ))}

        {/* OVERLAY GRADIENTE PREMIUM (TRES NIVELES DE PROFUNDIDAD) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent z-20 hidden md:block" />

        {/* CONTENIDO FLUIDO */}
        {items.map((item, index) => index === currentIndex && (
          <div 
            key={`content-${item.id}`} 
            className="absolute inset-0 flex flex-col justify-end p-2 md:p-4 py-4 md:py-6 z-30 animate-fade-in"
            style={{ animationDuration: '400ms' }}
          >
            <div className="max-w-xl space-y-2 md:space-y-3">
              {/* Categoría + Vistas en Fila */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white bg-primary-600 rounded-lg shadow-sm">
                  {item.tipo || 'complemento'}
                </span>
                {/* <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-white/70 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/5">
                  <Eye size={12} className="text-primary-400" /> {formatNumber(item.vistas || 0)}
                </span> */}
              </div>

              {/* Título de Mod */}
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-1">
                {item.titulo}
              </h3>

              {/* Creadores Integrados Estilo Badges */}
              {item.creadores && item.creadores.length > 0 && (
                <div className="flex items-center gap-1.5 text-white/90 text-xs">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-wide">Por:</span>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(item.creadores) ? item.creadores : [item.creadores]).slice(0, 2).map((creador, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/5 rounded-md text-[11px] font-bold tracking-wide">
                        {typeof creador === 'object' ? creador.nombre : creador}
                      </span>
                    ))}
                    {(Array.isArray(item.creadores) ? item.creadores : [item.creadores]).length > 2 && (
                      <span className="px-1.5 py-0.5 bg-white/5 text-white/60 rounded-md text-[10px] font-bold">
                        +{item.creadores.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Etiquetas Compactas */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-md">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-black/40 text-white/60 text-[10px] font-semibold uppercase tracking-wider rounded border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Botón CTA Premium */}
              <div className="pt-1">
                <button
                  onClick={() => navigate(`/view/${item.id}`)}
                  className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-primary-600/20 active:scale-[0.98]"
                >
                  <Info size={15} strokeWidth={2.5} />
                  Explorar Mod
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* FLECHAS DE NAVEGACIÓN SIMÉTRICAS (Visibles en Hover de escritorio) */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/70 text-white border border-white/5 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 z-40 hidden md:block"
          aria-label="Anterior mod"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/70 text-white border border-white/5 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 z-40 hidden md:block"
          aria-label="Siguiente mod"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

        {/* INDICADORES DE BARRA ESTILO STREAMING (Z-INDEX SUPERIOR) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                currentIndex === index 
                  ? 'bg-primary-500 w-8 shadow-sm shadow-primary-500/50' 
                  : 'bg-white/30 hover:bg-white/60 w-2.5'
              )}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;