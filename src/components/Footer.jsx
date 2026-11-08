import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Info, Mail, Heart, Github, Twitter, Instagram, Facebook, Shield, FileText, HelpCircle, Zap } from 'lucide-react';
import { FEATURES } from '../config/features';

const Footer = () => {
  const location = useLocation();

  return (
    <footer className="bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-gray-800 pt-12 pb-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {/* Columna 1: Sobre BSWorld */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">BSWorld</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Tu plataforma definitiva para descubrir, compartir y descargar mods de BombSquad. 
            Conecta con la comunidad y lleva tu experiencia al siguiente nivel.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://github.com/JoseANG3L" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Github size={18} />
            </a>
            <a href="https://x.com/byANG3L_HD" target="_blank" rel="noopener noreferrer" aria-label="X" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Twitter size={18} />
            </a>
            <a href="https://www.instagram.com/ijoseang3l/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://www.facebook.com/jose.angel.625627/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Facebook size={18} />
            </a>
          </div>
        </div>

        {/* Columna 2: Navegación */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Navegación</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Inicio
              </Link>
            </li>
            {FEATURES.comunidad && (
              <li>
                <Link to="/comunidad" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <Zap size={14} />
                  Comunidad
                </Link>
              </li>
            )}
            <li>
              <Link to="/mods" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Mods
              </Link>
            </li>
            <li>
              <Link to="/mapas" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Mapas
              </Link>
            </li>
            <li>
              <Link to="/minijuegos" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Minijuegos
              </Link>
            </li>
            <li>
              <Link to="/modpacks" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Modpacks
              </Link>
            </li>
            <li>
              <Link to="/paquetes" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Paquetes
              </Link>
            </li>
            <li>
              <Link to="/personajes" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Personajes
              </Link>
            </li>
            <li>
              <Link to="/destacados" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Destacados
              </Link>
            </li>
            <li>
              <Link
                to="/subir"
                state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Zap size={14} />
                Subir Mod
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Recursos */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Recursos</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/acerca-de" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Info size={14} />
                Acerca de
              </Link>
            </li>
            <li>
              <Link to="/contacto" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Mail size={14} />
                Contacto
              </Link>
            </li>
            <li>
              <Link to="/ayuda" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <HelpCircle size={14} />
                Ayuda
              </Link>
            </li>
            <li>
              <Link to="/terminos" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <FileText size={14} />
                Términos
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: Legal */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Legal</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/privacidad" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Shield size={14} />
                Privacidad
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Shield size={14} />
                Cookies
              </Link>
            </li>
            <li>
              <Link to="/licencias" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <FileText size={14} />
                Licencias
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>© 2026 BSWorld</span>
            <span>•</span>
            <span>Todos los derechos reservados</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Hecho con</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>para la comunidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
