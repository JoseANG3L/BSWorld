import React from 'react';
import { Link } from 'react-router-dom';
import { Info, Mail, Heart, Github, Twitter, Instagram, Facebook, Shield, FileText, HelpCircle, Zap } from 'lucide-react';

const Footer = () => {
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
            <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Github size={18} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Twitter size={18} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-[#1D1F23] text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
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
            <li>
              <Link to="/comunidad" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Comunidad
              </Link>
            </li>
            <li>
              <Link to="/mods" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <Zap size={14} />
                Mods
              </Link>
            </li>
            <li>
              <Link to="/subir" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
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
