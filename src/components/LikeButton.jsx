import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { toggleLike, isLikedByUser } from '../services/api';

const LikeButton = ({ contentId, initialLikes = 0, size = 'md' }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  // Verificar si el usuario ya dio like al montar
  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, contentId]);

  const checkIfLiked = async () => {
    try {
      const liked = await isLikedByUser(user.id, contentId);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error verificando like:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) return;
    if (loading) return;

    setLoading(true);
    try {
      const result = await toggleLike(user.id, contentId);
      setIsLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
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

  return (
    <button
      onClick={handleToggleLike}
      disabled={!user || loading}
      className={clsx(
        'inline-flex items-center font-medium rounded-lg transition-all',
        'border',
        sizeClasses[size],
        isLiked
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
          : 'bg-white dark:bg-[#1D1F23] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
        !user && 'opacity-50 cursor-not-allowed',
        loading && 'opacity-70 cursor-wait'
      )}
      title={user ? (isLiked ? 'Ya te gusta' : 'Me gusta') : 'Inicia sesión para dar like'}
    >
      <Heart 
        size={iconSizes[size]} 
        className={clsx(
          'transition-all',
          isLiked && 'fill-current'
        )} 
      />
      <span>{likesCount}</span>
    </button>
  );
};

export default LikeButton;
