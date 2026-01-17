import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContentByCreator, getUserByUsername } from '../services/api';
import Card from '../components/Card';
import { 
  Calendar, Shield, UserX, Loader2, 
  Grid, Boxes, Map, Gamepad2, Package, Wrench, User, Filter, CheckCircle, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import AvatarRenderer from '../components/AvatarRenderer'; // Asegúrate de importar esto si lo creaste

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
        const userData = await getUserByUsername(username);
        setProfile(userData);

        const userContent = await getContentByCreator(username);
        setContent(userContent);
        
        if (!userData && userContent.length === 0) setExists(false);
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

  // --- CONFIGURACIÓN DE TABS (Centralizada) ---
  // Calculamos los conteos y definimos las tabs aquí para usarlas en el Select y en los Botones
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
  const displayAvatar = profile?.avatar; 
  const hasCustomBanner = !!profile?.banner;
  const joinDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) 
    : 'N/A';

  return (
    <div className="animate-fade-in-up pb-10">
      
      {/* ==================================================
          SECCIÓN 1: PERFIL EXTENDIDO (ARRIBA)
         ================================================== */}
      <div className="relative mb-8">
         
         {/* Fondo del Header */}
         <div 
           className={clsx(
             "h-48 md:h-64 relative overflow-hidden bg-gray-900",
             !hasCustomBanner && "bg-gradient-to-r from-primary-900 via-purple-900 to-indigo-900"
           )}
         >
             {hasCustomBanner ? (
                <>
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ background: profile.banner?.startsWith('http') ? `url(${profile.banner})` : profile.banner }}
                  ></div>
                  <div className="absolute inset-0 bg-black/30"></div>
                </>
             ) : (
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             )}
         </div>

         {/* Info del Usuario */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="relative -mt-16 md:-mt-20 flex flex-col items-center text-center">
                 
                 {/* Avatar */}
                 <div className="relative group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white dark:border-[#121212] bg-white dark:bg-[#1e1e1e] shadow-xl overflow-hidden">
                        {/* Usamos el componente AvatarRenderer si lo tienes, sino img normal */}
                        <AvatarRenderer avatar={displayAvatar} name={username} /> 
                    </div>
                    {profile?.role === 'admin' && (
                        <div className="absolute bottom-2 right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full border-4 border-white dark:border-[#121212]" title="Admin">
                            <Shield size={16} fill="currentColor" />
                        </div>
                    )}
                 </div>

                 {/* Nombre */}
                 <div className="mt-4">
                     <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        {profile?.displayName || username}
                        {profile && <CheckCircle size={20} className="text-blue-500 fill-blue-500/10" />}
                     </h1>
                     <p className="text-gray-500 dark:text-gray-400 font-medium">@{username}</p>
                     
                     {/* Stats */}
                     <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-300">
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-lg">{content.length}</span>
                             <span className="text-xs uppercase text-gray-400">Posts</span>
                         </div>
                         <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                         <div className="flex flex-col items-center">
                             <span className="font-bold text-lg">{content.length * 15}</span>
                             <span className="text-xs uppercase text-gray-400">Puntos</span>
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

      {/* ==================================================
          SECCIÓN 2: MENÚ DE NAVEGACIÓN
         ================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        
        {/* OPCIÓN A: MENU SELECT (SOLO MÓVIL) */}
        <div className="block md:hidden">
            <div className="relative">
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white py-3 pl-4 pr-10 rounded-xl shadow-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                >
                    {tabsConfig.map((tab) => (
                        <option key={tab.id} value={tab.id}>
                            {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* OPCIÓN B: TABS DE BOTONES (SOLO ESCRITORIO) */}
        <div className="hidden md:flex justify-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide max-w-full">
                {tabsConfig.map((tab) => (
                    <TabButton 
                        key={tab.id}
                        active={activeTab === tab.id} 
                        onClick={() => setActiveTab(tab.id)}
                        icon={tab.icon} 
                        label={tab.label} 
                        count={tab.count}
                    />
                ))}
            </div>
        </div>

      </div>

      {/* ==================================================
          SECCIÓN 3: GRID DE CONTENIDO
         ================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item) => (
               <Card key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
             <div className="p-4 bg-white dark:bg-gray-800 rounded-full mb-3 shadow-sm">
               <Filter size={32} className="text-gray-400" />
             </div>
             <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
               No hay contenido en esta categoría.
             </p>
             {activeTab !== 'todos' && (
               <button 
                 onClick={() => setActiveTab('todos')}
                 className="mt-2 text-primary-600 font-bold hover:underline"
               >
                 Ver todas las publicaciones
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para botones de Tabs (Estilizado)
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap border select-none",
      active 
        ? "bg-gray-900 text-white dark:bg-white dark:text-black border-transparent shadow-lg transform scale-105" 
        : "bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
    )}
  >
    <Icon size={16} />
    {label}
    {count > 0 && (
      <span className={clsx(
        "ml-1 text-[10px] px-1.5 py-0.5 rounded-md",
        active ? "bg-white/20 text-white dark:bg-black/10 dark:text-black" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
      )}>
        {count}
      </span>
    )}
  </button>
);

export default PublicProfile;