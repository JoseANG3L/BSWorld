import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, User, Menu, LogOut, ShieldCheck, UserPlus, LogIn, Settings, Upload, LayoutGrid, Gamepad2, ChevronDown, Home, Crown, Boxes, Info, Mail, Earth } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from './AvatarRenderer';
import NotificationBell from './NotificationBell';
import SubirMod from '../pages/SubirMod';

const menuItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/comunidad", icon: Crown, label: "Comunidad" },
  { to: "/mods", icon: Gamepad2, label: "Mods" },
];

const Header = ({ toggleTheme, isDarkMode, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFocused, setIsFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isSubirModOpen, setIsSubirModOpen] = useState(false);
  const profileRef = useRef(null);
  const navMenuRef = useRef(null);

  // --- LÓGICA DE BÚSQUEDA ---
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const term = e.target.value.trim();
      if (term) {
        navigate(`/buscar?q=${encodeURIComponent(term)}`);
        e.target.blur();
        setIsFocused(false);
      }
    }
  };

  // Cerrar los menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setIsNavMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubirModClick = () => {
    if (user) {
      setIsSubirModOpen(true);
    } else {
      navigate('/login');
    }
  };

  return (
    <>
    <header className="flex items-center gap-2 md:gap-4 sticky top-0 z-40 px-2 md:px-4 py-2 bg-white dark:bg-dark-bg transition-colors duration-300 border-b border-gray-200 dark:border-gray-800 shadow-sm">

      {/* MENÚ HAMBURGUESA (Solo móvil) */}
      <div className="lg:hidden relative" ref={navMenuRef}>
        <button
          onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu size={18} />
        </button>
        {isNavMenuOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fade-in-up">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsNavMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "text-primary-600 dark:text-primary-400 font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400"
                  )}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* LOGO BSWorld (Solo texto, centrado en móvil, izquierda en desktop) */}
      <Link to="/" className="flex items-center shrink-0 group mx-auto md:mx-0">
        <span className="font-bold text-sm md:text-xl text-black dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
          BSWorld
        </span>
      </Link>

      {/* SEARCH BAR (Desktop) */}
      <div className="hidden md:block relative transition-all duration-300 ease-out flex-1 max-w-2xl">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={18} className={clsx("transition-colors duration-300", isFocused ? "text-primary-600 dark:text-primary-400" : "text-gray-400")} />
        </div>
        <input
          type="text"
          placeholder="Buscar mapas, mods..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleSearch}
          className={clsx(
            "w-full py-2 pl-11 pr-4 rounded-xl text-sm font-medium transition-all duration-300 outline-none border shadow-sm",
            "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400",
            "focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          )}
        />
      </div>

      {/* ICONO BÚSQUEDA (Solo móvil, derecha) */}
      <button className="md:hidden p-1.5 ml-auto" onClick={() => setIsFocused(true)}>
        <Search size={18} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* SEARCH EXPANDIDO (Solo móvil cuando está enfocado) */}
      {isFocused && (
        <div className="absolute inset-0 left-0 right-0 top-0 bottom-0 bg-white dark:bg-[#1e1e1e] z-50 flex items-center gap-2 px-2 md:hidden">
          <button className="p-1.5" onClick={() => setIsFocused(false)}>
            <Search size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <input
            type="text"
            placeholder="Buscar mapas, mods..."
            autoFocus
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleSearch}
            className={clsx(
              "flex-1 py-2 pl-4 pr-4 rounded-xl text-sm font-medium transition-all duration-300 outline-none border shadow-sm",
              "bg-gray-50 dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400",
              "focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            )}
          />
        </div>
      )}

      {/* MENÚ DE NAVEGACIÓN (DESKTOP) */}
      <div className="hidden lg:flex items-center gap-1 ml-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                isActive
                  ? "text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              )}
            >
              <div className={clsx(
                "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}></div>
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* ACCIONES (Desktop) */}
      <div className="hidden md:flex items-center gap-3 ml-auto">

        {/* SUBIR MOD */}
        <button 
          onClick={handleSubirModClick}
          className="flex px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm items-center gap-2"
        >
          <Upload size={16} strokeWidth={3} />
          <span>Subir</span>
        </button>

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={toggleTheme}
          className={clsx("w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all shadow-sm", "hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400")}
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
        </button>

        {/* NOTIFICACIONES */}
        {user && (
          <NotificationBell userId={user.id} />
        )}

        <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1"></div>

        {/* DROPDOWN PERFIL CON USERNAME VISIBLE */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="relative group flex items-center transition-colors rounded-full"
          >
            {user ? (
              // CONECTADO: Avatar + Username + Flecha
              <div className="flex gap-2">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-primary-900 shadow-sm shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-[#191B1E]">
                    <AvatarRenderer 
                      avatar={user.avatar} 
                      name={user.username} 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 max-w-[120px]">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate select-none">
                    {user.username}
                  </span>
                  <ChevronDown size={14} className={clsx("text-gray-900 dark:text-gray-500 transition-transform duration-300 flex-shrink-0", isProfileOpen && "rotate-180")} />
                </div>
              </div>
            ) : (
              // DESCONECTADO: Icono gris
              <div className="w-9 h-9 rounded-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                <User size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
            )}
          </button>

          {/* MENÚ DESPLEGABLE */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 py-2 z-50 origin-top-right overflow-hidden">
              {user ? (
                <>
                  <div className="px-4 pb-3 pt-1 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to={`/u/${user.username}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link
                    to="/mis-mods" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <LayoutGrid size={16} />
                    <span>Mis Mods</span>
                  </Link>
                  <Link
                    to="/configuracion" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Configuración</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <ShieldCheck size={16} /> Panel Admin
                    </Link>
                  )}
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                  <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuenta</p>
                  </div>
                  <a
                    href="/login"
                    rel="noopener noreferrer"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogIn size={16} /> Iniciar Sesión
                  </a>
                  <a
                    href="/login?register=true"
                    rel="noopener noreferrer"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserPlus size={16} /> Registrarse
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
    
    {/* MODAL SUBIR MOD */}
    <SubirMod isOpen={isSubirModOpen} onClose={() => setIsSubirModOpen(false)} />
    </>
  );
};

export default Header;