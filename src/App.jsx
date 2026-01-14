import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Personajes from './pages/Personajes';
import { Wrench } from 'lucide-react';
import Inicio from './pages/Inicio';
import Mapas from './pages/Mapas';
import Minijuegos from './pages/Minijuegos';
import Mods from './pages/Mods';
import Modpacks from './pages/Modpacks';
import Paquetes from './pages/Paquetes';
import AcercaDe from './pages/AcercaDe';
import Contacto from './pages/Contacto';
import AdminUpload from './pages/AdminUpload';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';

const Placeholder = ({ title }) => (
  <div className="flex flex-col justify-center items-center h-full text-gray-400 dark:text-gray-600">
    <Wrench size={64} className="mb-4 opacity-50" />
    <h3 className="text-xl font-semibold">{title}</h3>
    <p>Próximamente</p>
  </div>
);

function App() {
  // 1. CAMBIO: Inicializamos el estado con una función (Lazy Initialization)
  // Esto verifica el localStorage antes de renderizar por primera vez.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark'; // Si es 'dark' devuelve true, si no false
  });

  useEffect(() => {
    // 2. CAMBIO: Aplicar clase al HTML Y guardar en localStorage
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark'); // Guardamos 'dark'
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light'); // Guardamos 'light'
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}>
            <Route index element={<Inicio />} />
            <Route path="personajes" element={<Personajes />} />
            <Route path="mapas" element={<Mapas />} />
            <Route path="minijuegos" element={<Minijuegos />} />
            <Route path="mods" element={<Mods />} />
            <Route path="modpacks" element={<Modpacks />} />
            <Route path="paquetes" element={<Paquetes />} />
            <Route path="acerca-de" element={<AcercaDe />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="admin-upload" element={<AdminUpload />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;