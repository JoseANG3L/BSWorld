import { useCallback, useEffect, useRef, useState } from 'react';
import { getCatalogPage } from '../services/catalog';

const EMPTY = { items: [], total: 0, nextOffset: 0, loading: true, error: false };

export function useCatalogPages(options) {
  const [state, setState] = useState(EMPTY);
  const active = useRef(null);
  const request = useCallback(async (session) => {
    if (!session || session.busy) return;
    session.busy = true;
    const offset = session.offset;
    setState(prev => offset ? { ...prev, loading: true, error: false } : EMPTY);
    try {
      const page = await getCatalogPage({ ...session.options, offset, signal: session.controller.signal });
      if (active.current !== session) return;
      session.offset += page.items.length;
      setState(prev => {
        const seen = new Set(offset ? prev.items.map(item => item.id) : []);
        const items = offset ? [...prev.items, ...page.items.filter(item => !seen.has(item.id))] : page.items;
        return { items, total: page.total, nextOffset: session.offset, loading: false, error: false };
      });
    } catch {
      if (active.current === session) setState(prev => ({ ...prev, loading: false, error: true }));
    } finally {
      session.busy = false;
    }
  }, []);

  useEffect(() => {
    if (!options) return;
    const session = { options, offset: 0, busy: false, controller: new AbortController() };
    active.current = session;
    request(session);
    return () => {
      active.current = null;
      session.controller.abort();
    };
  }, [options, request]);

  return { ...state, loadMore: () => request(active.current) };
}
