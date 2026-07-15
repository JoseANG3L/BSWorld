import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Edit3, CornerDownRight, X, Reply, Check, Clock, Heart, MoreHorizontal, ChevronDown, ChevronUp, ThumbsUp, User as UserIcon } from 'lucide-react';
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

const CommentCard = ({ comment, contentId, onCommentMutated, isReply = false }) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.text);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const isAuthor = user?.id === comment.user_id;

  // Cargar respuestas si tiene hijos y está expandido
  useEffect(() => {
    if (!isReply && showReplies) {
      loadReplies();
    }
  }, [showReplies]);

  const loadReplies = async () => {
    try {
      const data = await getRepliesByComment(comment.id);
      setReplies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await createComment(user.id, contentId, replyText, comment.id);
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
      loadReplies();
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar este comentario?")) return;
    try {
      await deleteComment(comment.id);
      onCommentMutated();
    } catch (err) {
      console.error(err);
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

  return (
    <div 
      className={clsx(
        "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 hover:shadow-md",
        isReply 
          ? "bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.02] dark:to-white/[0.01] border-gray-200/60 dark:border-gray-800/60 ml-4" 
          : "bg-gradient-to-br from-white to-gray-50 dark:from-[#1a1a1a] dark:to-[#151515] border-gray-200 dark:border-gray-700 shadow-sm"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Encabezado de Usuario */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-gray-700 shadow-sm bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
              <AvatarRenderer avatar={comment.users?.avatar} name={comment.users?.username} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {comment.users?.username || "Usuario"}
              </span>
              {isAuthor && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  Autor
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock size={11} /> {formattedDate} {comment.updated_at && <span className="text-primary-500 font-medium">· editado</span>}
            </span>
          </div>
        </div>

        {/* Acciones de Autor */}
        <div className={clsx("flex items-center gap-1 transition-opacity duration-200", showActions || isAuthor ? "opacity-100" : "opacity-0")}>
          {isAuthor && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200" title="Editar">
                <Edit3 size={14} />
              </button>
              <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200" title="Eliminar">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo del Mensaje */}
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-0.5 whitespace-pre-wrap">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex gap-2 mt-2">
            <input 
              type="text" 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-700 rounded-xl focus:ring-2 focus:ring-primary-500/30 outline-none dark:text-white transition-all" 
              required 
              autoFocus
            />
            <button type="submit" className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all hover:scale-105 shadow-sm">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => { setIsEditing(false); setEditText(comment.text); }} className="p-2.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all hover:scale-105">
              <X size={16} />
            </button>
          </form>
        ) : (
          <p className="animate-fade-in">{comment.text}</p>
        )}
      </div>

      {/* Botonera inferior / Likes y Respuestas */}
      {!isEditing && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button 
              onClick={() => { setLiked(!liked); setLikesCount(prev => liked ? prev - 1 : prev + 1); }}
              className={clsx(
                "flex items-center gap-1.5 text-xs font-medium transition-all duration-200",
                liked ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              )}
            >
              <Heart 
                size={14} 
                className={clsx("transition-transform duration-200", liked && "scale-110 fill-current")} 
              /> 
              <span>{likesCount}</span>
            </button>

            {/* Reply Button */}
            {user && !isReply && (
              <button 
                onClick={() => setIsReplying(!isReplying)} 
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
              >
                <Reply size={14} className="rotate-180" /> Responder
              </button>
            )}
          </div>

          {/* Replies Toggle */}
          {!isReply && comment.replies_count > 0 && (
            <button 
              onClick={() => setShowReplies(!showReplies)} 
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
            >
              <MessageSquare size={14} /> 
              <span>{showReplies ? "Ocultar" : `Ver ${comment.replies_count} respuestas`}</span>
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      )}

      {/* Formulario de Respuestas */}
      {isReplying && (
        <form onSubmit={handleCreateReply} className="flex gap-2 mt-3 pl-4 border-l-2 border-primary-300 dark:border-primary-700 animate-fade-in-up">
          <input 
            type="text" 
            placeholder="Escribe una respuesta..." 
            value={replyText} 
            onChange={(e) => setReplyText(e.target.value)} 
            className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all" 
            required 
            autoFocus
          />
          <button 
            type="submit" 
            className="px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm"
          >
            <Send size={14} />
          </button>
        </form>
      )}

      {/* Contenedor de Respuestas */}
      {!isReply && showReplies && replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-800/60 animate-fade-in-up">
          {replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} contentId={contentId} onCommentMutated={loadReplies} isReply={true} />
          ))}
        </div>
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
      loadComments();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1e1e1e] dark:to-[#1a1a1a] p-4 md:p-6 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-lg flex flex-col gap-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <MessageSquare size={20} className="text-primary-600 dark:text-primary-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Comentarios
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
            </p>
          </div>
        </div>
      </div>

      {/* Caja de Comentarios Principal */}
      {user ? (
        <form onSubmit={handleCreateComment} className="flex gap-3 items-start">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-gray-700 shadow-sm bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
              <AvatarRenderer avatar={user.avatar} name={user.username} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Comparte tu opinión..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              disabled={submitting}
              className="w-full px-4 py-3 text-sm rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button 
              type="submit" 
              disabled={submitting || !commentText.trim()}
              className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200",
                submitting || !commentText.trim()
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white hover:scale-105 shadow-md"
              )}
            >
              {submitting ? (
                <Clock size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-800/40 rounded-xl text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <UserIcon size={24} className="text-primary-600 dark:text-primary-300" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Debes <Link to="/login" className="text-primary-600 font-bold hover:underline transition-colors">iniciar sesión</Link> para participar en la conversación
            </p>
          </div>
        </div>
      )}

      {/* Listado de Comentarios Principales */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Clock size={32} className="animate-spin text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando comentarios...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar animate-fade-in-up">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} contentId={contentId} onCommentMutated={loadComments} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
            <MessageSquare size={32} className="text-gray-400 dark:text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Aún no hay comentarios
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              ¡Sé el primero en compartir tu opinión!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;