import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Edit3, CornerDownRight, X, Reply, Check, Clock, Heart, MoreHorizontal, ChevronDown, ChevronUp, ThumbsUp, User as UserIcon, Link } from 'lucide-react';
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
        "flex flex-col gap-3 p-3 rounded-lg border transition-all duration-200",
        isReply 
          ? "bg-gray-50 dark:bg-[#191B1E] border-gray-200 dark:border-gray-700 ml-4" 
          : "bg-white dark:bg-[#1e1e1e] border-gray-300 dark:border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Encabezado de Usuario */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#191B1E]">
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
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white" 
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
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button 
              onClick={() => { setLiked(!liked); setLikesCount(prev => liked ? prev - 1 : prev + 1); }}
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

            {/* Reply Button */}
            {user && !isReply && (
              <button 
                onClick={() => setIsReplying(!isReplying)} 
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Reply size={14} className="rotate-180" /> Responder
              </button>
            )}
          </div>

          {/* Replies Toggle */}
          {!isReply && comment.replies_count > 0 && (
            <button 
              onClick={() => setShowReplies(!showReplies)} 
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
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
        <form onSubmit={handleCreateReply} className="flex gap-2 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          <input 
            type="text" 
            placeholder="Escribe una respuesta..." 
            value={replyText} 
            onChange={(e) => setReplyText(e.target.value)} 
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white" 
            required 
            autoFocus
          />
          <button 
            type="submit" 
            className="px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      )}

      {/* Contenedor de Respuestas */}
      {!isReply && showReplies && replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
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
    <div className="flex flex-col gap-4 bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Comentarios
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </p>
        </div>
      </div>

      {/* Caja de Comentarios Principal */}
      {user ? (
        <form onSubmit={handleCreateComment} className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#191B1E]">
            <AvatarRenderer avatar={user.avatar} name={user.username} />
          </div>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Comparte tu opinión..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              disabled={submitting}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none text-gray-800 dark:text-gray-200 focus:border-primary-500 dark:focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button 
              type="submit" 
              disabled={submitting || !commentText.trim()}
              className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                submitting || !commentText.trim()
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
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
        <div className="p-4 bg-gray-50 dark:bg-[#191B1E] rounded-lg text-center border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Debes <Link to="/login" className="text-primary-600 font-semibold hover:underline">iniciar sesión</Link> para participar en la conversación
          </p>
        </div>
      )}

      {/* Listado de Comentarios Principales */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Clock size={24} className="animate-spin text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} contentId={contentId} onCommentMutated={loadComments} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="p-3 bg-gray-100 dark:bg-[#191B1E] rounded-full">
            <MessageSquare size={24} className="text-gray-400 dark:text-gray-600" />
          </div>
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