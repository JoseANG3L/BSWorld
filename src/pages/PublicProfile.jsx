import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { getContentByCreator, getUserByUsername, getUserPublicProfile, getUserLikedContent } from '../services/api';
import Card from '../components/Card';
import { 
  Calendar, Shield, UserX, Loader2, Heart, Youtube, Twitter, Instagram, Linkedin, Github, Globe, MessageCircle, Download,
  Grid, Boxes, Map, Gamepad2, Package, Wrench, User, Search, ChevronDown, ArrowUpDown, Edit3, Settings, Filter, X, Check, Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';

// Cache simple para perfiles
const profileCache = {};

const capitalizeText = (str) => {
  if (!str) return '';
  const stringValue = str.toString();
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
};

const PublicProfile = () => {
  const { username } = useParams();
  const location = useLocation();
  const { user: currentUser } = useAuth(); // Contexto de usuario autenticado
  
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
  const [likedContent, setLikedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [activeTab, setActiveTab] = useState('todos');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  
  // Estados temporales para el modal en móvil
  const [tempOrden, setTempOrden] = useState('recientes');
  const [tempSelectedTypes, setTempSelectedTypes] = useState([]);
  
  const ordenDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // Verificar si el usuario en sesión es el dueño de este perfil
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !profile) return false;
    return currentUser.id === profile.uid || currentUser.username?.toLowerCase() === username?.toLowerCase();
  }, [currentUser, profile, username]);

  // Cierre de menús al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setIsOrdenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloqueo de scroll cuando el modal de filtros está abierto
  useEffect(() => {
    if (isFiltersModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFiltersModalOpen]);

  // Abrir modal e inicializar estados temporales
  const handleOpenFiltersModal = () => {
    setTempOrden(orden);
    setTempSelectedTypes(selectedTypes);
    setIsFiltersModalOpen(true);
  };

  // Tipos disponibles
  const availableTypes = useMemo(() => {
    const types = [...new Set(content.map(item => item.tipo))];
    return types.filter(Boolean);
  }, [content]);

  // Función para formatear números con K/M
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Calcular estadísticas totales
  const totalStats = useMemo(() => {
    const totalLikes = content.reduce((acc, item) => acc + (item.likes_count || 0), 0);
    const totalDescargas = content.reduce((acc, item) => {
      return acc + (item.descargas || []).reduce((dAcc, curr) => dAcc + (curr.count || 0), 0);
    }, 0);
    const totalVistas = content.reduce((acc, item) => acc + (item.vistas || 0), 0);
    
    return {
      likes: totalLikes,
      descargas: totalDescargas,
      vistas: totalVistas
    };
  }, [content]);

  useEffect(() => {
    const loadData = async () => {
      // Verificar si ya tenemos datos en cache para este username
      const cacheKey = username?.toLowerCase();
      if (profileCache[cacheKey]) {
        setProfile(profileCache[cacheKey].profile);
        setContent(profileCache[cacheKey].content);
        setLikedContent(profileCache[cacheKey].likedContent || []);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Obtener UID a partir del username
        const userData = await getUserByUsername(username);
        
        let finalProfile = userData;

        // 2. Si encontramos el UID, usamos getUserPublicProfile para obtener datos frescos
        if (userData && userData.uid) {
            const publicProfile = await getUserPublicProfile(userData.uid);
            finalProfile = { ...userData, ...publicProfile };
        }

        setProfile(finalProfile);

        // 3. Cargar contenido
        const userContent = await getContentByCreator(username);
        setContent(userContent);

        // 4. Cargar contenido liked del perfil visitado
        let liked = [];
        if (finalProfile && finalProfile.uid) {
          console.log('Cargando likes para UID:', finalProfile.uid);
          liked = await getUserLikedContent(finalProfile.uid);
          console.log('Datos de likes recibidos:', liked);
          const contentFromLikes = liked.map(item => item.content).filter(Boolean);
          console.log('Contenido extraído de likes:', contentFromLikes);
          setLikedContent(contentFromLikes);
        }
        
        // Guardar en cache
        profileCache[cacheKey] = {
          profile: finalProfile,
          content: userContent,
          likedContent: liked.map(item => item.content).filter(Boolean)
        };
        
        if (!finalProfile && userContent.length === 0) setExists(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [username, currentUser]);

  // Actualizar perfil localmente cuando el usuario actual cambia sus datos y es su propio perfil
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setProfile(prev => ({
        ...prev,
        username: currentUser.username,
        avatar: currentUser.avatar,
        banner: currentUser.banner
      }));
    }
  }, [currentUser, isOwnProfile]);

  // --- LÓGICA DE FILTRADO ---
  const filteredContent = useMemo(() => {
    // Determinar qué contenido usar según el tab activo
    let sourceContent = activeTab === 'likes' ? likedContent : content;
    
    let resultado = sourceContent.filter(item => {
      if (activeTab === 'todos' || activeTab === 'likes') return true;
      return item.tipo === activeTab;
    });

    // Filtrar por tipos seleccionados
    if (selectedTypes.length > 0) {
      const typesInLowerCase = selectedTypes.map(t => t.toString().toLowerCase());
      resultado = resultado.filter(item => {
        const itemType = item.tipo?.toString().toLowerCase();
        return itemType && typesInLowerCase.includes(itemType);
      });
    }

    if (busqueda) {
      const lowerBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(item => {
        const matchTitle = item.titulo?.toLowerCase().includes(lowerBusqueda);
        const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(lowerBusqueda));
        return matchTitle || matchTags;
      });
    }

    resultado.sort((a, b) => {
      if (orden === 'recientes') return new Date(b.creado) - new Date(a.creado);
      if (orden === 'antiguos') return new Date(a.creado) - new Date(b.creado);
      if (orden === 'az') return a.titulo.localeCompare(b.titulo);
      if (orden === 'za') return b.titulo.localeCompare(a.titulo);
      if (orden === 'mas_vistas') return (b.vistas || 0) - (a.vistas || 0);
      if (orden === 'mas_descargas') {
        const totalA = (a.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
        const totalB = (b.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
        return totalB - totalA;
      }
      return 0;
    });

    return resultado;
  }, [content, likedContent, activeTab, busqueda, orden, selectedTypes]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48}/>
    </div>
  );

  if (!exists) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="bg-gray-100 dark:bg-[#1D1F23] p-8 rounded-full mb-6">
           <UserX size={64} className="text-gray-400"/>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Usuario no encontrado</h2>
    </div>
  );

  const displayAvatar = profile?.imagen || profile?.avatar; 
  const banner = profile?.banner;
  const joinDate = profile?.createdat 
    ? new Date(profile.createdat).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : 'N/A';

  const isBannerUrl = banner && (banner.startsWith('http') || banner.startsWith('data:image'));

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* SECCIÓN 1: PERFIL */}
      <div className="flex items-center gap-4 justify-between mb-4 md:mb-6 px-2 md:px-4">
        {/* AVATAR, NOMBRE, FECHA Y REDES IZQUIERDA */}
        <div className="flex-1 flex items-center gap-4 md:gap-6 min-w-0">
            {/* AVATAR */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 md:w-36 md:h-36 rounded-full shadow-lg overflow-hidden">
                  <AvatarRenderer avatar={displayAvatar} name={username} /> 
              </div>
              {profile?.role === 'admin' && (
                  <div className="absolute bottom-0 right-0 bg-yellow-400 text-yellow-900 p-1 rounded-full border-2 border-white dark:border-[#121212]" title="Admin">
                      <Shield size={12} fill="currentColor" />
                  </div>
              )}
            </div>

            {/* NOMBRE, FECHA Y REDES */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate">
                      {username}
                    </h1>
                    
                    {/* BOTÓN EDITAR PERFIL */}
                    {isOwnProfile && (
                      <Link
                        to="/configuracion"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1D1F23] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors border border-gray-300 dark:border-gray-700 shadow-sm shrink-0"
                      >
                        <Settings size={16} />
                      </Link>
                    )}
                </div>
                
                {/* FECHA DE MIEMBRO */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Miembro desde {joinDate}
                </div>

                {/* DESCRIPCIÓN */}
                {profile?.descripcion && (
                    <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {profile.descripcion}
                    </div>
                )}

                {/* REDES SOCIALES */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {profile?.youtube && (
                        <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                            <Youtube size={18} />
                        </a>
                    )}
                    {profile?.twitter && (
                        <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                            <Twitter size={18} />
                        </a>
                    )}
                    {profile?.instagram && (
                        <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                            <Instagram size={18} />
                        </a>
                    )}
                    {profile?.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                            <Linkedin size={18} />
                        </a>
                    )}
                    {profile?.github && (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <Github size={18} />
                        </a>
                    )}
                    {profile?.discord && (
                        <a href={profile.discord} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                            <MessageCircle size={18} />
                        </a>
                    )}
                    {profile?.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                            <Globe size={18} />
                        </a>
                    )}
                </div>
            </div>
        </div>

        {/* ESTADÍSTICAS DERECHA */}
        <div className="flex items-center gap-8 shrink-0">
            <div className="flex flex-col items-center">
                <Eye size={22} className="text-green-500 mb-1" />
                <span className="font-bold text-gray-900 dark:text-white text-xl">{formatNumber(totalStats.vistas)}</span>
                <span className="text-[11px] uppercase text-gray-500 dark:text-gray-400 font-medium">Vistas</span>
            </div>
            <div className="flex flex-col items-center">
                <Download size={22} className="text-blue-500 mb-1" />
                <span className="font-bold text-gray-900 dark:text-white text-xl">{formatNumber(totalStats.descargas)}</span>
                <span className="text-[11px] uppercase text-gray-500 dark:text-gray-400 font-medium">Descargas</span>
            </div>
            <div className="flex flex-col items-center">
                <Heart size={22} className="text-red-500 mb-1" />
                <span className="font-bold text-gray-900 dark:text-white text-xl">{formatNumber(totalStats.likes)}</span>
                <span className="text-[11px] uppercase text-gray-500 dark:text-gray-400 font-medium">Likes</span>
            </div>
        </div>
      </div>

      {/* SECCIÓN 2: TABS */}
      <div className="mb-2 md:mb-4">
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('todos')}
            className={clsx(
              "pb-3 px-14 text-sm font-semibold transition-all duration-200 flex items-center gap-2",
              activeTab === 'todos'
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent"
            )}
          >
            <Grid size={16} />
            Mods
            <span className="text-xs opacity-60">({content.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={clsx(
              "pb-3 px-14 text-sm font-semibold transition-all duration-200 flex items-center gap-2",
              activeTab === 'likes'
                ? "text-red-500 dark:text-red-400 border-b-2 border-red-500 dark:border-red-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent"
            )}
          >
            <Heart size={16} />
            Me gustó
            <span className="text-xs opacity-60">({likedContent.length})</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 3: BARRA DE BÚSQUEDA Y ORDENAMIENTO */}
      <div className="mb-2 md:mb-4 flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center">
          {/* Búsqueda */}
          <div className="relative w-full md:flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por título o etiquetas..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
            />
          </div>

          {/* Botón para abrir modal de filtros en móvil */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={handleOpenFiltersModal}
              className="relative px-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium flex items-center gap-2 shrink-0"
            >
              <Filter size={18} className="text-gray-500 dark:text-gray-400" />
              <span>Filtros</span>
              {(selectedTypes.length > 0 || orden !== 'recientes') && (
                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>
              )}
            </button>
          </div>

          {/* Filtro de tipos (Desktop) */}
          {availableTypes.length > 0 && (
            <div className="hidden md:block relative w-full md:w-auto" ref={typeDropdownRef}>
              <div className="relative w-full md:w-56 lg:w-64">
                <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsOrdenDropdownOpen(false); }}
                  className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
                >
                  <span className="truncate block">
                    {selectedTypes.length === 0 
                      ? 'Todos los tipos' 
                      : selectedTypes.length === 1 
                        ? capitalizeText(selectedTypes[0]) 
                        : `${selectedTypes.length} tipos`}
                  </span>
                </button>
                <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isTypeDropdownOpen && "rotate-180")} />
              </div>

              {isTypeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => { setSelectedTypes([]); setIsTypeDropdownOpen(false); }}
                      className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left", selectedTypes.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                    >
                      <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0", selectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                        {selectedTypes.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>Todos los tipos</span>
                    </button>
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedTypes(prev => 
                          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left", selectedTypes.includes(type) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                      >
                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0", selectedTypes.includes(type) ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                          {selectedTypes.includes(type) && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-ellipsis overflow-hidden shrink">{capitalizeText(type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ordenamiento (Desktop) */}
          <div className="hidden md:flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
            <div className="relative w-full md:w-56 lg:w-64">
              <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setIsOrdenDropdownOpen(!isOrdenDropdownOpen)} 
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {orden === 'mas_descargas' ? 'Más Descargas' : orden === 'mas_vistas' ? 'Más Vistas' : orden === 'az' ? 'Nombre (A-Z)' : orden === 'za' ? 'Nombre (Z-A)' : orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden}
                </span>
              </button>
              <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isOrdenDropdownOpen && "rotate-180")} />

              {isOrdenDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                  <div className="flex flex-col gap-0.5">
                    {[{ val: 'mas_descargas', label: 'Más Descargas' }, { val: 'mas_vistas', label: 'Más Vistas' }, { val: 'az', label: 'Nombre (A-Z)' }, { val: 'za', label: 'Nombre (Z-A)' }, { val: 'recientes', label: 'Más Recientes' }, { val: 'antiguos', label: 'Más Antiguos' }].map((opt) => (
                      <button 
                        key={opt.val} 
                        type="button" 
                        onClick={() => { setOrden(opt.val); setIsOrdenDropdownOpen(false); }} 
                        className={clsx("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors", orden === opt.val ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>

      {/* SECCIÓN 3: CONTENIDO */}
      {filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {filteredContent.map((item) => (
              <Card key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          {activeTab === 'likes' ? (
            <>
              <Heart size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {likedContent.length === 0 ? 'Aún no has dado like a ningún mod' : 'No se encontraron resultados'}
              </p>
              <p className="text-sm">
                {likedContent.length === 0 ? 'Explora el contenido y dale like a tus mods favoritos.' : 'Intenta con otro término de búsqueda.'}
              </p>
            </>
          ) : (
            <>
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron resultados</p>
              <p className="text-sm">Intenta con otro término de búsqueda o limpiando filtros.</p>
            </>
          )}
        </div>
      )}

      {/* MODAL DE FILTROS EN MÓVIL */}
      {isFiltersModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:hidden"
          onClick={() => setIsFiltersModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 max-w-sm w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '200ms' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={18} className="text-primary-600 dark:text-primary-400" />
                <span>Filtros</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover.text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Filtro de tipos */}
              {availableTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tipo de contenido</h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setTempSelectedTypes([])}
                      className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full", tempSelectedTypes.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                    >
                      <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0", tempSelectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                        {tempSelectedTypes.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>Todos los tipos</span>
                    </button>
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTempSelectedTypes(prev => 
                          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full", tempSelectedTypes.includes(type) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                      >
                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0", tempSelectedTypes.includes(type) ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                          {tempSelectedTypes.includes(type) && <Check size={12} className="text-white" />}
                        </div>
                        <span className="text-ellipsis overflow-hidden shrink">{capitalizeText(type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ordenamiento */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ordenar por</h4>
                <div className="space-y-2">
                  {[{ val: 'recientes', label: 'Más Recientes' }, { val: 'antiguos', label: 'Más Antiguos' }, { val: 'mas_descargas', label: 'Más Descargas' }, { val: 'mas_vistas', label: 'Más Vistas' }, { val: 'az', label: 'Nombre (A-Z)' }, { val: 'za', label: 'Nombre (Z-A)' }].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTempOrden(opt.val)}
                      className={clsx("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors", tempOrden === opt.val ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrden(tempOrden);
                  setSelectedTypes(tempSelectedTypes);
                  setIsFiltersModalOpen(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PublicProfile;