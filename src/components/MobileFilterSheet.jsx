import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayBack } from '../hooks/useOverlayBack';
import FilterModalHeader from './FilterModalHeader';

export default function MobileFilterSheet({ children, onClose, onApply, desktopWidth = 768 }) {
  const ref = useRef(null);
  useOverlayBack(true, onClose);

  useLayoutEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      trigger?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia(`(min-width: ${desktopWidth}px)`);
    const handleResize = () => { if (desktop.matches) onClose(); };
    handleResize();
    desktop.addEventListener('change', handleResize);
    return () => desktop.removeEventListener('change', handleResize);
  }, [desktopWidth, onClose]);

  return createPortal(
    <dialog ref={ref} aria-label="Filtros" onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.currentTarget === event.target) onClose(); }}
      className="fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0 text-gray-900 backdrop:bg-black/50 dark:text-white">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-dark-bg">
        <div className="shrink-0 px-4 pt-3">
          <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-gray-300 dark:bg-gray-700" />
          <FilterModalHeader onClose={onClose} />
        </div>
        <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        <div className="flex shrink-0 gap-2 border-t border-gray-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/10">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl bg-gray-100 text-sm font-semibold dark:bg-[#1D1F23]">Cancelar</button>
          <button type="button" onClick={onApply} className="h-11 flex-[2] rounded-xl bg-primary-600 text-sm font-semibold text-white hover:bg-primary-700">Aplicar filtros</button>
        </div>
      </div>
    </dialog>, document.body
  );
}
