import { createElement } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Gamepad2, Star, Upload, Info, Mail, HelpCircle, FileText, Shield, Cookie,
  Scale, Heart, Github, Twitter, Instagram, Facebook,
} from 'lucide-react';

const groups = [
  {
    title: 'Navegación',
    links: [
      { label: 'Inicio', to: '/', icon: Home },
      { label: 'Mods', to: '/mods', icon: Gamepad2 },
      { label: 'Destacados', to: '/destacados', icon: Star },
      { label: 'Subir Mod', to: '/subir', icon: Upload },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Acerca de', to: '/acerca-de', icon: Info },
      { label: 'Contacto', to: '/contacto', icon: Mail },
      { label: 'Ayuda', to: '/ayuda', icon: HelpCircle },
      { label: 'Términos', to: '/terminos', icon: FileText },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidad', to: '/privacidad', icon: Shield },
      { label: 'Cookies', to: '/cookies', icon: Cookie },
      { label: 'Licencias', to: '/licencias', icon: Scale },
    ],
  },
];

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com/JoseANG3L', icon: Github },
  { label: 'X', url: 'https://x.com/byANG3L_HD', icon: Twitter },
  { label: 'Instagram', url: 'https://www.instagram.com/ijoseang3l/', icon: Instagram },
  { label: 'Facebook', url: 'https://www.facebook.com/jose.angel.625627/', icon: Facebook },
];

export default function Footer() {
  const location = useLocation();
  const returnTo = location.pathname + location.search + location.hash;

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-dark-bg dark:text-gray-400">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] lg:gap-x-10 lg:py-9">
          <div className="col-span-full border-b border-gray-200 pb-5 dark:border-gray-800 lg:col-span-1 lg:border-0 lg:pb-0">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">BSWorld</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed">
              Tu plataforma definitiva para descubrir, compartir y descargar mods de BombSquad.
              Conecta con la comunidad y lleva tu experiencia al siguiente nivel.
            </p>
            <div className="mt-3 flex gap-2">
              {socialLinks.map(({ label, url, icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-primary-500 dark:bg-dark-surface dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
                  {createElement(icon, { size: 17, 'aria-hidden': true })}
                </a>
              ))}
            </div>
          </div>

          {groups.map(({ title, links }) => {
            const primary = title === 'Navegación';
            return (
              <nav key={title} aria-label={title} className={primary ? 'col-span-full sm:col-span-1' : undefined}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">{title}</h4>
                <ul className={primary ? 'grid grid-cols-2 gap-x-6 sm:grid-cols-1' : undefined}>
                  {links.map(({ label, to, icon }) => (
                    <li key={to}>
                      <NavLink to={to} end state={to === '/subir' ? { returnTo } : undefined}
                        className="inline-flex min-h-9 items-center gap-2 rounded-sm text-sm transition-colors hover:text-primary-700 focus-visible:outline-primary-500 aria-[current=page]:font-semibold aria-[current=page]:text-primary-700 dark:hover:text-primary-300 dark:aria-[current=page]:text-primary-300">
                        {createElement(icon, { size: 15, 'aria-hidden': true })}
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-gray-200 py-4 text-xs dark:border-gray-800">
          <p>© 2026 BSWorld · Todos los derechos reservados</p>
          <p className="inline-flex items-center gap-1.5">
            Hecho con <Heart size={13} className="fill-rose-500 text-rose-500" aria-label="amor" /> para la comunidad
          </p>
        </div>
      </div>
    </footer>
  );
}
