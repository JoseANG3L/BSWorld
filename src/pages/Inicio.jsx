import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Boxes, Flame, Trophy, ArrowRight, Loader2, Heart } from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Card from '../components/Card.jsx';
import { getPublicContent } from '../services/api'; 

const Inicio = () => {
  const navigate = useNavigate();
  const [novedades, setNovedades] = useState([]);
  const [topMods, setTopMods] = useState([]);
  const [topFavoritos, setTopFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <div className="flex justify-between items-center mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame size={20} className="text-red-600 dark:text-red-500" /> Últimas Novedades
            </div>
            
            <Link to="/mods?sort=recientes"
              className="p-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white transition-all shadow-sm active:scale-95"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Contenedor Grid Responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {novedades.map((item, index) => (
              <div key={item.id} className="relative group/top-card">
                <Card {...item} />
              </div>
            ))}

          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 MODS --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-500" /> Top 10 Más Descargados
            </div>
            
            <Link to="/mods?sort=mas_descargas"
              className="p-1.5 flex items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white transition-all shadow-sm active:scale-95"
            >
              <span className="md:block hidden pl-1 text-md font-semibold">Ver todos</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Contenedor Grid Responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {topMods.map((item, index) => (
              <div key={item.id} className="relative group/top-card">
                <Card {...item} />
              </div>
            ))}

          </div>
        </div>

        {/* --- SECCIÓN: TOP 10 FAVORITOS --- */}
        <div className="flex flex-col pb-2 md:pb-4 relative">
          <div className="flex justify-between items-center mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Heart size={20} className="text-pink-600 dark:text-pink-500" /> Top 10 Favoritos
            </div>
            
            <Link to="/mods?sort=mas_likes"
              className="p-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white transition-all shadow-sm active:scale-95"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Contenedor Grid Responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {topFavoritos.map((item, index) => (
              <div key={item.id} className="relative group/top-card">
                <Card {...item} />
              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  );
};

export default Inicio;