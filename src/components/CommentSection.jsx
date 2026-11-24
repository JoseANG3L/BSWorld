import { useOverlayBack } from '../hooks/useOverlayBack';
import { useVisitState } from '../hooks/useVisitState';
import { catalogStamp, isCatalogCurrent } from '../services/catalog';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SendHorizontal, Trash2, Edit3, LogIn, X, Reply, Check, Heart, ChevronDown, ChevronRight, ChevronUp, Link as LinkIcon, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import {
  getCommentsByContent,
  getRepliesByComment,
  createComment,
  updateComment,
  deleteComment
} from '../services/api';
import AvatarRenderer from './AvatarRenderer';
import CardActionsMenu from './CardActionsMenu';
import RichText from './RichText';
import { createPortal } from 'react-dom';
import LoadingSpinner from './LoadingSpinner';

const commentInputStyle = "block h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white pl-3 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm outline-none dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200";
const desktopCommentsQuery = '(min-width: 1024px)';

const SendCommentButton = ({ label, disabled, loading = false }) => (
  <button type="submit" aria-label={label} disabled={disabled}
    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-lg bg-transparent text-primary-600 hover:text-primary-700 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-primary-400 dark:hover:text-primary-300 dark:disabled:text-gray-500">
    {loading ? <LoadingSpinner variant="inline" size={18} /> : <SendHorizontal size={20} strokeWidth={2} aria-hidden="true" />}
  </button>
);

const openDialog = (dialog) => {
  if (dialog && !dialog.open) dialog.showModal();
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} d`;
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};


const CommentText = ({ text }) => (
  <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    <RichText text={text} />
  </p>
);


const CommentCard = ({ comment, contentId, onCommentMutated, isReply = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.text);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useOverlayBack(showLoginModal, () => setShowLoginModal(false));

  const isAuthor = Boolean(user?.id) && user.id === comment.user_id;

  // Cargar respuestas cuando se habilite el visor de respuestas
  useEffect(() => {
    if (showReplies) {
      loadReplies();
    }
  }, [showReplies]);

  const loadReplies = async () => {
    try {
      const data = await getRepliesByComment(comment.id);
      setReplies(data);
    } catch (err) {
      console.error("Error al cargar respuestas:", err);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!replyText.trim()) return;
    try {
      await createComment(user.id, contentId, replyText, comment.id);
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
      await loadReplies();
      onCommentMutated();
    } catch (err) {
      console.error("Error al responder:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    try {
      await updateComment(comment.id, editText);
      setIsEditing(false);
      onCommentMutated();
    } catch (err) {
      console.error("Error al actualizar comentario:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;
    try {
      await deleteComment(comment.id);
      onCommentMutated();
    } catch (err) {
      console.error("Error al eliminar comentario:", err);
    }
  };

  const hasReplies = comment.replies_count > 0;

  const username = comment.users?.username || 'Usuario';

  return (
    <article className={clsx(
      "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-2.5 gap-y-2",
      isReply && "ml-4 sm:ml-10"
    )}>
      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-[#1D1F23]">
        <AvatarRenderer avatar={comment.users?.avatar} name={username} />
      </div>
      <div className="min-w-0">
        <header className="flex min-w-0 items-center gap-2">
          <span title={username} className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
            {username}
          </span>
          <time dateTime={comment.created_at} className="shrink-0 whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
            {getRelativeTime(comment.created_at)}
          </time>
          {isAuthor && (
            <span className="mr-auto shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              Autor
            </span>
          )}
          {isAuthor && !isEditing && (
            <CardActionsMenu label="Opciones del comentario" actions={[
              { label: 'Editar', icon: Edit3, onSelect: () => { setEditText(comment.text); setIsEditing(true); } },
              { label: 'Eliminar', icon: Trash2, onSelect: handleDelete, destructive: true }
            ]} />
          )}
        </header>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="relative mt-2">
            <input
              type="text"
              aria-label="Editar comentario"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={clsx(commentInputStyle, "pr-20")}
              required
              autoFocus
            />
            <div className="absolute inset-y-0 right-1 flex items-center">
              <button type="submit" aria-label="Guardar cambios" title="Guardar cambios" disabled={!editText.trim()}
                className="grid h-9 w-9 place-items-center rounded-lg bg-transparent text-primary-600 hover:text-primary-700 focus-visible:outline-primary-500 disabled:text-gray-400 dark:text-primary-400 dark:hover:text-primary-300">
                <Check size={18} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Cancelar edición" title="Cancelar edición" onClick={() => { setIsEditing(false); setEditText(comment.text); }}
                className="grid h-9 w-9 place-items-center rounded-lg bg-transparent text-gray-500 hover:text-gray-800 focus-visible:outline-primary-500 dark:text-gray-400 dark:hover:text-white">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : (
          <>
            <CommentText text={comment.text} />
            <div className="mt-0 flex flex-wrap items-center gap-x-3">
              <button
                type="button"
                aria-label="Me gusta"
                aria-pressed={liked}
                onClick={() => {
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  setLiked(!liked);
                  setLikesCount(prev => liked ? prev - 1 : prev + 1);
                }}
                className={clsx(
                  "flex min-h-8 items-center gap-1.5 text-xs font-medium transition-colors",
                  liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                )}
              >
                <Heart size={14} className={clsx(liked && "fill-current")} />
                <span>{likesCount}</span>
              </button>
              <button
                type="button"
                aria-expanded={isReplying}
                onClick={() => {
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  setIsReplying(!isReplying);
                }}
                className="flex min-h-8 items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-primary-500"
              >
                <Reply size={14} className="rotate-180" /> Responder
              </button>
            </div>
          </>
        )}

        {isReplying && (
          <form onSubmit={handleCreateReply} className="relative mt-2">
            <input
              type="text"
              placeholder="Escribe una respuesta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className={clsx(commentInputStyle, "pr-10")}
              required
              autoFocus
            />
            <SendCommentButton label="Enviar respuesta" disabled={!replyText.trim()} />
          </form>
        )}
      </div>

      {showReplies && replies.length > 0 && (
        <div className="col-span-full mt-1 flex min-w-0 flex-col gap-3">
          {replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} contentId={contentId} onCommentMutated={loadReplies} isReply />
          ))}
        </div>
      )}

      {hasReplies && !isEditing && (
        <button type="button" aria-expanded={showReplies}
          onClick={() => setShowReplies(open => !open)}
          className="col-start-2 -mt-1 flex min-h-5 items-center justify-self-start gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
          {showReplies ? "Ocultar respuestas" : `Ver ${comment.replies_count} ${comment.replies_count === 1 ? 'respuesta' : 'respuestas'}`}
          {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {/* MODAL DE LOGIN */}
      {showLoginModal && (
        <dialog ref={openDialog} aria-label="Inicia sesión para interactuar" onCancel={() => setShowLoginModal(false)}
          className="fixed inset-0 m-0 h-dvh w-full max-h-none max-w-none bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 md:p-8 max-w-sm w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
            style={{ animationDuration: '150ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <LogIn size={32} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Inicia sesión para interactuar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Necesitas estar registrado para comentar y responder publicaciones
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigate('/login');
                  setShowLoginModal(false);
                }}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                <span>Iniciar sesión</span>
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setShowLoginModal(false);
                }}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </dialog>
      )}
    </article>
  );
};

const CommentSection = ({ contentId }) => {
  const { user } = useAuth();
  const [savedComments, setSavedComments] = useVisitState('contentComments', null);
  const comments = savedComments?.data ?? [];
  const [restored] = useState(() => isCatalogCurrent(savedComments?.stamp));
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(!savedComments);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState(() => window.matchMedia(desktopCommentsQuery).matches ? 'inline' : 'preview');
  const isOpen = view === 'dialog';
  useOverlayBack(isOpen, () => setView('preview'));

  useEffect(() => {
    const media = window.matchMedia(desktopCommentsQuery);
    const updateView = () => setView(media.matches ? 'inline' : 'preview');
    media.addEventListener('change', updateView);
    updateView();
    return () => media.removeEventListener('change', updateView);
  }, []);

  const triggerRef = useRef(null);
  const featuredComment = comments.reduce((best, comment) =>
    !best || comment.replies_count > best.replies_count ? comment : best, null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const loadComments = async () => {
    try {
      const data = await getCommentsByContent(contentId);
      setSavedComments({ data, stamp: catalogStamp() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contentId && !restored) loadComments();
  }, [contentId, restored]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await createComment(user.id, contentId, commentText);
      setCommentText('');
      await loadComments();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const heading = loading ? 'Comentarios' : `Comentarios (${comments.length})`;
  const thread = view !== 'preview' && (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Caja de Comentarios Principal */}
      {user ? (
        <form onSubmit={handleCreateComment} className="flex gap-2 items-start">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
            <AvatarRenderer avatar={user.avatar} name={user.username} />
          </div>
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="Comparte tu opinión..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={submitting}
              className={clsx(commentInputStyle, "pr-10 disabled:cursor-not-allowed disabled:opacity-50")}
              required
            />
            <SendCommentButton label="Enviar comentario" disabled={submitting || !commentText.trim()} loading={submitting} />
          </div>
        </form>
      ) : (
        /* Estado Desactivado cuando NO hay sesión */
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
            <UserIcon size={18} />
          </div>
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              disabled
              placeholder="Inicia sesión para comentar"
              className={clsx(commentInputStyle, "cursor-not-allowed select-none pr-12 md:pr-32")}
            />
            <Link
              to="/login"
              className="absolute right-1 px-2 py-1.5 text-sm font-bold rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <LogIn size={16} />
              <span className="hidden md:block">Iniciar sesión</span>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner variant="section" />
      ) : comments.length > 0 ? (
        <div className="mt-1 flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} contentId={contentId} onCommentMutated={loadComments} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-3 gap-3 text-center">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Aún no hay comentarios
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              ¡Sé el primero en compartir tu opinión!
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section aria-labelledby="comments-title">
      <h3 id="comments-title" className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
        {heading}
      </h3>
      {view === 'inline' ? thread : (
        <div className="relative flex min-h-11 flex-row-reverse items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-[#1e1e1e]">
          <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={isOpen}
            aria-label={loading ? 'Abrir comentarios' : `Abrir comentarios (${comments.length})`}
            onClick={() => setView('dialog')}
            className="group flex shrink-0 items-center gap-1.5 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-primary-500">
            <ChevronRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-gray-500 group-hover:text-primary-600 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 dark:text-gray-400 dark:group-hover:text-primary-400" />
          </button>
          {!loading && (
            <div className="min-w-0 flex-1 [&_a]:relative [&_a]:z-10">
              {featuredComment ? (
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-[#1D1F23]">
                    <AvatarRenderer avatar={featuredComment.users?.avatar} name={featuredComment.users?.username} />
                  </div>
                  <div className="min-w-0 self-center">
                    <CommentText text={featuredComment.text} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay comentarios</p>
              )}
            </div>
          )}
        </div>
      )}
      {isOpen && createPortal(
        <dialog ref={openDialog} aria-labelledby="comments-heading" onCancel={() => setView('preview')}
          className="fixed inset-0 m-0 h-dvh w-full max-h-none max-w-none overflow-hidden bg-white p-0 text-gray-900 dark:bg-dark-bg dark:text-white">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-1.5 dark:border-white/[0.06] dark:bg-transparent sm:border-gray-200 sm:bg-transparent sm:px-4 sm:py-3 dark:sm:border-gray-800">
              <h2 id="comments-heading" className="flex min-h-9 items-center text-base font-bold sm:min-h-0 sm:text-lg sm:font-semibold">{heading}</h2>
              <button type="button" aria-label="Cerrar comentarios" onClick={() => setView('preview')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white sm:h-auto sm:w-auto sm:p-2"><X size={22} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {thread}
            </div>
          </div>
        </dialog>,
        document.body
      )}
    </section>
  );
};

export default CommentSection;
