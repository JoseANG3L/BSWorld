import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import { clsx } from 'clsx';

const Layout = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 relative">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
      />
      
      <main className="flex-1 transition-colors duration-300 relative z-0">
        <Outlet />
        <Footer />
      </main>
      
      <MobileBottomNav />
    </div>
  );
};

export default Layout;