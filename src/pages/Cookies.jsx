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
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-dark-surface">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm leading-relaxed [&_td]:px-3 [&_td]:py-3 [&_th]:px-3 [&_th]:py-2">
          <thead className="bg-gray-50 text-xs dark:bg-dark-bg">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th scope="col">Nombre</th>
              <th scope="col">Finalidad</th>
              <th scope="col">Duración</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.nombre} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="font-mono text-xs">{r.nombre}</td>
                <td>{r.fin}</td>
                <td>{r.dura}</td>
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
