import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Trash2, Edit3, LogIn, X, Reply, Check, Clock, Heart,
  ChevronDown, ChevronUp, Link as LinkIcon, User as UserIcon
} from 'lucide-react';
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
import { createPortal } from 'react-dom';

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

  const isAuthor = user?.id === comment.user_id;

  // Bloqueo de scroll cuando el modal está abierto
  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLoginModal]);

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

  const formattedDate = getRelativeTime(comment.created_at);
  const hasReplies = comment.replies_count > 0;

  return (
    <div 
      className={clsx(
        "flex flex-col gap-2",
        isReply && "ml-10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Encabezado de Usuario */}
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
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Acciones de Autor */}
        <div className="flex items-center gap-1">
          {isAuthor && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded transition-colors" title="Editar">
                <Edit3 size={14} />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo del Mensaje */}
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex gap-2">
            <input 
              type="text" 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white" 
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
          <p>{comment.text}</p>
        )}
      </div>

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
            className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white" 
            required 
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!replyText.trim()}
            className={clsx(
              "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors flex items-center justify-center",
              !replyText.trim()
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 text-white"
            )}
          >
            <Send size={14} />
          </button>
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
      {showLoginModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
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
        </div>,
        document.body
      )}
    </div>
  );
};

const CommentSection = ({ contentId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const loadComments = async () => {
    try {
      const data = await getCommentsByContent(contentId);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contentId) loadComments();
  }, [contentId]);

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
    <div className="flex flex-col gap-4 bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Comentarios
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            ({comments.length})
          </p>
        </div>
      </div>

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
              className="w-full pl-3 pr-10 py-2 text-sm rounded-lg bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 outline-none text-gray-800 dark:text-gray-200 focus:border-primary-500 dark:focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button 
              type="submit" 
              disabled={submitting || !commentText.trim()}
              className={clsx(
                "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors flex items-center justify-center",
                submitting || !commentText.trim()
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
              )}
            >
              {submitting ? (
                <Clock size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>
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
              placeholder="Debes iniciar sesión para comentar..." 
              className="w-full pl-3 pr-32 py-2 text-sm rounded-lg bg-gray-100 dark:bg-[#1D1F23]/60 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <Link 
              to="/login" 
              className="absolute right-1 px-3 py-1 text-sm font-bold rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <LogIn size={13} />
              <span>Iniciar sesión</span>
            </Link>
          </div>
        </div>
      )}

      {/* Listado de Comentarios Principales */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Clock size={24} className="animate-spin text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios...</p>
        </div>
      ) : comments.length > 0 ? (
        <>
          <div className="flex flex-col gap-6 mt-1">
            {comments.slice(0, commentsExpanded ? comments.length : 1).map((comment) => (
              <CommentCard key={comment.id} comment={comment} contentId={contentId} onCommentMutated={loadComments} />
            ))}
          </div>

          {/* Botón para expandir/colapsar */}
          {comments.length > 1 && (
            <button
              onClick={() => setCommentsExpanded(!commentsExpanded)}
              className="my-1 text-sm font-medium text-left text-primary-600 dark:text-primary-400"
            >
              {commentsExpanded ? `Ocultar ${comments.length - 1} comentarios` : `Ver ${comments.length - 1} comentarios más`}
            </button>
          )}
        </>
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
};

export default CommentSection;