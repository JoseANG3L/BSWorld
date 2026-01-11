import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar'; // Un solo import
import { clsx } from 'clsx';

const Layout = ({ toggleTheme, isDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen p-0 md:p-3 gap-3 bg-light-bg dark:bg-dark-bg transition-colors duration-300 overflow-hidden relative">
      
      {/* 1. SIDEBAR DESKTOP (Normal) */}
      <aside className="hidden md:block h-full shrink-0">
        <Sidebar isMobile={false} />
      </aside>

      {/* 2. SIDEBAR MOVIL (Drawer) */}
      <div 
        className={clsx(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-light-surface dark:bg-dark-surface shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Aquí lo usamos en modo móvil */}
        <Sidebar isMobile={true} />
      </div>

      <div className="flex flex-col flex-1 gap-0 md:gap-3 min-w-0 h-full">
        <Header 
          toggleTheme={toggleTheme} 
          isDarkMode={isDarkMode} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-auto rounded-none md:rounded-xl bg-light-surface dark:bg-dark-surface shadow-lg p-3 md:p-6 transition-colors duration-300 border border-gray-200 dark:border-gray-800 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;