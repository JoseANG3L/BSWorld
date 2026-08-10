import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Boxes, Flame, Trophy, ArrowRight, ArrowLeft, Loader2, Heart } from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Card from '../components/Card.jsx';
import { getPublicContent } from '../services/api'; 

const Inicio = () => {
  const navigate = useNavigate();
  const [novedades, setNovedades] = useState([]);
  const [topMods, setTopMods] = useState([]);
  const [topFavoritos, setTopFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. ESTADOS PARA CONTROLAR LA VISIBILIDAD DE LAS FLECHAS
  const [showLeftArrowNovedades, setShowLeftArrowNovedades] = useState(false);
  const [showRightArrowNovedades, setShowRightArrowNovedades] = useState(false);
  const [showLeftArrowTop, setShowLeftArrowTop] = useState(false);
  const [showRightArrowTop, setShowRightArrowTop] = useState(false);
  const [showLeftArrowFav, setShowLeftArrowFav] = useState(false);
  const [showRightArrowFav, setShowRightArrowFav] = useState(false);
  
  const novedadesSliderRef = useRef(null);
  const topSliderRef = useRef(null);
  const favoritosSliderRef = useRef(null);

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

        // Top Favoritos: ordenar por likes_count
        const sortedByLikes = [...allContent].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        const itemsForFavoritos = sortedByLikes.slice(0, 10);
        setTopFavoritos(itemsForFavoritos);

        // Verificación inicial de flechas tras cargar los datos
        setTimeout(() => {
          checkScrollPositionNovedades();
          checkScrollPositionTop();
          checkScrollPositionFav();
        }, 100);

      } catch (error) {
        console.error("Error cargando datos de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // 2. LÓGICA DE CÁLCULO DE VISIBILIDAD DE SCROLL
  const checkScrollPositionNovedades = () => {
    if (novedadesSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = novedadesSliderRef.current;
      setShowLeftArrowNovedades(scrollLeft > 5);
      setShowRightArrowNovedades(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const checkScrollPositionTop = () => {
    if (topSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = topSliderRef.current;
      setShowLeftArrowTop(scrollLeft > 5);
      setShowRightArrowTop(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const checkScrollPositionFav = () => {
    if (favoritosSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = favoritosSliderRef.current;
      setShowLeftArrowFav(scrollLeft > 5);
      setShowRightArrowFav(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Escuchar redimensionados de pantalla para recalcular flechas
  useEffect(() => {
    window.addEventListener('resize', checkScrollPositionNovedades);
    window.addEventListener('resize', checkScrollPositionTop);
    window.addEventListener('resize', checkScrollPositionFav);
    return () => {
      window.removeEventListener('resize', checkScrollPositionNovedades);
      window.removeEventListener('resize', checkScrollPositionTop);
      window.removeEventListener('resize', checkScrollPositionFav);
    };
  }, [novedades, topMods, topFavoritos]);

  const scrollNovedades = (direction) => {
    if (novedadesSliderRef.current) {
      const { scrollLeft, clientWidth } = novedadesSliderRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      novedadesSliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const scrollTop = (direction) => {
    if (topSliderRef.current) {
      const { scrollLeft, clientWidth } = topSliderRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      topSliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const scrollFav = (direction) => {
    if (favoritosSliderRef.current) {
      const { scrollLeft, clientWidth } = favoritosSliderRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      favoritosSliderRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <div className="flex flex-col animate-fade-in-up shadow-sm" style={{ animationDuration: '200ms' }}>
      
      {/* BANNER PRINCIPAL */}
      <Banner />
      
      <div className="flex flex-col px-2 md:px-4 py-8 md:py-6 space-y-5">
        
        {/* --- SECCIÓN: NOVEDADES RECIENTES --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <button
              onClick={() => novedades.length > 0 && navigate(`/view/${novedades[0].id}`)}
              className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <Flame size={20} className="text-red-600 dark:text-red-500" /> Últimas Novedades
            </button>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrowNovedades && (
                <button 
                  onClick={() => scrollNovedades('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrowNovedades && (
                <button 
                  onClick={() => scrollNovedades('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la derecha"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor Horizontal Deslizable con detector onScroll */}
          <div 
            ref={novedadesSliderRef}
            onScroll={checkScrollPositionNovedades}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 custom-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {novedades.map((item, index) => (
              <div key={item.id} className="relative group/top-card shrink-0 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] snap-start">
                {/* <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center z-30 border border-gray-200 dark:border-gray-800 group-hover/top-card:scale-115 transition-transform">
                  #{index + 1}
                </div> */}
                <Card {...item} />
              </div>
            ))}

            <Link
              to="/mods?sort=recientes"
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
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
            <button
              onClick={() => topMods.length > 0 && navigate(`/view/${topMods[0].id}`)}
              className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-500" /> Top 10 Más Descargados
            </button>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrowTop && (
                <button 
                  onClick={() => scrollTop('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrowTop && (
                <button 
                  onClick={() => scrollTop('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
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
            onScroll={checkScrollPositionTop}
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
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
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
            <button
              onClick={() => topFavoritos.length > 0 && navigate(`/view/${topFavoritos[0].id}`)}
              className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <Heart size={20} className="text-pink-600 dark:text-pink-500" /> Top 10 Favoritos
            </button>
            
            {/* 👇 BOTONES CONDICIONALES ANIMADOS */}
            <div className="flex gap-1.5 z-10 min-h-[36px]">
              {showLeftArrowFav && (
                <button 
                  onClick={() => scrollFav('left')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la izquierda"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
              )}
              {showRightArrowFav && (
                <button 
                  onClick={() => scrollFav('right')} 
                  className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-all shadow-sm animate-fade-in"
                  title="Desplazar a la derecha"
                >
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor Horizontal Deslizable con detector onScroll */}
          <div 
            ref={favoritosSliderRef}
            onScroll={checkScrollPositionFav}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 custom-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topFavoritos.map((item, index) => (
              <div key={item.id} className="relative group/top-card shrink-0 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] snap-start">
                {/* <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center z-30 border border-gray-200 dark:border-gray-800 group-hover/top-card:scale-115 transition-transform">
                  #{index + 1}
                </div> */}
                <Card {...item} />
              </div>
            ))}

            <Link 
              to="/mods?sort=mas_likes"
              className="group flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-lg p-6 w-[280px] sm:w-[300px] md:w-[240px] lg:w-[260px] xl:w-[280px] shrink-0 snap-start transition-all duration-300 shadow-sm relative"
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