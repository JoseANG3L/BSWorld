import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Inbox, Trash2, CheckCheck, RefreshCw
} from 'lucide-react';
import { useAuth, useNotifications } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
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
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationCard from '../components/NotificationCard';
import NotificationFilters from '../components/NotificationFilters';
import PageHeader from '../components/PageHeader';
import { useToast } from '../hooks/useToast';
import { getNotificationView } from '../utils/notifications';

const PER_PAGE = 20;

// Agrupa por día para dar contexto temporal a la bandeja.
const getDayGroup = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return { key: 'older', label: '' };

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (diffDays <= 0) return { key: 'today', label: 'Hoy' };
  if (diffDays === 1) return { key: 'yesterday', label: 'Ayer' };
  if (diffDays < 7) return { key: 'week', label: 'Esta semana' };
  return { key: 'older', label: '' };
};

const NotificationSkeleton = () => (
  <div className="space-y-2.5">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border border-gray-200/70 bg-white p-3 dark:border-transparent dark:bg-[#171819] sm:p-4"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2.5 py-0.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
              <div className="h-2.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-3.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-2/5 rounded-full bg-gray-200 dark:bg-gray-700" />
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actorCache, setActorCache] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);
  const notificationsRequestRef = useRef(0);

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
      const requestId = ++notificationsRequestRef.current;
      setLoading(true);
      invalidateNotificationsCache(user.id);
      try {
        const data = await getUserNotifications(user.id, false, PER_PAGE, 0, true);
        if (!active || requestId !== notificationsRequestRef.current) return;
        setNotifications(data);
        setPage(0);
        setHasMore(data.length === PER_PAGE);
        refreshNotifications();
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
        if (active && requestId === notificationsRequestRef.current) {
          showToast('No se pudieron cargar las notificaciones', 'error');
        }
      } finally {
        if (active && requestId === notificationsRequestRef.current) setLoading(false);
      }
    };

    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // --- ACTUALIZACIÓN EN TIEMPO REAL ---
  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `userid=eq.${user.id}`
        },
        async () => {
          if (!active) return;
          const requestId = ++notificationsRequestRef.current;
          const limit = (page + 1) * PER_PAGE;
          invalidateNotificationsCache(user.id);
          try {
            const data = await getUserNotifications(user.id, false, limit, 0, true);
            if (!active || requestId !== notificationsRequestRef.current) return;
            setNotifications(data);
            setHasMore(data.length === limit);
          } catch (error) {
            console.error('Error actualizando notificaciones en tiempo real:', error);
            if (active && requestId === notificationsRequestRef.current) {
              showToast('No se pudieron actualizar las notificaciones', 'error');
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Error en la suscripción de notificaciones: ${status}`);
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, page, showToast]);

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

  // --- CARGAR MÁS ---
  const loadMore = async () => {
    if (!user?.id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const requestId = ++notificationsRequestRef.current;
    try {
      const nextPage = page + 1;
      const data = await getUserNotifications(user.id, false, PER_PAGE, nextPage * PER_PAGE, true);
      if (requestId !== notificationsRequestRef.current) return;
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

    if (dateFilter !== 'all') {
      const notificationDate = new Date(notif.creado);
      if (Number.isNaN(notificationDate.getTime())) return false;
      const now = new Date();
      if (dateFilter === 'today') {
        if (notificationDate.toDateString() !== now.toDateString()) return false;
      } else {
        const days = dateFilter === '7days' ? 7 : 30;
        const fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - days);
        if (notificationDate < fromDate || notificationDate > now) return false;
      }
    }

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

  const hasUnreadNotifications = notifications.some((notification) => !notification.leida);

  const groups = [];
  filtered.forEach((notif) => {
    const { key, label } = getDayGroup(notif.creado);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(notif);
    else groups.push({ key, label, items: [notif] });
  });

  const hasFilters = filter !== 'all' || dateFilter !== 'all' || searchTerm.trim().length > 0;
  const clearFilters = () => {
    setFilter('all');
    setDateFilter('all');
    setSearchTerm('');
    searchRef.current?.focus();
  };

  return (
    <div className="flex w-full flex-col p-2 animate-fade-in-up md:p-4" style={{ animationDuration: '200ms' }}>

      {/* CABECERA */}
      <section className="mb-3 md:mb-4 flex min-w-0 flex-row flex-nowrap items-center gap-1 md:gap-3">
        <PageHeader
          title="Notificaciones"
          icon={Bell}
          gradientClass="from-blue-500 to-cyan-500"
          hideTitleOnMobile
          className="shrink-0 gap-2"
        />

        <NotificationFilters
          filter={filter}
          dateFilter={dateFilter}
          onFilterChange={setFilter}
          onDateFilterChange={setDateFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchRef={searchRef}
          className="mb-0 min-w-0 flex-1 basis-0 gap-1 md:gap-3"
        />

        <div className="flex shrink-0 items-center gap-1.5">
          {(unreadCount > 0 || hasUnreadNotifications) && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              aria-label="Marcar todas como leídas"
              title="Marcar todas como leídas"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-xs font-semibold text-white transition-colors hover:bg-primary-700 sm:h-9 sm:w-auto sm:gap-1 sm:rounded-lg sm:px-2.5"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Marcar todas</span>
            </button>
          )}
        </div>
      </section>

      {/* LISTA */}
      {loading ? (
        <NotificationSkeleton />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <div className="mb-1.5 px-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {group.label}
                  </span>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 dark:border-transparent dark:bg-[#171819] dark:divide-white/[0.06]">
                {group.items.map((notif, index) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    actor={getActor(notif)}
                    userRole={user?.role}
                    onOpen={handleOpen}
                    onToggleRead={handleToggleRead}
                    onDelete={setPendingDelete}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 30}ms`,
                      animationDuration: '220ms'
                    }}
                  />
                ))}
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
          <div className="relative mb-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
              <Inbox size={26} />
            </div>
          </div>

          <h2 className="relative text-lg font-bold text-gray-800 dark:text-gray-200">
            {searchTerm
              ? 'Sin resultados'
              : dateFilter !== 'all'
                ? 'Sin notificaciones en este periodo'
              : filter === 'unread'
                ? 'Estás al día'
                : filter === 'read'
                  ? 'Nada por aquí'
                  : 'Bandeja vacía'}
          </h2>
          <p className="relative mt-1.5 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? `No encontramos notificaciones para “${searchTerm}”.`
              : dateFilter !== 'all'
                ? 'Prueba con otro periodo o limpia los filtros.'
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
