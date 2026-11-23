import { useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

// All layers on a page share one history entry. Back dismisses only the top layer.
const marker = 'bsworldOverlay';
const layers = [];
let guard = null;
let pendingClose = null;
let routeKey;

export function trackOverlayRoute(key) {
  routeKey = key;
}

function pageKey() {
  return history.state?.key || 'default';
}

function syncHistory() {
  if (pendingClose) return;
  const active = layers.some(layer => layer.key === pageKey());
  if (active) {
    guard = { key: pageKey(), url: location.href };
    if (!history.state?.[marker]) {
      history.pushState({ ...history.state, [marker]: true }, '');
      // On Forward we may need to skip this closed layer to reach another page.
      history.replaceState({ ...history.state, [marker]: history.length }, '');
    }
  } else if (history.state?.[marker]) {
    leaveOverlayEntry();
  }
}

// Route-based dialogs must remove their temporary entry before replacing the URL.
export function leaveOverlayEntry(then) {
  if (!history.state?.[marker] && !pendingClose) {
    then?.();
    return;
  }
  if (pendingClose) {
    if (then) pendingClose.then = then;
    return;
  }
  pendingClose = { key: pageKey(), url: location.href, then };
  history.back();
}

function onPop(event) {
  const key = pageKey();
  const pending = pendingClose;
  pendingClose = null;
  if (pending && pending.key === key && pending.url === location.href && !event.state?.[marker]) {
    if (!pending.notifyRouter) event.stopImmediatePropagation();
    guard = null;
    pending.then?.();
    queueMicrotask(syncHistory);
    return;
  }
  if (event.state?.[marker]) {
    event.stopImmediatePropagation();
    if (routeKey === key && history.length > event.state[marker]) history.forward();
    else {
      pendingClose = { key, url: location.href, notifyRouter: routeKey !== key };
      history.back();
    }
    return;
  }
  const layer = layers[layers.length - 1];
  if (layer?.key === key && guard?.key === key && guard.url === location.href) {
    event.stopImmediatePropagation();
    guard = null;
    flushSync(() => layer.close.current());
    syncHistory();
  } else {
    guard = null;
  }
}

window.addEventListener('popstate', onPop, true);
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('popstate', onPop, true));

export function useOverlayBack(open, onClose) {
  const close = useRef(onClose);
  useLayoutEffect(() => { close.current = onClose; }, [onClose]);
  useLayoutEffect(() => {
    if (!open) return;
    const layer = { key: pageKey(), close };
    layers.push(layer);
    syncHistory();
    return () => {
      layers.splice(layers.indexOf(layer), 1);
      // Let a route change or a StrictMode remount finish before removing the entry.
      queueMicrotask(syncHistory);
    };
  }, [open]);
}
