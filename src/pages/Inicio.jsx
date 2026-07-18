import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Boxes, Flame, Trophy, ArrowRight, ArrowLeft, Loader2, Heart } from 'lucide-react';
import Carousel from '../components/Carousel.jsx';
import Card from '../components/Card.jsx';
import { getPublicContent } from '../services/api'; 

const Inicio = () => {
  const navigate = useNavigate();
  const [novedades, setNovedades] = useState([]);
  const [topMods, setTopMods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. ESTADOS PARA CONTROLAR LA VISIBILIDAD DE LAS FLECHAS
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  const topSliderRef = useRef(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const allContent = await getPublicContent();
        
        // Novedades: 4 más recientes
        const sortedByDate = [...allContent].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setNovedades(sortedByDate.slice(0, 10));

        // Top Mods: 9 elementos + 1 tarjeta de ver más = 10 totales
        const totalDescargas = (item) => (item.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
        const sortedByDownloads = allContent.sort((a, b) => totalDescargas(b) - totalDescargas(a));
        const itemsForTop = sortedByDownloads.slice(0, 10);
        setTopMods(itemsForTop);

        // Verificación inicial de flechas tras cargar los datos
        setTimeout(() => checkScrollPosition(), 100);

      } catch (error) {
        console.error("Error cargando datos de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // 2. LÓGICA DE CÁLCULO DE VISIBILIDAD DE SCROLL
  const checkScrollPosition = () => {
    if (topSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = topSliderRef.current;
      
      // Muestra la flecha izquierda si el scroll se ha movido más de 5px hacia la derecha
      setShowLeftArrow(scrollLeft > 5);
      
      // Muestra la flecha derecha si lo que queda por recorrer es mayor que el contenedor visible
      // Restamos un margen sutil de 5px por discrepancias de redondeo en pantallas de alta densidad
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Escuchar redimensionados de pantalla para recalcular flechas
  useEffect(() => {
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [topMods]);

  const scroll = (direction) => {
    if (topSliderRef.current) {
      const { scrollLeft, clientWidth } = topSliderRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      topSliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <div className="flex flex-col animate-fade-in-up shadow-sm" style={{ animationDuration: '200ms' }}>
      
      {/* CARRUSEL PRINCIPAL */}
      <Carousel title="" limit={9} />
      
      <div className="flex flex-col px-2 md:px-4 py-8 md:py-6 space-y-5">
        
        {/* --- SECCIÓN: NOVEDADES RECIENTES --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame size={20} className="text-red-600 dark:text-red-500" /> Últimas Novedades
            </h2>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrow && (
                <button 
                  onClick={() => scroll('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrow && (
                <button 
                  onClick={() => scroll('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la derecha"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor Horizontal Deslizable con detector onScroll */}
          <div 
            ref={topSliderRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 custom-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topMods.map((item, index) => (
              <div key={item.id} className="relative group/top-card shrink-0 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] snap-start">
                {/* <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center z-30 border border-gray-200 dark:border-gray-800 group-hover/top-card:scale-115 transition-transform">
                  #{index + 1}
                </div> */}
                <Card {...item} />
              </div>
            ))}

            <Link
              to="/mods?sort=recientes"
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-800 rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
            >
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
                
                {/* Texto limpio y moderno */}
                <div className="space-y-1">
                  <span className="block text-sm font-extrabold text-gray-800 dark:text-gray-200 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Ver más contenido
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 font-medium px-2 leading-normal">
                    Explora el catálogo completo y descubre más modificaciones.
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 MODS --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-500" /> Top 10 Más Descargados
            </h2>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrow && (
                <button 
                  onClick={() => scroll('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrow && (
                <button 
                  onClick={() => scroll('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la derecha"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor Horizontal Deslizable con detector onScroll */}
          <div 
            ref={topSliderRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 custom-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topMods.map((item, index) => (
              <div key={item.id} className="relative group/top-card shrink-0 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] snap-start">
                {/* <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center z-30 border border-gray-200 dark:border-gray-800 group-hover/top-card:scale-115 transition-transform">
                  #{index + 1}
                </div> */}
                <Card {...item} />
              </div>
            ))}

            <Link 
              to="/mods?sort=mas_descargas"
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-800 rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
            >
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
                
                {/* Texto limpio y moderno */}
                <div className="space-y-1">
                  <span className="block text-sm font-extrabold text-gray-800 dark:text-gray-200 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Ver más contenido
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 font-medium px-2 leading-normal">
                    Explora el catálogo completo y descubre más modificaciones.
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 FAVORITOS --- */}
        <div className="flex flex-col pb-2 md:pb-4 relative">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Heart size={20} className="text-pink-600 dark:text-pink-500" /> Top 10 Favoritos
            </h2>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrow && (
                <button 
                  onClick={() => scroll('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrow && (
                <button 
                  onClick={() => scroll('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la derecha"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor Horizontal Deslizable con detector onScroll */}
          <div 
            ref={topSliderRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 custom-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topMods.map((item, index) => (
              <div key={item.id} className="relative group/top-card shrink-0 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] snap-start">
                {/* <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center z-30 border border-gray-200 dark:border-gray-800 group-hover/top-card:scale-115 transition-transform">
                  #{index + 1}
                </div> */}
                <Card {...item} />
              </div>
            ))}

            <Link 
              to="/mods?sort=mas_descargas"
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-800 rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
            >
              <div className="flex flex-col items-center gap-3 z-10">
                <div className="w-11 h-11 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
                
                {/* Texto limpio y moderno */}
                <div className="space-y-1">
                  <span className="block text-sm font-extrabold text-gray-800 dark:text-gray-200 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Ver más contenido
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 font-medium px-2 leading-normal">
                    Explora el catálogo completo y descubre más modificaciones.
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Inicio;