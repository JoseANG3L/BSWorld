import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Sun, Moon, User, Menu, LogOut, ShieldCheck, UserPlus, LogIn, Settings, Upload, 
  LayoutGrid, Gamepad2, ChevronDown, Home, Crown, Bell, Info, Mail, Earth, Server, Heart 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from './AvatarRenderer';
import NotificationBell from './NotificationBell';
import SubirMod from '../pages/SubirMod';
import Login from '../pages/Login'; // 👈 Importamos el componente Login Modal

const menuItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/comunidad", icon: Crown, label: "Comunidad" },
  { to: "/mods", icon: Gamepad2, label: "Mods" },
  { to: "/servidores", icon: Server, label: "Servidores" },
];

const Header = ({ toggleTheme, isDarkMode, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFocused, setIsFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  
  // ESTADOS DE MODALES
  const [isSubirModOpen, setIsSubirModOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState(false);

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
      setLoginInitialRegister(false);
      setIsLoginOpen(true);
    }
  };

  const handleOpenLogin = (register = false) => {
    setLoginInitialRegister(register);
    setIsLoginOpen(true);
    setIsProfileOpen(false);
  };

  return (
    <>
    <header className="flex items-center gap-1 md:gap-2 lg:gap-4 sticky top-0 z-40 px-2 lg:px-4 py-1.5 md:py-2 bg-white dark:bg-dark-bg transition-colors duration-300 border-b border-gray-200 dark:border-gray-800 shadow-sm">

      {/* MENÚ HAMBURGUESA (Solo móvil) */}
      <div className="lg:hidden relative" ref={navMenuRef}>
        <button
          onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu size={26} />
        </button>
        {isNavMenuOpen && (
          <div className="absolute left-0 mt-1.5 md:mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-300 dark:border-transparent py-2 z-50 origin-top-left">
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
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400"
                  )}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="md:hidden border-t border-gray-300 dark:border-gray-700 my-1"></div>

            {/* Dark Mode / Light Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className={clsx(
                "w-full flex md:hidden items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400"
              )}
              title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
            >
              {isDarkMode ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ICONO BÚSQUEDA (Solo móvil, izquierda) */}
      <button className="w-9 h-9 flex items-center justify-center md:hidden mr-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsFocused(true)}>
        <Search size={22} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* SEARCH EXPANDIDO (Solo móvil cuando está enfocado) */}
      {isFocused && (
        <div className="absolute inset-0 left-0 right-0 top-0 bottom-0 bg-white dark:bg-dark-bg z-50 flex items-center gap-2 pl-2 pr-3 md:hidden">
          <button className="p-1.5" onClick={() => setIsFocused(false)}>
            <Search size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <input
            type="text"
            placeholder="Buscar mapas, mods..."
            autoFocus
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleSearch}
            className={clsx(
              "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 outline-none border shadow-sm",
              "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400",
              "focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            )}
          />
        </div>
      )}

      {/* LOGO BSWorld */}
      <Link to="/" className="flex items-center shrink-0 group mx-auto md:mx-0 pr-1 lg:pr-0">
        <span className="pt-0.5 font-bold text-xl md:text-xl text-black dark:text-white hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
          BSWorld
        </span>
      </Link>

      {/* SEARCH BAR (Desktop) */}
      <div className="hidden md:block relative transition-all duration-300 ease-out flex-1 max-w-2xl pr-1 lg:pr-0">
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
            "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400",
            "focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          )}
        />
      </div>      

      {/* MENÚ DE NAVEGACIÓN (DESKTOP) */}
      <div className="hidden lg:flex items-center gap-1 ml-0 xl:ml-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative group",
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
      <div className="flex items-center gap-2 lg:gap-3 ml-0 md:ml-auto">

        {/* SUBIR MOD */}
        <button 
          onClick={handleSubirModClick}
          className="flex items-center justify-center w-9 h-9 xl:w-auto xl:h-auto px-0 py-0 xl:px-4 xl:py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white rounded-full xl:rounded-lg text-sm font-semibold transition-colors shadow-sm gap-2"
        >
          <Upload size={16} strokeWidth={3} />
          <span className="hidden xl:flex">Subir</span>
        </button>

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={toggleTheme}
          className={clsx("w-9 h-9 hidden md:flex items-center justify-center rounded-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-all shadow-sm", "hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400")}
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
        </button>

        {/* NOTIFICACIONES */}
        {user && (
          <div className="hidden md:block">
            <NotificationBell userId={user.id} />
          </div>
        )}

        <div className="h-6 w-px hidden md:block bg-gray-400 dark:bg-gray-600 mx-1"></div>

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
                    <AvatarRenderer avatar={user.avatar} name={user.username} />
                  </div>
                </div>
                
                <div className="hidden xl:flex items-center gap-1 max-w-[120px]">
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
            <div className="absolute right-0 mt-1.5 md:mt-3 w-56 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-gray-300 dark:border-transparent py-2 z-50 origin-top-right overflow-hidden">
              {user ? (
                <>
                  {/* Información del Usuario */}
                  <div className="px-4 pb-3 pt-1 border-b border-gray-100 dark:border-gray-800 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>

                  {/* Enlaces de Navegación del Usuario */}
                  {[
                    { to: `/u/${user.username}`, icon: User, label: 'Mi Perfil' },
                    { to: '/mis-mods', icon: LayoutGrid, label: 'Mis Mods' },
                    { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
                    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldCheck, label: 'Panel Admin' }] : [])
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>

                  {/* Botón Cerrar Sesión */}
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-1.5 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuenta</p>
                  </div>

                  {/* Opciones de Login / Registro como Modal */}
                  <button
                    type="button"
                    onClick={() => handleOpenLogin(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-left"
                  >
                    <LogIn size={16} />
                    <span>Iniciar Sesión</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenLogin(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-left"
                  >
                    <UserPlus size={16} />
                    <span>Registrarse</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
    
    {/* MODAL SUBIR MOD */}
    <SubirMod isOpen={isSubirModOpen} onClose={() => setIsSubirModOpen(false)} />

    {/* MODAL LOGIN / REGISTRO */}
    <Login 
      isOpen={isLoginOpen} 
      onClose={() => setIsLoginOpen(false)} 
      initialRegister={loginInitialRegister} 
    />
    </>
  );
};

export default Header;