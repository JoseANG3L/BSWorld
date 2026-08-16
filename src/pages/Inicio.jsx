import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Boxes, Flame, Trophy, ArrowRight, Loader2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Card from '../components/Card.jsx';
import { getPublicContent } from '../services/api';

// Hook para scroll con botones de navegación
const useScrollNavigation = () => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return {
    scrollRef,
    scrollLeft,
    scrollRight
  };
};

const Inicio = () => {
  const navigate = useNavigate();
  const [novedades, setNovedades] = useState([]);
  const [topMods, setTopMods] = useState([]);
  const [topFavoritos, setTopFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hooks para scroll con navegación en cada sección
  const novedadesScroll = useScrollNavigation();
  const topModsScroll = useScrollNavigation();
  const topFavoritosScroll = useScrollNavigation();

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



      } catch (error) {
        console.error("Error cargando datos de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <div className="flex flex-col animate-fade-in-up shadow-sm" style={{ animationDuration: '200ms' }}>
      
      {/* BANNER PRINCIPAL */}
      <Banner />
      
      <div className="flex flex-col px-2 md:px-4 py-8 md:py-6 space-y-6">
        
        {/* --- SECCIÓN: NOVEDADES RECIENTES --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3.5 md:mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame size={20} className="text-red-600 dark:text-red-500" /> Últimas Novedades
            </div>
            
            <Link to="/mods?sort=recientes"
              className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-[#1e1e1e] dark:hover:bg-[#2a2a2a] text-white transition-all shadow-sm active:scale-95"
            >
              <span className="md:block hidden pl-1 text-sm font-semibold">Ver todos</span>
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>

          {/* Contenedor Scroll Horizontal con Navegación */}
          <div className="relative group/scroll">
            <div className="hidden md:block absolute z-10 left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={novedadesScroll.scrollLeft}
              className="absolute z-10 left-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronLeft size={26} className="text-white" />
            </button>
            
            <div 
              ref={novedadesScroll.scrollRef}
              className="flex overflow-x-auto gap-2 md:gap-3 scrollbar-hide scroll-smooth px-0 md:px-14"
            >
              {novedades.map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-[300px]">
                  <Card {...item} />
                </div>
              ))}
            </div>
            
            <div className="hidden md:block absolute z-10 right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={novedadesScroll.scrollRight}
              className="absolute z-10 right-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronRight size={26} className="text-white" />
            </button>
          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 MODS --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3.5 md:mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-500" /> Top 10 Más Descargados
            </div>
            
            <Link to="/mods?sort=mas_descargas"
              className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-[#1e1e1e] dark:hover:bg-[#2a2a2a] text-white transition-all shadow-sm active:scale-95"
            >
              <span className="md:block hidden pl-1 text-sm font-semibold">Ver todos</span>
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>

          {/* Contenedor Scroll Horizontal con Navegación */}
          <div className="relative group/scroll">
            <div className="hidden md:block absolute z-10 left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={topModsScroll.scrollLeft}
              className="absolute z-10 left-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronLeft size={26} className="text-white" />
            </button>
            
            <div 
              ref={topModsScroll.scrollRef}
              className="flex overflow-x-auto gap-2 md:gap-3 scrollbar-hide scroll-smooth px-0 md:px-14"
            >
              {topMods.map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-[300px]">
                  <Card {...item} />
                </div>
              ))}
            </div>
            
            <div className="hidden md:block absolute z-10 right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={topModsScroll.scrollRight}
              className="absolute z-10 right-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronRight size={26} className="text-white" />
            </button>
          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 FAVORITOS --- */}
        <div className="flex flex-col pb-2 md:pb-4 relative">
          <div className="flex justify-between items-center mb-3.5 md:mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Heart size={20} className="text-pink-600 dark:text-pink-500" /> Top 10 Favoritos
            </div>
            
            <Link to="/mods?sort=mas_likes"
              className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-[#1e1e1e] dark:hover:bg-[#2a2a2a] text-white transition-all shadow-sm active:scale-95"
            >
              <span className="md:block hidden pl-1 text-sm font-semibold">Ver todos</span>
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>

          {/* Contenedor Scroll Horizontal con Navegación */}
          <div className="relative group/scroll">
            <div className="hidden md:block absolute z-10 left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={topFavoritosScroll.scrollLeft}
              className="absolute z-10 left-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronLeft size={26} className="text-white" />
            </button>
            
            <div 
              ref={topFavoritosScroll.scrollRef}
              className="flex overflow-x-auto gap-2 md:gap-3 scrollbar-hide scroll-smooth px-0 md:px-14"
            >
              {topFavoritos.map((item, index) => (
                <div key={item.id} className="flex-shrink-0 w-[300px]">
                  <Card {...item} />
                </div>
              ))}
            </div>
            
            <div className="hidden md:block absolute z-10 right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent dark:from-dark-bg dark:to-transparent pointer-events-none"></div>
            <button
              onClick={topFavoritosScroll.scrollRight}
              className="absolute z-10 right-0 top-0 bottom-0 hidden md:flex w-12 items-center justify-center bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300"
            >
              <ChevronRight size={26} className="text-white" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Inicio;