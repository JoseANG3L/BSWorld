import {
  Heart, MessageCircle, Download, Globe, Lock, Eye, EyeOff, Bell,
  CheckCircle2, Clock, Hourglass, XCircle, AlertTriangle,
  Wrench, Map, Gamepad2, Boxes, Package, User
} from 'lucide-react';

// Etiquetas legibles para el tipo de contenido
export const CONTENT_TYPE_LABELS = {
  complemento: 'complemento',
  mapa: 'mapa',
  minijuego: 'minijuego',
  modpack: 'modpack',
  paquete: 'paquete',
  personaje: 'personaje'
};

const CONTENT_TYPE_ICONS = {
  complemento: Wrench,
  mapa: Map,
  minijuego: Gamepad2,
  modpack: Boxes,
  paquete: Package,
  personaje: User
};

// Paletas estáticas para que Tailwind las incluya en el build
const TONES = {
  rose: {
    tile: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    pill: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    badge: 'bg-rose-500 text-white'
  },
  blue: {
    tile: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    pill: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    badge: 'bg-blue-500 text-white'
  },
  green: {
    tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    badge: 'bg-emerald-500 text-white'
  },
  amber: {
    tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    pill: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    badge: 'bg-amber-500 text-white'
  },
  red: {
    tile: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    pill: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    badge: 'bg-red-500 text-white'
  },
  purple: {
    tile: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    pill: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
    badge: 'bg-purple-500 text-white'
  },
  cyan: {
    tile: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
    pill: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
    badge: 'bg-cyan-500 text-white'
  },
  gray: {
    tile: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
    pill: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
    badge: 'bg-gray-500 text-white'
  }
};

/**
 * Devuelve la vista unificada de una notificación:
 * icono, colores, etiqueta, título, cita y subtítulo.
 */
export const getNotificationView = (notification, actor = null, userRole = null) => {
  const type = notification?.type || 'status';
  const status = notification?.status || notification?.estado;
  const modType = CONTENT_TYPE_LABELS[notification?.modtype] || 'contenido';
  const modTitle = notification?.modtitle || '';
  const actorName = actor?.nombre || notification?.actorname || 'Alguien';
  const isAdmin = userRole === 'admin';
  const ContentIcon = CONTENT_TYPE_ICONS[notification?.modtype] || Package;

  if (type === 'like') {
    return {
      ...TONES.rose,
      Icon: Heart,
      label: 'Me gusta',
      title: `A ${actorName} le gustó tu ${modType}`,
      body: modTitle,
      hasActor: true
    };
  }

  if (type === 'comment') {
    return {
      ...TONES.blue,
      Icon: MessageCircle,
      label: notification?.parentid ? 'Respuesta' : 'Comentario',
      title: `${actorName} comentó en tu ${modType}`,
      quote: notification?.commenttext || '',
      body: modTitle,
      hasActor: true
    };
  }

  if (type === 'download') {
    return {
      ...TONES.green,
      Icon: Download,
      label: 'Descarga',
      title: `${actorName} descargó tu ${modType}`,
      body: modTitle,
      hasActor: true
    };
  }

  if (type === 'visibility') {
    if (notification?.visibilidad === 'publico') {
      return {
        ...TONES.green,
        Icon: Globe,
        label: 'Visibilidad',
        title: `Tu ${modType} ahora es público`,
        body: modTitle,
        hasActor: false
      };
    }
    if (notification?.visibilidad === 'privado') {
      return {
        ...TONES.amber,
        Icon: Lock,
        label: 'Visibilidad',
        title: `Tu ${modType} ahora es privado`,
        body: modTitle,
        hasActor: false
      };
    }
    return {
      ...TONES.blue,
      Icon: Eye,
      label: 'Visibilidad',
      title: `Cambiaste la visibilidad de tu ${modType}`,
      body: modTitle,
      hasActor: false
    };
  }

  switch (status) {
    case 'published':
    case 'aceptado':
      return {
        ...TONES.green,
        Icon: CheckCircle2,
        label: 'Publicado',
        title: isAdmin ? `Nuevo ${modType} publicado` : `Tu ${modType} ya está publicado`,
        body: modTitle,
        hasActor: false
      };
    case 'published_editing':
    case 'aceptado_con_edicion':
      return {
        ...TONES.blue,
        Icon: Clock,
        label: 'Cambios en revisión',
        title: isAdmin
          ? `El ${modType} está en revisión con versión pública`
          : 'Tus cambios están en revisión',
        body: modTitle,
        hasActor: false
      };
    case 'pending':
    case 'revision':
      return {
        ...TONES.amber,
        Icon: Hourglass,
        label: 'En revisión',
        title: isAdmin
          ? `${actorName} envió un ${modType} a revisión`
          : `Tu ${modType} está en revisión`,
        body: modTitle,
        hasActor: false
      };
    case 'rejected':
    case 'rechazado':
      return {
        ...TONES.red,
        Icon: isAdmin ? XCircle : AlertTriangle,
        label: 'Rechazado',
        title: isAdmin ? `El ${modType} fue rechazado` : `Tu ${modType} fue rechazado`,
        body: modTitle || 'Revisa las normas y vuelve a intentarlo.',
        hasActor: false
      };
    case 'inactive':
      return {
        ...TONES.gray,
        Icon: EyeOff,
        label: 'Inactivo',
        title: isAdmin ? `El ${modType} fue pausado` : `Tu ${modType} está pausado`,
        body: modTitle,
        hasActor: false
      };
    default:
      return {
        ...TONES.gray,
        Icon: Bell,
        label: 'Aviso',
        title: 'Actualización de tu contenido',
        body: modTitle,
        hasActor: false
      };
  }
};

/** Tiempo relativo compacto en español. */
export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;

  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};
