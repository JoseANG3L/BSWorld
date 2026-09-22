import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { likeForumPost, getForumPostLikes, getForumReplies } from '../services/api';
import { MessageSquare, Heart, Vote, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from './AvatarRenderer';

const ForumPost = ({ post, onPostMutated, isReply = false, showFullContent = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);

  const isAuthor = user?.id === post.user_id;

  // Cargar likes count inicial
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const count = await getForumPostLikes(post.id);
        setLikesCount(count);
      } catch (error) {
        console.error("Error cargando likes:", error);
      }
    };
    loadLikes();
  }, [post.id]);

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

  const formattedDate = getRelativeTime(post.created_at);

  const handleLike = async () => {
    if (!user) return;
    try {
      const result = await likeForumPost(post.id, user.id);
      setLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error("Error en like:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { createForumPost } = await import('../services/api');
      await createForumPost(user.id, replyText, post.id);
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
      await loadReplies();
      onPostMutated();
    } catch (error) {
      console.error("Error creando respuesta:", error);
    }
  };

  const loadReplies = async () => {
    try {
      const data = await getForumReplies(post.id);
      setReplies(data);
    } catch (error) {
      console.error("Error cargando respuestas:", error);
    }
  };

  const handlePostClick = () => {
    if (!isReply && !showFullContent) {
      navigate(`/foro/${post.id}`);
    }
  };

  return (
    <div 
      className={clsx(
        "flex flex-col gap-3 bg-white dark:bg-[#1e1e1e] rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 dark:border-transparent cursor-pointer hover:shadow-md transition-shadow",
        isReply && "ml-4 md:ml-6 mt-2"
      )}
      onClick={handlePostClick}
    >
      {/* Header optimizado para móvil */}
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
            <AvatarRenderer avatar={post.users?.avatar} name={post.users?.username} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {post.users?.username || "Usuario"}
              </span>
              {post.category && (
                <span className="px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded whitespace-nowrap">
                  {post.category}
                </span>
              )}
              {isAuthor && (
                <span className="px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded whitespace-nowrap">
                  Autor
                </span>
              )}
            </div>
            <span className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400">
              {formattedDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Los botones de editar/eliminar se movieron a la página de detalles */}
        </div>
      </div>

      {/* Título del post */}
      {post.title && (
        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* Imagen del post */}
      {post.image_url && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1D1F23]">
          <img 
            src={post.image_url} 
            alt="Imagen del post" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        <p className="line-clamp-3 md:line-clamp-none">{post.content}</p>
      </div>

      {/* Encuesta */}
      {post.poll_data && post.poll_data.options && (
        <div className="mt-3 space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Vote size={12} md:size={14} />
            Encuesta
          </div>
          {post.poll_data.options.map((option, index) => {
            const totalVotes = post.poll_data.votes?.reduce((sum, v) => sum + v, 0) || 0;
            const optionVotes = post.poll_data.votes?.[index] || 0;
            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
            
            return (
              <div key={index} className="relative">
                <div 
                  className="w-full h-7 md:h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  style={{ width: '100%' }}
                >
                  <div 
                    className="h-full bg-primary-500 dark:bg-primary-600 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-2 md:px-3">
                  <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white truncate">{option}</span>
                  <span className="text-[10px] md:text-xs font-bold text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-4 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLike}
            className={clsx(
              "flex items-center gap-1 md:gap-1.5 text-xs font-medium transition-colors",
              liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
          >
            <Heart size={12} md:size={14} className={clsx(liked && "fill-current")} /> 
            <span className="text-[10px] md:text-xs">{likesCount}</span>
          </button>

          <button 
            onClick={() => {
              if (!isReply && !showFullContent) {
                navigate(`/foro/${post.id}`);
              } else {
                setIsReplying(!isReplying);
              }
            }} 
            className="flex items-center gap-1 md:gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-500 transition-colors"
          >
            <MessageSquare size={12} md:size={14} /> 
            <span className="text-[10px] md:text-xs">Responder</span>
          </button>
        </div>
      )}

      {isReplying && (
        <form onSubmit={handleReply} className="relative mt-3 pl-3 border-l-2 border-primary-500/50" onClick={(e) => e.stopPropagation()}>
          <textarea 
            placeholder="Escribe una respuesta..." 
            value={replyText} 
            onChange={(e) => setReplyText(e.target.value)} 
            className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white resize-none"
            rows={2}
            required 
            autoFocus
          />
          <button 
            type="submit" 
            disabled={!replyText.trim()}
            className={clsx(
              "absolute right-1 bottom-1 p-1.5 rounded-md transition-colors flex items-center justify-center",
              !replyText.trim()
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 text-white"
            )}
          >
            <ChevronUp size={14} />
          </button>
        </form>
      )}

      {/* Botón para mostrar respuestas */}
      {post.replies_count > 0 && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!showReplies) {
              loadReplies();
            }
            setShowReplies(!showReplies);
          }} 
          className="flex items-center gap-1 md:gap-1.5 mt-2 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        >
          <span>
            {showReplies 
              ? "Ocultar respuestas" 
              : `Ver ${post.replies_count} ${post.replies_count === 1 ? 'respuesta' : 'respuestas'}`
            }
          </span>
          {showReplies ? <ChevronUp size={10} md:size={12} /> : <ChevronDown size={10} md:size={12} />}
        </button>
      )}

      {/* Contenedor de respuestas */}
      {showReplies && replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-3">
          {replies.map((reply) => (
            <ForumPost key={reply.id} post={reply} onPostMutated={loadReplies} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumPost;