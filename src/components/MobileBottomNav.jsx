import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Crown, Gamepad2, Upload, Bell, User, LayoutGrid, ShieldCheck, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import NotificationBell from './NotificationBell';
import AvatarRenderer from './AvatarRenderer';

const SubirMod = lazy(() => import('../pages/SubirMod'));

const MobileBottomNav = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [isSubirModOpen, setIsSubirModOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { to: "/", icon: Home, label: "Inicio" },
    { to: "/mods", icon: Gamepad2, label: "Mods" },
    { to: "/subir", icon: Upload, label: "Subir", isCenter: true },
  ];

  return (
    <>
    <nav className="lg:hidden bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
      <div className="grid h-12 grid-cols-5 items-center justify-items-center px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          if (item.isCenter) {
            const CenterControl = user ? 'button' : Link;
            const centerControlProps = user
              ? { type: 'button', onClick: () => setIsSubirModOpen(true) }
              : { to: '/login' };

            return (
              <CenterControl
                key={item.to}
                aria-label={item.label}
                {...centerControlProps}
                className={clsx(
                  "flex h-full w-full items-center justify-center -mt-4 transition-all duration-300",
                  isActive && "scale-105",
                  !user && "cursor-pointer"
                )}
              >
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-full p-3 shadow-md shadow-primary-600/40 hover:shadow-xl hover:shadow-primary-600/50 transition-all">
                  <item.icon size={22} strokeWidth={2.5} className="text-white" />
                </div>
              </CenterControl>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={clsx(
                "flex h-full w-full items-center justify-center transition-all duration-200",
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <item.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                className={clsx("transition-all", isActive && "scale-110")}
              />
            </Link>
          );
        })}

        {/* Notificaciones */}
        <div className="flex h-full w-full items-center justify-center">
          {user ? (
            <NotificationBell variant="plain" />
          ) : (
            <Link
              to="/login"
              aria-label="Iniciar sesión para ver notificaciones"
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                location.pathname === "/notificaciones"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <Bell size={20} strokeWidth={location.pathname === "/notificaciones" ? 2.5 : 2} />
            </Link>
          )}
        </div>

        {/* Cuenta */}
        <div className="relative flex h-full w-full items-center justify-center" ref={accountMenuRef}>
          {user ? (
            <>
              <button
                type="button"
                aria-label="Menú de cuenta"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className={clsx(
                  "flex h-full w-full items-center justify-center transition-all duration-200",
                  (location.pathname.startsWith("/u/") || isAccountMenuOpen)
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <span className="h-8 w-8 overflow-hidden rounded-full">
                  <AvatarRenderer avatar={user.avatar} name={user.username} />
                </span>
              </button>
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  aria-label="Menú de cuenta"
                  className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-[#1e1e1e]"
                >
                  <div className="mb-1 border-b border-gray-100 px-3 pb-2 pt-1 dark:border-gray-800">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{user.username}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  {[
                    { to: `/u/${user.username}`, icon: User, label: "Mi perfil" },
                    { to: "/mis-mods", icon: LayoutGrid, label: "Mis mods" },
                    ...(user.role === "admin" ? [{ to: "/admin", icon: ShieldCheck, label: "Panel admin" }] : []),
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <div className="my-0.5 h-px bg-gray-100 dark:bg-gray-800" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      setIsAccountMenuOpen(false);
                      showToast('Sesión cerrada. ¡Hasta pronto!', 'info');
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              className={clsx(
                "flex h-full w-full items-center justify-center transition-all duration-200",
                location.pathname === "/login"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <User
                size={20}
                strokeWidth={location.pathname === "/login" ? 2.5 : 2}
                className={clsx("transition-all", location.pathname === "/login" && "scale-110")}
              />
            </Link>
          )}
        </div>
      </div>
    </nav>
    {user && (
      <Suspense fallback={null}>
        <SubirMod isOpen={isSubirModOpen} onClose={() => setIsSubirModOpen(false)} />
      </Suspense>
    )}
    </>
  );
};

export default MobileBottomNav;
