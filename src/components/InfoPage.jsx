import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Maquetación compartida para páginas informativas y legales. */
export const InfoHero = ({ icon: Icon, title, desc }) => (
  <div className="relative bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500 rounded-3xl overflow-hidden mb-6 p-4 md:p-6 shadow-lg">
    <div className="max-w-3xl flex items-start gap-4">
      <div className="p-3 rounded-2xl bg-white/15 text-white shrink-0">
        <Icon size={28} />
      </div>
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight">{title}</h1>
        {desc && <p className="text-primary-100 text-md md:text-lg leading-relaxed">{desc}</p>}
      </div>
    </div>
  </div>
);

export const InfoSection = ({ title, children }) => (
  <section className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm p-4 md:p-6 mb-4">
    {title && (
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
    )}
    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const InfoBack = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
  >
    <ArrowLeft size={16} /> Volver al inicio
  </Link>
);

const InfoPage = ({ children }) => (
  <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
    {children}
  </div>
);

export default InfoPage;
