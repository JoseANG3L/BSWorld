import React, { useState, useEffect } from 'react';
import { Upload, Compass, Package, Download, Users, Zap, Puzzle, Map, Gamepad2, Box, Archive, User, Users as UsersIcon, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicContent, getGlobalStats } from '../services/api';
import SubirMod from '../pages/SubirMod';

const Banner = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mods: 0,
    downloads: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSubirModOpen, setIsSubirModOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Usar getGlobalStats para obtener estadísticas reales como en AcercaDe
        const data = await getGlobalStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback a getPublicContent si getGlobalStats falla
        try {
          const contentData = await getPublicContent();
          const totalMods = contentData.length;
          const totalDownloads = contentData.reduce((acc, item) => {
            const downloads = item.descargas || [];
            return acc + downloads.reduce((sum, d) => sum + (d.count || 0), 0);
          }, 0);
          
          setStats({
            mods: totalMods,
            downloads: totalDownloads,
            users: Math.floor(totalDownloads * 0.3)
          });
        } catch (fallbackError) {
          console.error('Error fetching fallback stats:', fallbackError);
        }
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
    <div className="relative w-full h-auto md:h-[450px] lg:h-[500px] overflow-hidden">
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
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-2 md:px-8 lg:px-12 py-4 pb-5 md:py-12 lg:py-16">
        {/* Mobile Layout */}
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto md:hidden">
          {/* Title Section */}
          <div className="mb-4 animate-fade-in-up text-center" style={{ animationDuration: '300ms' }}>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-lg">
              BombSquad World
            </h1>
            <p className="text-base font-semibold text-white/90 tracking-wide">
              Un mundo lleno de mods
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2 mb-4 animate-fade-in-up w-full" style={{ animationDuration: '400ms' }}>
            <div className="flex justify-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/40 backdrop-blur-md text-white text-[10px] font-bold rounded-md border-2 border-primary-400 shadow-lg">
                <UsersIcon size={12} />
                Comunidad
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/40 backdrop-blur-md text-white text-[10px] font-bold rounded-md border-2 border-primary-400 shadow-lg">
                <Server size={12} />
                Servidores
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { name: 'complementos'},
                { name: 'mapas'},
                { name: 'minijuegos'},
                { name: 'modpacks'},
                { name: 'paquetes'},
                { name: 'personajes'}
              ].map((categoria) => {
                return (
                  <span
                    key={categoria.name}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-semibold rounded-md border border-white/20"
                  >
                    {categoria.name.charAt(0).toUpperCase() + categoria.name.slice(1)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-row gap-3 mb-4 animate-fade-in-up" style={{ animationDuration: '700ms' }}>
            <div className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Package size={16} className="text-white/80" />
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Mods</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg font-black text-white">{formatNumber(stats.mods)}</span>
              )}
            </div>

            <div className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Download size={16} className="text-white/80" />
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Descargas</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg font-black text-white">{formatNumber(stats.downloads)}</span>
              )}
            </div>

            <div className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users size={16} className="text-white/80" />
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Usuarios</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg font-black text-white">{formatNumber(stats.users)}</span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up w-full" style={{ animationDuration: '500ms' }}>
            <button
              onClick={() => setIsSubirModOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
            >
              <Upload size={18} strokeWidth={2.5} />
              <span>Subir Mod</span>
            </button>
            <button
              onClick={() => navigate('/mods')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm"
            >
              <Gamepad2 size={18} strokeWidth={2.5} />
              <span>Explorar Mods</span>
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-row items-center justify-between w-full">
          {/* Left Section - Info */}
          <div className="flex flex-col items-start text-left max-w-xl">
            {/* Title Section */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-lg">
                BombSquad World
              </h1>
              <p className="text-lg lg:text-xl font-semibold text-white/90 tracking-wide">
                Un mundo lleno de mods
              </p>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-3 mb-8 animate-fade-in-up w-full" style={{ animationDuration: '400ms' }}>
              <div className="flex justify-start gap-3">
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-primary-500/40 backdrop-blur-md text-white text-xs font-bold rounded-md border-2 border-primary-400 shadow-lg">
                  <UsersIcon size={12} />
                  Comunidad
                </span>
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-primary-500/40 backdrop-blur-md text-white text-xs font-bold rounded-md border-2 border-primary-400 shadow-lg">
                  <Server size={12} />
                  Servidores
                </span>
              </div>

              <div className="flex flex-wrap justify-start gap-2">
                {[
                  { name: 'complementos'},
                  { name: 'mapas'},
                  { name: 'minijuegos'},
                  { name: 'modpacks'},
                  { name: 'paquetes'},
                  { name: 'personajes'}
                ].map((categoria) => {
                  return (
                    <span
                      key={categoria.name}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-md border border-white/20"
                    >
                      {categoria.name.charAt(0).toUpperCase() + categoria.name.slice(1)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-row gap-4 animate-fade-in-up w-full" style={{ animationDuration: '500ms' }}>
              <button
                onClick={() => setIsSubirModOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-base"
              >
                <Upload size={20} strokeWidth={2.5} />
                <span>Subir Mod</span>
              </button>
              <button
                onClick={() => navigate('/mods')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-base"
              >
                <Gamepad2 size={20} strokeWidth={2.5} />
                <span>Explorar Mods</span>
              </button>
            </div>
          </div>

          {/* Right Section - Stats */}
          <div className="flex flex-row gap-6 animate-fade-in-up" style={{ animationDuration: '700ms' }}>
            {/* Mods Stat */}
            <div className="flex flex-col items-center p-3 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px] md:min-w-[140px]">
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Package size={16} className="text-white/80" />
                <span className="text-[10px] md:text-xs font-semibold text-white/70 uppercase tracking-wider">Mods</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.mods)}</span>
              )}
            </div>

            {/* Downloads Stat */}
            <div className="flex flex-col items-center p-3 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px] md:min-w-[140px]">
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Download size={16} className="text-white/80" />
                <span className="text-[10px] md:text-xs font-semibold text-white/70 uppercase tracking-wider">Descargas</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.downloads)}</span>
              )}
            </div>

            {/* Users Stat */}
            <div className="flex flex-col items-center p-3 md:p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-w-[80px] md:min-w-[140px]">
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Users size={16} className="text-white/80" />
                <span className="text-[10px] md:text-xs font-semibold text-white/70 uppercase tracking-wider">Usuarios</span>
              </div>
              {loading ? (
                <div className="w-10 h-5 bg-white/20 rounded animate-pulse" />
              ) : (
                <span className="text-lg md:text-2xl lg:text-3xl font-black text-white">{formatNumber(stats.users)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SUBIR MOD */}
      <SubirMod isOpen={isSubirModOpen} onClose={() => setIsSubirModOpen(false)} />
    </div>
  );
};

export default Banner;