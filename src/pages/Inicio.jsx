import React from 'react';
import { Map, Gamepad2, Wrench, Boxes, Package, ArrowRight, Star, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import FeatureCard from '../components/FeatureCard.jsx';

const Inicio = () => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500 p-4 md:p-6 text-white">
        <h1 className="font-extrabold mb-2 md:mb-4 leading-tight flex flex-col gap-1 md:gap-2">
          <span className="text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">BombSquad World</span>
          <span className="text-xl md:text-4xl">Un mundo lleno de mods</span>
        </h1>
        
        <p className="text-primary-100 text-md md:text-lg mb-4 md:mb-8 leading-relaxed">
          Explora mapas increíbles, mods esenciales y paquetes de texturas únicos. Tu próxima aventura comienza aquí.
        </p>

        <div className="flex flex-wrap gap-2 md:gap-4">
          <button className="px-5 py-2 md:px-6 md:py-3 rounded-xl bg-white text-primary-900 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2">
            <Star size={18} className="text-yellow-500 fill-yellow-500" />
            Destacados
          </button>
          <button className="px-5 py-2 md:px-6 md:py-3 rounded-xl bg-primary-800 backdrop-blur-sm border border-primary-400 text-white/90 font-semibold hover:bg-primary-700 transition-all duration-200">
            Novedades
          </button>
        </div>
      </div>

      {/* --- GRID DE SECCIONES --- */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-5 flex items-center gap-2">
          <Boxes size={24} className="text-primary-600" />
          Categorías Principales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
          <FeatureCard 
            to="/mapas"
            icon={Map}
            title="Mapas Personalizados"
            desc="Descubre mundos únicos y fantasticos creados por la comunidad."
            colorClass="from-blue-500 to-cyan-400"
          />
          
          <FeatureCard 
            to="/mods"
            icon={Wrench}
            title="Mods & Herramientas"
            desc="Mejora tu juego con nuevas mecánicas, potenciadores y funcionalidades."
            colorClass="from-purple-500 to-pink-500"
          />
          
          <FeatureCard 
            to="/minijuegos"
            icon={Gamepad2}
            title="Minijuegos"
            desc="Desafía a tus amigos en arenas duel, combates explosivos, carreras y más diversión."
            colorClass="from-green-500 to-emerald-400"
          />

          <FeatureCard 
            to="/modpacks"
            icon={Boxes}
            title="Modpacks"
            desc="Experiencias completas creadas para descubrir un mundo diferente y emocionante."
            colorClass="from-orange-500 to-red-400"
          />

          <FeatureCard 
            to="/paquetes"
            icon={Package}
            title="Paquetes de Recursos"
            desc="Transforma el aspecto visual de tu mundo con texturas realistas o cartoon."
            colorClass="from-yellow-500 to-amber-400"
          />

          <FeatureCard
            to="/personajes"
            icon={Sparkles}
            title="Personajes"
            desc="Personaliza tu experiencia con personajes únicos y estilizados."
            colorClass="from-pink-500 to-purple-400"
          />
        </div>
      </div>
    </div>
  );
};

export default Inicio;