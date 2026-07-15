import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContentByCreator, getUserByUsername, getUserPublicProfile } from '../services/api'; // Importamos la nueva función
import Card from '../components/Card';
import { 
  Calendar, Shield, UserX, Loader2,
  Grid, Boxes, Map, Gamepad2, Package, Wrench, User, Search, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer';

const PublicProfile = () => {
  const { username } = useParams();
  
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(true);
  
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Obtener UID a partir del username
        const userData = await getUserByUsername(username);
        
        let finalProfile = userData;

        // 2. Si encontramos el UID, usamos getUserPublicProfile para obtener datos frescos y cacheados
        if (userData && userData.uid) {
            const publicProfile = await getUserPublicProfile(userData.uid);
            // Fusionamos: Los datos de 'userData' (como el banner/rol que vienen de la query)
            // con los datos frescos de 'publicProfile' (nombre/imagen actualizados)
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

  // --- LÓGICA DE FILTRADO ---
  const filteredContent = content.filter(item => {
    if (activeTab === 'todos') return true;
    return item.tipo === activeTab;
  });

  // --- CONFIGURACIÓN DE TABS ---
  const counts = {
    mapa: content.filter(i => i.tipo === 'mapa').length,
    minijuego: content.filter(i => i.tipo === 'minijuego').length,
    modpack: content.filter(i => i.tipo === 'modpack').length,
    mod: content.filter(i => i.tipo === 'mod').length,
    paquete: content.filter(i => i.tipo === 'paquete').length,
    personaje: content.filter(i => i.tipo === 'personaje').length,
  };

  const tabsConfig = [
    { id: 'todos', label: 'Todo', icon: Grid, count: content.length },
    { id: 'mapa', label: 'Mapas', icon: Map, count: counts.mapa },
    { id: 'minijuego', label: 'Minijuegos', icon: Gamepad2, count: counts.minijuego },
    { id: 'modpack', label: 'Modpacks', icon: Boxes, count: counts.modpack },
    { id: 'mod', label: 'Mods', icon: Wrench, count: counts.mod },
    { id: 'paquete', label: 'Paquetes', icon: Package, count: counts.paquete },
    { id: 'personaje', label: 'Personajes', icon: User, count: counts.personaje },
  ];

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48}/>
    </div>
  );

  if (!exists) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
           <UserX size={64} className="text-gray-400"/>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Usuario no encontrado</h2>
    </div>
  );

  // Avatar y Banner
  // Priorizamos 'imagen' (que viene de getUserPublicProfile) sobre 'avatar'
  const displayAvatar = profile?.imagen || profile?.avatar; 
  const hasCustomBanner = !!profile?.banner;
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

      {/* SECCIÓN 2: TABS */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6">
        <div className="block md:hidden">
            <div className="relative">
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-3 pl-4 pr-10 rounded-xl shadow-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all">
                    {tabsConfig.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.label} {tab.count > 0 ? `(${tab.count})` : ''}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="hidden md:flex justify-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide max-w-full">
                {tabsConfig.map((tab) => (
                    <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} count={tab.count} />
                ))}
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

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick} className={clsx("flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border select-none", active ? "bg-primary-600 text-white border-primary-600 shadow-sm transform" : "bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800")}>
    <Icon size={16} /> {label} {count > 0 && <span className={clsx("ml-1 text-[10px] px-1.5 py-0.5 rounded-md", active ? "bg-white/20 text-white dark:bg-black/10" : "bg-gray-100 dark:bg-gray-700 text-gray-400")}>{count}</span>}
  </button>
);

export default PublicProfile;