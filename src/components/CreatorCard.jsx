import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Calendar, User } from 'lucide-react';
import { clsx } from 'clsx';

const CreatorCard = ({ username, avatar, role, createdAt }) => {
  
  // Formatear fecha
  const fecha = createdAt 
    ? new Date(createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) 
    : 'N/A';

  return (
    // 1. CAMBIO PRINCIPAL: El contenedor ahora es un <Link>
    <Link 
      to={`/u/${username}`} 
      className="block group relative bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      
      {/* Banner Superior */}
      <div className={clsx(
        "h-20 transition-opacity opacity-90 group-hover:opacity-100",
        role === 'admin' 
          ? "bg-gradient-to-r from-yellow-500 to-orange-600" // Banner Dorado para Admins
          : "bg-gradient-to-r from-primary-600 to-purple-600" // Banner Normal
      )}></div>

      <div className="px-5 pb-5">
        
        {/* Header con Avatar y Botón */}
        <div className="relative -mt-10 mb-3 flex justify-between items-end">
          
          {/* Avatar */}
          <img 
            src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
            alt={username}
            className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1e1e1e] bg-gray-200 object-cover shadow-md group-hover:scale-105 transition-transform"
          />
          
          {/* Icono de flecha (Visual) */}
          <div className="mb-1 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <ExternalLink size={18} />
          </div>
        </div>

        {/* Info Usuario */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex items-center gap-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {username}
            {role === 'admin' && (
              <Shield size={16} className="text-yellow-500 fill-yellow-500/20" />
            )}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
               <Calendar size={12} /> {fecha}
            </span>
            
            <span className={clsx(
              "capitalize px-2 py-1 rounded-md border flex items-center gap-1",
              role === 'admin' 
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            )}>
               <User size={12} /> {role === 'admin' ? 'Admin' : 'Miembro'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CreatorCard;