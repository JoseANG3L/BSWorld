import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCircle, XCircle, Loader2, ExternalLink, Check, 
  Eye, Clock, Filter, Trash2, Inbox, EyeOff, AlertCircle, Heart, MessageCircle, Download, Globe, Lock, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, useNotifications } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead, deleteNotification, invalidateNotificationsCache, getUserPublicProfile } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';

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
  const { unreadCount, refreshNotifications } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [actorCache, setActorCache] = useState({}); // Cache para información de actores
  const filterDropdownRef = useRef(null);
  const NOTIFICATIONS_PER_PAGE = 20;

  // --- CONFIGURACIÓN DE LOS TIPOS DE NOTIFICACIONES ---
  const getNotificationConfig = (notification) => {
    // Prioridad para tipos de notificaciones de interacción
    if (notification.type === 'like') {
      return {
        icon: Heart,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-900/30",
        label: "Nuevo like",
        desc: `A ${notification.actorName || 'Alguien'} le gustó tu contenido.`
      };
    }
    
    if (notification.type === 'comment') {
      return {
        icon: MessageCircle,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        label: "Nuevo comentario",
        desc: `${notification.actorName || 'Alguien'} comentó: "${notification.commentText || '...'}"`
      };
    }
    
    if (notification.type === 'download') {
      return {
        icon: Download,
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Nueva descarga",
        desc: `${notification.actorName || 'Alguien'} descargó tu contenido.`
      };
    }
    
    if (notification.type === 'visibility') {
      const visibility = notification.visibilidad;
      if (visibility === 'publico') {
        return {
          icon: Globe,
          color: "text-green-500",
          bg: "bg-green-100 dark:bg-green-900/30",
          label: "Visibilidad: Público",
          desc: "Tu contenido ahora es visible para toda la comunidad."
        };
      } else if (visibility === 'privado') {
        return {
          icon: Lock,
          color: "text-orange-500",
          bg: "bg-orange-100 dark:bg-orange-900/30",
          label: "Visibilidad: Privado",
          desc: "Tu contenido ahora es privado y solo tú puedes verlo."
        };
      } else {
        return {
          icon: Eye,
          color: "text-blue-500",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          label: "Visibilidad cambiada",
          desc: "La visibilidad de tu contenido ha sido actualizada."
        };
      }
    }
    
    // Configuración para notificaciones de estado del contenido
    const status = notification.status || notification.estado;
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
          bg: "bg-gray-100 dark:bg-[#1D1F23]", 
          label: "Inactivo",
          desc: "Este contenido ha sido pausado y no es visible."
        };
      default:
        return { 
          icon: AlertCircle, 
          color: "text-gray-500", 
          bg: "bg-gray-100 dark:bg-[#1D1F23]", 
          label: "Aviso",
          desc: "Actualización de sistema."
        };
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setLoading(false);
        setNotifications([]);
        return;
      }
      try {
        setLoading(true);
        // Invalidar cache al cargar para evitar duplicados
        invalidateNotificationsCache(user.id);
        
        // Cargar notificaciones con paginación
        const data = await getUserNotifications(user.id, false, NOTIFICATIONS_PER_PAGE, 0, true);
        setNotifications(data);
        
        // Refrescar conteo global
        refreshNotifications();
        
        // Verificar si hay más notificaciones
        setHasMore(data.length === NOTIFICATIONS_PER_PAGE);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user?.id]); // Solo depende del user.id para evitar ejecuciones múltiples

  // Cargar más notificaciones (scroll infinito)
  const loadMore = async () => {
    if (!user?.id || loading || !hasMore) return;
    
    try {
      const nextPage = page + 1;
      const offset = nextPage * NOTIFICATIONS_PER_PAGE;
      const data = await getUserNotifications(user.id, false, NOTIFICATIONS_PER_PAGE, offset, true);
      
      // Evitar duplicados verificando IDs
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newItems = data.filter(n => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
      
      setPage(nextPage);
      setHasMore(data.length === NOTIFICATIONS_PER_PAGE);
    } catch (error) {
      console.error("Error cargando más notificaciones:", error);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leida: true } : n));
      await markNotificationAsRead(notifId, user?.id);
      invalidateNotificationsCache(user?.id);
      refreshNotifications(); // Refrescar conteo global
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (notifId) => {
    if (!window.confirm("¿Eliminar esta notificación?")) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      await deleteNotification(notifId);
      invalidateNotificationsCache(user?.id);
      refreshNotifications(); // Refrescar conteo global
    } catch (error) { console.error(error); }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      
      // Marcar cada notificación individualmente (más eficiente que crear una función RPC)
      const unreadIds = notifications.filter(n => !n.leida).map(n => n.id);
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id, user?.id)));
      invalidateNotificationsCache(user?.id);
      refreshNotifications(); // Refrescar conteo global
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  };

  // Cierre del dropdown al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    return true;
  });

  // Cargar información de actores para las notificaciones
  useEffect(() => {
    const loadActorsInfo = async () => {
      const actorIds = notifications.map(n => n.actorid).filter(Boolean);
      const uniqueActorIds = [...new Set(actorIds)];
      
      for (const actorId of uniqueActorIds) {
        if (!actorCache[actorId]) {
          const info = await getUserPublicProfile(actorId);
          if (info) {
            setActorCache(prev => ({ ...prev, [actorId]: info }));
          }
        }
      }
    };
    
    if (notifications.length > 0) {
      loadActorsInfo();
    }
  }, [notifications]);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  // Componente personalizado para renderizar notificaciones
  const renderNotificationItem = (notif) => {
    const config = getNotificationConfig(notif);
    const StatusIcon = config.icon;
    
    // Obtener información del actor del cache (getUserPublicProfile devuelve { uid, nombre, imagen, verificado })
    const actorInfo = actorCache[notif.actorid] || { nombre: notif.actorname, imagen: notif.actoravatar };
    
    // Generar título y descripción según tipo
    let title = '';
    let description = config.desc;
    
    if (notif.type === 'like') {
      title = `A ${actorInfo.nombre || 'Alguien'} le gustó tu ${notif.modtype}`;
    } else if (notif.type === 'comment') {
      title = `${actorInfo.nombre || 'Alguien'} comentó en tu ${notif.modtype}`;
    } else if (notif.type === 'download') {
      title = `${actorInfo.nombre || 'Alguien'} descargó tu ${notif.modtype}`;
    } else if (notif.type === 'visibility') {
      title = `Visibilidad de tu ${notif.modtype} cambiada`;
    } else {
      title = `Tu ${notif.modtype} "${notif.modtitle}"`;
    }
    
    // Renderizado especial para comentarios con avatar
    if (notif.type === 'comment') {
      const isReply = notif.parentid !== null;
      
      return (
        <div 
          key={notif.id}
          className={clsx(
            "group relative flex gap-4 p-5 rounded-3xl border transition-all duration-300",
            !notif.leida 
              ? "bg-white dark:bg-[#1e1e1e] border-primary-200 dark:border-primary-900/40 shadow-md shadow-primary-500/5" 
              : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90"
          )}
        >
          {/* AVATAR DEL USUARIO */}
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-full">
              <AvatarRenderer 
                avatar={actorInfo.imagen} 
                name={actorInfo.nombre} 
              />
            </div>
          </div>

          {/* CONTENIDO DEL COMENTARIO */}
          <div className="flex-1 min-w-0">
            {/* HEADER: Nombre, tipo y tiempo */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {actorInfo.nombre || 'Alguien'}
                </h4>
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isReply 
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                )}>
                  {isReply ? 'Respuesta' : 'Comentario'}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {getTimeAgo(notif.creado)}
              </span>
            </div>

            {/* COMENTARIO */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {notif.commenttext || '...'}
            </p>

            {/* INFORMACIÓN DEL CONTENIDO */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{isReply ? 'respondió a tu comentario en' : 'comentó en'} tu {notif.modtype}</span>
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                "{notif.modtitle}"
              </span>
            </div>

            {/* ACCIONES */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link 
                to={`/view/${notif.modid}`}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                {isReply ? 'Ver respuesta' : 'Ver comentario'}
              </Link>
              <span className="text-gray-300">•</span>
              {!notif.leida && (
                <button 
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Marcar como leída
                </button>
              )}
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => handleDelete(notif.id)}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Renderizado especial para likes con avatar
    if (notif.type === 'like') {
      return (
        <div 
          key={notif.id}
          className={clsx(
            "group relative flex gap-4 p-5 rounded-3xl border transition-all duration-300",
            !notif.leida 
              ? "bg-white dark:bg-[#1e1e1e] border-primary-200 dark:border-primary-900/40 shadow-md shadow-primary-500/5" 
              : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90"
          )}
        >
          {/* AVATAR DEL USUARIO */}
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-full">
              <AvatarRenderer 
                avatar={actorInfo.imagen} 
                name={actorInfo.nombre} 
              />
            </div>
          </div>

          {/* CONTENIDO DEL LIKE */}
          <div className="flex-1 min-w-0">
            {/* HEADER: Nombre y tiempo */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {actorInfo.nombre || 'Alguien'}
              </h4>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {getTimeAgo(notif.creado)}
              </span>
            </div>

            {/* MENSAJE DE LIKE */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Le gustó tu {notif.modtype}
            </p>

            {/* INFORMACIÓN DEL CONTENIDO */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                "{notif.modtitle}"
              </span>
            </div>

            {/* ACCIONES */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link 
                to={`/view/${notif.modid}`}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver {notif.modtype}
              </Link>
              <span className="text-gray-300">•</span>
              {!notif.leida && (
                <button 
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Marcar como leída
                </button>
              )}
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => handleDelete(notif.id)}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Renderizado normal para otros tipos de notificaciones
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
            {title} <span className="text-primary-600 dark:text-primary-400">"{notif.modtitle}"</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            {description}
          </p>
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
          <Link 
            to={(notif.status === 'published' || notif.status === 'published_editing') ? `/view/${notif.modid}` : `/subir?edit=${notif.modid}`}
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
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white", `bg-gradient-to-br from-blue-500 to-cyan-500`)}>
              <Bell size={20} strokeWidth={2.5} />
          </div>
          Notificaciones
        </h1>

        {/* SELECTOR DE FILTROS Y ACCIONES */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-auto" ref={filterDropdownRef}>
            <div className="relative w-full md:w-56 lg:w-64">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {filter === 'all' ? 'Todas las notificaciones' : filter === 'unread' ? 'No leídas' : 'Leídas'}
                </span>
              </button>
              <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isFilterDropdownOpen && "rotate-180")} />
            </div>

            {isFilterDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  {[
                    { val: 'all', label: 'Todas las notificaciones' },
                    { val: 'unread', label: 'No leídas' },
                    { val: 'read', label: 'Leídas' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => { setFilter(opt.val); setIsFilterDropdownOpen(false); }}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        filter === opt.val 
                          ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" 
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* LISTADO */}
      <div className="grid gap-4">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map(renderNotificationItem)
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1e1e1e] border-4 border-dashed border-gray-100 dark:border-gray-800/50 rounded-[40px] text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-[#252525] rounded-full flex items-center justify-center mb-6 text-gray-200 dark:text-gray-700">
               <Inbox size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">Bandeja despejada</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">No hay notificaciones para mostrar</p>
          </div>
        )}
        
        {/* Botón cargar más */}
        {hasMore && filteredNotifs.length > 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Cargar más'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;