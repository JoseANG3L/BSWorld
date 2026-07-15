import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import { clsx } from 'clsx';

const Layout = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen transition-colors duration-300 relative overflow-hidden">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
      />
      
      <main className="flex-1 transition-colors duration-300 relative z-0 overflow-y-auto">
        <Outlet />
        <Footer />
      </main>
      
      <MobileBottomNav />
    </div>
  );
};

export default Layout;