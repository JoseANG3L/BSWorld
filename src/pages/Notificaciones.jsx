import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCircle, XCircle, Loader2, ExternalLink, Check, Eye, Clock, Filter, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead, deleteNotification } from '../services/api';

const Notificaciones = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.uid) {
        try {
          const data = await getUserNotifications(user.uid);
          setNotifications(data);
        } catch (error) {
          console.error("Error cargando notificaciones:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  // Función para marcar la notificación como leída
  const handleMarkAsRead = async (notifId) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, leida: true } : n)
      );
      await markNotificationAsRead(notifId);
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  // Función para eliminar notificación
  const handleDelete = async (notifId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta notificación?")) return;
    
    try {
      // Actualización optimista: removemos el item inmediatamente de la tabla
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      await deleteNotification(notifId);
    } catch (error) {
      console.error("Error al eliminar notificación", error);
      alert("Hubo un error al eliminar la notificación.");
    }
  };

  // Filtros aplicados a los resultados
  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    return true;
  });

  // Diseño de la etiqueta de estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'published':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle size={12}/> Aprobado</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><XCircle size={12}/> Rechazado</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"><Clock size={12}/> En Revisión</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">Desconocido</span>;
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in-up">
      
      {/* ENCABEZADO Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl shadow-sm">
                    <Bell size={28} />
                </div>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-[#121212]">
                        {unreadCount}
                    </span>
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Notificaciones</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Historial de revisiones de tus aportes.</p>
            </div>
        </div>

        <div className="flex bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg p-1 self-start md:self-auto">
            <button onClick={() => setFilter('all')} className={clsx("px-4 py-1.5 rounded-md text-xs font-bold transition-all", filter === 'all' ? "bg-primary-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800")}>Todas</button>
            <button onClick={() => setFilter('unread')} className={clsx("px-4 py-1.5 rounded-md text-xs font-bold transition-all", filter === 'unread' ? "bg-primary-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800")}>No leídas</button>
            <button onClick={() => setFilter('read')} className={clsx("px-4 py-1.5 rounded-md text-xs font-bold transition-all", filter === 'read' ? "bg-primary-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800")}>Leídas</button>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        
        {filteredNotifs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Estado / Info</th>
                  <th className="p-4 font-bold">Contenido (Mod)</th>
                  <th className="p-4 font-bold">Fecha</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifs.map((notif) => (
                  <tr 
                    key={notif.id} 
                    className={clsx(
                        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        !notif.leida ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                    )}
                  >
                    {/* ESTADO */}
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-2 items-start">
                        {getStatusBadge(notif.status)}
                        {!notif.leida && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                                Nueva
                            </span>
                        )}
                      </div>
                    </td>

                    {/* INFO DEL MOD */}
                    <td className="p-4 align-middle min-w-[250px]">
                      <div className="flex items-center gap-3">
                        {notif.modImage ? (
                          <img src={notif.modImage} alt="mod" className="w-10 h-10 rounded-lg object-cover bg-gray-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                             <Eye size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {notif.modTitle || "Contenido sin título"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5" title="UID del Mod">
                              ID: {notif.modId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* FECHA */}
                    <td className="p-4 align-middle whitespace-nowrap">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {new Date(notif.creado).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(notif.creado).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </td>

                    {/* ACCIONES */}
                    <td className="p-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Botón Ver (Si está activo) / Editar (Si fue rechazado o pendiente) */}
                        {notif.status === 'active' ? (
                            <Link 
                              to={`/view/${notif.modId}`} 
                              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors rounded-lg"
                              title="Ver publicación"
                            >
                                <ExternalLink size={16} />
                            </Link>
                        ) : (
                            <Link 
                              to={`/subir?edit=${notif.modId}`} 
                              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors rounded-lg"
                              title={notif.status === 'rejected' ? "Corregir publicación" : "Editar envío"}
                            >
                                <ExternalLink size={16} />
                            </Link>
                        )}

                        {/* Botón Marcar como leída */}
                        {!notif.leida ? (
                            <button 
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
                              title="Marcar como leída"
                            >
                                <Check size={16} />
                            </button>
                        ) : (
                            <div className="p-2 text-gray-300 dark:text-gray-600 rounded-lg cursor-not-allowed" title="Ya está leída">
                                <Check size={16} />
                            </div>
                        )}

                        {/* Botón Eliminar Notificación */}
                        <button 
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors rounded-lg"
                          title="Eliminar notificación"
                        >
                            <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
               <Filter size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No hay notificaciones</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
               No encontramos notificaciones que coincidan con tu filtro actual.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notificaciones;