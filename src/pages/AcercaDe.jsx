import React, { useState, useEffect } from 'react';
import InfoPage, { InfoBack, InfoHero } from '../components/InfoPage';
import { Heart, Code, Globe, Shield, Zap, Coffee, Github, Twitter, Users, Download, FileCode, Server, Facebook, Instagram, Youtube, Twitch } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer'; 
// IMPORTAMOS LA FUNCIÓN DEL API
import { getGlobalStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// --- SUB-COMPONENTES ---

const StatCard = ({ icon: Icon, value, label, color, loading }) => (
  <div className="flex min-w-0 flex-col items-center justify-center py-2">
    <div className={clsx("p-2 rounded-lg mb-2 bg-opacity-10", color.bg, color.text)}>
      {React.createElement(Icon, { size: 20, "aria-hidden": true })}
    </div>
    {loading ? (
        <LoadingSpinner variant="inline" size={24} />
    ) : (
        <span className="text-xl md:text-2xl font-bold tabular-nums text-gray-900 dark:text-white mb-1 animate-fade-in-up">
            {value}
        </span>
    )}
    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{label}</span>
  </div>
);

const TechBadge = ({ label }) => (
  <span className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-medium">
    {label}
  </span>
);

const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 shrink-0 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
      {React.createElement(Icon, { size: 24, "aria-hidden": true })}
    </div>
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const AcercaDe = () => {
  // ESTADO PARA LAS ESTADÍSTICAS
  const [stats, setStats] = useState({ users: null, downloads: null, mods: null });
  const [loadingStats, setLoadingStats] = useState(true);

  // CARGAR DATOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(await getGlobalStats());
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Formateador de números (ej: 1200 -> 1.2k)
  const formatNumber = (num) => {
    if (num == null) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <InfoPage wide>
      <InfoBack />
      <InfoHero icon={Globe} title="Construyendo el futuro de BSWorld"
        desc="Somos una comunidad dedicada a recopilar, actualizar y compartir los mejores mods para BombSquad. Creemos un espacio abierto, seguro y lleno de creatividad." />

      {/* --- BARRA DE ESTADÍSTICAS (CON DATOS REALES) --- */}
      <div className="mb-6 grid grid-cols-2 gap-y-3 border-b border-gray-200 pb-5 dark:border-gray-800 sm:grid-cols-4">
        <StatCard 
            icon={Users} 
            value={formatNumber(stats.users)} 
            label="Usuarios" 
            color={{ bg: 'bg-blue-500', text: 'text-blue-500' }} 
            loading={loadingStats}
        />
        <StatCard 
            icon={Download} 
            value={formatNumber(stats.downloads)} 
            label="Descargas" 
            color={{ bg: 'bg-green-500', text: 'text-green-500' }} 
            loading={loadingStats}
        />
        <StatCard 
            icon={FileCode} 
            value={formatNumber(stats.mods)}
            label="Mods Publicados" 
            color={{ bg: 'bg-purple-500', text: 'text-purple-500' }} 
            loading={loadingStats}
        />
        <StatCard 
            icon={Server} 
            value="99.9%" 
            label="Activo" 
            color={{ bg: 'bg-orange-500', text: 'text-orange-500' }} 
            loading={false} // Uptime suele ser estático o de otro servicio
        />
      </div>

      {/* --- CONTENIDO PRINCIPAL (GRID) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Misión y Valores */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="text-primary-600" />
              Nuestra Filosofía
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem 
                icon={Shield} 
                title="Seguridad Primero" 
                desc="Analizamos cada archivo en busca de malware. Si no es seguro para nosotros, no lo es para ti." 
              />
              <FeatureItem 
                icon={Zap} 
                title="Sin Bloatware" 
                desc="Descargas directas. Odiamos los acortadores con 50 pop-ups tanto como tú." 
              />
              <FeatureItem 
                icon={Code} 
                title="Open Source" 
                desc="Creemos en la transparencia. Parte de nuestro código está disponible para la comunidad." 
              />
              <FeatureItem 
                icon={Heart} 
                title="Comunidad" 
                desc="Impulsado por creadores apasionados. Todo el contenido es mérito de sus autores." 
              />
            </div>
          </div>

          {/* Stack Tecnológico */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Stack Tecnológico
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-6">
              BSWorld está construido con tecnologías modernas para garantizar velocidad, SEO y una experiencia de usuario fluida (SPA).
            </p>
            <div className="flex flex-wrap gap-2">
              {['React 18', 'Vite', 'Tailwind CSS', 'Firebase', 'Firestore', 'React Router', 'Lucide Icons', 'Netlify'].map(tech => (
                <TechBadge key={tech} label={tech} />
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (1/3) */}
        <div className="flex flex-col gap-4 md:gap-6">
          
          {/* Card del Creador */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6 text-center relative overflow-hidden group">
            
            <div className="relative z-10">
              {/* Avatar Container */}
              <div className="mx-auto mb-3 h-20 w-20">
                 <div className="w-full h-full rounded-full overflow-hidden">
                    <AvatarRenderer 
                        avatar="https://yt3.googleusercontent.com/x70TGBZqG4aVeiRw5ZeYxc3mkVyHtCFQ_5qphjeJaqVhYkpWZ517Xu7y69_0iOlkIhdj2VZFCVg=s900-c-k-c0x00ffffff-no-rj" 
                        name="byANG3L"
                    />
                 </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Admin BSWorld</h3>
              <p className="text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-4">Lead Developer</p>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 italic px-4">
                "Mi objetivo es crear la plataforma que siempre quise tener cuando empecé a jugar."
              </p>

              <div className="flex justify-center gap-2 flex-wrap">
                <a href="https://www.facebook.com/jose.angel.625627/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-[#4267B2] hover:text-white transition-all hover:-translate-y-1" aria-label="Facebook"><Facebook size={18} /></a>
                <a href="https://github.com/JoseANG3L" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white transition-all hover:-translate-y-1" aria-label="GitHub"><Github size={18} /></a>
                <a href="https://www.instagram.com/ijoseang3l/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-[#E1306C] hover:text-white transition-all hover:-translate-y-1" aria-label="Instagram"><Instagram size={18} /></a>
                <a href="https://www.twitch.tv/ijoseang3l" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-[#9146FF] hover:text-white transition-all hover:-translate-y-1" aria-label="Twitch"><Twitch size={18} /></a>
                <a href="https://x.com/byANG3L_HD" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-[#1DA1F2] hover:text-white transition-all hover:-translate-y-1" aria-label="X"><Twitter size={18} /></a>
                <a href="https://www.youtube.com/c/@JoseANG3LYT" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 hover:bg-[#FF0000] hover:text-white transition-all hover:-translate-y-1" aria-label="YouTube"><Youtube size={18} /></a>
              </div>
            </div>
          </div>

          {/* Card de Apoyo */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-transparent dark:bg-dark-surface md:p-6 text-center text-gray-900 dark:text-white">
            
            <Heart size={24} className="mx-auto mb-3 text-rose-500" fill="currentColor" />
            <h3 className="text-xl font-bold mb-2">Apoya el Proyecto</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
              Mantener los servidores y el desarrollo cuesta tiempo y café. Si te gusta BSWorld, considera apoyarnos.
            </p>
            <a 
              href="https://www.buymeacoffee.com/joseang3l" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Coffee size={20} />
              Invítame un Café
            </a>
          </div>

        </div>
      </div>

      {/* FOOTER PEQUEÑO */}
      <div className="text-center pt-8 border-t border-gray-100 dark:border-gray-800 mt-4">
        <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} BSWorld - Un mundo lleno de mods. <br className="md:hidden"/> Hecho con <span className="text-red-500">❤</span> y bombas.
        </p>
      </div>

    </InfoPage>
  );
};

export default AcercaDe;
