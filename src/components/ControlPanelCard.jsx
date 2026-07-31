import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Trash2, Eye, Calendar, Tag, Download, AlertCircle, Layers } from 'lucide-react';

const ControlPanelCard = ({ 
  id, 
  titulo, 
  imagen, 
  creadores, 
  tags, 
  status, 
  tipo,
  descargas, 
  vistas, 
  likes_count,
  creado,
  mensaje_rechazo,
  isEditable = true,
  handleDelete,
  isDeleting,
  onEdit
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'aceptado':
      case 'published':
        return { 
          label: 'Aceptado', 
          style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'revision':
      case 'pending':
        return { 
          label: 'En Revisión', 
          style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
      case 'rechazado':
      case 'rejected':
        return { 
          label: 'Rechazado', 
          style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
      case 'borrador':
      case 'draft':
        return { 
          label: 'Borrador', 
          style: 'bg-gray-100 text-gray-600 dark:bg-[#1D1F23] dark:text-gray-400'
        };
      default:
        return { 
          label: 'Desconocido', 
          style: 'bg-gray-100 text-gray-500 dark:bg-[#1D1F23] dark:text-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const isRejected = status === 'rechazado' || status === 'rejected';
  const totalDownloads = descargas?.reduce((acc, d) => acc + (d.count || 0), 0) || 0;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail - Aspect ratio 16:9 */}
        <div className="w-36 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          {imagen ? (
            <img 
              src={imagen} 
              alt={titulo} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Layers size={24} />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 capitalize">
                {tipo || 'mod'}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${statusConfig.style}`}>
                {statusConfig.label}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {new Date(creado).toLocaleDateString()}
            </span>
          </div>
          
          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate mb-1">
            {titulo || 'Sin título'}
          </h3>
          
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {vistas || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download size={12} />
              {totalDownloads}
            </span>
            {creadores && creadores.length > 0 && (
              <span className="truncate">
                por {creadores.map(c => c.nombre).join(', ')}
              </span>
            )}
          </div>

          {/* Rejection Message */}
          {isRejected && mensaje_rechazo && (
            <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
              <div className="flex items-start gap-1">
                <AlertCircle size={12} className="text-red-500mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-300 line-clamp-1">{mensaje_rechazo}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors"
            title="Editar"
          >
            <Edit3 size={16} />
          </button>
          <Link
            to={`/view/${id}`}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Ver"
          >
            <Eye size={16} />
          </Link>
          {isEditable && (
            <button
              onClick={() => handleDelete(id)}
              disabled={isDeleting}
              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanelCard;
