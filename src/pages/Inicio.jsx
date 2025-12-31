import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Gamepad2, Wrench, Boxes, Package, ArrowRight, Star, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const FeatureCard = ({ to, icon: Icon, title, desc, colorClass }) => (
  <Link 
    to={to}
    className="group relative p-6 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
  >
    {/* Fondo decorativo con gradiente suave al hover */}
    <div className={clsx(
      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
      colorClass
    )} />

    <div className="relative z-10 flex flex-col h-full">
      <div className={clsx(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
        "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 group-hover:text-white",
        // Al hacer hover, el icono toma el color del gradiente
        `group-hover:${colorClass.replace('from-', 'bg-')}` 
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-grow">
        {desc}
      </p>

      <div className="flex items-center text-sm font-bold text-primary-600 dark:text-primary-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Explorar <ArrowRight size={16} className="ml-1" />
      </div>
    </div>
  </Link>
);

const Inicio = () => {
  return (
    <div className="h-full flex flex-col gap-8">
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-primary-600 shadow-2xl p-8 md:p-12 text-white">
        {/* Patrón de fondo (Círculos decorativos) */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary-500/30 rounded-full blur-2xl"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-4 text-primary-100">
            <Sparkles size={14} className="text-yellow-300" />
            Bienvenido a BSWorld v2.0
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Descubre el universo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Minecraft</span>
          </h1>
          
          <p className="text-primary-100 text-lg mb-8 leading-relaxed opacity-90">
            Explora mapas increíbles, mods esenciales y paquetes de texturas únicos. Tu próxima aventura comienza aquí.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 rounded-xl bg-white text-primary-900 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2">
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
              Destacados
            </button>
            <button className="px-6 py-3 rounded-xl bg-primary-700/50 backdrop-blur-sm border border-white/10 text-white font-semibold hover:bg-primary-700/70 transition-all duration-200">
              Ver Novedades
            </button>
          </div>
        </div>
      </div>

      {/* --- GRID DE SECCIONES --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Boxes size={24} className="text-primary-600" />
          Categorías Principales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <FeatureCard 
            to="/mapas"
            icon={Map}
            title="Mapas Mundiales"
            desc="Desde ciudades modernas hasta reinos de fantasía. Descarga los mejores mundos creados por la comunidad."
            colorClass="from-blue-500 to-cyan-400"
          />
          
          <FeatureCard 
            to="/mods"
            icon={Wrench}
            title="Mods & Herramientas"
            desc="Mejora tu juego con nuevas mecánicas, bloques y criaturas. La colección esencial."
            colorClass="from-purple-500 to-pink-500"
          />
          
          <FeatureCard 
            to="/minijuegos"
            icon={Gamepad2}
            title="Minijuegos"
            desc="Desafía a tus amigos en arenas PvP, parkour, carreras y más diversión arcade."
            colorClass="from-green-500 to-emerald-400"
          />

          <FeatureCard 
            to="/modpacks"
            icon={Boxes}
            title="Modpacks"
            desc="Experiencias completas curadas para supervivencia extrema o tecnología avanzada."
            colorClass="from-orange-500 to-red-400"
          />

          <FeatureCard 
            to="/paquetes"
            icon={Package}
            title="Paquetes de Recursos"
            desc="Transforma el aspecto visual de tu mundo con texturas realistas o cartoon."
            colorClass="from-yellow-500 to-amber-400"
          />
        </div>
      </div>
    </div>
  );
};

export default Inicio;