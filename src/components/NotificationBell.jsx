import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Inbox, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, useNotifications } from '../context/AuthContext';
import {
  getUserNotifications,
  markNotificationAsRead,
  invalidateNotificationsCache,
  getUserPublicProfile,
  prefetchUserProfiles
} from '../services/api';
import AvatarRenderer from './AvatarRenderer';
import { getNotificationView, getTimeAgo, CONTENT_TYPE_LABELS } from '../utils/notifications';
import { thumbUrl } from '../utils/image';

const PANEL_LIMIT = 8;

const BellSkeleton = () => (
  <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-start gap-2.5 px-2 py-2 sm:gap-3 sm:px-3.5 sm:py-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
        <div className="flex-1 space-y-2 py-0.5">
          <div className="h-2 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

const NotificationBell = () => {
  const { user } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorCache, setActorCache] = useState({});
  const dropdownRef = useRef(null);

  const fetchRecent = useCallback(async ({ showLoader = false } = {}) => {
    if (!user?.id) {
      setLoading(false);
      setItems([]);
      return;
    }
    if (showLoader) setLoading(true);
    try {
      const data = await getUserNotifications(user.id, true, PANEL_LIMIT, 0, true);
      setItems(data);
    } catch (error) {
      console.error('Error cargando notificaciones para el panel:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar al montar y cuando cambia el usuario
  useEffect(() => {
    fetchRecent({ showLoader: true });
  }, [fetchRecent]);

  // Perfiles de quienes interactúan (una sola consulta para todos)
  useEffect(() => {
    const ids = [...new Set(items.map((n) => n.actorid).filter(Boolean))]
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
  }, [items, actorCache]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 639px)').matches) return undefined;

    const scrollY = window.scrollY;
    const bodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    const htmlOverflow = document.documentElement.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      Object.assign(document.body.style, bodyStyles);
      document.documentElement.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const togglePanel = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      fetchRecent();
      refreshNotifications();
    }
  };

  const handleOpenNotification = async (notif) => {
    setIsOpen(false);
    if (!notif.leida) {
      try {
        setItems((prev) => prev.filter((n) => n.id !== notif.id));
        await markNotificationAsRead(notif.id, user?.id);
        invalidateNotificationsCache(user?.id);
        refreshNotifications();
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    }
    if (notif.modid) navigate(`/view/${notif.modid}`);
  };

  if (!user) return null;

  return (
    <div className="relative inline-block font-sans" ref={dropdownRef}>
      {/* CAMPANA */}
      <button
        type="button"
        onClick={togglePanel}
        className={clsx(
          'relative flex h-9 w-9 items-center justify-center rounded-full border text-sm shadow-sm transition-all',
          'bg-white dark:bg-[#252525] border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400',
          'hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400',
          isOpen && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
        )}
        title="Notificaciones"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={isOpen}
      >
        <Bell size={18} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm dark:border-[#121212]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* PANEL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex h-dvh w-full flex-col overscroll-contain overflow-hidden bg-white shadow-lg shadow-black/5 animate-fade-in-up dark:bg-[#1c1d20] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:h-auto sm:max-h-none sm:w-[min(23rem,calc(100vw-1.5rem))] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl sm:shadow-black/10 sm:dark:border-white/[0.08]"
          style={{ animationDuration: '180ms' }}
        >
          {/* CABECERA */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-3.5 sm:py-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white sm:h-8 sm:w-8 sm:rounded-xl sm:bg-gradient-to-br sm:from-primary-500 sm:to-indigo-500 sm:shadow-sm sm:shadow-primary-500/25">
                <Bell size={14} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-[#1c1d20]" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-sm">
                  Notificaciones
                </h3>
                <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-[10px]">
                  {unreadCount > 0
                    ? `${unreadCount > 99 ? '99+' : unreadCount} sin leer`
                    : 'Todo al día'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white sm:hidden"
              aria-label="Cerrar notificaciones"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          {/* LISTA */}
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overscroll-contain overflow-y-auto sm:max-h-[min(24rem,calc(100vh-9rem))] sm:flex-none">
            {loading ? (
              <BellSkeleton />
            ) : items.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {items.map((notif) => {
                  const actorInfo = actorCache[notif.actorid] || null;
                  const view = getNotificationView(notif, actorInfo, user?.role);
                  const Icon = view.Icon;
                  const contentType = CONTENT_TYPE_LABELS[notif.modtype] || 'contenido';

                  return (
                    <button
                      type="button"
                      key={notif.id}
                      onClick={() => handleOpenNotification(notif)}
                      className={clsx(
                        'group relative flex w-full items-start gap-2.5 px-2.5 py-2.5 text-left transition-colors sm:gap-3 sm:px-3.5 sm:py-3',
                        'hover:bg-gray-50 dark:hover:bg-white/[0.04]',
                        !notif.leida && 'bg-gradient-to-r from-primary-50/70 to-white dark:from-primary-500/[0.08] dark:to-transparent'
                      )}
                    >
                      {!notif.leida && (
                        <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600" />
                      )}

                      <div className="relative shrink-0">
                        {view.hasActor && notif.actorid ? (
                          <>
                            <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/80 dark:ring-[#1c1d20] sm:h-9 sm:w-9 sm:ring-2">
                              <AvatarRenderer avatar={actorInfo?.imagen} name={actorInfo?.nombre} />
                            </div>
                            <span className={clsx('absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 ring-white dark:ring-[#1c1d20] sm:h-[18px] sm:w-[18px] sm:ring-2', view.badge)}>
                              <Icon size={9} strokeWidth={2.5} />
                            </span>
                          </>
                        ) : (
                          <div className={clsx('flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/5 sm:h-9 sm:w-9 sm:rounded-xl', view.tile)}>
                            <Icon size={15} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={clsx(
                            'inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-1.5 sm:text-[9px]',
                            view.pill
                          )}>
                            {view.label}
                          </span>
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-[10px]">
                            {getTimeAgo(notif.creado)}
                          </span>
                          {!notif.leida && (
                            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                          )}
                        </div>

                        <p className={clsx(
                          'mt-0.5 text-[13px] leading-snug line-clamp-2 sm:mt-1 sm:text-xs',
                          notif.leida
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'font-semibold text-gray-900 dark:text-white'
                        )}>
                          {view.title}
                        </p>

                        {view.quote && (
                          <p className="mt-1 line-clamp-2 border-l-2 border-blue-400/40 pl-1.5 text-xs italic text-gray-500 dark:text-gray-400 sm:line-clamp-1 sm:text-[10px]">
                            “{view.quote}”
                          </p>
                        )}

                        {notif.modtitle && (
                          <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1.5">
                            {notif.modimage ? (
                              <img
                                src={thumbUrl(notif.modimage, 80)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="hidden h-5 w-5 shrink-0 rounded object-cover sm:block"
                                onError={(event) => { event.currentTarget.src = '/default.jpg'; }}
                              />
                            ) : (
                              <span className={clsx('hidden h-5 w-5 shrink-0 items-center justify-center rounded sm:flex', view.tile)}>
                                <Icon size={10} />
                              </span>
                            )}
                            <span className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-[10px]">
                              {notif.modtitle}
                            </span>
                            <span className="hidden shrink-0 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:inline">
                              {contentType}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-3 py-6 text-center sm:px-6 sm:py-10">
                <div className="relative mb-2 sm:mb-3">
                  <span className="absolute -inset-2 rounded-full bg-primary-500/5 dark:bg-primary-500/10" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-500 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Inbox size={20} />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No tienes notificaciones sin leer</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-xs">
                  Aquí verás los likes, comentarios y novedades de tu contenido.
                </p>
              </div>
            )}
          </div>

          {/* PIE */}
          <Link
            to="/notificaciones"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-gray-100 bg-gray-50/50 px-2.5 py-2 text-[13px] font-bold text-primary-600 transition-colors hover:bg-primary-50 dark:border-white/[0.06] dark:bg-white/[0.01] dark:text-primary-400 dark:hover:bg-primary-500/10 sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-xs"
          >
            Ver todas
            <ChevronRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
