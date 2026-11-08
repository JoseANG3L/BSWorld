import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, ArrowUpDown, Sparkles, X, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { prefetchUserProfiles } from '../services/api';
import { CardSkeleton, PostSkeleton } from './CardSkeleton';
import PageHeader from './PageHeader';
import FilterModalHeader from './FilterModalHeader';

const capitalizeText = (str) => {
  if (!str) return '';
  const stringValue = str.toString();
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
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
  loading = false,
  skeletonCount = 12
}) => {
  // 1. ESTADO INTERNO
  const [busqueda, setBusqueda] = useState(initialSearchValue);
  const [orden, setOrden] = useState('recientes');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Estados temporales para el modal en móvil
  const [tempOrden, setTempOrden] = useState('recientes');
  const [tempSelectedTypes, setTempSelectedTypes] = useState([]);

  const ITEMS_PER_PAGE = 12;

  // Precarga avatares en 1 sola consulta (evita N peticiones, una por tarjeta)
  useEffect(() => {
    if (!items || items.length === 0) return;
    const uids = items.flatMap((item) => {
      const fromList = Array.isArray(item.creadores) ? item.creadores : [item.creadores];
      return [...fromList, item.aporte]
        .map((c) => (typeof c === 'string' ? c : c?.uid || c?.id))
        .filter(Boolean);
    });
    prefetchUserProfiles(uids);
  }, [items]);

  const typeDropdownRef = useRef(null);
  const ordenDropdownRef = useRef(null);

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

  const visibleItems = itemsFiltrados.slice(0, visibleCount);
  const hasMore = itemsFiltrados.length > visibleCount;

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [busqueda, orden, selectedTypes]);

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

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
          <div className="md:hidden">
          <button
            type="button"
            onClick={handleOpenFiltersModal}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-100 dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Abrir filtros"
            title="Filtros"
          >
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            {(selectedTypes.length > 0 || orden !== 'recientes') && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500"></span>
            )}
          </button>
          </div>

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
      {loading ? (
        <div className={clsx(
          layout === 'vertical'
            ? "flex flex-col gap-4 pb-4"
            : layout === 'forum-columns'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4"
              : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-4"
        )}>
          {Array.from({ length: layout === 'forum-columns' ? 6 : skeletonCount }).map((_, i) => (
            layout === 'forum-columns' ? <PostSkeleton key={i} /> : <CardSkeleton key={i} />
          ))}
        </div>
      ) : visibleItems.length > 0 ? (
        <>
          <div className={clsx(
            layout === 'vertical' 
              ? "flex flex-col gap-4 pb-4" 
              : layout === 'forum-columns'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-4"
          )}>
            {visibleItems.map((item) => 
               React.cloneElement(renderItem(item), { key: item.id || item._id })
            )}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)} className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md text-sm flex items-center gap-2">
                Ver más contenido <span className="text-sm opacity-75">({itemsFiltrados.length - visibleCount} restantes)</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">{emptyMessage}</p>
          <p className="text-sm">Intenta con otro término de búsqueda o limpiando filtros.</p>
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
            <FilterModalHeader onClose={() => setIsFiltersModalOpen(false)} />

            {/* Contenido desplazable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar">
              {mobileFilterContent}

              {/* Sección: Ordenar por */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ordenar por
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(customSortOptions || [
                    { val: 'recientes', label: 'Más Recientes' },
                    { val: 'antiguos', label: 'Más Antiguos' },
                    { val: 'az', label: 'Nombre (A-Z)' },
                    { val: 'za', label: 'Nombre (Z-A)' },
                    { val: 'mas_vistas', label: 'Más Vistas' },
                    { val: 'mas_descargas', label: 'Más Descargas' }
                  ]).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTempOrden(opt.val)}
                      className={clsx(
                        "px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left border",
                        tempOrden === opt.val
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección: Filtrar por tipo */}
              {enableTypeFilter && availableTypes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {typeFilterLabel}
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempSelectedTypes([])}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border",
                        tempSelectedTypes.length === 0
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0", tempSelectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                        {tempSelectedTypes.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>{allTypesLabel}</span>
                    </button>

                    {availableTypes.map((type) => {
                      const isSelected = tempSelectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTempSelectedTypes(prev =>
                              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                            );
                          }}
                          className={clsx(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border",
                            isSelected
                              ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                              : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div className={clsx("w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0", isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600")}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span>{capitalizeText(type)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pie de página con acciones */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DataContainer;