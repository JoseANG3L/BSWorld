import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';
import AvatarRenderer from './AvatarRenderer';

const CreatorCard = ({ username, avatar, role }) => {
  return (
    <Link 
      to={`/u/${username}`} 
      className="flex items-center gap-3 p-3 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-xl shadow-sm group"
    >
      {/* Avatar con Renderer */}
      <div className="w-12 h-12 rounded-full flex-shrink-0">
        <AvatarRenderer avatar={avatar} name={username} />
      </div>

      {/* Info Usuario */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {username}
          {role === 'admin' && (
            <Shield size={14} className="text-yellow-500 fill-yellow-500/20 flex-shrink-0" />
          )}
        </h3>
      </div>

      {/* Icono de flecha */}
      <div className="p-1.5 rounded-full bg-gray-100 dark:bg-[#1D1F23] text-gray-500 dark:text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-colors flex-shrink-0">
        <ExternalLink size={14} />
      </div>
    </Link>
  );
};

export default CreatorCard;