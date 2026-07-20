import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 

// Componentes
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas Públicas
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import AcercaDe from './pages/AcercaDe';
import Contacto from './pages/Contacto';

// Páginas de Contenido
import Personajes from './pages/Personajes';
import Mapas from './pages/Mapas';
import Minijuegos from './pages/Minijuegos';
import Mods from './pages/Mods';
import Modpacks from './pages/Modpacks';
import Paquetes from './pages/Paquetes';
import MisMods from './pages/MisMods';

// Páginas de Funcionalidad y Usuario
import AdminPanel from './pages/AdminPanel';
import AdminUpload from './pages/AdminUpload';
import Configuracion from './pages/Configuracion';
import Comunidad from './pages/Comunidad';
import PublicProfile from './pages/PublicProfile';
import Resultados from './pages/Resultados'; 
import Destacados from './pages/Destacados';
import DetalleContenido from './pages/DetalleContenido';
import SubirMod from './pages/SubirMod';
import SubirModPage from './pages/SubirModPage';
import Notificaciones from './pages/Notificaciones';

// 👇 COMPONENTE INTERNO PARA REINICIAR EL SCROLL EN CADA CAMBIO DE RUTA
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

function App() {
  // Lógica del Tema Oscuro (Persistencia)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 👇 RUTAS INDEPENDIENTES: Fuera del Layout principal */}
          <Route path="/login" element={<Login />} />
          <Route path="/subir" element={<SubirModPage />} />

          {/* 💻 RUTAS ENVUELTAS EN EL LAYOUT (Llevan Sidebar y Header) */}
          <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
            
            {/* --- RUTAS PRINCIPALES --- */}
            <Route index element={<Inicio />} />
            
            {/* --- CATEGORÍAS --- */}
            <Route path="personajes" element={<Personajes />} />
            <Route path="mapas" element={<Mapas />} />
            <Route path="minijuegos" element={<Minijuegos />} />
            <Route path="mods" element={<Mods />} />
            <Route path="modpacks" element={<Modpacks />} />
            <Route path="paquetes" element={<Paquetes />} />

            {/* --- BUSCADOR --- */}
            <Route path="buscar" element={<Resultados />} /> 

            {/* --- COMUNIDAD --- */}
            <Route path="comunidad" element={<Comunidad />} />
            <Route path="u/:username" element={<PublicProfile />} />
            
            {/* --- OTROS --- */}
            <Route path="acerca-de" element={<AcercaDe />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="destacados" element={<Destacados />} />
            <Route path="/view/:id" element={<DetalleContenido />} />

            {/* --- RUTAS PROTEGIDAS --- */}
            <Route path="admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route path="admin-upload" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminUpload />
                </ProtectedRoute>
              } 
            />
            <Route path="configuracion" element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              } 
            />
            <Route path="mis-mods" element={
                <ProtectedRoute>
                  <MisMods />
                </ProtectedRoute>
              } 
            />
            <Route path="notificaciones" element={
                <ProtectedRoute>
                  <Notificaciones />
                </ProtectedRoute>
              } 
            />

            {/* 404 - Redirección */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;