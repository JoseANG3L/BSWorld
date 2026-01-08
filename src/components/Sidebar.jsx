import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Map, Gamepad2, Wrench, Boxes, Package,
  User, Info, Mail, ChevronLeft, ChevronRight, Earth
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const menuItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/mapas", icon: Map, label: "Mapas" },
  { to: "/minijuegos", icon: Gamepad2, label: "Minijuegos" },
  { to: "/mods", icon: Wrench, label: "Mods" },
  { to: "/modpacks", icon: Boxes, label: "Modpacks" },
  { to: "/paquetes", icon: Package, label: "Paquetes" },
  { to: "/personajes", icon: User, label: "Personajes" },
  { to: "/acerca-de", icon: Info, label: "Acerca de" },
  { to: "/contacto", icon: Mail, label: "Contacto" },
];

// Recibimos isCollapsed para adaptar el estilo
const SidebarItem = ({ to, icon: Icon, label, isCollapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => twMerge(clsx(
      "hover-boing flex items-center rounded-xl transition-all duration-300 font-semibold border-2 transform will-change-transform group whitespace-nowrap",
      
      // AJUSTE DE PADDING Y ALINEACIÓN SEGÚN ESTADO
      isCollapsed ? "justify-center px-1 py-2.5 mx-1" : "gap-3 px-3.5 py-2.5 mx-2",

      isActive
        // ACTIVO
        ? "bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-100 border-primary-500 dark:border-primary-400 scale-105"

        // INACTIVO
        : "bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 " +
        "hover:scale-105 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-100 dark:hover:border-primary-400"
    ))}
  >
    {({ isActive }) => (
      <>
        <Icon
          size={20}
          strokeWidth={3}
          className={clsx(
            "transition-transform duration-300 ease-out flex-shrink-0", // flex-shrink-0 evita que el icono se aplaste
            isActive ? "text-primary-600 dark:text-primary-100" : "icon-boing text-gray-400 dark:text-gray-500",
            "group-hover:text-primary-600 dark:group-hover:text-primary-100"
          )}
        />
        
        {/* TEXTO CON TRANSICIÓN DE OPACIDAD Y ANCHO */}
        <span className={clsx(
          "relative z-10 transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  // Estado para controlar si está colapsado o no
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={clsx(
        "flex flex-col h-full bg-light-surface dark:bg-dark-surface shadow-lg rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-800",
        // CAMBIO DE ANCHO: 20 (80px) cerrado vs 64 (256px) abierto
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* HEADER DEL SIDEBAR */}
      <div className={clsx(
        "flex items-center border-b border-gray-300 dark:border-gray-700 h-[52px]",
        isCollapsed ? "justify-center px-1" : "justify-between px-3"
      )}>
        {/* Título: Se oculta si está colapsado */}
        <h1 className={clsx(
          "text-xl font-bold text-gray-900 dark:text-white cursor-default whitespace-nowrap overflow-hidden transition-all duration-300",
          isCollapsed ? "w-0 opacity-0 px-0" : "w-auto opacity-100 ps-1"
        )}>
          <Earth size={24} className="inline-block mb-1 mr-2 text-primary-600 dark:text-primary-400" />
          BSWorld
        </h1>

        {/* Botón de Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* LISTA DE ITEMS */}
      <div className="overflow-x-hidden overflow-y-auto px-1 custom-scrollbar flex-1">
        <ul className={clsx("flex flex-col gap-1.5", isCollapsed ? "py-2" : "py-3")}>
          {menuItems.map((item, index) => (
            <li
              key={item.to}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SidebarItem 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                isCollapsed={isCollapsed} // Pasamos el estado al item
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;