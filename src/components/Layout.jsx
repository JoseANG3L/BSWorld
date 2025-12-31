import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar'; // Importamos el componente que acabamos de separar

const Layout = ({ toggleTheme, isDarkMode }) => {
  return (
    <div className="flex h-screen p-4 gap-4 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      {/* Sidebar oculta en móviles */}
      <aside className="hidden md:block h-full">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 gap-2 md:gap-3">
        <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        
        <main className="flex-1 overflow-auto rounded-xl bg-light-surface dark:bg-dark-surface shadow-lg p-6 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;