import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import Banner from '../components/Banner.jsx';
import Card from '../components/Card.jsx';
import { CardSkeleton } from '../components/CardSkeleton.jsx';
import { getPublicContent, prefetchUserProfiles } from '../services/api';

const Inicio = () => {
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const allContent = await getPublicContent();

        // Novedades: más recientes (ya vienen ordenadas por `creado desc`)
        const sortedByDate = [...allContent].sort((a, b) => new Date(b.creado) - new Date(a.creado));
        setNovedades(sortedByDate);

        // Avatares en segundo plano: una sola consulta en vez de una por tarjeta
        const uids = sortedByDate.flatMap((item) => {
          const fromList = Array.isArray(item.creadores) ? item.creadores : [item.creadores];
          return [...fromList, item.aporte].map((c) => (typeof c === 'string' ? c : c?.uid || c?.id)).filter(Boolean);
        });
        prefetchUserProfiles(uids);
      } catch (error) {
        console.error("Error cargando datos de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // La página (Banner + cabecera) se muestra al instante;
  // solo las tarjetas esperan a los datos (esqueleto intermedio)
  return (
    <div className="flex flex-col animate-fade-in-up shadow-sm" style={{ animationDuration: '200ms' }}>

      {/* BANNER PRINCIPAL */}
      <Banner />

      <div className="flex flex-col px-2 md:px-4 py-5 md:py-7">

        {/* --- SECCIÓN: ÚLTIMOS MODS --- */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3.5 md:mb-5">
            <div className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              <Flame size={20} className="text-red-600 dark:text-red-500" /> Últimos Mods
            </div>

            <Link to="/mods?sort=recientes"
              className="px-3 py-1.5 flex items-center gap-1.5 border border-gray-300 dark:border-transparent rounded-lg bg-gray-50 hover:bg-gray-200 dark:bg-[#1e1e1e] dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-white transition-all shadow-sm active:scale-95"
            >
              <span className="md:block hidden pl-1 text-sm font-semibold">Ver todos</span>
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>

          {/* Grid de cards o esqueletos */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {novedades.map((item, i) => (
                <Card key={item.id} {...item} priority={i < 4} />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Inicio;