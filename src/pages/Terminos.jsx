import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import InfoPage, { InfoHero, InfoSection, InfoBack } from '../components/InfoPage';

const Terminos = () => (
  <InfoPage>
    <InfoBack />
    <InfoHero
      icon={FileText}
      title="Términos de uso"
      desc="Condiciones para usar BSWorld. Última actualización: 2026."
    />
    <InfoSection title="1. Qué es BSWorld">
      <p>
        BSWorld es una plataforma comunitaria para descubrir, compartir y descargar modificaciones
        (mods) para BombSquad. Al usar la plataforma aceptas estos términos.
      </p>
    </InfoSection>
    <InfoSection title="2. Contenido de los usuarios">
      <p>
        Al subir contenido declaras que tienes derecho a compartirlo (es de tu autoría o tienes
        permiso del autor). El equipo puede poner en revisión, ocultar o eliminar contenido que
        incumpla las normas, contenga malware, spam o material ilegal.
      </p>
      <p>
        Los mods pertenecen a sus autores. Descargar un mod te da derecho a usarlo, no a
        redistribuirlo como propio sin permiso. Consulta la página de{' '}
        <Link to="/licencias" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Licencias
        </Link>
        .
      </p>
    </InfoSection>
    <InfoSection title="3. Cuentas">
      <p>
        Eres responsable de tu cuenta y de mantener tus credenciales a salvo. No compartas cuentas
        ni suplantes a otros usuarios. Podemos suspender cuentas que abusen de la plataforma.
      </p>
    </InfoSection>
    <InfoSection title="4. Uso aceptable">
      <p>
        No está permitido subir malware, contenido ilegal, spam, ni acosar a otros usuarios. Los
        enlaces de descarga deben apuntar al contenido descrito y no a publicidad engañosa.
      </p>
    </InfoSection>
    <InfoSection title="5. Disponibilidad">
      <p>
        BSWorld se ofrece "tal cual", sin garantías de disponibilidad continua. Podemos modificar o
        interrumpir el servicio avisando con antelación razonable cuando sea posible.
      </p>
    </InfoSection>
    <InfoSection title="6. Contacto">
      <p>
        Para dudas sobre estos términos usa la página de{' '}
        <Link to="/contacto" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Contacto
        </Link>
        .
      </p>
    </InfoSection>
  </InfoPage>
);

export default Terminos;
