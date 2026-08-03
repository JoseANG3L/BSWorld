import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Crown, Wrench, Upload, Bell, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Inicio" },
    { to: "/mods", icon: Wrench, label: "Mods" },
    { to: "/subir", icon: Upload, label: "Subir", isCenter: true },
  ];

  return (
    <nav className="lg:hidden bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-around h-12 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          if (item.isCenter) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  "flex flex-col items-center justify-center -mt-6 transition-all duration-300",
                  isActive && "scale-105"
                )}
              >
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-full p-3 shadow-lg shadow-primary-600/40 hover:shadow-xl hover:shadow-primary-600/50 transition-all">
                  <item.icon size={22} strokeWidth={2.5} className="text-white" />
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 px-2 pt-1 pb-1.5 transition-all duration-200",
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
        <Link
          to="/notificaciones"
          className={clsx(
            "flex flex-col items-center justify-center gap-0.5 px-2 pt-1 pb-1.5 transition-all duration-200",
            location.pathname === "/notificaciones"
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {user ? (
            <div className="relative">
              <NotificationBell />
            </div>
          ) : (
            <Bell size={20} strokeWidth={location.pathname === "/notificaciones" ? 2.5 : 2} />
          )}
        </Link>

        {/* Cuenta */}
        <Link
          to={user ? `/u/${user.username}` : "/login"}
          className={clsx(
            "flex flex-col items-center justify-center gap-0.5 px-2 pt-1 pb-1.5 transition-all duration-200",
            location.pathname.startsWith("/u/") || location.pathname === "/login"
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <User 
            size={20} 
            strokeWidth={location.pathname.startsWith("/u/") || location.pathname === "/login" ? 2.5 : 2}
            className={clsx("transition-all", (location.pathname.startsWith("/u/") || location.pathname === "/login") && "scale-110")}
          />
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
