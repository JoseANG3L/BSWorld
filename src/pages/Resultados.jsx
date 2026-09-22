import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Loader2, Frown, Filter, Map, Gamepad2, Wrench, Boxes, Package, Grid, ChevronDown, User, MessageSquare, Users
} from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../components/Card';
import CreatorCard from '../components/CreatorCard';
import ForumPost from '../components/ForumPost';
import { getAllContent, getAllUsers, getForumPosts } from '../services/api';
import DataContainer from '../components/DataContainer';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [contentResults, setContentResults] = useState([]); 
  const [userResults, setUserResults] = useState([]);
  const [forumResults, setForumResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contenido');

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const lowerQuery = query.toLowerCase();
        
        // Buscar contenido
        const contentData = await getAllContent();
        const contentMatches = contentData.filter(item => {
          const matchTitle = item.titulo?.toLowerCase().includes(lowerQuery);
          const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
          const matchCreators = Array.isArray(item.creadores) 
            ? item.creadores.some(c => (typeof c === 'string' ? c : c.nombre).toLowerCase().includes(lowerQuery))
            : false;
          return matchTitle || matchTags || matchCreators;
        });
        setContentResults(contentMatches);

        // Buscar usuarios
        const userData = await getAllUsers();
        const userMatches = userData.filter(user => 
          user.username?.toLowerCase().includes(lowerQuery)
        );
        setUserResults(userMatches);

        // Buscar posts del foro
        const forumData = await getForumPosts();
        const forumMatches = forumData.filter(post => {
          const matchTitle = post.title?.toLowerCase().includes(lowerQuery);
          const matchContent = post.content?.toLowerCase().includes(lowerQuery);
          return matchTitle || matchContent;
        });
        setForumResults(forumMatches);

      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) performSearch();
  }, [query]);

  const tabsConfig = [
    { id: 'contenido', label: 'Contenido', icon: Grid, count: contentResults.length },
    { id: 'usuarios', label: 'Usuarios', icon: Users, count: userResults.length },
    { id: 'foro', label: 'Foro', icon: MessageSquare, count: forumResults.length },
  ];

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48} />
      <p className="text-gray-500 animate-pulse">Buscando en los archivos...</p>
    </div>
  );

  const renderContentItem = (item) => {
    const total = item.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
    return <Card key={item.id} id={item.id} {...item} totalDownloads={total} />;
  };

  const renderUserItem = (user) => (
    <CreatorCard key={user.id} username={user.username} avatar={user.avatar} role={user.role} />
  );

  const renderForumItem = (post) => (
    <ForumPost key={post.id} post={post} onPostMutated={() => {}} />
  );

  return (
    <div className="animate-fade-in-up pb-10">
      
      {/* HEADER DE RESULTADOS */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600">
             <Search size={20} strokeWidth={2.5} />
          </div>
          Resultados para: <span className="text-primary-600 dark:text-primary-400 italic">"{query}"</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
          Se encontraron <b>{contentResults.length + userResults.length + forumResults.length}</b> coincidencias.
        </p>
      </div>

      {/* TABS DE FILTRO */}
      <div className="mb-6">
        <div className="block md:hidden">
          <div className="relative">
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-3 pl-4 pr-10 rounded-xl shadow-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
            >
              {tabsConfig.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden md:flex justify-start">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide max-w-full">
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

      {/* RESULTADOS POR TAB */}
      {activeTab === 'contenido' && (
        contentResults.length > 0 ? (
          <DataContainer
            title="Contenido Encontrado"
            icon={Grid}
            gradientClass="from-purple-500 to-pink-500"
            items={contentResults}
            searchKey="titulo"
            dateKey="creado"
            renderItem={renderContentItem}
            enableTypeFilter={true}
            typeKey="tipo"
            customTypes={['mapa', 'minijuego', 'modpack', 'complemento', 'paquete', 'personaje']}
            showHeader={false}
          />
        ) : (
          <EmptyState message="No se encontró contenido" />
        )
      )}

      {activeTab === 'usuarios' && (
        userResults.length > 0 ? (
          <DataContainer
            title="Usuarios Encontrados"
            icon={Users}
            gradientClass="from-green-500 to-teal-500"
            items={userResults}
            searchKey="username"
            dateKey="createdat"
            renderItem={renderUserItem}
            showHeader={false}
            layout="grid"
          />
        ) : (
          <EmptyState message="No se encontraron usuarios" />
        )
      )}

      {activeTab === 'foro' && (
        forumResults.length > 0 ? (
          <DataContainer
            title="Posts del Foro"
            icon={MessageSquare}
            gradientClass="from-blue-500 to-purple-500"
            items={forumResults.map(post => ({
              ...post,
              searchContent: `${post.title || ''} ${post.content || ''}`.toLowerCase()
            }))}
            searchKey="searchContent"
            dateKey="created_at"
            renderItem={renderForumItem}
            enableTypeFilter={true}
            typeKey="category"
            customTypes={['General', 'Ayuda', 'Discusión', 'Anuncios', 'Proyectos', 'Off-topic']}
            layout="forum-columns"
            showHeader={false}
          />
        ) : (
          <EmptyState message="No se encontraron posts en el foro" />
        )
      )}

      {/* ESTADO VACÍO TOTAL */}
      {contentResults.length === 0 && userResults.length === 0 && forumResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
           <div className="bg-gray-200 dark:bg-[#1D1F23] p-6 rounded-full mb-4">
              <Frown size={64} className="text-gray-400" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No encontramos nada</h2>
           <p className="text-gray-500 dark:text-gray-400 max-w-md">
             Intenta con otras palabras clave, revisa la ortografía o busca términos más generales.
           </p>
        </div>
      )}
    </div>
  );
};

// Componente TabButton
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap border select-none",
      active 
        ? "bg-primary-600 text-white border-primary-600 shadow-md transform" 
        : "bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#191B1E]"
    )}
  >
    <Icon size={16} />
    {label}
    {count > 0 && (
      <span className={clsx(
        "ml-1 text-[10px] px-1.5 py-0.5 rounded-md",
        active ? "bg-white/20 text-white dark:bg-black/10" : "bg-gray-100 dark:bg-gray-700 text-gray-400"
      )}>
        {count}
      </span>
    )}
  </button>
);

// Componente EmptyState
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
    <Search size={48} className="mb-4 opacity-20" />
    <p className="text-lg font-medium">{message}</p>
    <p className="text-sm">Intenta con otro término de búsqueda.</p>
  </div>
);

export default Resultados;