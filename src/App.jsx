import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Páginas de Funcionalidad y Usuario
import AdminPanel from './pages/AdminPanel';
import AdminUpload from './pages/AdminUpload';
import Configuracion from './pages/Configuracion';
import Comunidad from './pages/Comunidad';
import PublicProfile from './pages/PublicProfile';
import Resultados from './pages/Resultados'; // <--- IMPORTANTE: Importar Resultados

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
        <Routes>
          <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
            
            {/* --- RUTAS PRINCIPALES --- */}
            <Route index element={<Inicio />} />
            <Route path="login" element={<Login />} />
            
            {/* --- CATEGORÍAS --- */}
            <Route path="personajes" element={<Personajes />} />
            <Route path="mapas" element={<Mapas />} />
            <Route path="minijuegos" element={<Minijuegos />} />
            <Route path="mods" element={<Mods />} />
            <Route path="modpacks" element={<Modpacks />} />
            <Route path="paquetes" element={<Paquetes />} />

            {/* --- BUSCADOR --- */}
            <Route path="buscar" element={<Resultados />} /> {/* <--- ESTA FALTABA */}

            {/* --- COMUNIDAD --- */}
            <Route path="comunidad" element={<Comunidad />} />
            <Route path="u/:username" element={<PublicProfile />} />
            
            {/* --- OTROS --- */}
            <Route path="acerca-de" element={<AcercaDe />} />
            <Route path="contacto" element={<Contacto />} />

            {/* --- RUTAS PROTEGIDAS --- */}
            
            <Route path="admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            {/* Solo Admins */}
            <Route path="admin-upload" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminUpload />
                </ProtectedRoute>
              } 
            />
            
            {/* Usuarios Logueados */}
            <Route path="configuracion" element={
                <ProtectedRoute>
                  <Configuracion />
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