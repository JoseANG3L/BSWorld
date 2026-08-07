import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getContentByCreator, getUserByUsername, getUserPublicProfile, getUserLikedContent } from '../services/api';
import Card from '../components/Card';
import { 
  Calendar, Shield, UserX, Loader2, Heart, Youtube, Twitter, Instagram, Linkedin, Github, Globe, MessageCircle,
  Grid, Boxes, Map, Gamepad2, Package, Wrench, User, Search, ChevronDown, ArrowUpDown, Edit3, Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';

// Cache simple para perfiles
const profileCache = {};

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
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const ordenDropdownRef = useRef(null);

  // Verificar si el usuario en sesión es el dueño de este perfil
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !profile) return false;
    return currentUser.id === profile.uid || currentUser.username?.toLowerCase() === username?.toLowerCase();
  }, [currentUser, profile, username]);

  // Cierre del menú de ordenamiento al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setIsOrdenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        // 4. Si es propio perfil, cargar contenido liked
        let liked = [];
        if (currentUser && finalProfile && (currentUser.id === finalProfile.uid || currentUser.username?.toLowerCase() === username?.toLowerCase())) {
          liked = await getUserLikedContent(currentUser.id);
          const contentFromLikes = liked.map(item => item.content).filter(Boolean);
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
  }, [content, likedContent, activeTab, busqueda, orden]);

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
    ? new Date(profile.createdat).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) 
    : 'N/A';

  const isBannerUrl = banner && (banner.startsWith('http') || banner.startsWith('data:image'));

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* SECCIÓN 1: PERFIL */}
      <div className="relative mb-4 md:mb-6">
         {/* CONTENEDOR PERFIL: AVATAR IZQUIERDA, NOMBRE CENTRO, REDES DERECHA */}
         <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
                 {/* AVATAR IZQUIERDA */}
                 <div className="relative group shrink-0">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-[#2a2d34] shadow-lg overflow-hidden">
                        <AvatarRenderer avatar={displayAvatar} name={username} /> 
                    </div>
                    {profile?.role === 'admin' && (
                        <div className="absolute bottom-0 right-0 bg-yellow-400 text-yellow-900 p-1 rounded-full border-2 border-white dark:border-[#121212]" title="Admin">
                            <Shield size={12} fill="currentColor" />
                        </div>
                    )}
                 </div>

                 {/* NOMBRE CENTRO */}
                 <div className="flex-1 min-w-0">
                     <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate">
                        {username}
                     </h1>
                     
                     {/* ESTADÍSTICAS */}
                     <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                         <div className="flex items-center gap-1.5">
                             <span className="font-bold">{content.length}</span>
                             <span className="text-xs uppercase text-gray-400">Posts</span>
                         </div>
                         <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                         <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span className="text-xs uppercase text-gray-400">{joinDate}</span>
                         </div>
                     </div>

                     {/* BOTÓN EDITAR PERFIL */}
                     {isOwnProfile && (
                       <div className="mt-3">
                         <Link
                           to="/configuracion"
                           className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#1D1F23] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors border border-gray-300 dark:border-gray-700 shadow-sm"
                         >
                           <Settings size={14} />
                           <span>Editar perfil</span>
                         </Link>
                       </div>
                     )}
                 </div>

                 {/* REDES SOCIALES DERECHA */}
                 <div className="flex items-center gap-2 shrink-0">
                     {profile?.youtube && (
                         <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                             <Youtube size={16} />
                         </a>
                     )}
                     {profile?.twitter && (
                         <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                             <Twitter size={16} />
                         </a>
                     )}
                     {profile?.instagram && (
                         <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                             <Instagram size={16} />
                         </a>
                     )}
                     {profile?.linkedin && (
                         <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                             <Linkedin size={16} />
                         </a>
                     )}
                     {profile?.github && (
                         <a href={profile.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                             <Github size={16} />
                         </a>
                     )}
                     {profile?.discord && (
                         <a href={profile.discord} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                             <MessageCircle size={16} />
                         </a>
                     )}
                     {profile?.website && (
                         <a href={profile.website} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                             <Globe size={16} />
                         </a>
                     )}
                 </div>
             </div>
      </div>

      {/* SECCIÓN 2: TABS (Solo para propio perfil) */}
      {isOwnProfile && (
        <div className="mb-2 md:mb-4">
          <div className="inline-flex bg-gray-100 dark:bg-[#1D1F23] rounded-2xl p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('todos')}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                activeTab === 'todos'
                  ? "bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Grid size={16} className={activeTab === 'todos' ? "text-primary-600 dark:text-primary-400" : ""} />
              Mis Mods
              <span className="text-xs opacity-60">({content.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                activeTab === 'likes'
                  ? "bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Heart size={16} className={activeTab === 'likes' ? "text-red-500 fill-current" : ""} />
              Mis Likes
              <span className="text-xs opacity-60">({likedContent.length})</span>
            </button>
          </div>
        </div>
      )}

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

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
            <div className="relative w-full md:w-64">
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
              <p className="text-sm">Intenta con otro término de búsqueda.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;