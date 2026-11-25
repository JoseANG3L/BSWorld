import { useState, useEffect, lazy, Suspense } from 'react';
import { Upload, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGlobalStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// El formulario de subida es pesado (editor, galería, markdown): solo se carga
// cuando el usuario abre el modal, no en la carga inicial del inicio.
const SubirMod = lazy(() => import('../pages/SubirMod'));
import logoDark from '../assets/logo-dark.webp?no-inline';
import bannerMobile from '../assets/banner-mobile.webp';
import bannerDesktop from '../assets/banner-desktop.webp';

const metrics = [
  { key: 'mods', label: 'Mods' },
  { key: 'downloads', label: 'Descargas' },
  { key: 'users', label: 'Usuarios' },
];

const Banner = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
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
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num == null) return '—';
    if (!num) return '0';
    if (num >= 1000000) {
      const value = num / 1000000;
      return value < 10 ? value.toFixed(1) + 'M' : Math.floor(value) + 'M';
    }
    if (num >= 1000) {
      const value = num / 1000;
      return value < 10 ? value.toFixed(1) + 'K' : Math.floor(value) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Image */}
      <picture className="absolute inset-0" aria-hidden="true">
        <source media="(max-width: 767px)" srcSet={bannerMobile} />
        <img src={bannerDesktop} alt="" fetchPriority="high" width={1280} height={543} className="h-full w-full object-cover" />
      </picture>

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

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl justify-items-center gap-y-4 px-4 py-5 text-center
                      md:min-h-[280px] lg:min-h-[360px] md:grid-cols-[minmax(0,1fr)_auto] md:content-center md:items-center md:justify-items-start md:gap-x-8 md:gap-y-6 md:px-8 md:py-10 md:text-left lg:px-12">
        <div className="min-w-0">
          <img src={logoDark} width={2161} height={555} alt="BombSquad World"
            className="mx-auto -mt-2 mb-2 h-10 w-auto max-w-full object-contain drop-shadow-lg sm:h-12 md:mx-0 md:mb-4 md:h-16 lg:h-20" />
          <p className="text-base font-semibold tracking-wide text-white md:text-lg lg:text-xl">
            Un mundo lleno de mods para BombSquad
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-balance text-xs leading-relaxed text-primary-100 md:mx-0 md:text-sm">
            Complementos, mapas, minijuegos, modpacks, paquetes y personajes
          </p>
        </div>

        <dl aria-label="Estadísticas de la comunidad" aria-busy={loading}
          className="grid w-full max-w-sm grid-cols-3 divide-x divide-white/25 text-center md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto lg:min-w-96">
          {metrics.map(({ key, label }) => (
            <div key={key} className="flex flex-col-reverse items-center gap-1 px-2 md:px-3 lg:px-5">
              <dt className="text-xs font-medium text-primary-100 lg:text-sm">{label}</dt>
              <dd className="flex min-h-7 items-center justify-center text-2xl font-bold leading-none tracking-tight text-white tabular-nums md:min-h-9 md:text-3xl lg:text-4xl">
                {loading ? <LoadingSpinner variant="inline" size={20} /> : formatNumber(stats?.[key])}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex w-full flex-col gap-2 md:col-start-1 md:row-start-2 md:w-auto md:flex-row md:gap-4 mt-0 lg:mt-4">
          <button type="button" onClick={() => setIsSubirModOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-lg transition-colors hover:bg-white/90 md:px-7 md:py-3 md:text-base">
            <Upload size={16} strokeWidth={2.5} className="md:h-5 md:w-5" />
            Subir Mod
          </button>
          <button type="button" onClick={() => navigate('/mods')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 md:px-7 md:py-3 md:text-base">
            <Gamepad2 size={16} strokeWidth={2.5} className="md:h-5 md:w-5" />
            Explorar Mods
          </button>
        </div>
      </div>

      {/* MODAL SUBIR MOD */}
      {isSubirModOpen && (
        <Suspense fallback={null}>
          <SubirMod isOpen={isSubirModOpen} onClose={() => setIsSubirModOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Banner;
