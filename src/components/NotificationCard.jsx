import React from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';
import { getNotificationView, getTimeAgo } from '../utils/notifications';
import { thumbUrl } from '../utils/image';

/**
 * Tarjeta única de notificación.
 * La usan tanto la campana (compact) como la página de notificaciones.
 */
const NotificationCard = ({
  notification,
  actor = null,
  userRole = null,
  onOpen,
  onToggleRead,
  onDelete,
  compact = false,
  className,
  style
}) => {
  const view = getNotificationView(notification, actor, userRole);
  const Icon = view.Icon;
  const isUnread = !notification.leida;
  const canOpen = Boolean(notification.modid && onOpen);

  const surface = isUnread
    ? compact
      ? 'bg-gradient-to-r from-primary-50/70 to-white hover:from-primary-50 dark:from-primary-500/[0.08] dark:to-transparent dark:hover:from-primary-500/[0.12]'
      : 'bg-primary-50/60 hover:bg-primary-50 dark:bg-primary-500/[0.06] dark:hover:bg-primary-500/[0.09]'
    : compact
      ? 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]';

  return (
    <article
      style={style}
      className={clsx(
        'group relative flex items-start transition-colors duration-200',
        compact
          ? 'gap-1.5 px-2.5 py-2.5 sm:gap-2 sm:px-3.5 sm:py-3'
          : 'gap-1.5 p-3 sm:gap-2 sm:p-3.5',
        surface,
        className
      )}
    >
      {isUnread && (
        <span
          className={clsx(
            'absolute left-0 w-[3px] rounded-r-full bg-gradient-to-b from-primary-400 to-primary-600',
            compact ? 'top-1/2 h-8 -translate-y-1/2' : 'inset-y-3'
          )}
        />
      )}

      {/* CONTENIDO ABRIBLE */}
      <button
        type="button"
        onClick={canOpen ? () => onOpen(notification) : undefined}
        disabled={!canOpen}
        className={clsx(
          'flex min-w-0 flex-1 items-start text-left disabled:cursor-default',
          compact ? 'gap-2.5 sm:gap-3' : 'gap-2.5 sm:gap-3'
        )}
      >
        {/* ICONO / AVATAR */}
        <div className="relative shrink-0">
          {view.hasActor && notification.actorid ? (
            <>
              <div
                className={clsx(
                  'overflow-hidden rounded-full ring-1 ring-white/80 dark:ring-[#1c1d20] sm:ring-2',
                  compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-9 w-9'
                )}
              >
                <AvatarRenderer avatar={actor?.imagen} name={actor?.nombre} />
              </div>
              <span
                className={clsx(
                  'absolute -bottom-1 -right-1 flex items-center justify-center rounded-full ring-1 ring-white dark:ring-[#1c1d20] sm:ring-2',
                  compact ? 'h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]' : 'h-4 w-4',
                  view.badge
                )}
              >
                <Icon size={9} strokeWidth={2.5} />
              </span>
            </>
          ) : (
            <div
              className={clsx(
                'flex items-center justify-center ring-1 ring-black/5 dark:ring-white/5',
                compact ? 'h-8 w-8 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl' : 'h-9 w-9 rounded-xl',
                view.tile
              )}
            >
              <Icon size={compact ? 15 : 17} />
            </div>
          )}
        </div>

        {/* TEXTO */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span
              className={clsx(
                'inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-1.5',
                view.pill
              )}
            >
              {view.label}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-[10px]">
              {getTimeAgo(notification.creado)}
            </span>
          </div>

          <p
            className={clsx(
              'mt-0.5 line-clamp-2 text-sm leading-snug sm:mt-1 sm:text-xs',
              notification.leida
                ? 'text-gray-600 dark:text-gray-400'
                : 'font-semibold text-gray-900 dark:text-white'
            )}
          >
            {view.title}
          </p>

          {view.quote && (
            <p className="mt-1 line-clamp-2 text-xs italic text-gray-500 dark:text-gray-400 sm:line-clamp-1 sm:text-[10px]">
              “{view.quote}”
            </p>
          )}

          {notification.modtitle ? (
            <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1.5">
              {notification.modimage ? (
                <img
                  src={thumbUrl(notification.modimage, 80)}
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
              <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-[10px]">
                {notification.modtitle}
              </span>
            </div>
          ) : (
            view.body && (
              <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-500">
                {view.body}
              </p>
            )
          )}
        </div>
      </button>

      {/* ACCIONES */}
      {(onToggleRead || onDelete) && (
        <div
          className={clsx(
            'flex shrink-0 flex-col items-center gap-0.5 self-start pt-0.5 transition-opacity duration-200',
            !compact && 'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
          )}
        >
          {onToggleRead && (
            <button
              type="button"
              onClick={() => onToggleRead(notification)}
              title={notification.leida ? 'Marcar como no leída' : 'Marcar como leída'}
              aria-label={notification.leida ? 'Marcar como no leída' : 'Marcar como leída'}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 dark:hover:text-primary-400"
            >
              {notification.leida ? <Mail size={14} /> : <MailOpen size={14} />}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(notification)}
              title="Eliminar notificación"
              aria-label="Eliminar notificación"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default NotificationCard;
