import { trackOverlayRoute } from '../hooks/useOverlayBack';
import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map();
function visibleAnchor(id) {
  return Array.from(document.querySelectorAll(`[data-scroll-anchor="${CSS.escape(id)}"]`))
    .find(node => node.getClientRects().length);
}

export default function HistoryScroll() {
  const { key, pathname } = useLocation();
  const navigation = useNavigationType();

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    trackOverlayRoute(key);

    const saved = navigation === 'POP' && positions.get(key);
    const entry = saved || { y: 0, anchor: null };
    const enteringDetail = !saved && /^\/view\/[^/]+\/?$/.test(pathname);
    const target = entry.y;
    const anchor = entry.anchor;
    let restoring = true;
    const stop = () => {
      restoring = false;
      observer.disconnect();
      mutations.disconnect();
    };
    const restore = () => {
      if (!restoring) return;
      let top = target;
      if (anchor) {
        // Hay dos listas responsivas. Solo una tiene una posición visible.
        const element = visibleAnchor(anchor.id);
        if (element) top = window.scrollY + element.getBoundingClientRect().top - anchor.top;
      }
      if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: 'instant' });
      // El indicador de carga puede estar arriba antes de que exista la galería.
      if (enteringDetail && !document.querySelector('[data-content-detail]')) return;
      if (!anchor && Math.abs(window.scrollY - target) <= 1) stop();
    };
    // Algunas rutas recuperan sus datos después de montar la pantalla.
    const observer = new ResizeObserver(restore);
    const mutations = new MutationObserver(restore);
    observer.observe(document.body);
    const main = document.querySelector('main');
    if (main) observer.observe(main);
    if ((anchor || enteringDetail) && main) mutations.observe(main, { childList: true, subtree: true });
    positions.delete(key);
    positions.set(key, entry);
    if (positions.size > 100) positions.delete(positions.keys().next().value);
    restore();
    const remember = () => { if (!restoring) entry.y = window.scrollY; };
    const cancel = () => { stop(); entry.anchor = null; remember(); };
    const rememberLink = event => {
      const link = event.target.closest?.('a[data-scroll-anchor], a[data-return-anchor]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const id = link.dataset.returnAnchor || link.dataset.scrollAnchor;
      const element = link.dataset.returnAnchor ? visibleAnchor(id) : link;
      if (!element) return;
      stop();
      entry.y = window.scrollY;
      entry.anchor = { id, top: element.getBoundingClientRect().top };
    };
    window.addEventListener('click', rememberLink, true);
    if (anchor) document.addEventListener('animationend', restore, true);
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    inputs.forEach(event => window.addEventListener(event, cancel, { passive: true }));
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      stop();
      window.removeEventListener('click', rememberLink, true);
      document.removeEventListener('animationend', restore, true);
      inputs.forEach(event => window.removeEventListener(event, cancel));
      window.removeEventListener('scroll', remember);
    };
  }, [key, navigation, pathname]);
  return null;
}
