import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Calendar, User } from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';

const CreatorCard = ({ username, avatar, banner, role, createdAt }) => {
  
  // Formatear fecha
  const fecha = createdAt 
    ? new Date(createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) 
    : 'N/A';

  // Detectar si el banner es una URL de imagen
  const isBannerUrl = banner && (banner.startsWith('http') || banner.startsWith('data:image'));

  return (
    <Link 
      to={`/u/${username}`} 
      className="block group relative bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      
      {/* --- BANNER SUPERIOR DINÁMICO --- */}
      <div className="h-20 w-full relative overflow-hidden transition-opacity opacity-90 group-hover:opacity-100">
        {banner ? (
            // CASO 1: TIENE BANNER PERSONALIZADO
            isBannerUrl ? (
                <img 
                  src={banner} 
                  alt="Banner" 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
            ) : (
                <div 
                  className="w-full h-full" 
                  style={{ background: banner }}
                ></div>
            )
        ) : (
            // CASO 2: NO TIENE BANNER (USAR DEFAULT POR ROL)
            <div className={clsx(
                "w-full h-full",
                role === 'admin' 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-600" 
                  : "bg-gradient-to-r from-primary-600 to-purple-600"
            )}></div>
        )}
      </div>

      <div className="px-5 pb-5">
        
        {/* Header con Avatar y Botón */}
        <div className="relative -mt-10 mb-3 flex justify-between items-end">
          
          {/* Avatar con Renderer */}
          <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#1e1e1e] shadow-md group-hover:scale-105 transition-transform overflow-hidden bg-gray-200 dark:bg-gray-800">
             <AvatarRenderer 
                avatar={avatar} 
                name={username} 
             />
          </div>
          
          {/* Icono de flecha */}
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