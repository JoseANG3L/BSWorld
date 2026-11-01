import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, X, Inbox, Mail, MailOpen, Trash2, CheckCheck, RefreshCw,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, useNotifications } from '../context/AuthContext';
import {
  getUserNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  invalidateNotificationsCache,
  getUserPublicProfile,
  prefetchUserProfiles
} from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { getNotificationView, getTimeAgo, CONTENT_TYPE_LABELS } from '../utils/notifications';
import { thumbUrl } from '../utils/image';

const PER_PAGE = 20;

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'read', label: 'Leídas' }
];

// Agrupa por día para dar contexto temporal a la bandeja.
const getDayGroup = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return { key: 'older', label: 'Anteriores' };

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (diffDays <= 0) return { key: 'today', label: 'Hoy' };
  if (diffDays === 1) return { key: 'yesterday', label: 'Ayer' };
  if (diffDays < 7) return { key: 'week', label: 'Esta semana' };
  return { key: 'older', label: 'Anteriores' };
};

const NotificationSkeleton = () => (
  <div className="space-y-2.5">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border border-gray-200/70 bg-white p-3 dark:border-white/[0.06] dark:bg-[#171819] sm:p-4"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2.5 py-0.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-2.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-3.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Notificaciones = () => {
  const { user } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actorCache, setActorCache] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);

  const getActor = useCallback(
    (notif) => actorCache[notif.actorid] || null,
    [actorCache]
  );

  // --- CARGA INICIAL ---
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      invalidateNotificationsCache(user.id);
      try {
        const data = await getUserNotifications(user.id, false, PER_PAGE, 0, true);
        if (!active) return;
        setNotifications(data);
        setPage(0);
        setHasMore(data.length === PER_PAGE);
        refreshNotifications();
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
        if (active) showToast('No se pudieron cargar las notificaciones', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- PERFILES DE QUIENES INTERACTÚAN ---
  useEffect(() => {
    const ids = [...new Set(notifications.map((n) => n.actorid).filter(Boolean))]
      .filter((id) => !actorCache[id]);
    if (ids.length === 0) return;

    let active = true;
    (async () => {
      await prefetchUserProfiles(ids);
      const entries = await Promise.all(
        ids.map(async (id) => [id, await getUserPublicProfile(id)])
      );
      if (!active) return;
      setActorCache((prev) => {
        const next = { ...prev };
        entries.forEach(([id, info]) => { if (info) next[id] = info; });
        return next;
      });
    })();

    return () => { active = false; };
  }, [notifications, actorCache]);

  // --- RECARGAR ---
  const handleRefresh = async () => {
    if (!user?.id || refreshing) return;
    setRefreshing(true);
    invalidateNotificationsCache(user.id);
    try {
      const data = await getUserNotifications(user.id, false, PER_PAGE, 0, true);
      setNotifications(data);
      setPage(0);
      setHasMore(data.length === PER_PAGE);
      refreshNotifications();
    } catch (error) {
      console.error('Error actualizando notificaciones:', error);
      showToast('No se pudieron actualizar las notificaciones', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // --- CARGAR MÁS ---
  const loadMore = async () => {
    if (!user?.id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getUserNotifications(user.id, false, PER_PAGE, nextPage * PER_PAGE, true);
      setNotifications((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        return [...prev, ...data.filter((n) => !existing.has(n.id))];
      });
      setPage(nextPage);
      setHasMore(data.length === PER_PAGE);
    } catch (error) {
      console.error('Error cargando más notificaciones:', error);
      showToast('No se pudieron cargar más notificaciones', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  // --- ABRIR NOTIFICACIÓN ---
  const handleOpen = (notif) => {
    if (!notif.modid) return;
    if (!notif.leida) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)));
      markNotificationAsRead(notif.id, user?.id)
        .then(() => refreshNotifications())
        .catch(() => {});
    }
    navigate(`/view/${notif.modid}`);
  };

  // --- LEÍDA / NO LEÍDA ---
  const handleToggleRead = async (notif) => {
    const nextRead = !notif.leida;
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: nextRead } : n)));
    try {
      if (nextRead) {
        await markNotificationAsRead(notif.id, user?.id);
      } else {
        await markNotificationAsUnread(notif.id, user?.id);
      }
      invalidateNotificationsCache(user?.id);
      refreshNotifications();
      showToast(nextRead ? 'Marcada como leída' : 'Marcada como no leída', 'info');
    } catch (error) {
      console.error('Error actualizando la notificación:', error);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: notif.leida } : n)));
      showToast('No se pudo actualizar la notificación', 'error');
    }
  };

  // --- MARCAR TODAS COMO LEÍDAS ---
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    const unreadIds = new Set(notifications.filter((n) => !n.leida).map((n) => n.id));
    if (unreadIds.size === 0 && unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await markAllNotificationsAsRead(user.id);
      refreshNotifications();
      showToast('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      setNotifications((prev) => prev.map((n) => (unreadIds.has(n.id) ? { ...n, leida: false } : n)));
      showToast('No se pudieron marcar todas como leídas', 'error');
    }
  };

  // --- ELIMINAR ---
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    setNotifications((prev) => prev.filter((n) => n.id !== target.id));
    try {
      await deleteNotification(target.id);
      invalidateNotificationsCache(user?.id);
      refreshNotifications();
      showToast('Notificación eliminada');
      setPendingDelete(null);
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      setNotifications((prev) =>
        [target, ...prev].sort((a, b) => new Date(b.creado) - new Date(a.creado))
      );
      showToast('No se pudo eliminar la notificación', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // --- FILTRO + BÚSQUEDA COMBINADOS ---
  const filtered = notifications.filter((notif) => {
    if (filter === 'unread' && notif.leida) return false;
    if (filter === 'read' && !notif.leida) return false;

    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const actor = getActor(notif);
    const view = getNotificationView(notif, actor, user?.role);
    return [
      notif.modtitle,
      notif.modtype,
      notif.commenttext,
      notif.type,
      view.label,
      view.title,
      actor?.nombre
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const counts = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.leida).length,
    read: notifications.filter((n) => n.leida).length
  };

  const readPercent = counts.all > 0 ? Math.round((counts.read / counts.all) * 100) : 0;

  const groups = [];
  filtered.forEach((notif) => {
    const { key, label } = getDayGroup(notif.creado);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(notif);
    else groups.push({ key, label, items: [notif] });
  });

  const hasFilters = filter !== 'all' || searchTerm.trim().length > 0;
  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    searchRef.current?.focus();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-2 py-4 animate-fade-in-up md:px-4 md:py-6" style={{ animationDuration: '200ms' }}>

      {/* CABECERA */}
      <section className="relative mb-4 overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#171819] sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/25">
              <Bell size={23} strokeWidth={2.5} />
              {counts.unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-red-500 dark:border-[#171819]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white md:text-2xl">
                  Notificaciones
                </h1>
                {counts.unread > 0 && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                    {counts.unread > 99 ? '99+' : counts.unread} sin leer
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                Likes, comentarios y novedades de tu contenido.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar notificaciones"
              aria-label="Actualizar notificaciones"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-primary-300 hover:text-primary-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-primary-500/40 dark:hover:text-primary-400"
            >
              <RefreshCw size={15} className={clsx(refreshing && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 && counts.unread === 0}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 text-xs font-bold text-white shadow-sm shadow-primary-600/25 transition-all hover:bg-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none dark:disabled:bg-white/5 dark:disabled:text-gray-600 sm:flex-none"
            >
              <CheckCheck size={15} />
              Marcar leídas
            </button>
          </div>
        </div>

        {counts.all > 0 && (
          <div className="relative mt-4 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${readPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              {counts.read} de {counts.all} leídas
            </span>
          </div>
        )}
      </section>

      {/* FILTROS */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5 lg:w-auto">
          {TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                aria-pressed={active}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all lg:flex-none',
                  active
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                )}
              >
                {tab.label}
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200/80 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                  )}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-64">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            aria-label="Buscar notificaciones"
            placeholder="Buscar notificaciones..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1D1F23] dark:text-gray-200"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
              title="Limpiar búsqueda"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <NotificationSkeleton />
      ) : filtered.length > 0 ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-white/10" />
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((notif, index) => {
                  const actor = getActor(notif);
                  const view = getNotificationView(notif, actor, user?.role);
                  const Icon = view.Icon;
                  const canOpen = Boolean(notif.modid);
                  const contentType = CONTENT_TYPE_LABELS[notif.modtype] || 'contenido';

                  return (
                    <article
                      key={notif.id}
                      style={{
                        animationDelay: `${Math.min(index, 8) * 30}ms`,
                        animationDuration: '220ms'
                      }}
                      className={clsx(
                        'group relative flex items-start gap-2.5 overflow-hidden rounded-2xl border p-3 transition-all duration-200 animate-fade-in-up sm:gap-3 sm:p-4',
                        notif.leida
                          ? 'border-gray-200/80 bg-white hover:border-gray-300 dark:border-white/[0.06] dark:bg-[#171819] dark:hover:border-white/10'
                          : 'border-primary-200/80 bg-gradient-to-r from-primary-50/70 via-white to-white shadow-sm shadow-primary-500/5 hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/10 dark:border-primary-500/20 dark:from-primary-500/[0.08] dark:via-[#1a1b1e] dark:to-[#1a1b1e] dark:hover:border-primary-500/30'
                      )}
                    >
                      {!notif.leida && (
                        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600" />
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpen(notif)}
                        disabled={!canOpen}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-default"
                      >
                        {/* ICONO / AVATAR */}
                        <div className="relative shrink-0">
                          {view.hasActor && notif.actorid ? (
                            <>
                              <div className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-white shadow-sm dark:ring-[#171819]">
                                <AvatarRenderer avatar={actor?.imagen} name={actor?.nombre} />
                              </div>
                              <span className={clsx(
                                'absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white dark:ring-[#171819]',
                                view.badge
                              )}>
                                <Icon size={10} strokeWidth={2.5} />
                              </span>
                            </>
                          ) : (
                            <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/5', view.tile)}>
                              <Icon size={20} />
                            </div>
                          )}
                        </div>

                        {/* TEXTO */}
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={clsx('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', view.pill)}>
                              {view.label}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                              {getTimeAgo(notif.creado)}
                            </span>
                          </div>

                          <h2 className={clsx(
                            'mt-1 text-sm leading-snug line-clamp-2 sm:text-[15px]',
                            notif.leida
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'font-semibold text-gray-900 dark:text-white'
                          )}>
                            {view.title}
                          </h2>

                          {view.quote && (
                            <p className="mt-2 line-clamp-2 rounded-lg border-l-2 border-blue-400/50 bg-blue-50/60 px-2.5 py-1.5 text-[11px] italic text-gray-600 dark:bg-blue-500/10 dark:text-gray-300 sm:text-xs">
                              “{view.quote}”
                            </p>
                          )}

                          {notif.modtitle ? (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200/70 dark:border-white/10">
                                {notif.modimage ? (
                                  <img
                                    src={thumbUrl(notif.modimage, 160)}
                                    alt={notif.modtitle}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(event) => { event.currentTarget.src = '/default.jpg'; }}
                                  />
                                ) : (
                                  <div className={clsx('flex h-full w-full items-center justify-center', view.tile)}>
                                    <Icon size={15} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                  {notif.modtitle}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                  {contentType}
                                </p>
                              </div>
                              {canOpen && (
                                <ChevronRight
                                  size={15}
                                  className="ml-auto shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary-500 dark:text-gray-600 dark:group-hover:text-primary-400"
                                />
                              )}
                            </div>
                          ) : (
                            view.body && (
                              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                                {view.body}
                              </p>
                            )
                          )}
                        </div>
                      </button>

                      {/* ACCIONES */}
                      <div className="flex shrink-0 flex-col items-center gap-0.5 self-start pt-0.5 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleToggleRead(notif)}
                          title={notif.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                          aria-label={notif.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 dark:hover:text-primary-400"
                        >
                          {notif.leida ? <Mail size={15} /> : <MailOpen size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(notif)}
                          title="Eliminar notificación"
                          aria-label="Eliminar notificación"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-600 transition-all hover:border-primary-300 hover:text-primary-600 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-[#1a1b1e] dark:text-gray-300 dark:hover:border-primary-500/40 dark:hover:text-primary-400"
              >
                {loadingMore ? <LoadingSpinner variant="inline" size={14} /> : <RefreshCw size={14} />}
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ESTADO VACÍO */
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#171819]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.10),transparent_60%)]" />

          <div className="relative mb-5">
            <div className="absolute -inset-3 rounded-full bg-primary-500/5 dark:bg-primary-500/10" />
            <span className="absolute -right-3 -top-1 h-3 w-3 rounded-full bg-primary-400/40" />
            <span className="absolute -bottom-1 -left-4 h-2 w-2 rounded-full bg-indigo-400/40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-500 shadow-sm dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400">
              <Inbox size={30} />
            </div>
          </div>

          <h2 className="relative text-lg font-bold text-gray-800 dark:text-gray-200">
            {searchTerm
              ? 'Sin resultados'
              : filter === 'unread'
                ? 'Estás al día'
                : filter === 'read'
                  ? 'Nada por aquí'
                  : 'Bandeja vacía'}
          </h2>
          <p className="relative mt-1.5 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? `No encontramos notificaciones para “${searchTerm}”.`
              : filter === 'unread'
                ? 'No tienes notificaciones sin leer.'
                : filter === 'read'
                  ? 'Todavía no has leído ninguna notificación.'
                  : 'Cuando alguien interactúe con tu contenido, lo verás aquí.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-700"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in-up"
          style={{ animationDuration: '150ms' }}
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-notification-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#1e1f22]"
          >
            <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <span className="absolute -inset-2 rounded-full border border-red-200/60 dark:border-red-500/20" />
              <Trash2 size={22} />
            </div>
            <h2 id="delete-notification-title" className="text-center text-base font-bold text-gray-900 dark:text-white">
              Eliminar notificación
            </h2>
            <p className="mt-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer.
            </p>

            {pendingDelete.modtitle && (
              <p className="mt-3 line-clamp-2 rounded-xl bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                {pendingDelete.modtitle}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <LoadingSpinner variant="inline" size={14} /> : <Trash2 size={14} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
