import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import InfoPage, { InfoHero, InfoSection, InfoBack } from '../components/InfoPage';

const Privacidad = () => (
  <InfoPage>
    <InfoBack />
    <InfoHero
      icon={Shield}
      title="Política de privacidad"
      desc="Qué datos recogemos, para qué y cómo protegerlos. Última actualización: 2026."
    />
    <InfoSection title="1. Datos que recogemos">
      <p>
        <strong>Cuenta:</strong> correo, nombre de usuario, avatar y proveedor de acceso (correo,
        Google, GitHub o Discord). <strong>Actividad:</strong> contenido que subes, comentarios,
        likes, descargas y notificaciones. <strong>Técnicos:</strong> preferencias guardadas en tu
        navegador (tema claro/oscuro) y datos de sesión para mantenerte conectado.
      </p>
    </InfoSection>
    <InfoSection title="2. Para qué los usamos">
      <p>
        Operar la plataforma (mostrar tu perfil y tu contenido), moderar, enviarte notificaciones
        sobre tu actividad y mejorar el servicio. No vendemos tus datos ni los compartimos con
        terceros con fines publicitarios.
      </p>
    </InfoSection>
    <InfoSection title="3. Dónde se guardan">
      <p>
        Los datos se almacenan en Supabase (base de datos y autenticación) con acceso restringido
        por políticas de seguridad a nivel de fila: cada usuario solo puede modificar sus propios
        datos. Las imágenes y enlaces que subes se alojan en los servicios que tú elijas.
      </p>
    </InfoSection>
    <InfoSection title="4. Tus derechos">
      <p>
        Puedes editar tu perfil en Configuración en cualquier momento. Para eliminar tu cuenta y
        tus datos asociados, escríbenos desde{' '}
        <Link to="/contacto" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Contacto
        </Link>{' '}
        indicando tu nombre de usuario.
      </p>
    </InfoSection>
    <InfoSection title="5. Menores">
      <p>
        BSWorld no está dirigido a menores de 13 años. Si detectamos una cuenta de un menor sin
        consentimiento parental, la eliminaremos.
      </p>
    </InfoSection>
  </InfoPage>
);

export default Privacidad;
