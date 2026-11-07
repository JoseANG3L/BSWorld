import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 

// Componentes
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { FEATURES } from './config/features';

// Componente de carga único de la app
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loading de páginas
const Inicio = lazy(() => import('./pages/Inicio'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AcercaDe = lazy(() => import('./pages/AcercaDe'));
const Contacto = lazy(() => import('./pages/Contacto'));
const Mods = lazy(() => import('./pages/Mods'));
const Mapas = lazy(() => import('./pages/Mapas'));
const Minijuegos = lazy(() => import('./pages/Minijuegos'));
const Modpacks = lazy(() => import('./pages/Modpacks'));
const Paquetes = lazy(() => import('./pages/Paquetes'));
const Personajes = lazy(() => import('./pages/Personajes'));
const MisMods = lazy(() => import('./pages/MisMods'));
const MisLikes = lazy(() => import('./pages/MisLikes'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Comunidad = lazy(() => import('./pages/Comunidad'));
const ForoDetalle = lazy(() => import('./pages/ForoDetalle'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Resultados = lazy(() => import('./pages/Resultados')); 
const Destacados = lazy(() => import('./pages/Destacados'));
const DetalleContenido = lazy(() => import('./pages/DetalleContenido'));
const SubirModPage = lazy(() => import('./pages/SubirModPage'));
const EditContent = lazy(() => import('./pages/EditContent'));
const Notificaciones = lazy(() => import('./pages/Notificaciones'));
const Ayuda = lazy(() => import('./pages/Ayuda'));
const Terminos = lazy(() => import('./pages/Terminos'));
const Privacidad = lazy(() => import('./pages/Privacidad'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Licencias = lazy(() => import('./pages/Licencias'));

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
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner variant="fullscreen" />}>
          <Routes>
            {/* RUTAS INDEPENDIENTES: Fuera del Layout principal */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login-page" element={<LoginPage />} />
            <Route path="/subir" element={<SubirModPage />} />

            {/* RUTAS ENVUELTAS EN EL LAYOUT (Llevan Sidebar y Header) */}
            <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
              
              {/* --- RUTAS PRINCIPALES --- */}
              <Route index element={<Inicio />} />
              
              {/* --- CATEGORÍAS --- */}
              <Route path="mods" element={<Mods />} />
              <Route path="mapas" element={<Mapas />} />
              <Route path="minijuegos" element={<Minijuegos />} />
              <Route path="modpacks" element={<Modpacks />} />
              <Route path="paquetes" element={<Paquetes />} />
              <Route path="personajes" element={<Personajes />} />
              <Route path="destacados" element={<Destacados />} />

              {/* --- BUSCADOR --- */}
              <Route path="buscar" element={<Resultados />} /> 

              {/* --- COMUNIDAD (desactivada temporalmente) --- */}
              {FEATURES.comunidad && (
                <>
                  <Route path="comunidad" element={<Comunidad />} />
                  <Route path="foro/:id" element={<ForoDetalle />} />
                </>
              )}
              <Route path="u/:username" element={<PublicProfile />} />
              
              {/* --- OTROS --- */}
              <Route path="acerca-de" element={<AcercaDe />} />
              <Route path="contacto" element={<Contacto />} />
              <Route path="ayuda" element={<Ayuda />} />
              <Route path="terminos" element={<Terminos />} />
              <Route path="privacidad" element={<Privacidad />} />
              <Route path="cookies" element={<Cookies />} />
              <Route path="licencias" element={<Licencias />} />
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
              <Route path="mis-likes" element={
                  <ProtectedRoute>
                    <MisLikes />
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
    </ToastProvider>
  );
}

export default App;