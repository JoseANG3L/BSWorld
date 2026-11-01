import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import InfoPage, { InfoHero, InfoSection, InfoBack } from '../components/InfoPage';

const Licencias = () => (
  <InfoPage>
    <InfoBack />
    <InfoHero
      icon={Scale}
      title="Licencias"
      desc="Quién posee cada cosa en BSWorld y qué puedes hacer con ella."
    />
    <InfoSection title="1. Mods y contenido de usuarios">
      <p>
        Cada mod, mapa, personaje o paquete pertenece a su autor o autores indicados en la ficha.
        Descargarlo te autoriza a usarlo en tu juego. Para redistribuirlo, modificarlo o incluirlo
        en otros proyectos necesitas el permiso del autor, salvo que indique una licencia abierta
        (MIT, GPL, CC-BY...) en su descripción.
      </p>
    </InfoSection>
    <InfoSection title="2. BombSquad">
      <p>
        BombSquad es un juego de Eric Froemling. BSWorld es una comunidad de fans sin afiliación
        oficial. Las marcas y el juego pertenecen a sus respectivos dueños.
      </p>
    </InfoSection>
    <InfoSection title="3. Plataforma BSWorld">
      <p>
        El diseño, logo y textos propios de BSWorld son de la plataforma. El código e ideas de la
        web no pueden copiarse integralmente sin permiso. Si crees que tu contenido se usa sin
        autorización, repórtalo desde{' '}
        <Link to="/contacto" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Contacto
        </Link>
        .
      </p>
    </InfoSection>
    <InfoSection title="4. Bibliotecas de terceros">
      <p>
        Esta web usa software libre: React, React Router, Tailwind CSS, Supabase, Lucide Icons y
        otras dependencias, cada una bajo su propia licencia (MIT, ISC, Apache-2.0). Sus avisos de
        copyright pertenecen a sus autores.
      </p>
    </InfoSection>
  </InfoPage>
);

export default Licencias;
