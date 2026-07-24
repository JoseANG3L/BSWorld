import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Globe, Server, ChevronRight, Activity, MapPin, Clock } from 'lucide-react';
import { clsx } from 'clsx';

const ServerCard = ({ 
  id, 
  nombre, 
  jugadoresPromedio = 0,
  jugadoresMaximos = 100,
  ip,
  puerto = 25565,
  ubicacion = 'Desconocida',
  estado = 'online',
  version = '1.20.4',
  tipo = 'Survival',
  imagen = null
}) => {
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getEstadoConfig = (status) => {
    switch (status) {
      case 'online':
        return { 
          label: 'En Línea', 
          style: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
          dotColor: 'bg-green-500'
        };
      case 'offline':
        return { 
          label: 'Desconectado', 
          style: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
          dotColor: 'bg-red-500'
        };
      case 'maintenance':
        return { 
          label: 'Mantenimiento', 
          style: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
          dotColor: 'bg-yellow-500'
        };
      default:
        return { 
          label: 'Desconocido', 
          style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const estadoConfig = getEstadoConfig(estado);
  const fullIp = `${ip}:${puerto}`;

  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent rounded-lg shadow-sm transition-all duration-300 z-0 relative h-full hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400">
      
      {/* IMAGEN DEL SERVIDOR */}
      <Link 
        to={`/servidor/${id}`}
        className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-[#191B1E] block cursor-pointer rounded-t-lg"
      >
        {imagen ? (
          <img 
            src={imagen} 
            alt={nombre}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <Server size={48} className="text-white/80" />
          </div>
        )}

        {/* ESTADO DEL SERVIDOR */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full shadow-sm">
          <div className={clsx("w-2 h-2 rounded-full", estadoConfig.dotColor)} />
          <span className={clsx("text-xs font-bold", estadoConfig.style.split(' ').filter(s => s.includes('text-')).join(' '))}>
            {estadoConfig.label}
          </span>
        </div>

        {/* TIPO DE SERVIDOR */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-primary-600/90 backdrop-blur-sm rounded-lg shadow-sm">
          <span className="text-xs font-bold text-white">{tipo}</span>
        </div>
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-3 pb-3 space-y-2.5">
        
        {/* NOMBRE DEL SERVIDOR */}
        <Link 
          to={`/servidor/${id}`}
          className="block hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <h3 className="text-md font-bold text-black dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={nombre}>
            {nombre}
          </h3>
        </Link>

        {/* JUGADORES */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50 dark:bg-[#191B1E]">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {formatNumber(jugadoresPromedio)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/ {formatNumber(jugadoresMaximos)}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">jugadores</span>
        </div>

        {/* VERSIÓN */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-[#191B1E]">
          <Activity size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Versión {version}
          </span>
        </div>

        {/* UBICACIÓN */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-[#191B1E]">
          <MapPin size={14} className="text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {ubicacion}
          </span>
        </div>

        {/* IP DEL SERVIDOR */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-[#191B1E]">
          <Globe size={14} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
            {fullIp}
          </span>
        </div>

        {/* BOTÓN VER DETALLES */}
        <Link 
          to={`/servidor/${id}`}
          className="mt-autoflex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary-700 hover:bg-primary-600 text-white font-bold text-sm transition-all duration-150 active:scale-[0.98] shadow-md"
        >
          <span>Ver Detalles</span>
          <ChevronRight size={16} />
        </Link>

      </div>
    </div>
  );
};

export default ServerCard;
