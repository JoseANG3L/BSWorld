import { useOverlayBack } from '../hooks/useOverlayBack';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, ArrowUpDown, Sparkles, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useCatalogPages } from '../hooks/useCatalogPages';
import { useVisitState } from '../hooks/useVisitState';
import { PAGE_SIZE } from '../services/catalog';
import LoadingSpinner from './LoadingSpinner';
import PageHeader from './PageHeader';
import FilterModalHeader from './FilterModalHeader';

const capitalizeText = (str) => {
  if (!str) return '';
  const stringValue = str.toString();
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
};

const openFiltersDialog = (dialog) => {
  if (dialog && !dialog.open) dialog.showModal();
};

const DataContainer = ({
  title,
  icon: Icon = Sparkles,
  gradientClass = "from-pink-500 to-purple-500",
  items = [],
  searchKey = 'nombre',
  initialSearchValue = '',
  searchMatchMode = 'contains',
  sortKey = searchKey,
  dateKey = 'fecha',
  renderItem,
  enableTypeFilter = false,
  typeKey = 'tipo',
  customTypes = null,
  typeFilterLabel = 'Tipos de Contenido',
  allTypesLabel = 'Todos los tipos',
  layout = 'grid',
  customSortOptions = null,
  searchPlaceholder = null,
  showHeader = true,
  hideHeaderTitleOnMobile = false,
  headerClassName = 'shrink-0',
  headerTrailing = null,
  mobileFilterContent = null,
  emptyMessage = 'No se encontraron resultados',
  catalogMode,
  catalogType,
  catalogQuery = '',
  initialSort = 'recientes',
  loading = false
}) => {
  // 1. ESTADO INTERNO
  const [busqueda, setBusqueda] = useVisitState(`list-${catalogMode || title}-search`, initialSearchValue);
  const [orden, setOrden] = useVisitState(`list-${catalogMode || title}-order`, initialSort);
  const [visibleCount, setVisibleCount] = useVisitState(`list-${catalogMode || title}-limit`, PAGE_SIZE);
  const [selectedTypes, setSelectedTypes] = useVisitState(`list-${catalogMode || title}-types`, []);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Estados temporales para el modal en móvil
  const [tempOrden, setTempOrden] = useState(initialSort);
  const [tempSelectedTypes, setTempSelectedTypes] = useState([]);

  const [search, setSearch] = useState(busqueda.trim());
  useEffect(() => {
    if (!catalogMode) return;
    const timer = setTimeout(() => setSearch(busqueda.trim()), 200);
    return () => clearTimeout(timer);
  }, [busqueda, catalogMode]);

  const options = useMemo(() => catalogMode ? {
    users: catalogMode === 'users',
    search: catalogQuery,
    refine: catalogQuery && search !== catalogQuery ? search : '',
    title: catalogQuery ? '' : search,
    types: catalogType ? [catalogType] : selectedTypes,
    sort: orden
  } : null, [catalogMode, catalogQuery, catalogType, search, selectedTypes, orden]);
  const page = useCatalogPages(options, `pages-${catalogMode}`);

  const typeDropdownRef = useRef(null);
  const ordenDropdownRef = useRef(null);
  const filterButtonRef = useRef(null);
  const hasActiveFilters = selectedTypes.length > 0 || orden !== initialSort;

  // Si hay customTypes usa esos, si no, los extrae de los items
  const availableTypes = useMemo(() => {
    if (customTypes && Array.isArray(customTypes)) {
      return customTypes;
    }
    const types = [...new Set(items.map(item => item[typeKey]))];
    return types.filter(Boolean);
  }, [items, typeKey, customTypes]);

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
    if (!isFiltersModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = filterButtonRef.current;
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsFiltersModalOpen(false); };
    document.body.style.overflow = 'hidden';
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', closeOnDesktop);
      trigger?.focus({ preventScroll: true });
    };
  }, [isFiltersModalOpen]);

  // Abrir modal e inicializar estados temporales
  const handleOpenFiltersModal = () => {
    setTempOrden(orden);
    setTempSelectedTypes(selectedTypes);
    setIsFiltersModalOpen(true);
  };

  // 2. LÓGICA DE FILTRADO
  const itemsFiltrados = useMemo(() => {
    let resultado = items.filter(item => {
      const valor = String(item[searchKey] || '').toLowerCase();
      const consulta = busqueda.toLowerCase().trim();
      if (!consulta) return true;
      if (searchMatchMode === 'any-term') {
        return consulta.split(/\s+/).some((term) => valor.includes(term));
      }
      return valor.includes(consulta);
    });

    if (enableTypeFilter && selectedTypes.length > 0) {
      const typesInLowerCase = selectedTypes.map(t => t.toString().toLowerCase());
      
      resultado = resultado.filter(item => {
        const itemType = item[typeKey]?.toString().toLowerCase();
        return itemType && typesInLowerCase.includes(itemType);
      });
    }

    resultado.sort((a, b) => {
      if (orden === 'recientes') return new Date(b[dateKey]) - new Date(a[dateKey]);
      if (orden === 'antiguos') return new Date(a[dateKey]) - new Date(b[dateKey]);
      if (orden === 'az') return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      if (orden === 'za') return String(b[sortKey] || '').localeCompare(String(a[sortKey] || ''));
      if (orden === 'mas_vistas') return (b.vistas || 0) - (a.vistas || 0);
      if (orden === 'mas_likes') return (b.likes_count || 0) - (a.likes_count || 0);
      if (orden === 'mas_descargas') {
        const totalA = (a.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
        const totalB = (b.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
        return totalB - totalA;
      }
      return 0;
    });

    return resultado;
  }, [items, busqueda, orden, searchKey, searchMatchMode, sortKey, dateKey, enableTypeFilter, selectedTypes, typeKey]);

  const visibleItems = catalogMode ? page.items : itemsFiltrados.slice(0, visibleCount);
  const remaining = catalogMode ? page.total - page.nextOffset : itemsFiltrados.length - visibleCount;

  const filterKey = JSON.stringify([busqueda, orden, selectedTypes]);
  const lastFilters = useRef(filterKey);
  useEffect(() => {
    if (lastFilters.current !== filterKey) setVisibleCount(PAGE_SIZE);
    lastFilters.current = filterKey;
  }, [filterKey, setVisibleCount]);

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

  useOverlayBack(isFiltersModalOpen, () => setIsFiltersModalOpen(false));

  if (loading) return <LoadingSpinner variant="page" />;

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      <div className="mb-4 flex min-w-0 flex-row flex-nowrap items-center gap-1 md:mb-6 md:gap-3">
        {showHeader && (
          <PageHeader
            title={title}
            icon={Icon}
            gradientClass={gradientClass}
            hideTitleOnMobile={hideHeaderTitleOnMobile}
            className={headerClassName}
          />
        )}
        {/* BARRA DE FILTROS */}
        <div className="flex min-w-0 flex-1 basis-0 flex-row flex-nowrap items-center gap-1 md:gap-3">
          {/* Búsqueda */}
          <div className="relative min-w-0 flex-[2_1_0%]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={searchPlaceholder || `Buscar por ${searchKey}...`} 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full min-w-0 pl-10 pr-2 md:pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
          />
          </div>

          {/* Botón para abrir modal de filtros en móvil */}
          <button
            ref={filterButtonRef}
            type="button"
            onClick={handleOpenFiltersModal}
            className={clsx(
              'flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-2.5 text-sm font-semibold transition-colors focus-visible:outline-primary-500 md:hidden',
              hasActiveFilters
                ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/15 dark:text-primary-300'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200'
            )}
            aria-label={hasActiveFilters ? 'Abrir filtros activos' : 'Abrir filtros'}
            aria-haspopup="dialog"
            aria-expanded={isFiltersModalOpen}
            title="Filtros"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Filtros</span>
          </button>

          {/* Filtro de tipos (Desktop) */}
          {enableTypeFilter && availableTypes.length > 0 && (
          <div className="hidden md:block relative min-w-0 flex-1 basis-0" ref={typeDropdownRef}>
            <div className="relative min-w-0 w-full">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsOrdenDropdownOpen(false); }}
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {selectedTypes.length === 0
                    ? allTypesLabel
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
                    onClick={() => { clearTypes(); setIsTypeDropdownOpen(false); }}
                    className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left", selectedTypes.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}
                  >
                    <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0", selectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                      {selectedTypes.length === 0 && <Check size={12} className="text-white" />}
                    </div>
                    <span>{allTypesLabel}</span>
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
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
          <div className="hidden md:flex min-w-0 flex-1 basis-0 items-center gap-2" ref={ordenDropdownRef}>
          <div className="relative min-w-0 w-full">
            <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <button type="button" onClick={() => { setIsOrdenDropdownOpen(!isOrdenDropdownOpen); setIsTypeDropdownOpen(false); }} className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left">
              <span className="truncate block">
                {orden === 'mas_descargas' ? 'Más Descargas' : orden === 'mas_vistas' ? 'Más Vistas' : orden === 'az' ? 'Nombre (A-Z)' : orden === 'za' ? 'Nombre (Z-A)' : orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden}
              </span>
            </button>
            <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isOrdenDropdownOpen && "rotate-180")} />

            {isOrdenDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  {(customSortOptions || [
                    { val: 'mas_descargas', label: 'Más Descargas' }, 
                    { val: 'mas_vistas', label: 'Más Vistas' }, 
                    { val: 'az', label: 'Nombre (A-Z)' }, 
                    { val: 'za', label: 'Nombre (Z-A)' }, 
                    { val: 'recientes', label: 'Más Recientes' }, 
                    { val: 'antiguos', label: 'Más Antiguos' }
                  ]).map((opt) => (
                    <button key={opt.val} type="button" onClick={() => { setOrden(opt.val); setIsOrdenDropdownOpen(false); }} className={clsx("w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors", orden === opt.val ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700")}>{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
            {showHeader && headerTrailing}
          </div>
      </div>

      {/* RESULTADOS */}
      {catalogMode && page.loading && !page.items.length ? <LoadingSpinner variant="page" /> : visibleItems.length > 0 ? (
        <>
          <div className={clsx(
            layout === 'vertical' 
              ? "flex flex-col gap-4 pb-4" 
              : layout === 'forum-columns'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-4"
          )}>
            {visibleItems.map((item, index) =>
               React.cloneElement(renderItem(item, index), { key: item.id || item._id })
            )}
          </div>
          {remaining > 0 && !page.error && (
            <div className="flex justify-center mt-6">
              <button disabled={catalogMode && page.loading} onClick={catalogMode ? page.loadMore : () => setVisibleCount(prev => prev + PAGE_SIZE)} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md text-sm flex items-center gap-2">
                {catalogMode && page.loading ? 'Cargando…' : 'Ver más contenido'} <span className="text-sm opacity-75">({remaining} restantes)</span>
              </button>
            </div>
          )}
        </>
      ) : !page.error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">{emptyMessage}</p>
          <p className="text-sm">Intenta con otro término de búsqueda o limpiando filtros.</p>
        </div>
      )}

      {catalogMode && page.error && (
        <div role="alert" className="py-6 text-center">
          No se pudieron cargar los resultados. <button type="button" onClick={page.loadMore} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {/* MODAL DE FILTROS EN MÓVIL */}
      {isFiltersModalOpen && createPortal(
        <dialog
          ref={openFiltersDialog}
          aria-label="Filtros"
          onCancel={(event) => { event.preventDefault(); setIsFiltersModalOpen(false); }}
          onClick={(event) => { if (event.target === event.currentTarget) setIsFiltersModalOpen(false); }}
          className="fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0 text-gray-900 backdrop:bg-black/50 dark:text-white md:hidden"
        >
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl motion-safe:animate-fade-in-up dark:bg-dark-bg"
            style={{ animationDuration: '160ms' }}>
            <div className="shrink-0 px-4 pt-4">
              <FilterModalHeader onClose={() => setIsFiltersModalOpen(false)} />
            </div>

            <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
              {mobileFilterContent}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Ordenar por</span>
                <span className="relative block">
                  <ArrowUpDown size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <select value={tempOrden} onChange={(event) => setTempOrden(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-9 text-sm font-medium focus-visible:outline-primary-500 dark:border-transparent dark:bg-[#1D1F23]">
                    {(customSortOptions || [
                      { val: 'recientes', label: 'Más recientes' },
                      { val: 'antiguos', label: 'Más antiguos' },
                      { val: 'az', label: 'Nombre (A-Z)' },
                      { val: 'za', label: 'Nombre (Z-A)' },
                      { val: 'mas_vistas', label: 'Más vistas' },
                      { val: 'mas_descargas', label: 'Más descargas' }
                    ]).map((opt) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                </span>
              </label>

              {enableTypeFilter && availableTypes.length > 0 && (
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-semibold">{typeFilterLabel}</legend>
                  <div className="flex flex-wrap gap-2">
                    {[null, ...availableTypes].map((type) => {
                      const all = type === null;
                      const selected = all ? tempSelectedTypes.length === 0 : tempSelectedTypes.includes(type);
                      return (
                        <button key={type ?? ''} type="button" aria-pressed={selected}
                          onClick={() => setTempSelectedTypes(prev => {
                            if (all) return [];
                            return prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
                          })}
                          className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-left text-sm font-medium text-gray-700 transition-colors focus-visible:outline-primary-500 aria-pressed:border-primary-300 aria-pressed:bg-primary-50 aria-pressed:text-primary-700 dark:border-gray-700 dark:text-gray-300 dark:aria-pressed:border-primary-500/50 dark:aria-pressed:bg-primary-500/15 dark:aria-pressed:text-primary-300">
                          <span aria-hidden="true" className={clsx('grid h-4 w-4 shrink-0 place-items-center rounded border',
                            selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 dark:border-gray-600')}>
                            {selected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 break-words">{all ? allTypesLabel : capitalizeText(type)}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-gray-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/10">
              <button type="button" onClick={() => setIsFiltersModalOpen(false)}
                className="h-11 flex-1 rounded-xl bg-gray-100 px-3 text-sm font-semibold text-gray-700 active:bg-gray-200 dark:bg-[#1D1F23] dark:text-gray-200">
                Cancelar
              </button>
              <button type="button" onClick={() => {
                setOrden(tempOrden);
                setSelectedTypes(tempSelectedTypes);
                setIsFiltersModalOpen(false);
              }}
                className="h-11 flex-[2] rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white hover:bg-primary-700 active:bg-primary-800">
                Aplicar filtros
              </button>
            </div>
          </div>
        </dialog>,
        document.body
      )}
    </div>
  );
};

export default DataContainer;
