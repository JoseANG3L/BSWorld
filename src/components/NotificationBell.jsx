import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, Check, Loader2, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../services/api';

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return `Ayer a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  if (diffDays < 7) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return `El ${days[date.getDay()]} a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${date.toLocaleDateString()} a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const NotificationBell = () => {
  const { user } = useAuth();

  // Usamos una función simulada para navigate en este entorno aislado
  const navigate = (path) => console.log(`Navegando a: ${path}`);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Cargar notificaciones no leídas
  const fetchUnread = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getUserNotifications(user.uid);
      // Filtramos solo las que no han sido leídas
      setUnreadNotifs(data.filter(n => !n.leida));
    } catch (error) {
      console.error("Error cargando notificaciones para el panel:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar el componente y cuando el usuario cambie
  useEffect(() => {
    fetchUnread();

    // Refrescar cada 1 minuto para mantener el número actualizado
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Cerrar panel al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marcar como leída desde el panel
  const handleMarkAsRead = async (e, notifId) => {
    e.stopPropagation(); // Evita que se dispare el click del contenedor padre
    try {
      // Actualización optimista: la quitamos del panel instantáneamente
      setUnreadNotifs(prev => prev.filter(n => n.id !== notifId));
      await markNotificationAsRead(notifId);
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  // Click en una notificación entera: marca como leída y navega
  const handleNotifClick = async (notif) => {
    setIsOpen(false); // Cierra el panel

    try {
      setUnreadNotifs(prev => prev.filter(n => n.id !== notif.id));
      await markNotificationAsRead(notif.id);
    } catch (error) {
      console.error(error);
    }

    // Navegación contextual
    if (notif.status === 'active' || notif.status === 'published') {
      navigate(`/view/${notif.modId}`);
    } else {
      navigate(`/subir?edit=${notif.modId}`);
    }
  };

  // Configuración visual según estado
  const getStatusConfig = (status) => {
    switch (status) {
      case 'published': // Público y sin cambios pendientes
        return { 
          icon: CheckCircle, 
          color: "text-green-500", 
          bg: "bg-green-100 dark:bg-green-900/30", 
          label: "Publicado" 
        };
      case 'published_editing': // Está al aire, pero el autor subió una versión nueva que se está revisando
        return { 
          icon: Clock, 
          color: "text-blue-500", 
          bg: "bg-blue-100 dark:bg-blue-900/30", 
          label: "Publicado (Revisando cambios)" 
        };
      case 'pending': // Primera vez que se sube, aún no es público
        return { 
          icon: Loader2, // O Clock
          color: "text-yellow-600", 
          bg: "bg-yellow-100 dark:bg-yellow-900/30", 
          label: "En revisión" 
        };
      case 'rejected': // Fue rechazado por moderación
        return { 
          icon: XCircle, 
          color: "text-red-500", 
          bg: "bg-red-100 dark:bg-red-900/30", 
          label: "Rechazado" 
        };
      case 'draft': // En borrador
        return { 
          icon: Clock,
          color: "text-red-500", 
          bg: "bg-red-100 dark:bg-red-900/30", 
          label: "Borrador" 
        };
      case 'inactive': // Deshabilitado (por el usuario o admin)
        return { 
          icon: EyeOff, // Necesitarás importar EyeOff de lucide-react
          color: "text-gray-500", 
          bg: "bg-gray-100 dark:bg-gray-800", 
          label: "Inactivo" 
        };
      default:
        return { 
          icon: Bell, 
          color: "text-gray-500", 
          bg: "bg-gray-100 dark:bg-gray-800", 
          label: "Aviso" 
        };
    }
  };

  if (!user) return null; // No mostrar si no hay sesión

  return (
    <div className="relative inline-block font-sans" ref={dropdownRef}>

      {/* BOTÓN CAMPANA */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadNotifs.length === 0) fetchUnread(); // Refrescar al abrir si está vacío
        }}
        className={clsx(
          "w-9 h-9 flex items-center justify-center border shadow-sm rounded-full transition-all text-sm",
          "bg-white dark:bg-[#252525] border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400"
        )}
        title="Notificaciones"
      >
        <Bell size={18} strokeWidth={2.5} />
        {/* Badge numérico si hay > 0 */}
        {unreadNotifs.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-[#121212] px-1">
            {unreadNotifs.length > 99 ? '99+' : unreadNotifs.length}
          </span>
        )}
      </button>

      {/* PANEL FLOTANTE */}
      {isOpen && (
        <div className="fixed md:absolute top-full right-0 mt-1 mx-3 md:mx-0 md:mt-3 w-100 md:w-80 sm:w-96 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-fade-in-up origin-top-right" style={{ animationDuration: '200ms' }}>

          {/* Header del Panel */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
              Notificaciones
            </h3>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {unreadNotifs.length}
            </span>
          </div>

          {/* Cuerpo del Panel (Lista) */}
          <div className="max-h-80 overflow-y-auto flex flex-col custom-scrollbar">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : unreadNotifs.length > 0 ? (
              unreadNotifs.slice(0, 10).map(notif => {
                const config = getStatusConfig(notif.status);
                const Icon = config.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  >
                    <div className={clsx("p-2.5 rounded-full h-fit shrink-0", config.bg, config.color)}>
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 pr-4 leading-tight">
                        Tu {notif.modType} <span className="text-gray-900 dark:text-white font-bold">"{notif.modTitle}"</span> ha sido {config.label.toLowerCase()}.
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">
                        {getTimeAgo(notif.creado)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleMarkAsRead(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 h-fit text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all shrink-0"
                      title="Marcar como leída"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center text-gray-500">
                <Inbox size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium">No tienes notificaciones nuevas</p>
                <p className="text-xs mt-1">¡Todo está al día!</p>
              </div>
            )}

            {/* Aviso si hay más de 10 */}
            {unreadNotifs.length > 10 && (
              <p className="text-center text-[10px] text-gray-400 py-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                Y {unreadNotifs.length - 10} más...
              </p>
            )}
          </div>

          {/* Footer del Panel (Botón Ver Todas) */}
          <Link
            to="/notificaciones"
            onClick={() => setIsOpen(false)}
            className="text-sm m-3 text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:dark:text-primary-500 font-semibold transition-colors"
          >
            Ver todas las notificaciones
          </Link>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;