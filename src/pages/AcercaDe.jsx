import React from 'react';
import { Info, Heart, Code, Globe, Shield, Zap, Coffee, Github, Twitter } from 'lucide-react';
import { clsx } from 'clsx';

const TechBadge = ({ label }) => (
  <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold border border-gray-200 dark:border-gray-700">
    {label}
  </span>
);

const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
    <div className="p-3 h-fit rounded-lg bg-white dark:bg-gray-800 shadow-sm text-primary-600 dark:text-primary-400">
      <Icon size={24} />
    </div>
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const AcercaDe = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 shadow-xl p-8 md:p-12 text-white">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
              <Info size={24} className="text-white" />
            </div>
            <span className="font-bold tracking-wider text-primary-100 uppercase text-sm">Sobre el Proyecto</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">BSWorld</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-100 leading-relaxed opacity-90 mb-8 max-w-2xl">
            Tu biblioteca definitiva de recursos para Minecraft. Desde mapas épicos hasta los mods más esenciales, todo en un solo lugar diseñado para la comunidad.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 rounded-xl bg-white text-primary-900 font-bold hover:bg-gray-100 transition-colors shadow-lg">
              Ver Mapa de Ruta
            </button>
            <button className="px-6 py-3 rounded-xl bg-primary-900/50 border border-primary-400/30 text-white font-semibold hover:bg-primary-900/70 backdrop-blur-sm transition-colors">
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL (GRID) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Misión y Features (Ocupa 2 espacios) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card de Misión */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe size={20} className="text-primary-600" />
              Nuestra Misión
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              BSWorld nació con la idea de simplificar la búsqueda de contenido de calidad para Minecraft. 
              Sabemos lo difícil que es encontrar mods seguros, mapas que funcionen y texturas actualizadas. 
              Nuestro objetivo es curar este contenido en una interfaz moderna, rápida y accesible para todos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem 
                icon={Shield} 
                title="100% Seguro" 
                desc="Todos los archivos son verificados antes de ser publicados." 
              />
              <FeatureItem 
                icon={Zap} 
                title="Descargas Rápidas" 
                desc="Sin publicidad intrusiva ni acortadores molestos." 
              />
            </div>
          </div>

          {/* Stack Tecnológico */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Code size={20} className="text-primary-600" />
              Tecnologías Usadas
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Esta aplicación ha sido desarrollada utilizando las últimas tecnologías web para asegurar el mejor rendimiento:
            </p>
            <div className="flex flex-wrap gap-2">
              <TechBadge label="React 18" />
              <TechBadge label="Vite" />
              <TechBadge label="Tailwind CSS" />
              <TechBadge label="React Router" />
              <TechBadge label="Lucide Icons" />
              <TechBadge label="Glassmorphism" />
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Creador y Donaciones (Ocupa 1 espacio) */}
        <div className="flex flex-col gap-6">
          
          {/* Card del Creador */}
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-100 to-transparent dark:from-primary-900/20"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto rounded-full p-1 bg-white dark:bg-[#1e1e1e] mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="https://via.placeholder.com/150" 
                  alt="Creador" 
                  className="w-full h-full rounded-full object-cover bg-gray-200"
                />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Admin BSWorld</h3>
              <p className="text-primary-600 dark:text-primary-400 font-medium text-sm mb-4">Desarrollador Full Stack</p>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                "Creando experiencias digitales y jugando a los cubos desde 2012."
              </p>

              <div className="flex justify-center gap-3">
                <a href="#" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-400 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Card de Apoyo */}
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white text-center">
            <Heart size={32} className="mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold mb-2">¿Te gusta el proyecto?</h3>
            <p className="text-white/90 text-sm mb-4">
              Ayúdanos a mantener los servidores activos invitándonos a un café.
            </p>
            <button className="w-full py-2 rounded-xl bg-white text-primary-900 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              <Coffee size={18} />
              Invítame un Café
            </button>
          </div>

        </div>
      </div>

      {/* FOOTER PEQUEÑO */}
      <div className="text-center py-6 text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} BSWorld. No afiliado con Mojang ni Microsoft.</p>
      </div>

    </div>
  );
};

export default AcercaDe;