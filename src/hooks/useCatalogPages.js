import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { catalogStamp, getCatalogPage, isCatalogCurrent } from '../services/catalog';
import { VisitContext } from './useVisitState';

const EMPTY = { items: [], total: 0, nextOffset: 0, loading: true, error: false };

export function useCatalogPages(options, slot = 'catalog') {
  const visit = useContext(VisitContext);
  const signature = JSON.stringify(options);
  const [state, setState] = useState(() => {
    const saved = visit?.get(slot);
    return saved?.signature === signature && isCatalogCurrent(saved.stamp) ? saved.state : EMPTY;
  });
  const active = useRef(null);
  const request = useCallback(async (session) => {
    if (!session || session.busy) return;
    session.busy = true;
    const offset = session.offset;
    setState(prev => offset ? { ...prev, loading: true, error: false } : EMPTY);
    try {
      let next;
      do {
        const page = await getCatalogPage({ ...session.options, offset: session.offset, signal: session.controller.signal });
        if (active.current !== session) return;
        const seen = new Set(session.items.map(item => item.id));
        session.items = [...session.items, ...page.items.filter(item => !seen.has(item.id))];
        session.offset += page.items.length;
        next = { items: session.items, total: page.total, nextOffset: session.offset, loading: false, error: false };
        if (!page.items.length || session.offset >= page.total) break;
      } while (session.offset < session.restoreCount);
      visit?.set(slot, { signature: session.signature, stamp: session.stamp, state: next });
      setState(next);
    } catch {
      if (active.current === session) setState(prev => ({ ...prev, loading: false, error: true }));
    } finally {
      session.busy = false;
    }
  }, [visit, slot]);

  useEffect(() => {
    if (!options) return;
    const saved = visit?.get(slot);
    const previous = saved?.signature === signature ? saved.state : null;
    const restored = isCatalogCurrent(saved?.stamp) ? previous : null;
    const session = { options, signature, stamp: restored ? saved.stamp : catalogStamp(), offset: restored?.nextOffset || 0, items: restored?.items || [],
      restoreCount: previous?.nextOffset || 0, busy: false, controller: new AbortController() };
    active.current = session;
    if (restored) setState(restored);
    else request(session);
    return () => {
      active.current = null;
      session.controller.abort();
    };
  }, [options, request, visit, slot, signature]);

  return { ...state, loadMore: () => request(active.current) };
}
