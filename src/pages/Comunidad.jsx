import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllUsers, getForumPosts, createForumPost, updateForumPost, deleteForumPost, likeForumPost, getForumPostLikes, getForumReplies } from '../services/api';
import CreatorCard from '../components/CreatorCard';
import { Crown, Loader2, MessageSquare, Users, Plus, X, Heart, Image as ImageIcon, Tag, Vote, ChevronDown, Search, ArrowUpDown, Filter, Check } from 'lucide-react';
import DataContainer from '../components/DataContainer';
import { useAuth } from '../context/AuthContext';
import AvatarRenderer from '../components/AvatarRenderer';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import Login from '../pages/Login';

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
              {post.category && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {post.category}
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

      {/* Encuesta */}
      {post.poll_data && post.poll_data.options && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Vote size={14} />
            Encuesta
          </div>
          {post.poll_data.options.map((option, index) => {
            const totalVotes = post.poll_data.votes?.reduce((sum, v) => sum + v, 0) || 0;
            const optionVotes = post.poll_data.votes?.[index] || 0;
            const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
            
            return (
              <div key={index} className="relative">
                <div 
                  className="w-full h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  style={{ width: '100%' }}
                >
                  <div 
                    className="h-full bg-primary-500 dark:bg-primary-600 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{option}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState(false);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  
  // Campos de publicación
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showPostCategoryDropdown, setShowPostCategoryDropdown] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState(false);

  const categoryDropdownRef = useRef(null);
  const ordenDropdownRef = useRef(null);
  const postCategoryDropdownRef = useRef(null);

  const categories = [
    'General', 'Ayuda', 'Discusión', 'Anuncios', 'Proyectos', 'Off-topic'
  ];

  // Posts filtrados
  const postsFiltrados = useMemo(() => {
    let resultado = posts.filter(post => {
      const valor = post.content || '';
      return valor.toLowerCase().includes(busqueda.toLowerCase());
    });

    if (selectedCategory) {
      resultado = resultado.filter(post => post.category === selectedCategory);
    }

    resultado.sort((a, b) => {
      if (orden === 'recientes') return new Date(b.created_at) - new Date(a.created_at);
      if (orden === 'antiguos') return new Date(a.created_at) - new Date(b.created_at);
      if (orden === 'mas_likes') return (b.likes_count || 0) - (a.likes_count || 0);
      return 0;
    });

    return resultado;
  }, [posts, busqueda, orden, selectedCategory]);

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

  // Previsualización de imagen
  useEffect(() => {
    if (postImageUrl.trim()) {
      setImagePreview(postImageUrl);
      setImageError(false);
    } else {
      setImagePreview('');
      setImageError(false);
    }
  }, [postImageUrl]);

  // Cierre de menús al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setIsOrdenDropdownOpen(false);
      }
      if (postCategoryDropdownRef.current && !postCategoryDropdownRef.current.contains(event.target)) {
        setShowPostCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateClick = () => {
    if (!user) {
      setLoginInitialRegister(false);
      setIsLoginOpen(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    if (!user?.id) {
      setLoginInitialRegister(false);
      setIsLoginOpen(true);
      return;
    }
    
    setSubmitting(true);
    try {
      const pollData = showPollOptions && pollOptions.filter(opt => opt.trim()).length >= 2 
        ? { options: pollOptions.filter(opt => opt.trim()), votes: pollOptions.filter(opt => opt.trim()).map(() => 0) }
        : null;
      
      await createForumPost(
        user.id, 
        postContent, 
        null, 
        postImageUrl.trim() || null, 
        postCategory.trim() || null, 
        pollData
      );
      
      // Reset form
      setPostContent('');
      setPostImageUrl('');
      setPostCategory('');
      setShowPollOptions(false);
      setPollOptions(['', '']);
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
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Foro de la Comunidad</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Comparte tus ideas, discute con otros miembros y mantente al día con las novedades de la comunidad</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-semibold"
        >
          <Plus size={16} />
          Crear
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="mb-4 flex flex-row gap-2 md:gap-3 items-start md:items-center">
        {/* Búsqueda */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar en el foro..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
          />
        </div>

        {/* Filtro de categoría */}
        <div className="relative w-full md:w-auto" ref={categoryDropdownRef}>
          <div className="relative w-full md:w-56">
            <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsOrdenDropdownOpen(false); }}
              className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
            >
              <span className="truncate block">
                {selectedCategory ? selectedCategory : 'Todas las categorías'}
              </span>
            </button>
            <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isCategoryDropdownOpen && "rotate-180")} />
          </div>

          {isCategoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(''); setIsCategoryDropdownOpen(false); }}
                  className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left", selectedCategory === '' ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                >
                  <span>Todas las categorías</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left", selectedCategory === cat ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ordenamiento */}
        <div className="hidden md:flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
          <div className="relative w-full md:w-56">
            <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <button type="button" onClick={() => { setIsOrdenDropdownOpen(!isOrdenDropdownOpen); setIsCategoryDropdownOpen(false); }} className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left">
              <span className="truncate block">
                {orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden === 'mas_likes' ? 'Más Likes' : orden}
              </span>
            </button>
            <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isOrdenDropdownOpen && "rotate-180")} />

            {isOrdenDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  {[
                    { val: 'recientes', label: 'Más Recientes' },
                    { val: 'antiguos', label: 'Más Antiguos' },
                    { val: 'mas_likes', label: 'Más Likes' }
                  ].map((opt) => (
                    <button key={opt.val} type="button" onClick={() => { setOrden(opt.val); setIsOrdenDropdownOpen(false); }} className={clsx("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors", orden === opt.val ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}>{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="animate-spin text-primary-600" size={24} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando publicaciones...</p>
        </div>
      ) : postsFiltrados.length > 0 ? (
        <div className="flex flex-col gap-4">
          {postsFiltrados.map((post) => (
            <ForumPost key={post.id} post={post} onPostMutated={loadPosts} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {busqueda || selectedCategory ? 'No se encontraron publicaciones' : 'Aún no hay publicaciones en el foro'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {busqueda || selectedCategory ? 'Intenta con otros filtros' : '¡Sé el primero en compartir algo con la comunidad!'}
          </p>
        </div>
      )}

      {/* MODAL PARA CREAR PUBLICACIÓN */}
      {showCreateModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl w-full max-w-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col animate-fade-in-up"
            style={{ animationDuration: '200ms' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER DEL MODAL */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <MessageSquare size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Crear Publicación</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Comparte novedades con la comunidad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 flex flex-col gap-4">
              {/* CABECERA DE USUARIO Y SELECTOR DE CATEGORÍA */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 shadow-sm">
                    <AvatarRenderer avatar={user?.avatar} name={user?.username} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      {user?.username || 'Usuario'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Publicando ahora</span>
                  </div>
                </div>

                {/* Selector de Categoría Flotante */}
                <div className="relative" ref={postCategoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPostCategoryDropdown(!showPostCategoryDropdown)}
                    className={clsx(
                      "h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                      postCategory 
                        ? "bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-800 text-primary-600 dark:text-primary-400" 
                        : "bg-gray-50 dark:bg-[#1D1F23] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                    )}
                  >
                    <Tag size={12} />
                    <span>{postCategory || 'Categoría'}</span>
                    <ChevronDown size={12} className={clsx("transition-transform duration-200", showPostCategoryDropdown && "rotate-180")} />
                  </button>

                  {showPostCategoryDropdown && (
                    <div className="absolute top-full right-0 mt-1.5 w-40 bg-white dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-1 animate-scale-up">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setPostCategory(cat);
                            setShowPostCategoryDropdown(false);
                          }}
                          className={clsx(
                            "w-full px-3 py-1.5 text-left text-xs font-semibold rounded-lg transition-colors flex items-center justify-between",
                            postCategory === cat 
                              ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" 
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <span>{cat}</span>
                          {postCategory === cat && <Check size={12} strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TEXTAREA PRINCIPAL */}
              <textarea
                placeholder="¿Qué tienes en mente para compartir hoy con la comunidad?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full p-3.5 text-sm bg-gray-50/50 dark:bg-[#16181B] border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none transition-all placeholder:text-gray-400 min-h-[110px]"
                rows={4}
                required
                autoFocus
              />

              {/* PREVIEW DE IMAGEN CON RATIO 16/9 */}
              {imagePreview && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#16181B] shadow-sm">
                  <img 
                    src={imagePreview} 
                    alt="Previsualización" 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                  {imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white gap-1">
                      <ImageIcon size={24} className="opacity-60" />
                      <span className="text-xs font-medium">No se pudo cargar la imagen</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPostImageUrl('');
                      setImagePreview('');
                      setImageError(false);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors shadow-md"
                    title="Quitar imagen"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* CREADOR DE ENCUESTA */}
              {showPollOptions && (
                <div className="bg-gray-50/70 dark:bg-[#16181B] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-2.5 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Vote size={14} className="text-primary-500" /> Opciones de Encuesta
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{pollOptions.length} de 5</span>
                  </div>

                  <div className="space-y-2">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Opción ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-xs bg-white dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                          />
                        </div>
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                            title="Eliminar opción"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 pt-1"
                    >
                      <Plus size={14} /> Añadir otra opción
                    </button>
                  )}
                </div>
              )}

              {/* BARRA DE ACCESORIOS Y ADJUNTOS */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5">
                  {/* Input URL Imagen */}
                  <div className="relative flex-1 sm:w-64">
                    <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      placeholder="URL de imagen..."
                      value={postImageUrl}
                      onChange={(e) => setPostImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 h-9 text-xs bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 rounded-xl outline-none dark:text-white focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                  </div>

                  {/* Toggle Encuesta */}
                  <button
                    type="button"
                    onClick={() => setShowPollOptions(!showPollOptions)}
                    className={clsx(
                      "h-9 px-3 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border shrink-0",
                      showPollOptions 
                        ? "bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800" 
                        : "bg-white dark:bg-[#1D1F23] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    )}
                    title="Adjuntar encuesta"
                  >
                    <Vote size={14} />
                    <span className="hidden sm:inline">Encuesta</span>
                  </button>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !postContent.trim()}
                    className={clsx(
                      "px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm",
                      submitting || !postContent.trim()
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-primary-600 hover:bg-primary-700 text-white"
                    )}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={3} />}
                    <span>Publicar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL LOGIN / REGISTRO */}
      <Login 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        initialRegister={loginInitialRegister} 
      />
    </div>
  );
};

const UsersSection = ({ users }) => {
  const [busqueda, setBusqueda] = useState('');

  const usuariosFiltrados = users.filter(user => 
    user.username?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Título y subtítulo */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Miembros de la Comunidad</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Descubre a los creadores, desarrolladores y miembros que hacen parte de BSWorld</p>
      </div>

      {/* Búsqueda de usuarios */}
      <div className="relative w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar usuarios..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
        />
      </div>
      
      {/* Grid de usuarios */}
      {usuariosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {usuariosFiltrados.map((user) => (
            <CreatorCard
              key={user.id}
              username={user.username}
              avatar={user.avatar}
              role={user.role}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Users size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            No se encontraron usuarios
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Intenta con otro término de búsqueda
          </p>
        </div>
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
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {/* Header con Tabs */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-5">
        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white bg-gradient-to-br from-yellow-600 to-orange-500">
            <Crown size={20} strokeWidth={2.5} />
          </div>
          Comunidad
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex w-full md:w-auto mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('foro')}
          className={clsx(
            "flex-1 md:flex-none pb-3 px-2 md:px-14 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'foro'
              ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent"
          )}
        >
          <MessageSquare size={16} />
          Foro
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={clsx(
            "flex-1 md:flex-none pb-3 px-2 md:px-14 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'usuarios'
              ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent"
          )}
        >
          <Users size={16} />
          Usuarios
        </button>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'usuarios' ? (
        <UsersSection users={users} />
      ) : (
        <ForumSection />
      )}
    </div>
  );
};

export default Comunidad;