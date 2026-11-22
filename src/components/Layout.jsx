import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getVisit, VisitContext } from '../hooks/useVisitState';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

const Layout = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const key = JSON.stringify([location.key, user?.id, user?.role]);
  const formRoute = /^\/(edit\/|configuracion(?:\/|$))/.test(location.pathname);
  const visit = React.useMemo(() => getVisit(key), [key]);
  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 relative">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
      />
      
      {/* Mantenemos pb-14 o pb-16 en móvil para reservar espacio a MobileBottomNav */}
      <main className="flex-1 transition-colors duration-300 relative z-0 pb-14 lg:pb-0">
        <VisitContext.Provider key={formRoute ? location.key : key} value={visit}><Outlet /></VisitContext.Provider>
        
        <Footer />
      </main>
      
      {/* Navegación inferior fija en móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Layout;
