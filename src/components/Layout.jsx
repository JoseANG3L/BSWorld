import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

const Layout = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 relative">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
      />
      
      {/* Mantenemos pb-14 o pb-16 en móvil para reservar espacio a MobileBottomNav */}
      <main className="flex-1 transition-colors duration-300 relative z-0 pb-14 lg:pb-0">
        <Outlet />
        
        <Footer />
        {/* 💡 Oculto en móviles, visible solo en pantallas grandes */}
        {/* <div className="hidden lg:block">
          <Footer />
        </div> */}
      </main>
      
      {/* Navegación inferior fija en móvil */}
      {/* <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <MobileBottomNav />
      </div> */}
    </div>
  );
};

export default Layout;