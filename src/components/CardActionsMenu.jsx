import { createElement, Fragment, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { useOverlayBack } from '../hooks/useOverlayBack';

export default function CardActionsMenu({ label, actions }) {
  const [anchor, setAnchor] = useState(null);
  const menuRef = useRef(null);
  const startAtEnd = useRef(false);
  const menuId = useId();

  const dismiss = () => {
    anchor?.focus({ preventScroll: true });
    setAnchor(null);
  };
  useOverlayBack(Boolean(anchor), dismiss);

  useLayoutEffect(() => {
    if (!anchor) return;
    const menu = menuRef.current;
    const positionMenu = () => {
      const rect = anchor.getBoundingClientRect();
      const top = rect.bottom + 6;
      menu.style.top = `${top + menu.offsetHeight <= window.innerHeight ? top : Math.max(4, rect.top - menu.offsetHeight - 6)}px`;
      menu.style.left = `${Math.max(4, rect.right - menu.offsetWidth)}px`;
    };
    const closeOutside = (event) => {
      if (!menu.contains(event.target) && !anchor.contains(event.target)) setAnchor(null);
    };
    positionMenu();
    (startAtEnd.current ? menu.lastElementChild : menu.firstElementChild).focus({ preventScroll: true });
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('scroll', positionMenu, true);
    window.addEventListener('resize', positionMenu);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('scroll', positionMenu, true);
      window.removeEventListener('resize', positionMenu);
    };
  }, [anchor]);

  const handleMenuKey = (event) => {
    if (event.key === 'Tab') {
      dismiss();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'));
    const offset = event.key === 'ArrowUp' ? -1 : 1;
    let target = (items.indexOf(event.target) + offset + items.length) % items.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = items.length - 1;
    items[target].focus();
  };

  return (
    <>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => { startAtEnd.current = false; setAnchor(anchor ? null : event.currentTarget); }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          startAtEnd.current = event.key === 'ArrowUp';
          setAnchor(event.currentTarget);
        }}
        className="flex h-9 w-4 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-primary-500 aria-expanded:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:aria-expanded:bg-gray-800">
        <MoreVertical size={18} aria-hidden="true" />
      </button>
      {anchor && createPortal(
        <div ref={menuRef} id={menuId} role="menu" aria-label={label} onKeyDown={handleMenuKey}
          className="fixed z-[70] w-max min-w-44 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-[#1e1e1e]">
          {actions.map(({ label: text, icon, onSelect, destructive }, index) => (
            <Fragment key={text}>
              {index > 0 && destructive && <div role="separator" className="my-0.5 h-px bg-gray-100 dark:bg-gray-800" />}
              <button type="button" role="menuitem" tabIndex={-1} onClick={() => { dismiss(); onSelect(); }}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  destructive
                    ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus-visible:bg-red-950/30'
                    : 'text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:focus-visible:bg-gray-700/60'
                )}>
                {createElement(icon, { size: 16, className: 'shrink-0', 'aria-hidden': true })}
                {text}
              </button>
            </Fragment>
          ))}
        </div>,
        anchor.closest('dialog') || document.body
      )}
    </>
  );
}
