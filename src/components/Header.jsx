import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Moon, User, Menu, LogOut, ShieldCheck, UserPlus, LogIn, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

const Header = ({ toggleTheme, isDarkMode, onMenuClick }) => {
  // ✅ CORRECTO: El hook se llama dentro del componente
  const { user, logout } = useAuth();
  
  const [isFocused, setIsFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center gap-4 sticky top-0 z-40 px-3 py-2 md:p-0 bg-white dark:bg-[#1e1e1e] md:bg-light-bg md:dark:bg-dark-bg/80 backdrop-blur-sm transition-colors duration-300">
      
      {/* MENU MOVIL */}
      <div className={clsx("flex items-center gap-3 md:hidden", isFocused && "hidden")}>
         <button onClick={onMenuClick} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Menu size={24} className="text-primary-600 dark:text-primary-300" />
         </button>
         <Link to="/" className="flex items-center gap-1">
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">BSWorld</span>
         </Link>
      </div>

      {/* SEARCH BAR */}
      <div className={twMerge(clsx("relative transition-all duration-300 ease-out", isFocused ? "flex-[2] absolute left-0 right-16 z-50 md:relative md:inset-auto md:max-w-2xl" : "hidden md:block flex-1 max-w-md"))}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={18} className={clsx("transition-colors duration-300", isFocused ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
        </div>
        <input 
            type="text" 
            placeholder="Buscar..." 
            onFocus={() => setIsFocused(true)} 
            onBlur={() => setIsFocused(false)} 
            className={clsx("w-full py-2.5 pl-11 pr-4 rounded-full text-sm font-medium transition-all duration-300 outline-none border shadow-sm", "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400", "focus:border-primary-600 dark:focus:border-primary-500 focus:ring-0")} 
        />
      </div>
      
      {!isFocused && (
          <button className="md:hidden p-2 ml-auto" onClick={() => setIsFocused(true)}>
            <Search size={20} className="text-gray-600" />
          </button>
      )}

      <div className="flex-1 hidden md:block"></div>

      {/* ACCIONES */}
      <div className="flex items-center gap-3 ml-auto md:ml-0">

        {/* ADMIN BUTTON (Solo visible para admins) */}
        {user?.role === 'admin' && (
          <Link to="/admin-upload" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-bold">
            <ShieldCheck size={16} /> Admin
          </Link>
        )}

        {/* THEME TOGGLE */}
        <button onClick={toggleTheme} className={clsx("p-2.5 rounded-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all duration-200 shadow-md", "hover:scale-105 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400")}>
          {isDarkMode ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
        </button>

        <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1 hidden sm:block"></div>

        {/* DROPDOWN PERFIL */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="relative group flex items-center outline-none">
            {user ? (
               // CONECTADO: Avatar
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-900 p-[2px] shadow-md transition-transform duration-200 hover:scale-105">
                 <img src={user.photoURL || user.avatar || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full rounded-full object-cover bg-white dark:bg-gray-800" />
                 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#121212] rounded-full"></span>
               </div>
            ) : (
               // DESCONECTADO: Icono gris
               <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-md hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all">
                  <User size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
               </div>
            )}
          </button>

          {/* MENÚ DESPLEGABLE */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in-up origin-top-right overflow-hidden" style={{ animationDuration: '200ms' }}>
              {user ? (
                // OPCIONES USUARIO LOGUEADO
                <>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/perfil" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors">
                    <User size={16} /> Mi Perfil
                  </Link>
                  <Link to="/ajustes" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors">
                    <Settings size={16} /> Configuración
                  </Link>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                  <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                // OPCIONES VISITANTE
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuenta</p>
                  </div>
                  <Link 
                    to="/login" 
                    state={{ isRegistering: false }} 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors"
                  >
                    <LogIn size={16} /> Iniciar Sesión
                  </Link>
                  <Link 
                    to="/login" 
                    state={{ isRegistering: true }} 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors"
                  >
                    <UserPlus size={16} /> Registrarse
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;