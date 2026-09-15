import React, { useState, useEffect } from 'react';
import { getAllUsers, getForumPosts, createForumPost, updateForumPost, deleteForumPost, likeForumPost, getForumPostLikes, getForumReplies } from '../services/api';
import CreatorCard from '../components/CreatorCard';
import { Crown, Loader2, MessageSquare, Users, Plus, X, Heart } from 'lucide-react';
import DataContainer from '../components/DataContainer';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from '../components/AvatarRenderer';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

// Componente de Foro basado en el sistema de comentarios
const ForumPost = ({ post, onPostMutated, isReply = false }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    try {
      await updateForumPost(post.id, editText);
      setIsEditing(false);
      onPostMutated();
    } catch (error) {
      console.error("Error actualizando post:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await deleteForumPost(post.id);
      onPostMutated();
    } catch (error) {
      console.error("Error eliminando post:", error);
    }
  };

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

  return (
    <div className={clsx("flex flex-col gap-3 bg-white dark:bg-[#1e1e1e] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-transparent", isReply && "ml-6 mt-2")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
            <AvatarRenderer avatar={post.users?.avatar} name={post.users?.username} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {post.users?.username || "Usuario"}
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

        <div className="flex items-center gap-1">
          {isAuthor && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded transition-colors" title="Editar">
                <MessageSquare size={14} />
              </button>
              <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex gap-2">
            <textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)} 
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white resize-none"
              rows={3}
              required 
              autoFocus
            />
            <div className="flex flex-col gap-2">
              <button type="submit" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Users size={16} />
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setEditText(post.content); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          </form>
        ) : (
          <p>{post.content}</p>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={handleLike}
            className={clsx(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
          >
            <Heart size={14} className={clsx(liked && "fill-current")} /> {likesCount}
          </button>

          <button 
            onClick={() => setIsReplying(!isReplying)} 
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-500 transition-colors"
          >
            <MessageSquare size={14} /> Responder
          </button>
        </div>
      )}

      {isReplying && (
        <form onSubmit={handleReply} className="relative mt-3 pl-3 border-l-2 border-primary-500/50">
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
            <Plus size={14} />
          </button>
        </form>
      )}

      {/* Botón para mostrar respuestas */}
      {post.replies_count > 0 && (
        <button 
          onClick={() => {
            if (!showReplies) {
              loadReplies();
            }
            setShowReplies(!showReplies);
          }} 
          className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        >
          <span>
            {showReplies 
              ? "Ocultar respuestas" 
              : `Ver ${post.replies_count} ${post.replies_count === 1 ? 'respuesta' : 'respuestas'}`
            }
          </span>
          {showReplies ? <X size={12} /> : <Plus size={12} />}
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

const ForumSection = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await getForumPosts();
      setPosts(data);
    } catch (error) {
      console.error("Error cargando posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setSubmitting(true);
    try {
      await createForumPost(user.id, postText);
      setPostText('');
      setShowCreateModal(false);
      await loadPosts();
    } catch (error) {
      console.error("Error creando post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Foro de la Comunidad</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-semibold"
        >
          <Plus size={16} />
          Nueva publicación
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="animate-spin text-primary-600" size={24} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando publicaciones...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <ForumPost key={post.id} post={post} onPostMutated={loadPosts} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Aún no hay publicaciones en el foro
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            ¡Sé el primero en compartir algo con la comunidad!
          </p>
        </div>
      )}

      {/* Modal para crear publicación */}
      {showCreateModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 max-w-lg w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
            style={{ animationDuration: '150ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Publicación</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23]">
                  <AvatarRenderer avatar={user?.avatar} name={user?.username} />
                </div>
                <textarea
                  placeholder="¿Qué quieres compartir con la comunidad?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500 dark:text-white resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !postText.trim()}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                    submitting || !postText.trim()
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    "Publicar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const Comunidad = () => {
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'foro'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        
        // Normalizamos los datos inyectando la prop 'id' que DataContainer 
        // necesita para el React.cloneElement interno.
        const normalizedData = data.map(user => ({
            ...user,
            id: user.uid || user.id
        }));

        setUsers(normalizedData);
      } catch (error) {
        console.error("Error cargando comunidad:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <div className="flex flex-col animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {/* Header con Tabs */}
      <div className="px-2 md:px-4 py-5 md:py-7">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Crown size={24} className="text-yellow-600 dark:text-yellow-500" /> Comunidad
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'usuarios'
                ? "border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Users size={18} />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('foro')}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'foro'
                ? "border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <MessageSquare size={18} />
            Foro
          </button>
        </div>
      </div>

      {/* Contenido según tab activo */}
      <div className="px-2 md:px-4 pb-4">
        {activeTab === 'usuarios' ? (
          <DataContainer
            title="Usuarios"
            icon={Users}
            gradientClass="from-yellow-600 to-orange-500"
            items={users}
            searchKey="username"
            renderItem={(user) => (
              <CreatorCard
                username={user.username}
                avatar={user.avatar}
                role={user.role}
              />
            )}
          />
        ) : (
          <ForumSection />
        )}
      </div>
    </div>
  );
};

export default Comunidad;