import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map();

export default function HistoryScroll() {
  const { key } = useLocation();
  const navigation = useNavigationType();

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const entry = (navigation === 'POP' && positions.get(key)) || { y: 0, anchor: null };
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
        const matches = document.querySelectorAll(`[data-recommended-id="${CSS.escape(anchor.id)}"]`);
        const card = Array.from(matches).find(node => node.getClientRects().length);
        if (card) top = window.scrollY + card.getBoundingClientRect().top - anchor.top;
      }
      if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: 'instant' });
      if (!anchor && Math.abs(window.scrollY - target) <= 1) stop();
    };
    // Algunas rutas recuperan sus datos después de montar la pantalla.
    const observer = new ResizeObserver(restore);
    const mutations = new MutationObserver(restore);
    observer.observe(document.body);
    const main = document.querySelector('main');
    if (main) observer.observe(main);
    if (anchor && main) mutations.observe(main, { childList: true, subtree: true });
    positions.delete(key);
    positions.set(key, entry);
    if (positions.size > 100) positions.delete(positions.keys().next().value);
    restore();
    const remember = () => { if (!restoring) entry.y = window.scrollY; };
    const cancel = () => { stop(); entry.anchor = null; remember(); };
    const rememberLink = event => {
      const link = event.target.closest?.('[data-recommended-id]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      stop();
      entry.y = window.scrollY;
      entry.anchor = { id: link.dataset.recommendedId, top: link.getBoundingClientRect().top };
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
  }, [key, navigation]);
  return null;
}
