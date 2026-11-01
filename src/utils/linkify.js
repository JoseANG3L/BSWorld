/**
 * Auto-detección de enlaces en texto:
 * - URLs http(s)/www... -> enlace externo
 * - @usuario -> enlace al perfil /u/usuario
 * - Rutas internas (/view/:id, /u/:x, /foro/:id, ...) -> navegación interna
 * Respeta bloques de código y enlaces markdown ya existentes.
 */

const USERNAME = '[A-Za-z0-9_][A-Za-z0-9_.]{0,19}';
const PATHS = 'view|u|foro|comunidad|mods|buscar|destacados|mis-mods|notificaciones|configuracion|acerca-de|contacto|ayuda|terminos|privacidad|cookies|licencias|login-page|subir|admin|edit';
const PATH_RE = `\\/(?:${PATHS})(?:\\/[A-Za-z0-9_.~:/?#[\\]@!$&'()*+,;=%-]*)?`;

// Una sola pasada: mención o ruta interna (evita procesar lo ya generado)
const COMBINED_RE = new RegExp(
  `(^|[^A-Za-z0-9_.@/])@(${USERNAME})` +
  `|(^|[\\s(>])(https?:\\/\\/[^\\s<]*?)?(${PATH_RE})`, 'g');

// Bloques de código cercado, enlaces/imágenes markdown y código inline: no tocar
const PROTECTED_RE = /(`[^`]*`|\[[^\]]*\]\([^)]*\)|!\[[^\]]*\]\([^)]*\))/g;
const FENCED_RE = /(```[\s\S]*?(?:```|$))/g;

/** Convierte @usuario y rutas internas en enlaces markdown. Una sola pasada. */
export const linkifyMentions = (md) => {
  if (!md || typeof md !== 'string') return md;
  return md.split(FENCED_RE).map((part, i) => {
    if (i % 2 === 1) return part; // bloque de código intacto
    return part.split(PROTECTED_RE).map((seg, j) => {
      if (j % 2 === 1) return seg; // código inline o enlace existente
      return seg.replace(COMBINED_RE, (m, preM, name, preP, origin, path) => {
        if (name !== undefined) {
          const clean = name.replace(/[.]+$/, '');
          const trail = name.slice(clean.length);
          if (!clean) return m;
          return `${preM}[@${clean}](/u/${clean})${trail}`;
        }
        if (origin) return m; // URL completa: la maneja SmartLink
        const clean = path.replace(/[.,;:!?)]+$/, '');
        const trail = path.slice(clean.length);
        return `${preP}[${clean}](${clean})${trail}`;
      });
    }).join('');
  }).join('');
};

/** ¿Es una ruta interna de la app? Devuelve el path o null. */
export const toInternalPath = (href) => {
  if (!href || typeof href !== 'string') return null;
  if (href.startsWith('/')) return href;
  try {
    const u = new URL(href);
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return u.pathname + u.search + u.hash;
    }
  } catch {
    return null;
  }
  return null;
};

const TRAIL_RE = /[.,;:!?)]+$/;

/** Quita puntuación final que no es parte del enlace. */
export const splitTrail = (token) => {
  const m = token.match(TRAIL_RE);
  if (!m) return [token, ''];
  return [token.slice(0, -m[0].length), m[0]];
};
