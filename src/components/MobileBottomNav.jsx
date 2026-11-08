import React, { lazy, Suspense, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Crown, Gamepad2, Upload, Bell, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import AvatarRenderer from './AvatarRenderer';

const SubirMod = lazy(() => import('../pages/SubirMod'));

const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSubirModOpen, setIsSubirModOpen] = useState(false);

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
        <Link
          to={user ? `/u/${user.username}` : "/login"}
          aria-label={user ? "Mi perfil" : "Iniciar sesión"}
          className={clsx(
            "flex h-full w-full items-center justify-center transition-all duration-200",
            location.pathname.startsWith("/u/") || location.pathname === "/login"
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {user ? (
            <span className="h-8 w-8 overflow-hidden rounded-full">
              <AvatarRenderer avatar={user.avatar} name={user.username} />
            </span>
          ) : (
            <User
              size={20}
              strokeWidth={location.pathname === "/login" ? 2.5 : 2}
              className={clsx("transition-all", location.pathname === "/login" && "scale-110")}
            />
          )}
        </Link>
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
