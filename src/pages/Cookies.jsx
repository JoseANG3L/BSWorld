import React from 'react';
import { Cookie } from 'lucide-react';
import InfoPage, { InfoHero, InfoSection, InfoBack } from '../components/InfoPage';

const ROWS = [
  { nombre: 'Sesión (Supabase Auth)', fin: 'Mantenerte conectado y recordar tu usuario', dura: 'Hasta cerrar sesión' },
  { nombre: 'theme', fin: 'Recordar modo claro u oscuro', dura: 'Persistente en tu navegador' },
  { nombre: 'download_limit_*', fin: 'Evitar conteo duplicado de descargas (anti-spam)', dura: '1 hora' },
  { nombre: 'viewed_*', fin: 'No contar dos veces la misma vista en una sesión', dura: 'Sesión' },
];

const Cookies = () => (
  <InfoPage>
    <InfoBack />
    <InfoHero
      icon={Cookie}
      title="Política de cookies"
      desc="BSWorld no usa cookies de publicidad ni rastreo de terceros."
    />
    <InfoSection title="Qué guardamos en tu navegador">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 font-bold text-gray-900 dark:text-white">Nombre</th>
              <th className="py-2 pr-4 font-bold text-gray-900 dark:text-white">Finalidad</th>
              <th className="py-2 font-bold text-gray-900 dark:text-white">Duración</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.nombre} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2 pr-4 font-mono text-xs">{r.nombre}</td>
                <td className="py-2 pr-4">{r.fin}</td>
                <td className="py-2">{r.dura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoSection>
    <InfoSection title="Cómo borrarlas">
      <p>
        Puedes borrar el almacenamiento del sitio desde tu navegador (Configuración → Privacidad →
        Borrar datos de sitios) o cerrar sesión para eliminar la sesión. Sin estos datos algunas
        funciones (mantener sesión, tema, conteo de vistas) dejarán de funcionar hasta tu próxima
        visita.
      </p>
    </InfoSection>
  </InfoPage>
);

export default Cookies;
