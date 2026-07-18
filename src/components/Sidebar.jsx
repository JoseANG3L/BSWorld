import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Map, Gamepad2, Wrench, Boxes, Package, Crown,
  User, Info, Mail, ChevronLeft, ChevronRight, Earth, Trophy
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const menuItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/comunidad", icon: Crown, label: "Comunidad" },
  // { to: "/destacados", icon: Trophy, label: "Destacados" },
  // { to: "/mapas", icon: Map, label: "Mapas" },
  // { to: "/minijuegos", icon: Gamepad2, label: "Minijuegos" },
  // { to: "/modpacks", icon: Boxes, label: "Modpacks" },
  { to: "/mods", icon: Wrench, label: "Mods" },
  // { to: "/paquetes", icon: Package, label: "Paquetes" },
  // { to: "/personajes", icon: User, label: "Personajes" },
  { to: "/acerca-de", icon: Info, label: "Acerca de" },
  { to: "/contacto", icon: Mail, label: "Contacto" },
];

const SidebarItem = ({ to, icon: Icon, label, isCollapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => twMerge(clsx(
      "hover-boing flex items-center rounded-xl transition-all duration-300 font-semibold text-sm transform will-change-transform group whitespace-nowrap border-2",
      
      // 📐 Proporciones ligeramente más amplias y cómodas
      isCollapsed ? "justify-center px-1 py-2.5 mx-1" : "gap-3 px-3.5 py-2 mx-2.5",

      isActive
        ? "bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-100 border-primary-500 dark:border-primary-400"
        : "text-gray-700 dark:text-gray-400 border-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-100"
    ))}
  >
    {({ isActive }) => (
      <>
        {/* 🌟 Iconos regresados a 18px para mejor visibilidad */}
        <Icon
          size={18}
          strokeWidth={2.5}
          className={clsx(
            "transition-transform duration-300 ease-out flex-shrink-0",
            isActive ? "text-primary-600 dark:text-primary-100" : "icon-boing text-gray-400 dark:text-gray-500",
            "group-hover:text-primary-600 dark:group-hover:text-primary-100"
          )}
        />
        
        <span className={clsx(
          "relative z-10 transition-all duration-300 ease-in-out overflow-hidden tracking-wide",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isMobile = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const actualCollapsed = isMobile ? false : isCollapsed;

  return (
    <div 
      className={clsx(
        "flex flex-col h-full bg-light-surface dark:bg-dark-surface shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800",
        // 📐 Tamaño balanceado: w-16 (64px) colapsado / w-52 (208px) expandido
        isMobile ? "w-full rounded-none border-0" : (actualCollapsed ? "w-16 rounded-xl" : "w-52 rounded-xl")
      )}
    >
      {/* HEADER DEL SIDEBAR */}
      <div className={clsx(
        "flex items-center border-b border-gray-200 dark:border-gray-800 h-12",
        actualCollapsed ? "justify-center px-1" : "justify-between px-4"
      )}>
        <h1 className={clsx(
          "text-base font-bold text-gray-900 dark:text-white cursor-default whitespace-nowrap overflow-hidden transition-all duration-300 tracking-tight",
          actualCollapsed ? "w-0 opacity-0 px-0" : "w-auto opacity-100 ps-0.5"
        )}>
          <Earth size={20} strokeWidth={2.5} className="inline-block mb-0.5 mr-2 text-primary-600 dark:text-primary-400" />
          BSWorld
        </h1>

        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#191B1E] transition-colors"
            title={actualCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {actualCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {/* LISTA DE ITEMS */}
      <div className="overflow-x-hidden overflow-y-auto px-1 custom-scrollbar flex-1">
        <ul className="flex flex-col gap-1 py-3">
          {menuItems.map((item, index) => (
            <li
              key={item.to}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 30}ms`, animationDuration: '200ms' }}
            >
              <SidebarItem 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                isCollapsed={actualCollapsed} 
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;