import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Map, Gamepad2, Wrench, Boxes, Package, 
  User, Info, Mail 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ... (menuItems array es el mismo de antes) ...
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

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => twMerge(clsx(
      // Agregamos 'group' para coordinar la animación
      "hover-boing flex items-center gap-3 px-4 py-3 my-1 mx-3 rounded-xl transition-all duration-200 font-bold border-2 transform will-change-transform group",
      
      isActive 
        // ACTIVO
        ? "bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-100 border-primary-500 dark:border-primary-400 shadow-[2px_2px_0px_#8b5cf6] dark:shadow-[2px_2px_0px_#a78bfa] scale-105"
        
        // INACTIVO
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] " +
          // HOVER CONTENEDOR
          "hover:scale-105 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-500 hover:shadow-[2px_2px_0px_#8b5cf6] hover:text-primary-700 dark:hover:text-primary-100 dark:hover:border-primary-400"
    ))}
  >
    {({ isActive }) => (
      <>
        <Icon 
          size={20} 
          strokeWidth={3}
          className={clsx(
            // 'ease-spring' o 'ease-out' para que el salto se sienta natural
            "transition-transform duration-300 ease-out", 
            
            isActive ? "text-primary-600 dark:text-primary-100" : "icon-boing text-gray-400 dark:text-gray-500",

            // --- ANIMACIÓN DE SALTO (JUMP) ---
            "group-hover:text-primary-600 dark:group-hover:text-primary-100",
          )} 
        />
        <span className="relative z-10">{label}</span>
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  return (
    <div className="flex flex-col h-full w-64 bg-light-surface dark:bg-dark-surface shadow-lg rounded-xl p-4 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 px-4 text-gray-900 dark:text-white cursor-default hover:text-primary-700 transition-colors duration-300">
        BSWorld
      </h1>
      
      <ul className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
        {menuItems.map((item, index) => (
          <li 
            key={item.to}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }} 
          >
            <SidebarItem to={item.to} icon={item.icon} label={item.label} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;