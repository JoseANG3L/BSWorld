import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Frown, Grid, MessageSquare, Users, Compass } from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../components/Card';
import CreatorCard from '../components/CreatorCard';
import ForumPost from '../components/ForumPost';
import { getAllContent, getAllUsers, getForumPosts } from '../services/api';
import DataContainer from '../components/DataContainer';
import PageHeader from '../components/PageHeader';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [contentResults, setContentResults] = useState([]); 
  const [userResults, setUserResults] = useState([]);
  const [forumResults, setForumResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contenido');

  useEffect(() => {
    const q = query.trim().toLowerCase();

    // Sin término: no buscar (antes se quedaba cargando infinito)
    if (!q) {
      setContentResults([]);
      setUserResults([]);
      setForumResults([]);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const terms = q.split(/\s+/);
        const matches = (...fields) => {
          const haystack = fields.filter(Boolean).join(' ').toLowerCase();
          return terms.some((t) => haystack.includes(t));
        };

        // En paralelo (antes eran 3 awaits secuenciales) y con caché de api.js
        const [contentData, userData, forumData] = await Promise.all([
          getAllContent(),
          getAllUsers(),
          getForumPosts(),
        ]);

        // Buscar contenido (título, tags, creadores, descripción)
        const contentMatches = (contentData || []).filter(item => matches(
          item.titulo,
          Array.isArray(item.tags) ? item.tags.join(' ') : item.tags,
          Array.isArray(item.creadores)
            ? item.creadores.map(c => (typeof c === 'string' ? c : c?.nombre || c?.username)).join(' ')
            : item.creadores,
          item.descripcion
        ));
        setContentResults(contentMatches);

        // Buscar usuarios (nombre y descripción)
        const userMatches = (userData || []).filter(u => matches(u.username, u.descripcion));
        setUserResults(userMatches);

        // Buscar posts del foro (título y contenido)
        const forumMatches = (forumData || []).filter(post => matches(post.title, post.content));
        setForumResults(forumMatches);

        // Ir directo a la primera pestaña con resultados
        const counts = { contenido: contentMatches.length, usuarios: userMatches.length, foro: forumMatches.length };
        setActiveTab((prev) => (
          counts[prev] > 0 ? prev : (['contenido', 'usuarios', 'foro'].find(t => counts[t] > 0) || 'contenido')
        ));
      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const tabsConfig = [
    { id: 'contenido', label: 'Contenido', icon: Grid, count: contentResults.length },
    { id: 'usuarios', label: 'Usuarios', icon: Users, count: userResults.length },
    { id: 'foro', label: 'Foro', icon: MessageSquare, count: forumResults.length },
  ];

  const renderContentItem = (item) => <Card key={item.id} {...item} />;

  const renderUserItem = (user) => (
    <CreatorCard key={user.id} username={user.username} avatar={user.avatar} role={user.role} />
  );

  const renderForumItem = (post) => (
    <ForumPost key={post.id} post={post} onPostMutated={() => {}} />
  );

  return (
    <div className="flex flex-col animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {/* HEADER estilo DataContainer */}
      <div className="flex flex-col gap-3 p-2 md:flex-row md:items-center md:justify-between md:p-4">
        <PageHeader
          title={query.trim() ? `Resultados para "${query.trim()}"` : 'Buscar'}
          icon={Search}
          gradientClass="from-primary-500 to-primary-700"
          className="min-w-0 md:flex-1"
        />

        {/* TABS como pills con scroll (móvil y desktop) */}
        <div className="flex max-w-full items-center gap-2 overflow-x-auto scrollbar-hide md:shrink-0">
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

      {/* RESULTADOS POR TAB */}
      {activeTab === 'contenido' && (
        contentResults.length > 0 || loading ? (
          <DataContainer
            title="Contenido Encontrado"
            icon={Grid}
            gradientClass="from-purple-500 to-pink-500"
            items={contentResults}
            loading={loading}
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
        userResults.length > 0 || loading ? (
          <DataContainer
            title="Usuarios Encontrados"
            icon={Users}
            gradientClass="from-green-500 to-teal-500"
            items={userResults}
            loading={loading}
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
        forumResults.length > 0 || loading ? (
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
            loading={loading}
            showHeader={false}
          />
        ) : (
          <EmptyState message="No se encontraron posts en el foro" />
        )
      )}

      {/* ESTADO VACÍO / SIN TÉRMINO (solo cuando ya terminó de cargar) */}
      {!loading && contentResults.length === 0 && userResults.length === 0 && forumResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
           <div className="bg-gray-200 dark:bg-[#1D1F23] p-6 rounded-full mb-4">
              {query.trim() ? (
                <Frown size={64} className="text-gray-400" />
              ) : (
                <Compass size={64} className="text-primary-500" />
              )}
           </div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
             {query.trim() ? 'No encontramos nada' : 'Busca mods, usuarios o posts'}
           </h2>
           <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
             {query.trim()
               ? 'Intenta con otras palabras clave, revisa la ortografía o busca términos más generales.'
               : 'Escribe en la barra superior qué quieres encontrar.'}
           </p>
           <Link
             to="/mods"
             className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
           >
             Explorar mods
           </Link>
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