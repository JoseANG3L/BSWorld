import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle, XCircle, Loader2, 
  Eye, Clock, Filter, Inbox, EyeOff, AlertCircle, Heart, MessageCircle, Download, Globe, Lock, ChevronDown, Search,
  Wrench, Map, Gamepad2, Boxes, Package, User
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth, useNotifications } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead, markNotificationAsUnread, deleteNotification, invalidateNotificationsCache, getUserPublicProfile } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';

// --- MAPEO DE ICONOS POR TIPO DE CONTENIDO ---
const CONTENT_TYPE_ICONS = {
  'complemento': Wrench,
  'mapa': Map,
  'minijuego': Gamepad2,
  'modpack': Boxes,
  'paquete': Package,
  'personaje': User
};

const CONTENT_TYPE_COLORS = {
  'complemento': 'from-blue-500 to-indigo-600',
  'mapa': 'from-emerald-500 to-teal-600',
  'minijuego': 'from-amber-500 to-orange-600',
  'modpack': 'from-red-500 to-rose-600',
  'paquete': 'from-cyan-500 to-blue-600',
  'personaje': 'from-purple-500 to-pink-600'
};

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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    const isAdmin = user?.role === 'admin';
    const modType = notification.modtype || 'mod';
    const modTitle = notification.modtitle || 'contenido';
    
    // Obtener icono específico según el tipo de contenido
    const ContentTypeIcon = CONTENT_TYPE_ICONS[modType] || Package;
    const contentTypeColor = CONTENT_TYPE_COLORS[modType] || 'from-gray-500 to-gray-600';
    
    // Colores según estado para el icono
    const getStatusColor = (status) => {
      if (status === 'published' || status === 'aceptado') return 'text-green-500';
      if (status === 'published_editing' || status === 'aceptado_con_edicion') return 'text-blue-500';
      if (status === 'pending' || status === 'revision') return 'text-yellow-600';
      if (status === 'rejected' || status === 'rechazado') return 'text-red-500';
      return 'text-gray-500';
    };
    
    const getStatusBg = (status) => {
      if (status === 'published' || status === 'aceptado') return 'bg-green-100 dark:bg-green-900/30';
      if (status === 'published_editing' || status === 'aceptado_con_edicion') return 'bg-blue-100 dark:bg-blue-900/30';
      if (status === 'pending' || status === 'revision') return 'bg-yellow-100 dark:bg-yellow-900/30';
      if (status === 'rejected' || status === 'rechazado') return 'bg-red-100 dark:bg-red-900/30';
      return 'bg-gray-100 dark:bg-[#1D1F23]';
    };
    
    switch (status) {
      case 'published':
      case 'aceptado':
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
          label: "Publicado",
          desc: isAdmin ? `El ${modType} "${modTitle}" ha sido publicado.` : "Tu aporte ya es visible para la comunidad."
        };
      case 'published_editing':
      case 'aceptado_con_edicion':
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
          label: "Publicado (En revisión)",
          desc: isAdmin ? `El ${modType} "${modTitle}" está en revisión con versión pública.` : "La versión anterior sigue pública mientras revisamos tus nuevos cambios."
        };
      case 'pending':
      case 'revision':
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
          label: isAdmin ? "Pendiente de revisión" : "En revisión",
          desc: isAdmin ? `Tienes un ${modType} pendiente de revisión` : `Tu ${modType} "${modTitle}" se ha enviado para revisión.`
        };
      case 'rejected':
      case 'rechazado':
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
          label: "Rechazado",
          desc: isAdmin ? `El ${modType} "${modTitle}" ha sido rechazado.` : "No cumple con las normas. Haz clic para ver detalles y corregir."
        };
      case 'inactive':
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
          label: "Inactivo",
          desc: isAdmin ? `El ${modType} "${modTitle}" ha sido pausado.` : "Este contenido ha sido pausado y no es visible."
        };
      default:
        return { 
          icon: ContentTypeIcon, 
          color: getStatusColor(status), 
          bg: getStatusBg(status), 
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

  // Marcar todas como no leídas
  const handleMarkAllAsUnread = async () => {
    if (!user?.id) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, leida: false })));
      
      // Marcar cada notificación individualmente
      const readIds = notifications.filter(n => n.leida).map(n => n.id);
      await Promise.all(readIds.map(id => markNotificationAsUnread(id, user?.id)));
      invalidateNotificationsCache(user?.id);
      refreshNotifications(); // Refrescar conteo global
    } catch (error) {
      console.error("Error marcando todas como no leídas:", error);
    }
  };

  // Marcar como no leída (individual)
  const handleMarkAsUnread = async (notifId) => {
    if (!user?.id) return;
    try {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leida: false } : n));
      await markNotificationAsUnread(notifId, user?.id);
      invalidateNotificationsCache(user?.id);
      refreshNotifications(); // Refrescar conteo global
    } catch (error) {
      console.error("Error marcando como no leída:", error);
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
    // Filtro por estado
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const contentTitle = (n.modtitle || '').toLowerCase();
      const actorName = (n.actorname || '').toLowerCase();
      const commentText = (n.commenttext || '').toLowerCase();
      const notifType = (n.type || '').toLowerCase();
      
      return contentTitle.includes(searchLower) || 
             actorName.includes(searchLower) || 
             commentText.includes(searchLower) ||
             notifType.includes(searchLower);
    }
    
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
    } else if (notif.type === 'status') {
      // Para notificaciones de status, usar la descripción de config que ya está personalizada por rol
      title = '';
    } else {
      title = `Tu ${notif.modtype} "${notif.modtitle}" se ha enviado para revisión`;
    }
    
    // Renderizado especial para comentarios con avatar
    if (notif.type === 'comment') {
      const isReply = !!notif.parentid;
      
      return (
        <div 
          key={notif.id}
          onClick={async () => {
            // Marcar como leída antes de navegar
            if (!notif.leida) {
              await markNotificationAsRead(notif.id, user?.id);
              invalidateNotificationsCache(user?.id);
              refreshNotifications();
            }
            navigate(`/view/${notif.modid}`);
          }}
          className={clsx(
            "group relative flex gap-3 p-3 rounded-xl border cursor-pointer shadow-sm",
            !notif.leida 
              ? "bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-transparent hover:bg-gray-50 dark:hover:bg-[#282828]" 
              : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          )}
        >
          {/* AVATAR DEL USUARIO */}
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full">
              <AvatarRenderer 
                avatar={actorInfo.imagen} 
                name={actorInfo.nombre} 
              />
            </div>
          </div>

          {/* CONTENIDO DEL COMENTARIO */}
          <div className="flex-1 min-w-0">
            {/* HEADER: Nombre */}
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {actorInfo.nombre || 'Alguien'}
              </h4>
              {/* Botón marcar como no leída */}
              {notif.leida && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsUnread(notif.id);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  title="Marcar como no leída"
                >
                  Marcar como no leída
                </button>
              )}
            </div>

            {/* COMENTARIO O RESPUESTA */}
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
              {isReply ? `Respuesta: "${notif.commenttext || '...'}"` : `"${notif.commenttext || '...'}"`}
            </p>

            {/* TIEMPO */}
            <span className="text-[10px] text-gray-400">
              {getTimeAgo(notif.creado)}
            </span>
          </div>

          {/* IMAGEN DEL CONTENIDO */}
          {notif.modimage && (
            <div className="relative h-20 aspect-video shrink-0">
              <img 
                src={notif.modimage} 
                alt={notif.modtitle}
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      );
    }
    
    // Renderizado especial para likes con avatar
    if (notif.type === 'like') {
      return (
        <div 
          key={notif.id}
          onClick={async () => {
            // Marcar como leída antes de navegar
            if (!notif.leida) {
              await markNotificationAsRead(notif.id, user?.id);
              invalidateNotificationsCache(user?.id);
              refreshNotifications();
            }
            navigate(`/view/${notif.modid}`);
          }}
          className={clsx(
            "group relative flex gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer",
            !notif.leida 
              ? "bg-white dark:bg-[#1e1e1e] border-primary-200 dark:border-primary-900/40 shadow-md shadow-primary-500/5" 
              : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90"
          )}
        >
          {/* AVATAR DEL USUARIO */}
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full">
              <AvatarRenderer 
                avatar={actorInfo.imagen} 
                name={actorInfo.nombre} 
              />
            </div>
          </div>

          {/* CONTENIDO DEL LIKE */}
          <div className="flex-1 min-w-0">
            {/* HEADER: Nombre */}
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {actorInfo.nombre || 'Alguien'}
              </h4>
              {/* Botón marcar como no leída */}
              {notif.leida && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsUnread(notif.id);
                  }}
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                  title="Marcar como no leída"
                >
                  Marcar como no leída
                </button>
              )}
            </div>

            {/* MENSAJE DE LIKE */}
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
              Le gustó tu {notif.modtype}
            </p>

            {/* TIEMPO */}
            <span className="text-[10px] text-gray-400">
              {getTimeAgo(notif.creado)}
            </span>
          </div>

          {/* IMAGEN DEL CONTENIDO */}
          {notif.modimage && (
            <div className="relative h-20 aspect-video shrink-0">
              <img 
                src={notif.modimage} 
                alt={notif.modtitle}
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      );
    }
    
    // Renderizado normal para otros tipos de notificaciones
    return (
      <div 
        key={notif.id}
        onClick={async () => {
          // Marcar como leída antes de navegar
          if (!notif.leida) {
            await markNotificationAsRead(notif.id, user?.id);
            invalidateNotificationsCache(user?.id);
            refreshNotifications();
          }
          // Siempre navegar a vista del contenido
          navigate(`/view/${notif.modid}`);
        }}
        className={clsx(
          "group relative flex gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer shadow-sm",
          !notif.leida 
            ? "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-transparent" 
            : "bg-gray-50/40 dark:bg-[#151515] border-gray-200 dark:border-gray-800 opacity-90"
        )}
      >
        {/* ICONO */}
        <div className="shrink-0">
          <div className={clsx("p-2 rounded-lg shrink-0", config.bg, config.color)}>
            <StatusIcon size={18} className={notif.status === 'pending' ? 'animate-pulse' : ''} />
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 min-w-0">
          {/* HEADER: Tipo */}
          <div className="flex items-center justify-between mb-1">
            <span className={clsx("text-[10px] font-black uppercase tracking-wider", config.color)}>
              {config.label}
            </span>
            {/* Botón marcar como no leída */}
            {notif.leida && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsUnread(notif.id);
                }}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                title="Marcar como no leída"
              >
                Marcar como no leída
              </button>
            )}
          </div>

          {/* TÍTULO/DESCRIPCIÓN */}
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">
            {title || description}
          </h3>

          {/* TIEMPO */}
          <span className="text-[10px] text-gray-400">
            {getTimeAgo(notif.creado)}
          </span>
        </div>

        {/* IMAGEN DEL CONTENIDO */}
        {notif.modimage && (
          <div className="relative h-20 aspect-video shrink-0">
            <img 
              src={notif.modimage} 
              alt={notif.modtitle}
              className="w-full h-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2 md:mb-6">

        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white", `bg-gradient-to-br from-blue-500 to-cyan-500`)}>
              <Bell size={20} strokeWidth={2.5} />
          </div>
          Notificaciones
        </h1>
          
        <div className="flex gap-2">
          {notifications.filter(n => !n.leida).length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
            >
              Marcar todas como leídas
            </button>
          )}
          {notifications.filter(n => n.leida).length > 0 && (
            <button
              onClick={handleMarkAllAsUnread}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
            >
              Marcar todas como no leídas
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="mb-6 flex flex-row gap-3 items-center">
        {/* Búsqueda */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar notificaciones..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
          />
        </div>

        {/* Filtro de estado */}
        <div className="hidden md:block relative w-full md:w-auto" ref={filterDropdownRef}>
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