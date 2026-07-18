import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCircle, XCircle, Loader2, ExternalLink, Check, 
  Eye, Clock, Filter, Trash2, Inbox, EyeOff, AlertCircle 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead, deleteNotification } from '../services/api';

// --- UTILIDAD DE TIEMPO ---
const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return `Ayer`;
  return date.toLocaleDateString();
};

const Notificaciones = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // --- CONFIGURACIÓN DE LOS 5 ESTADOS ---
  const getStatusConfig = (status) => {
    switch (status) {
      case 'published':
        return { 
          icon: CheckCircle, 
          color: "text-green-500", 
          bg: "bg-green-100 dark:bg-green-900/30", 
          label: "Publicado",
          desc: "Tu aporte ya es visible para la comunidad."
        };
      case 'published_editing':
        return { 
          icon: Clock, 
          color: "text-blue-500", 
          bg: "bg-blue-100 dark:bg-blue-900/30", 
          label: "Publicado (En revisión)",
          desc: "La versión anterior sigue pública mientras revisamos tus nuevos cambios."
        };
      case 'pending':
        return { 
          icon: Loader2, 
          color: "text-yellow-600", 
          bg: "bg-yellow-100 dark:bg-yellow-900/30", 
          label: "En revisión",
          desc: "Tu envío está pendiente de revisión."
        };
      case 'rejected':
        return { 
          icon: XCircle, 
          color: "text-red-500", 
          bg: "bg-red-100 dark:bg-red-900/30", 
          label: "Rechazado",
          desc: "No cumple con las normas. Haz clic para ver detalles y corregir."
        };
      case 'inactive':
        return { 
          icon: EyeOff, 
          color: "text-gray-500", 
          bg: "bg-gray-100 dark:bg-[#191B1E]", 
          label: "Inactivo",
          desc: "Este contenido ha sido pausado y no es visible."
        };
      default:
        return { 
          icon: AlertCircle, 
          color: "text-gray-500", 
          bg: "bg-gray-100 dark:bg-[#191B1E]", 
          label: "Aviso",
          desc: "Actualización de sistema."
        };
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) return;
      try {
        const data = await getUserNotifications(user.uid);
        setNotifications(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notifId) => {
    try {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
      await markNotificationAsRead(notifId);
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (notifId) => {
    if (!window.confirm("¿Eliminar esta notificación?")) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      await deleteNotification(notifId);
    } catch (error) { console.error(error); }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    return true;
  });

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={40} />
      <p className="text-gray-500 font-medium">Sincronizando notificaciones...</p>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20">
            <Bell size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Centro de Actividad</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Tienes <span className="text-primary-600 dark:text-primary-400">{unreadCount} avisos sin leer</span>
            </p>
          </div>
        </div>

        {/* SELECTOR DE FILTROS */}
        <div className="flex bg-gray-100 dark:bg-[#1a1a1a] p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                filter === f 
                  ? "bg-white dark:bg-[#2a2a2a] text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-gray-700" 
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              {f === 'all' ? 'Todas' : f === 'unread' ? 'No leídas' : 'Leídas'}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif) => {
            const config = getStatusConfig(notif.status);
            const StatusIcon = config.icon;
            
            return (
              <div 
                key={notif.id}
                className={clsx(
                  "group relative flex flex-col md:flex-row md:items-center gap-5 p-5 rounded-3xl border transition-all duration-300",
                  !notif.leida 
                    ? "bg-white dark:bg-[#1e1e1e] border-primary-200 dark:border-primary-900/40 shadow-md shadow-primary-500/5" 
                    : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90"
                )}
              >
                {/* ICONO Y ESTADO */}
                <div className="flex md:flex-col items-center gap-3">
                  <div className={clsx("p-4 rounded-2xl shrink-0 shadow-inner", config.bg, config.color)}>
                    <StatusIcon size={26} className={notif.status === 'pending' ? 'animate-pulse' : ''} />
                  </div>
                  <div className="md:hidden flex flex-col">
                     <span className={clsx("text-[10px] font-black uppercase tracking-widest", config.color)}>{config.label}</span>
                     <span className="text-[10px] text-gray-400">{getTimeAgo(notif.creado)}</span>
                  </div>
                </div>

                {/* CONTENIDO */}
                <div className="flex-1 min-w-0">
                  <div className="hidden md:flex items-center gap-3 mb-1.5">
                    <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", config.bg, config.color, "border-current/10")}>
                      {config.label}
                    </span>
                    <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                      <Clock size={12} /> {getTimeAgo(notif.creado)}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                    Tu {notif.modType} <span className="text-primary-600 dark:text-primary-400">"{notif.modTitle}"</span>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
                    {config.desc}
                  </p>
                </div>

                {/* ACCIONES */}
                <div className="flex items-center gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                  <Link 
                    to={(notif.status === 'published' || notif.status === 'published_editing') ? `/view/${notif.modId}` : `/subir?edit=${notif.modId}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-primary-600 hover:bg-black dark:hover:bg-primary-700 text-white text-xs font-black rounded-2xl transition-all active:scale-95"
                  >
                    {(notif.status === 'published' || notif.status === 'published_editing') ? 'ABRIR' : 'GESTIONAR'}
                    <ExternalLink size={14} />
                  </Link>

                  <div className="flex gap-2">
                    {!notif.leida && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-3 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-primary-100 dark:border-primary-900/40 rounded-2xl transition-all"
                        title="Marcar como leída"
                      >
                        <Check size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-gray-100 dark:border-gray-800/50 rounded-[40px] text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-[#252525] rounded-full flex items-center justify-center mb-6 text-gray-200 dark:text-gray-700">
               <Inbox size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">Bandeja despejada</h3>
            <p className="text-gray-500 mt-2 max-w-xs font-medium px-4">
              No hay nada pendiente por aquí. ¡Buen trabajo manteniéndote al día!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;