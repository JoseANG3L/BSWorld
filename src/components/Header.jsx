import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Moon, User, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Header = ({ toggleTheme, isDarkMode, onMenuClick }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="flex items-center gap-4 sticky top-0 z-40 px-3 py-2 md:p-0 bg-white dark:bg-[#1e1e1e] md:bg-light-bg md:dark:bg-dark-bg/80 backdrop-blur-sm transition-colors duration-300">
      
      {/* --- NUEVO: BOTÓN MENÚ Y LOGO (SOLO MÓVIL) --- */}
      {/* Se oculta automáticamente en pantallas medianas/grandes (md:hidden) */}
      <div className={clsx("flex items-center gap-3 md:hidden", isFocused && "hidden")}>
        <button 
          onClick={onMenuClick}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
        >
          <Menu size={24} className="text-primary-600 dark:text-primary-300" />
        </button>
        <Link to="/" className="flex items-center gap-1">
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
            BSWorld
          </span>
        </Link>
      </div>

      {/* --- BARRA DE BÚSQUEDA RESPONSIVA --- */}
      <div className={twMerge(clsx(
        "relative transition-all duration-300 ease-out",
        // Lógica de tamaño:
        // 1. Si está enfocado en móvil: Ocupa todo el ancho (absolute)
        // 2. Si está en escritorio: Se comporta normal (flex)
        // 3. Si no está enfocado en móvil: Se oculta (hidden)
        isFocused 
          ? "flex-[2] absolute left-0 right-16 z-50 md:relative md:inset-auto md:max-w-2xl" 
          : "hidden md:block flex-1 max-w-md"
      ))}>
        
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search 
            size={18} 
            className={clsx(
              "transition-colors duration-300",
              isFocused ? "text-primary-600 dark:text-primary-400" : "text-gray-400"
            )} 
          />
        </div>

        <input 
          type="text" 
          placeholder="Buscar..." 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={clsx(
            "w-full py-2.5 pl-11 pr-4 rounded-full text-sm font-medium transition-all duration-300 outline-none border shadow-sm",
            "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400",
            // Tu estilo de borde Púrpura
            "focus:border-primary-600 dark:focus:border-primary-500 focus:ring-0" 
          )}
        />
      </div>

      {/* Botón Lupa (Solo visible en móvil cuando la barra está oculta) */}
      {!isFocused && (
        <button 
          className="md:hidden p-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#252525] rounded-full border border-gray-200 dark:border-gray-700 shadow-sm ml-auto"
          onClick={() => setIsFocused(true)}
        >
          <Search size={20} />
        </button>
      )}

      {/* Espaciador para escritorio */}
      <div className="flex-1 hidden md:block"></div>

      {/* --- BOTONES DE ACCIÓN --- */}
      <div className="flex items-center gap-3 ml-auto md:ml-0">
        
        {/* Toggle Tema */}
        <button 
          onClick={toggleTheme}
          className={clsx(
            "p-2.5 rounded-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all duration-200 shadow-md",
            // Tu estilo hover Púrpura
            "hover:scale-105 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-500 dark:hover:border-primary-500"
          )}
          title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDarkMode ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
        </button>

        {/* Separador vertical sutil (oculto en móvil muy pequeño) */}
        <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1 hidden sm:block"></div>

        {/* Avatar de Perfil */}
        <Link 
          to="/perfil" 
          className="relative group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-900 p-[2px] shadow-md transition-transform duration-200 group-hover:scale-105">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
               <User size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </div>
          </div>
          {/* Indicador Online */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#121212] rounded-full"></span>
        </Link>
      </div>
    </header>
  );
};

export default Header;