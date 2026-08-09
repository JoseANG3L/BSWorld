import React, { useState, useEffect } from 'react';
import { Upload, Compass, Package, Download, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicContent } from '../services/api';

const Banner = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mods: 0,
    downloads: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getPublicContent();
        
        // Calcular estadísticas
        const totalMods = data.length;
        const totalDownloads = data.reduce((acc, item) => {
          const downloads = item.descargas || [];
          return acc + downloads.reduce((sum, d) => sum + (d.count || 0), 0);
        }, 0);
        
        // Simular usuarios (en un caso real vendría de una API de usuarios)
        const totalUsers = Math.floor(totalDownloads * 0.3); // Estimación aproximada
        
        setStats({
          mods: totalMods,
          downloads: totalDownloads,
          users: totalUsers
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="relative w-full h-96 md:h-[450px] lg:h-[500px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/bannerbsworld.png)' }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-primary-900/80" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Left Section - Info */}
        <div className="flex flex-col items-start text-left max-w-xl mb-8 md:mb-0">
          {/* Title Section */}
          <div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-3 md:mb-4 drop-shadow-lg">
              BombSquad World
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-semibold text-white/90 tracking-wide">
              Un mundo lleno de mods
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6 md:mb-8 animate-fade-in-up" style={{ animationDuration: '400ms' }}>
            {['complementos', 'mapas', 'minijuegos', 'modpacks', 'paquetes', 'personajes'].map((categoria) => (
              <button
                key={categoria}
                onClick={() => navigate(`/mods?tipo=${categoria}`)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-md text-white text-xs md:text-sm font-semibold rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all hover:scale-105 active:scale-95"
              >
                {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 animate-fade-in-up" style={{ animationDuration: '500ms' }}>
            <button
              onClick={() => navigate('/subir-mod')}
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Upload size={20} strokeWidth={2.5} />
              <span className="text-sm md:text-base">Subir Mod</span>
            </button>
            <button
              onClick={() => navigate('/mods')}
              className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Compass size={20} strokeWidth={2.5} />
              <span className="text-sm md:text-base">Explorar Mods</span>
            </button>
          </div>
        </div>

        {/* Right Section - Stats */}
        <div className="flex flex-row gap-4 md:gap-6 animate-fade-in-up" style={{ animationDuration: '700ms' }}>
          {/* Mods Stat */}
          <div className="flex flex-col items-center p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[100px] md:min-w-[140px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package size={20} className="text-white/80" />
              <span className="text-xs md:text-sm font-semibold text-white/70 uppercase tracking-wider">Mods</span>
            </div>
            {loading ? (
              <div className="w-12 h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              <span className="text-xl md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.mods)}</span>
            )}
          </div>

          {/* Downloads Stat */}
          <div className="flex flex-col items-center p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[100px] md:min-w-[140px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Download size={20} className="text-white/80" />
              <span className="text-xs md:text-sm font-semibold text-white/70 uppercase tracking-wider">Descargas</span>
            </div>
            {loading ? (
              <div className="w-12 h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              <span className="text-xl md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.downloads)}</span>
            )}
          </div>

          {/* Users Stat */}
          <div className="flex flex-col items-center p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[100px] md:min-w-[140px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={20} className="text-white/80" />
              <span className="text-xs md:text-sm font-semibold text-white/70 uppercase tracking-wider">Usuarios</span>
            </div>
            {loading ? (
              <div className="w-12 h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              <span className="text-xl md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.users)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;