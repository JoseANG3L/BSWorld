import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getForumPostById, getForumReplies, deleteForumPost, likeForumPost, getForumPostLikes, updateForumPost } from '../services/api';
import ForumPost from '../components/ForumPost';
import { Loader2, ArrowLeft, MessageSquare, Heart, Share2, Bookmark, MoreHorizontal, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from '../components/AvatarRenderer';
import { clsx } from 'clsx';

const ForoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await getForumPostById(id);
      if (postData) {
        setPost(postData);
        await loadReplies();
        await loadLikes();
      } else {
        navigate('/comunidad');
      }
    } catch (error) {
      console.error("Error cargando post:", error);
      navigate('/comunidad');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const data = await getForumReplies(id);
      setReplies(data);
    } catch (error) {
      console.error("Error cargando respuestas:", error);
    }
  };

  const loadLikes = async () => {
    try {
      const count = await getForumPostLikes(id);
      setLikesCount(count);
    } catch (error) {
      console.error("Error cargando likes:", error);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const result = await likeForumPost(id, user.id);
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
      await createForumPost(user.id, replyText, id);
      setReplyText('');
      setIsReplying(false);
      await loadReplies();
    } catch (error) {
      console.error("Error creando respuesta:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await deleteForumPost(id);
      navigate('/comunidad');
    } catch (error) {
      console.error("Error eliminando post:", error);
    }
  };

  const handleEdit = () => {
    setEditTitle(post.title || '');
    setEditContent(post.content);
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    try {
      await updateForumPost(id, editContent, editTitle);
      setIsEditing(false);
      await loadPost();
    } catch (error) {
      console.error("Error actualizando post:", error);
    }
  };

  // Cerrar menú de opciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="animate-spin text-primary-600" size={32} />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando publicación...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">No se encontró la publicación</p>
        <Link to="/comunidad" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
          Volver al foro
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header con navegación */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/comunidad" 
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Volver al foro</span>
        </Link>
      </div>

      {/* Post principal */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm border border-gray-200 dark:border-transparent p-4 md:p-6 mb-6">
        {/* Header del post */}
        <div className="flex items-start justify-between gap-3 md:gap-4 mb-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
              <AvatarRenderer avatar={post.users?.avatar} name={post.users?.username} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {post.users?.username || "Usuario"}
                </span>
                {post.category && (
                  <span className="px-1.5 py-0.5 text-[9px] md:text-xs font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded whitespace-nowrap">
                    {post.category}
                  </span>
                )}
                {isAuthor && (
                  <span className="px-1.5 py-0.5 text-[9px] md:text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded whitespace-nowrap">
                    Autor
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                {getRelativeTime(post.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <button className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
              <Share2 size={14} md:size={18} />
            </button>
            <button className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
              <Bookmark size={14} md:size={18} />
            </button>
            {isAuthor && (
              <div className="relative" ref={optionsRef}>
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  title="Opciones"
                >
                  <MoreHorizontal size={14} md:size={18} />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1 min-w-[140px] md:min-w-[160px]">
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                    >
                      <Edit size={14} md:size={16} />
                      Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} md:size={16} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Título */}
        {post.title && (
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>
        )}

        {/* Imagen */}
        {post.image_url && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1D1F23] mb-4">
            <img 
              src={post.image_url} 
              alt="Imagen del post" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Contenido */}
        <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título del post..."
                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white font-semibold"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Contenido del post..."
                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white resize-none"
                rows={6}
                required
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditTitle(post.title || ''); setEditContent(post.content); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            post.content
          )}
        </div>

        {/* Encuesta */}
        {post.poll_data && post.poll_data.options && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <MessageSquare size={16} />
              Encuesta
            </div>
            {post.poll_data.options.map((option, index) => {
              const totalVotes = post.poll_data.votes?.reduce((sum, v) => sum + v, 0) || 0;
              const optionVotes = post.poll_data.votes?.[index] || 0;
              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
              
              return (
                <div key={index} className="relative">
                  <div 
                    className="w-full h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                    style={{ width: '100%' }}
                  >
                    <div 
                      className="h-full bg-primary-500 dark:bg-primary-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{option}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLike}
            className={clsx(
              "flex items-center gap-2 text-sm font-medium transition-colors",
              liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
          >
            <Heart size={18} className={clsx(liked && "fill-current")} /> 
            {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
          </button>

          <button 
            onClick={() => setIsReplying(!isReplying)} 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary-500 transition-colors"
          >
            <MessageSquare size={18} /> 
            {replies.length} {replies.length === 1 ? 'Respuesta' : 'Respuestas'}
          </button>
        </div>

        {/* Formulario de respuesta */}
        {isReplying && (
          <form onSubmit={handleReply} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-[#1D1F23] shrink-0">
                <AvatarRenderer avatar={user?.avatar} name={user?.username} />
              </div>
              <div className="flex-1">
                <textarea 
                  placeholder="Escribe una respuesta..." 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white resize-none"
                  rows={3}
                  required 
                  autoFocus
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    Responder
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Respuestas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {replies.length} {replies.length === 1 ? 'Respuesta' : 'Respuestas'}
        </h2>
        
        {replies.length > 0 ? (
          replies.map((reply) => (
            <ForumPost 
              key={reply.id} 
              post={reply} 
              onPostMutated={loadReplies} 
              isReply={true} 
              showFullContent={true}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aún no hay respuestas. ¡Sé el primero en responder!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForoDetalle;