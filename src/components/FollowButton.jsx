import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser, isFollowing } from '../services/api';

const FollowButton = ({ targetUserId, size = 'md', showText = true }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // No mostrar botón si es el propio usuario
  if (user && user.id === targetUserId) {
    return null;
  }

  // Verificar si el usuario ya sigue al target al montar
  useEffect(() => {
    if (user && targetUserId) {
      checkIfFollowing();
    }
  }, [user, targetUserId]);

  const checkIfFollowing = async () => {
    try {
      const following = await isFollowing(user.id, targetUserId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error verificando follow:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !targetUserId) return;
    if (loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id, targetUserId);
        setIsFollowing(false);
      } else {
        await followUser(user.id, targetUserId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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
      onClick={handleToggleFollow}
      disabled={!user || loading}
      className={clsx(
        'inline-flex items-center font-medium rounded-lg transition-all',
        'border',
        sizeClasses[size],
        isFollowing
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400'
          : 'bg-white dark:bg-[#1D1F23] border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
        !user && 'opacity-50 cursor-not-allowed',
        loading && 'opacity-70 cursor-wait'
      )}
      title={user ? (isFollowing ? 'Dejar de seguir' : 'Seguir') : 'Inicia sesión para seguir'}
    >
      {isFollowing ? (
        <UserMinus size={iconSizes[size]} />
      ) : (
        <UserPlus size={iconSizes[size]} />
      )}
      {showText && (
        <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
      )}
    </button>
  );
};

export default FollowButton;
