import { useOverlayBack } from '../hooks/useOverlayBack';
import { useVisitState } from '../hooks/useVisitState';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, Frown, Compass, Filter, ChevronDown } from 'lucide-react';
import Card from '../components/Card';
import CreatorCard from '../components/CreatorCard';
import { catalogStamp, isCatalogCurrent, getCatalogPage } from '../services/catalog';
import DataContainer from '../components/DataContainer';
import PageHeader from '../components/PageHeader';
import FilterModalHeader from '../components/FilterModalHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = (searchParams.get('q') || '').trim();
  const [searchValue, setSearchValue] = useVisitState('results-search', initialQuery);
  const [query, setQuery] = useState(searchValue.trim());
  
  const [counts, setCounts] = useVisitState('counts', { contenido: 0, usuarios: 0 });
  const [savedVersion, setSavedVersion] = useVisitState('searchVersion', null);
  const [loading, setLoading] = useState(savedVersion?.query !== query || !isCatalogCurrent(savedVersion));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [activeTab, setActiveTab] = useVisitState('activeTab', 'contenido');
  const [isEmptyFilterOpen, setIsEmptyFilterOpen] = useState(false);

  useOverlayBack(isEmptyFilterOpen, () => setIsEmptyFilterOpen(false));

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchValue.trim()), 200);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const version = catalogStamp();
    if (savedVersion?.query === query && isCatalogCurrent(savedVersion)) return;
    const controller = new AbortController();
    const signal = controller.signal;
    setFailed(false);
    if (!query) {
      setCounts({ contenido: 0, usuarios: 0 });
      setSavedVersion(null);
      setLoading(false);
      return;
    }
    Promise.all([
      getCatalogPage({ search: query, signal }),
      getCatalogPage({ users: true, search: query, signal })
    ]).then(([content, users]) => {
      if (signal.aborted) return;
      const totals = { contenido: content.total, usuarios: users.total };
      setCounts(totals);
      setSavedVersion({ ...version, query });
      if (loading) setActiveTab(prev => totals[prev] ? prev : (users.total && !content.total ? 'usuarios' : 'contenido'));
    }).catch(() => {
      if (!signal.aborted) setFailed(true);
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, attempt]);

  useEffect(() => {
    if (!isEmptyFilterOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEmptyFilterOpen]);

  const tabsConfig = [
    { id: 'contenido', label: 'Contenido', count: counts.contenido },
    { id: 'usuarios', label: 'Usuarios', count: counts.usuarios },
  ];

  const renderContentItem = (item) => <Card key={item.id} {...item} />;

  const renderUserItem = (user) => (
    <CreatorCard key={user.id} username={user.username} avatar={user.avatar} role={user.role} />
  );

  const renderTabSelector = () => (
    <div className="relative min-w-0">
      <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={activeTab}
        onChange={(event) => setActiveTab(event.target.value)}
        aria-label="Tipo de resultados"
        className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm font-medium text-gray-700 outline-none transition-all dark:border-white/10 dark:bg-[#1D1F23] dark:text-gray-200"
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

  if (loading) return <LoadingSpinner variant="page" />;

  if (failed) return (
    <p role="alert" className="py-12 text-center">No se pudo completar la búsqueda. <button className="underline" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></p>
  );

  return (
    <div className="flex flex-col animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {initialQuery ? (
        <>
          {activeTab === 'contenido' && (
            <DataContainer
              key="contenido"
              compactPagination
              title="Buscar"
              icon={Search}
              gradientClass="from-primary-500 to-primary-700"
              hideHeaderTitleOnMobile
              headerClassName="min-w-0 lg:max-w-[12rem]"
              headerTrailing={desktopTabSelector}
              mobileFilterContent={mobileTabFilter}
              catalogMode="search"
              catalogQuery={query}
              loading={loading}
              searchKey="searchText"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
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
              key="usuarios"
              compactPagination
              title="Buscar"
              icon={Search}
              gradientClass="from-primary-500 to-primary-700"
              hideHeaderTitleOnMobile
              headerClassName="min-w-0 lg:max-w-[12rem]"
              headerTrailing={desktopTabSelector}
              mobileFilterContent={mobileTabFilter}
              catalogMode="users"
              catalogQuery={query}
              customTypes={['user', 'admin']}
              loading={loading}
              searchKey="searchText"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
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
