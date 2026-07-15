import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Map, Gamepad2, Wrench, Boxes, Package, Crown, Trophy, User, Search, Loader2 } from 'lucide-react';
import FeatureCard from '../components/FeatureCard.jsx';
import Carousel from '../components/Carousel.jsx';
import { searchGlobalContent } from '../services/api'; // Asegúrate de tener esta función

const Inicio = () => {

  return (
    <div className="flex flex-col animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* --- CARRUSEL DE MODS DESTACADOS --- */}
      <Carousel title="" limit={9} />
      
      <div className="flex flex-col p-2 md:p-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <Boxes size={24} className="text-primary-600" /> Categorías Principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <FeatureCard to="/mapas" icon={Map} title="Mapas" desc="Descubre mundos únicos." colorClass="from-blue-500 to-cyan-400" />
          <FeatureCard to="/minijuegos" icon={Gamepad2} title="Minijuegos" desc="Desafía a tus amigos." colorClass="from-green-500 to-emerald-400" />
          <FeatureCard to="/modpacks" icon={Boxes} title="Modpacks" desc="Experiencias completas." colorClass="from-orange-500 to-red-400" />
          <FeatureCard to="/mods" icon={Wrench} title="Mods" desc="Nuevas mecánicas." colorClass="from-purple-500 to-pink-500" />
          <FeatureCard to="/paquetes" icon={Package} title="Recursos" desc="Transforma el aspecto." colorClass="from-yellow-500 to-amber-400" />
          <FeatureCard to="/personajes" icon={User} title="Personajes" desc="Personaliza tu estilo." colorClass="from-pink-500 to-purple-400" />
        </div>
      </div>
    </div>
  );
};

export default Inicio;