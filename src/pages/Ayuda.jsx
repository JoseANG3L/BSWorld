import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, Download, Upload, User, ShieldCheck, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import InfoPage, { InfoHero, InfoSection, InfoBack } from '../components/InfoPage';
import { FEATURES } from '../config/features';

const FAQS = [
  {
    icon: Download,
    q: '¿Cómo descargo un mod?',
    a: 'Entra a la página del contenido y pulsa el botón Descargar. Si hay varias versiones (por API de BombSquad), elige la que coincida con tu versión del juego. Las descargas son gratuitas y no requieren cuenta.',
  },
  {
    icon: Upload,
    q: '¿Cómo subo mi mod?',
    a: 'Pulsa Subir en la barra superior e inicia sesión si no lo has hecho. Completa título, imagen, creadores y al menos un enlace de descarga. Si el contenido ya está publicado, tu edición pasará por revisión antes de verse reflejada.',
  },
  {
    icon: User,
    q: '¿Necesito una cuenta?',
    a: 'Para descargar no. Para subir contenido, comentar, dar likes o seguir usuarios sí necesitas registrarte. Puedes hacerlo con correo o con Google, GitHub o Discord.',
  },
  {
    icon: ShieldCheck,
    q: '¿Por qué mi contenido está "en revisión"?',
    a: 'Todo contenido nuevo o editado pasa por revisión del equipo para verificar que cumple las normas (sin malware, contenido propio o con permiso, descripción clara). Normalmente se resuelve en poco tiempo y recibes una notificación con el resultado.',
  },
  {
    icon: MessageSquare,
    q: '¿Cómo reporto un problema con un mod o un usuario?',
    a: 'Usa la página de Contacto describiendo el problema e indicando el enlace del contenido o el nombre del usuario. Revisamos todos los reportes.',
  },
  {
    icon: Download,
    q: '¿Qué significan las etiquetas API 9, API 8...?',
    a: 'Indican la versión de la API de BombSquad con la que funciona cada descarga. Usa la que coincida con tu juego: por ejemplo API 9 para 1.7.44+. Si no estás seguro, prueba con la más reciente.',
  },
];

const FaqItem = ({ icon: Icon, q, a, open, onToggle }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <span className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shrink-0">
        <Icon size={16} />
      </span>
      <span className="flex-1 text-sm font-bold text-gray-900 dark:text-white">{q}</span>
      <ChevronDown size={16} className={clsx('text-gray-400 transition-transform duration-200 shrink-0', open && 'rotate-180')} />
    </button>
    {open && (
      <p className="px-4 pb-4 pl-[60px] text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{a}</p>
    )}
  </div>
);

const Ayuda = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <InfoPage>
      <InfoBack />
      <InfoHero
        icon={HelpCircle}
        title="Ayuda"
        desc="Respuestas a las preguntas más frecuentes sobre BSWorld."
      />
      <div className="space-y-3 mb-4">
        {FAQS.map((f, i) => (
          <FaqItem
            key={i}
            icon={f.icon}
            q={f.q}
            a={f.a}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
      <InfoSection title="¿No encuentras respuesta?">
        <p>
          Escríbenos desde la página de{' '}
          <Link to="/contacto" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Contacto
          </Link>
          {FEATURES.comunidad ? (
            <>
              {' '}o pregunta en la{' '}
              <Link to="/comunidad" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                Comunidad
              </Link>
              , donde otros usuarios y el equipo pueden ayudarte.
            </>
          ) : (
            ' y el equipo te responderá lo antes posible.'
          )}
        </p>
      </InfoSection>
    </InfoPage>
  );
};

export default Ayuda;
