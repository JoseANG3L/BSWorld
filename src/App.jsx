import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 

// Componentes
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy loading de páginas
const Inicio = lazy(() => import('./pages/Inicio'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AcercaDe = lazy(() => import('./pages/AcercaDe'));
const Contacto = lazy(() => import('./pages/Contacto'));
const Mods = lazy(() => import('./pages/Mods'));
const MisMods = lazy(() => import('./pages/MisMods'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Comunidad = lazy(() => import('./pages/Comunidad'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Resultados = lazy(() => import('./pages/Resultados')); 
const Destacados = lazy(() => import('./pages/Destacados'));
const DetalleContenido = lazy(() => import('./pages/DetalleContenido'));
const SubirModPage = lazy(() => import('./pages/SubirModPage'));
const EditContent = lazy(() => import('./pages/EditContent'));
const Notificaciones = lazy(() => import('./pages/Notificaciones'));

// COMPONENTE INTERNO PARA REINICIAR EL SCROLL EN CADA CAMBIO DE RUTA
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
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* RUTAS INDEPENDIENTES: Fuera del Layout principal */}
            <Route path="/login-page" element={<LoginPage />} />
            <Route path="/subir" element={<SubirModPage />} />

            {/* RUTAS ENVUELTAS EN EL LAYOUT (Llevan Sidebar y Header) */}
            <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
              
              {/* --- RUTAS PRINCIPALES --- */}
              <Route index element={<Inicio />} />
              
              {/* --- CATEGORÍAS --- */}
              <Route path="mods" element={<Mods />} />

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
              <Route path="edit/:id" element={
                  <ProtectedRoute>
                    <EditContent />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;