import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { toggleLike, isLikedByUser } from '../services/api';

const LikeButton = ({ contentId, initialLikes = 0, size = 'md', variant = 'default', onChange }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario ya dio like al montar
  useEffect(() => {
    if (!user || !contentId) {
      setIsLiked(false);
      return;
    }

    let isMounted = true;
    const verifyLike = async () => {
      try {
        const liked = await isLikedByUser(user.id, contentId);
        if (isMounted) setIsLiked(liked);
      } catch (error) {
        console.error('Error verificando like:', error);
      }
    };

    verifyLike();
    return () => { isMounted = false; };
  }, [user, contentId]);

  // Notificar al contenedor (card/detalle) para reflejar el estado activo
  useEffect(() => {
    if (onChange) onChange(isLiked, likesCount);
  }, [isLiked, likesCount, onChange]);

  const handleToggleLike = async () => {
    if (!user || !contentId) return;
    if (loading) return;

    const previousLiked = isLiked;
    const nextLiked = !previousLiked;
    const countChange = nextLiked ? 1 : -1;

    setIsLiked(nextLiked);
    setLikesCount(prev => Math.max(0, prev + countChange));
    setLoading(true);
    try {
      const result = await toggleLike(user.id, contentId);
      if (result !== nextLiked) {
        setIsLiked(result);
        setLikesCount(prev => Math.max(0, prev + (result ? 1 : -1) - countChange));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(previousLiked);
      setLikesCount(prev => Math.max(0, prev - countChange));
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const isOverlay = variant === 'overlay';

  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleToggleLike();
      }}
      disabled={!user || !contentId || loading}
      className={clsx(
        isOverlay
          ? clsx(
            'group/like absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:brightness-90',
            isLiked
              ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white shadow-lg shadow-rose-950/40 hover:brightness-110 hover:shadow-rose-800/50'
              : 'bg-black/45 text-white/90 hover:bg-black/70 hover:text-white'
          )
          : clsx(
            'inline-flex items-center font-medium rounded-lg transition-all border',
            sizeClasses[size],
            isLiked
              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
              : 'bg-white dark:bg-[#1D1F23] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          ),
        !user && 'opacity-70 cursor-not-allowed',
          loading && 'cursor-wait'
      )}
      title={!user ? 'Inicia sesión para dar like' : !contentId ? 'Contenido no disponible' : isLiked ? 'Ya te gusta' : 'Me gusta'}
      aria-label={!user ? 'Inicia sesión para dar like' : !contentId ? 'Contenido no disponible' : isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
    >
      <Heart 
        size={isOverlay ? 16 : iconSizes[size]}
        className={clsx(
          'transition-colors duration-200',
          isLiked
            ? 'fill-current'
            : 'group-hover/like:fill-white/25'
        )} 
      />
      {!isOverlay && <span>{likesCount}</span>}
    </button>
  );
};

export default LikeButton;
