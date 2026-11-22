import { supabase } from './supabaseClient';

export const PAGE_SIZE = 12;
export const CARD_COLUMNS = 'id,titulo,imagen,descargas,creadores,tags,aporte,vistas,likes_count,tipo,creado,estado,visibilidad,parent_id';
const TTL = 120_000;
const pages = new Map();
let generation = 0;
let legacyRows;
let viewMissingUntil = 0;

export function clearCatalogPages() {
  generation++;
  pages.clear();
  legacyRows = undefined;
}

function publicContentQuery(columns, options) {
  return supabase.from('content').select(columns, options)
    .eq('estado', 'aceptado').eq('visibilidad', 'publico').is('parent_id', null);
}

export function isMissingView(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

// Compatibilidad con instalaciones que todavía no han aplicado la migración.
export async function readPublicRows(columns, signal) {
  const rows = [];
  const size = 250;
  let total;
  do {
    const offset = rows.length;
    let query = publicContentQuery(columns, offset ? undefined : { count: 'exact' })
      .order('id').range(offset, offset + size - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, count, error } = await query;
    if (error?.code === 'PGRST103' && offset) break;
    if (error) throw error;
    if (!offset) total = count;
    rows.push(...data);
    if (!data.length || (total == null && data.length < size)) break;
  } while (total == null || rows.length < total);
  return rows;
}

function searchTerms(text) {
  return [...new Set(text.trim().toLowerCase().split(/\s+/).filter(Boolean))];
}

function literalPattern(terms) {
  return terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}

async function legacyContentPage({ search, refine, title, types, sort, offset, signal }) {
  const version = generation;
  let rows = legacyRows?.rows;
  if (!rows || Date.now() >= legacyRows.expires) {
    rows = await readPublicRows(CARD_COLUMNS + ',descripcion', signal);
    if (version === generation) legacyRows = { rows, expires: Date.now() + TTL };
  }
  const termGroups = [search, refine].filter(Boolean).map(searchTerms);
  const matches = rows.filter(item => {
    if (types.length && !types.includes(item.tipo)) return false;
    if (title && !String(item.titulo || '').toLowerCase().includes(title.toLowerCase())) return false;
    if (!termGroups.length) return true;
    const creators = [item.creadores].flat().map(c => typeof c === 'string' ? c : c?.nombre || c?.username);
    const text = [item.titulo, item.descripcion, ...[item.tags].flat(), ...creators].join(' ').toLowerCase();
    return termGroups.every(terms => terms.some(term => text.includes(term)));
  });
  const downloads = item => (item.descargas || []).reduce((sum, d) => sum + (Number(d?.count) || 0), 0);
  const compare = (a, b) => {
    switch (sort) {
      case 'mas_descargas': return downloads(b) - downloads(a);
      case 'mas_vistas': return (b.vistas || 0) - (a.vistas || 0);
      case 'mas_likes': return (b.likes_count || 0) - (a.likes_count || 0);
      case 'az': return String(a.titulo || '').localeCompare(b.titulo || '');
      case 'za': return String(b.titulo || '').localeCompare(a.titulo || '');
      case 'antiguos': return new Date(a.creado) - new Date(b.creado);
      default: return new Date(b.creado) - new Date(a.creado);
    }
  };
  matches.sort((a, b) => compare(a, b) || String(a.id).localeCompare(String(b.id)));
  return { items: matches.slice(offset, offset + PAGE_SIZE), total: matches.length };
}

// search busca palabras en todo el registro. title filtra por el título en las categorías.
export async function getCatalogPage({ users = false, search = '', refine = '', title = '',
  types = [], sort = 'recientes', offset = 0, signal } = {}) {
  const key = JSON.stringify([users, search, refine, title, types, sort, offset]);
  const cached = pages.get(key);
  if (cached && cached.expires > Date.now()) return cached.page;
  const version = generation;
  const useView = !users && Boolean(search || sort === 'mas_descargas');
  let page;
  if (!useView || Date.now() >= viewMissingUntil) {
    const counts = { count: 'exact' };
    let query = users
      ? supabase.from('users').select('id,username,avatar,role,createdat', counts)
      : useView ? supabase.from('public_mod_catalog').select(CARD_COLUMNS, counts)
        : publicContentQuery(CARD_COLUMNS, counts);
    if (types.length) query = query.in(users ? 'role' : 'tipo', types);
    if (title) query = query.filter('titulo', 'imatch', literalPattern([title]));
    for (const words of new Set([search, refine].filter(Boolean))) {
      const pattern = literalPattern(searchTerms(words));
      if (users) {
        const quoted = JSON.stringify(pattern);
        query = query.or('username.imatch.' + quoted + ',descripcion.imatch.' + quoted);
      } else {
        query = query.filter('search_text', 'imatch', pattern);
      }
    }
    const orderColumn = { az: users ? 'username' : 'titulo', za: users ? 'username' : 'titulo',
      mas_descargas: 'download_count', mas_vistas: 'vistas', mas_likes: 'likes_count' }[sort]
      || (users ? 'createdat' : 'creado');
    query = query.order(orderColumn, { ascending: sort === 'az' || sort === 'antiguos', nullsFirst: false })
      .order('id').range(offset, offset + PAGE_SIZE - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, count, error } = await query;
    if (!error) page = { items: data, total: count };
    else if (offset && error.code === 'PGRST103') page = { items: [], total: offset };
    else if (useView && isMissingView(error)) viewMissingUntil = Date.now() + TTL;
    else throw error;
  }
  if (!page) page = await legacyContentPage({ search, refine, title, types, sort, offset, signal });
  if (version === generation && !signal?.aborted) {
    if (pages.size >= 40) pages.delete(pages.keys().next().value);
    pages.set(key, { page, expires: Date.now() + TTL });
  }
  return page;
}
