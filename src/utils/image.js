/**
 * Miniaturas rápidas para imágenes remotas (las suben los usuarios y
 * pesan lo que pesen). Usa el proxy wsrv.nl para servir versión
 * WebP redimensionada. Con fallback: si el proxy falla, se usa la original.
 */

const PROXY = 'https://wsrv.nl';

const getYouTubeThumbnailUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    if (!/(^|\.)ytimg\.com$/i.test(parsedUrl.hostname)) return null;

    const animatedThumbnailMatch = parsedUrl.pathname.match(/^\/an_webp\/([a-zA-Z0-9_-]+)\//);
    if (animatedThumbnailMatch) {
      return `https://img.youtube.com/vi/${animatedThumbnailMatch[1]}/mqdefault.jpg`;
    }

    return url;
  } catch {
    return null;
  }
};

/** ¿Es una URL remota que vale la pena proxear? */
export const isProxeable = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) return false;
  if (/\.svg(\?|#|$)/i.test(url)) return false; // los SVG ya pesan poco
  if (getYouTubeThumbnailUrl(url)) return false;
  return /^https?:\/\//i.test(url);
};

/**
 * Devuelve URL de miniatura WebP (ancho w px, calidad 70).
 * Si no se puede proxear, devuelve la original.
 */
export const thumbUrl = (url, w = 640) => {
  const youtubeThumbnailUrl = getYouTubeThumbnailUrl(url);
  if (youtubeThumbnailUrl) return youtubeThumbnailUrl;
  if (!isProxeable(url)) return url;
  const isHttps = /^https:/i.test(url);
  const host = url.replace(/^https?:\/\//i, '');
  const src = isHttps ? `ssl:${host}` : host;
  return `${PROXY}/?url=${encodeURIComponent(src)}&w=${w}&q=70&output=webp&we&il`;
};
