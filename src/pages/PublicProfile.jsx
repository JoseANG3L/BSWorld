import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentByCreator, getUserByUsername, getUserPublicProfile } from '../services/api';
import Card from '../components/Card';
import { 
  Calendar, Shield, UserX, Loader2,
  Grid, Boxes, Map, Gamepad2, Package, Wrench, User, Search, ChevronDown, ArrowUpDown, Edit3, Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';

const PublicProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth(); // Contexto de usuario autenticado
  
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
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
        
        if (!finalProfile && userContent.length === 0) setExists(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [username]);

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
    let resultado = content.filter(item => {
      if (activeTab === 'todos') return true;
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
  }, [content, activeTab, busqueda, orden]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48}/>
    </div>
  );

  if (!exists) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="bg-gray-100 dark:bg-[#191B1E] p-8 rounded-full mb-6">
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
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* SECCIÓN 1: PERFIL */}
      <div className="relative mb-8">
         <div className="h-32 md:h-64 w-full relative overflow-hidden transition-opacity opacity-90 group-hover:opacity-100 rounded-3xl">
            {banner ? (
                isBannerUrl ? (
                    <img src={banner} alt="Banner" loading="lazy" referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full" style={{ background: banner }}></div>
                )
            ) : (
                <div className={clsx("w-full h-full", profile?.role === 'admin' ? "bg-gradient-to-r from-yellow-500 to-orange-600" : "bg-gradient-to-r from-primary-600 to-purple-600")}></div>
            )}
         </div>

         <div className="max-w-7xl mx-auto">
             <div className="relative -mt-16 md:-mt-20 flex flex-col items-center text-center">
                 <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white dark:border-[#121212] bg-white dark:bg-[#1e1e1e] shadow-xl overflow-hidden">
                        <AvatarRenderer avatar={displayAvatar} name={username} /> 
                    </div>
                    {profile?.role === 'admin' && (
                        <div className="absolute bottom-2 right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full border-4 border-white dark:border-[#121212]" title="Admin">
                            <Shield size={16} fill="currentColor" />
                        </div>
                    )}
                 </div>

                 <div className="mt-4">
                     <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        {username}
                     </h1>

                     {/* BOTÓN EDITAR PERFIL DEBAJO DEL NOMBRE */}
                     {isOwnProfile && (
                       <div className="mt-3 flex justify-center">
                         <Link
                           to="/configuracion"
                           className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#191B1E] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors border border-gray-300 dark:border-gray-700 shadow-sm"
                         >
                           <Settings size={15} />
                           <span>Editar perfil</span>
                         </Link>
                       </div>
                     )}

                     <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-300">
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-lg">{content.length}</span>
                             <span className="text-xs uppercase text-gray-400">Posts</span>
                         </div>
                         <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                         <div className="flex flex-col items-center">
                            <span className="font-bold text-lg"><Calendar size={18} className="mb-0.5 inline"/></span>
                            <span className="text-xs uppercase text-gray-400">{joinDate}</span>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* SECCIÓN 2: BARRA DE BÚSQUEDA Y ORDENAMIENTO */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
          {/* Búsqueda */}
          <div className="relative w-full md:flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por título o etiquetas..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
            />
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
            <div className="relative w-full md:w-64">
              <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setIsOrdenDropdownOpen(!isOrdenDropdownOpen)} 
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {orden === 'mas_descargas' ? 'Más Descargas' : orden === 'mas_vistas' ? 'Más Vistas' : orden === 'az' ? 'Nombre (A-Z)' : orden === 'za' ? 'Nombre (Z-A)' : orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden}
                </span>
              </button>
              <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isOrdenDropdownOpen && "rotate-180")} />

              {isOrdenDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 dark:bg-[#191B1E] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
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
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron resultados</p>
          <p className="text-sm">Intenta con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;