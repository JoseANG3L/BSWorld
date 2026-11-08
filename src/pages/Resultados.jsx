import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, Frown, Compass, Filter, ChevronDown } from 'lucide-react';
import Card from '../components/Card';
import CreatorCard from '../components/CreatorCard';
import { getAllContent, getAllUsers } from '../services/api';
import DataContainer from '../components/DataContainer';
import PageHeader from '../components/PageHeader';
import FilterModalHeader from '../components/FilterModalHeader';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [contentResults, setContentResults] = useState([]); 
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contenido');
  const [isEmptyFilterOpen, setIsEmptyFilterOpen] = useState(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();

    // Sin término: no buscar (antes se quedaba cargando infinito)
    if (!q) {
      setContentResults([]);
      setUserResults([]);
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
        const [contentData, userData] = await Promise.all([
          getAllContent(),
          getAllUsers(),
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

        // Ir directo a la primera pestaña con resultados
        const counts = { contenido: contentMatches.length, usuarios: userMatches.length };
        setActiveTab((prev) => (
          counts[prev] > 0 ? prev : (['contenido', 'usuarios'].find(t => counts[t] > 0) || 'contenido')
        ));
      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  useEffect(() => {
    if (!isEmptyFilterOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEmptyFilterOpen]);

  const tabsConfig = [
    { id: 'contenido', label: 'Contenido', count: contentResults.length },
    { id: 'usuarios', label: 'Usuarios', count: userResults.length },
  ];

  const contentSearchResults = contentResults.map((item) => ({
    ...item,
    searchText: [
      item.titulo,
      Array.isArray(item.tags) ? item.tags.join(' ') : item.tags,
      Array.isArray(item.creadores)
        ? item.creadores.map((creator) => (typeof creator === 'string' ? creator : creator?.nombre || creator?.username)).join(' ')
        : item.creadores,
      item.descripcion
    ].filter(Boolean).join(' ').toLowerCase()
  }));
  const userSearchResults = userResults.map((user) => ({
    ...user,
    searchText: `${user.username || ''} ${user.descripcion || ''}`.toLowerCase()
  }));
  const renderContentItem = (item) => <Card key={item.id} {...item} />;

  const renderUserItem = (user) => (
    <CreatorCard key={user.id} username={user.username} avatar={user.avatar} role={user.role} />
  );

  const hasAnyResults = contentResults.length > 0 || userResults.length > 0;
  const renderTabSelector = () => (
    <div className="relative min-w-0">
      <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={activeTab}
        onChange={(event) => setActiveTab(event.target.value)}
        aria-label="Tipo de resultados"
        className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1D1F23] dark:text-gray-200"
      >
        {tabsConfig.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label} ({tab.count})
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );

  const desktopTabSelector = (
    <div className="ml-auto hidden w-44 shrink-0 md:block">
      {renderTabSelector()}
    </div>
  );

  const mobileTabFilter = (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
        Tipo de resultados
      </label>
      {renderTabSelector()}
    </div>
  );

  return (
    <div className="flex flex-col animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {(hasAnyResults || loading) ? (
        <>
          {activeTab === 'contenido' && (
            <DataContainer
              key={`contenido-${query}`}
              title="Buscar"
              icon={Search}
              gradientClass="from-primary-500 to-primary-700"
              hideHeaderTitleOnMobile
              headerClassName="min-w-0 lg:max-w-[12rem]"
              headerTrailing={desktopTabSelector}
              mobileFilterContent={mobileTabFilter}
              items={contentSearchResults}
              loading={loading}
              searchKey="searchText"
              initialSearchValue={query}
              searchMatchMode="any-term"
              searchPlaceholder="Buscar contenido"
              dateKey="creado"
              sortKey="titulo"
              renderItem={renderContentItem}
              enableTypeFilter={true}
              typeKey="tipo"
              customTypes={['mapa', 'minijuego', 'modpack', 'complemento', 'paquete', 'personaje']}
              typeFilterLabel="Tipos de contenido"
              allTypesLabel="Todos los tipos"
              customSortOptions={[
                { val: 'recientes', label: 'Más Recientes' },
                { val: 'antiguos', label: 'Más Antiguos' },
                { val: 'az', label: 'Nombre (A-Z)' },
                { val: 'za', label: 'Nombre (Z-A)' },
                { val: 'mas_vistas', label: 'Más Vistas' },
                { val: 'mas_likes', label: 'Más Likes' },
                { val: 'mas_descargas', label: 'Más Descargas' }
              ]}
              emptyMessage="No se encontró contenido"
            />
          )}

          {activeTab === 'usuarios' && (
            <DataContainer
              key={`usuarios-${query}`}
              title="Buscar"
              icon={Search}
              gradientClass="from-primary-500 to-primary-700"
              hideHeaderTitleOnMobile
              headerClassName="min-w-0 lg:max-w-[12rem]"
              headerTrailing={desktopTabSelector}
              mobileFilterContent={mobileTabFilter}
              items={userSearchResults}
              loading={loading}
              searchKey="searchText"
              initialSearchValue={query}
              searchMatchMode="any-term"
              searchPlaceholder="Buscar usuarios..."
              sortKey="username"
              dateKey="createdat"
              renderItem={renderUserItem}
              enableTypeFilter={true}
              typeKey="role"
              typeFilterLabel="Tipos de usuario"
              allTypesLabel="Todos los usuarios"
              customSortOptions={[
                { val: 'recientes', label: 'Más Recientes' },
                { val: 'antiguos', label: 'Más Antiguos' },
                { val: 'az', label: 'Nombre (A-Z)' },
                { val: 'za', label: 'Nombre (Z-A)' }
              ]}
              layout="grid"
              emptyMessage="No se encontraron usuarios"
            />
          )}

        </>
      ) : (
        <>
          <div className="flex w-full min-w-0 flex-row flex-nowrap items-center gap-1 p-2 md:gap-3 md:p-4">
            <PageHeader
              title="Buscar"
              icon={Search}
              gradientClass="from-primary-500 to-primary-700"
              hideTitleOnMobile
              className="min-w-0 lg:max-w-[12rem]"
            />
            {desktopTabSelector}
            <button
              type="button"
              onClick={() => setIsEmptyFilterOpen(true)}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-[#1D1F23] dark:text-gray-300 md:hidden"
              aria-label="Abrir filtros"
            >
              <Filter size={18} />
            </button>
          </div>
          {isEmptyFilterOpen && createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:hidden"
              onClick={() => setIsEmptyFilterOpen(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-transparent dark:bg-[#1e1e1e]"
                onClick={(event) => event.stopPropagation()}
              >
                <FilterModalHeader onClose={() => setIsEmptyFilterOpen(false)} />
                <div className="py-4">{mobileTabFilter}</div>
              </div>
            </div>,
            document.body
          )}
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
           <div className="bg-gray-200 dark:bg-[#1D1F23] p-6 rounded-full mb-4">
              {query.trim() ? (
                <Frown size={64} className="text-gray-400" />
              ) : (
                <Compass size={64} className="text-primary-500" />
              )}
           </div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
             {query.trim() ? 'No encontramos nada' : 'Busca mods o usuarios'}
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
        </>
      )}
    </div>
  );
};

export default Resultados;