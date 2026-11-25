import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from './PageHeader';

/** Maquetación compartida para páginas informativas y legales. */
export const InfoHero = ({ icon, title, desc }) => (
  <header className="mb-5 border-b border-gray-200 pb-5 dark:border-gray-800 md:mb-6">
    <PageHeader icon={icon} title={title} className="[&>span:last-child]:whitespace-normal" />
    {desc && <p className="mt-3 max-w-prose text-sm leading-relaxed text-gray-600 dark:text-gray-300">{desc}</p>}
  </header>
);

export const InfoSection = ({ title, children }) => (
  <section className="border-b border-gray-200 py-5 first-of-type:pt-0 last:border-b-0 dark:border-gray-800">
    {title && (
      <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-white md:text-lg">{title}</h2>
    )}
    <div className="space-y-3 text-sm leading-7 text-gray-700 dark:text-gray-300">{children}</div>
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

const InfoPage = ({ children, wide = false }) => (
  <div className={`mx-auto w-full px-4 pb-10 pt-4 md:px-6 md:pt-6 motion-safe:animate-fade-in-up ${wide ? 'max-w-6xl' : 'max-w-3xl'}`} style={{ animationDuration: '200ms' }}>
    {children}
  </div>
);

export default InfoPage;
