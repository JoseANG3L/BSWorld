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

const commentInputStyle = "rounded-lg border-0 bg-gray-100 py-2 text-sm text-gray-800 outline-none transition-colors focus:bg-primary-50 dark:bg-[#1D1F23] dark:text-gray-200 dark:focus:bg-gray-800";

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

const CommentAuthor = ({ comment, isAuthor }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
      <AvatarRenderer avatar={comment.users?.avatar} name={comment.users?.username} />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {comment.users?.username || "Usuario"}
        </span>
        {isAuthor && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
            Autor
          </span>
        )}
      </div>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">
        {getRelativeTime(comment.created_at)}
      </span>
    </div>
  </div>
);

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

  return (
    <div 
      className={clsx(
        "flex flex-col gap-2",
        isReply && "ml-10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <CommentAuthor comment={comment} isAuthor={isAuthor} />

        {isAuthor && !isEditing && (
          <CardActionsMenu label="Opciones del comentario" actions={[
            { label: 'Editar', icon: Edit3, onSelect: () => { setEditText(comment.text); setIsEditing(true); } },
            { label: 'Eliminar', icon: Trash2, onSelect: handleDelete, destructive: true }
          ]} />
        )}
      </div>

      {/* Cuerpo del Mensaje */}
      {isEditing ? (
          <form onSubmit={handleUpdate} className="flex gap-2">
            <input 
              type="text" 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className={clsx(commentInputStyle, "min-w-0 flex-1 px-3")}
              required 
              autoFocus
            />
            <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => { setIsEditing(false); setEditText(comment.text); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </form>
        ) : (
          <CommentText text={comment.text} />
      )}

      {/* Botonera inferior / Likes y Respuestas */}
      {!isEditing && (
        <div className="flex flex-col pt-1 gap-3">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setLiked(!liked);
                setLikesCount(prev => liked ? prev - 1 : prev + 1);
              }}
              className={clsx(
                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              )}
            >
              <Heart 
                size={14} 
                className={clsx(liked && "fill-current")} 
              /> 
              <span>{likesCount}</span>
            </button>

            {/* Reply Button (Abierto para todos, exige login si no hay sesión) */}
            <button 
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setIsReplying(!isReplying);
              }} 
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Reply size={14} className="rotate-180" /> Responder
            </button>
          </div>

          {/* Botón para mostrar / ocultar respuestas */}
          {hasReplies && (
            <button 
              onClick={() => {
                if (!showReplies) {
                  loadReplies();
                }
                setShowReplies(!showReplies);
              }} 
              className="flex items-center gap-1.5 ml-10 mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              <span>
                {showReplies 
                  ? "Ocultar respuestas" 
                  : `Ver ${comment.replies_count || replies.length} ${comment.replies_count === 1 || replies.length === 1 ? 'respuesta' : 'respuestas'}`
                }
              </span>
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      )}

      {/* Formulario de Respuestas */}
      {isReplying && (
        <form onSubmit={handleCreateReply} className="relative mt-3 pl-3 border-l-2 border-primary-500/50">
          <input 
            type="text" 
            placeholder="Escribe una respuesta..." 
            value={replyText} 
            onChange={(e) => setReplyText(e.target.value)} 
            className={clsx(commentInputStyle, "w-full pl-3 pr-10")}
            required 
            autoFocus
          />
          <SendCommentButton label="Enviar respuesta" disabled={!replyText.trim()} />
        </form>
      )}

      {/* Contenedor de Respuestas anidadas */}
      {showReplies && replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          {replies.map((reply) => (
            <CommentCard 
              key={reply.id} 
              comment={reply} 
              contentId={contentId} 
              onCommentMutated={loadReplies} 
              isReply={true} 
            />
          ))}
        </div>
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
    </div>
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
  const [isOpen, setIsOpen] = useState(false);
  useOverlayBack(isOpen, () => setIsOpen(false));

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

  return (
    <>
      <h3 id="comments-preview-title" className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
        Comentarios{!loading && ` (${comments.length})`}
      </h3>
      <section aria-labelledby="comments-preview-title" className="relative flex min-h-11 flex-row-reverse items-center gap-2 rounded-xl bg-white px-3 py-2 dark:bg-[#1e1e1e]">
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={isOpen}
        aria-label={loading ? 'Abrir comentarios' : `Abrir comentarios (${comments.length})`}
        onClick={() => setIsOpen(true)}
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
      {isOpen && createPortal(
        <dialog ref={openDialog} aria-labelledby="comments-heading" onCancel={() => setIsOpen(false)}
          className="fixed inset-0 m-0 h-dvh w-full max-h-none max-w-none overflow-hidden bg-white p-0 text-gray-900 dark:bg-dark-bg dark:text-white">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-1.5 dark:border-white/[0.06] dark:bg-transparent sm:border-gray-200 sm:bg-transparent sm:px-4 sm:py-3 dark:sm:border-gray-800">
              <h2 id="comments-heading" className="flex min-h-9 items-center text-base font-bold sm:min-h-0 sm:text-lg sm:font-semibold">Comentarios{!loading && ` (${comments.length})`}</h2>
              <button type="button" aria-label="Cerrar comentarios" onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white sm:h-auto sm:w-auto sm:p-2"><X size={22} /></button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
              {/* Caja de Comentarios Principal */}
              {user ? (
                <form onSubmit={handleCreateComment} className="flex gap-2 items-start">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
                    <AvatarRenderer avatar={user.avatar} name={user.username} />
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Comparte tu opinión..." 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      disabled={submitting}
                      className={clsx(commentInputStyle, "w-full pl-3 pr-10 disabled:opacity-50 disabled:cursor-not-allowed")}
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
                      className="w-full pl-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-[#1D1F23]/60 border-0 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
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

              {/* Listado de Comentarios Principales */}
              {loading ? (
                <LoadingSpinner variant="section" />
              ) : comments.length > 0 ? (
                <div className="flex flex-col gap-6 mt-1">
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
          </div>
        </dialog>,
        document.body
      )}
      </section>
    </>
  );
};

export default CommentSection;
