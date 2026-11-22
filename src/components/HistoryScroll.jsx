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
    const target = navigation === 'POP' ? positions.get(key) || 0 : 0;
    let restoring = true;
    const stop = () => { restoring = false; observer.disconnect(); };
    const restore = () => {
      window.scrollTo({ top: target, behavior: 'instant' });
      if (Math.abs(window.scrollY - target) <= 1) stop();
    };
    // Algunas rutas recuperan sus datos después de montar la pantalla.
    const observer = new ResizeObserver(restore);
    observer.observe(document.body);
    const main = document.querySelector('main');
    if (main) observer.observe(main);
    positions.delete(key);
    positions.set(key, target);
    if (positions.size > 100) positions.delete(positions.keys().next().value);
    restore();
    const remember = () => { if (!restoring) positions.set(key, window.scrollY); };
    const cancel = () => { stop(); remember(); };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    inputs.forEach(event => window.addEventListener(event, cancel, { passive: true }));
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      stop();
      inputs.forEach(event => window.removeEventListener(event, cancel));
      window.removeEventListener('scroll', remember);
    };
  }, [key, navigation]);
  return null;
}
