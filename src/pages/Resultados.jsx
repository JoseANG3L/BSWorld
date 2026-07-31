import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Loader2, Frown, Filter, Map, Gamepad2, Wrench, Boxes, Package, Grid, ChevronDown, User 
} from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../components/Card';
import { getAllContent } from '../services/api';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [allResults, setAllResults] = useState([]); 
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');

  // 1. BUSCAR CUANDO CAMBIA LA URL
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const data = await getAllContent();
        const lowerQuery = query.toLowerCase();
        
        const matches = data.filter(item => {
          const matchTitle = item.titulo?.toLowerCase().includes(lowerQuery);
          const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
          const matchCreators = Array.isArray(item.creadores) 
            ? item.creadores.some(c => (typeof c === 'string' ? c : c.nombre).toLowerCase().includes(lowerQuery))
            : false;

          return matchTitle || matchTags || matchCreators;
        });

        setAllResults(matches);
        setFilteredResults(matches);
        setActiveTab('todos'); 

      } catch (error) {
        console.error("Error buscando:", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) performSearch();
  }, [query]);

  // 2. FILTRAR POR TABS
  useEffect(() => {
    if (activeTab === 'todos') {
      setFilteredResults(allResults);
    } else {
      setFilteredResults(allResults.filter(item => item.tipo === activeTab));
    }
  }, [activeTab, allResults]);

  // --- 3. CONFIGURACIÓN DE TABS Y CONTADORES (CORREGIDO) ---
  // Usamos 'allResults' porque queremos contar sobre lo que se encontró
  const counts = {
    mapa: allResults.filter(i => i.tipo === 'mapa').length,
    minijuego: allResults.filter(i => i.tipo === 'minijuego').length,
    modpack: allResults.filter(i => i.tipo === 'modpack').length,
    mod: allResults.filter(i => i.tipo === 'mod').length,
    paquete: allResults.filter(i => i.tipo === 'paquete').length,
    personaje: allResults.filter(i => i.tipo === 'personaje').length,
  };

  const tabsConfig = [
    { id: 'todos', label: 'Todo', icon: Grid, count: allResults.length },
    { id: 'mapa', label: 'Mapas', icon: Map, count: counts.mapa },
    { id: 'minijuego', label: 'Minijuegos', icon: Gamepad2, count: counts.minijuego },
    { id: 'modpack', label: 'Modpacks', icon: Boxes, count: counts.modpack },
    { id: 'mod', label: 'Mods', icon: Wrench, count: counts.mod },
    { id: 'paquete', label: 'Paquetes', icon: Package, count: counts.paquete },
    { id: 'personaje', label: 'Personajes', icon: User, count: counts.personaje },
  ];

  // --- RENDERIZADO ---

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48} />
      <p className="text-gray-500 animate-pulse">Buscando en los archivos...</p>
    </div>
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
          Se encontraron <b>{allResults.length}</b> coincidencias.
        </p>
      </div>

      {allResults.length > 0 ? (
        <>
          {/* TABS DE FILTRO */}
          <div className="mb-4 md:mb-6">
        
            {/* OPCIÓN A: MENU SELECT (SOLO MÓVIL) */}
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

            {/* OPCIÓN B: TABS DE BOTONES (SOLO ESCRITORIO) */}
            <div className="hidden md:flex justify-start"> {/* Cambiado a justify-start para alineación */}
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

          {/* GRID DE RESULTADOS */}
          {filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {filteredResults.map((item) => {
                 const total = item.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
                 return (
                    <Card 
                        key={item.id} 
                        id={item.id} 
                        {...item} 
                        totalDownloads={total}
                    />
                 );
              })}
            </div>
          ) : (
            // ESTADO VACÍO DENTRO DE UNA TAB
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron resultados</p>
              <p className="text-sm">Intenta con otro término de búsqueda.</p>
            </div>
          )}
        </>
      ) : (
        // ESTADO VACÍO TOTAL
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

export default Resultados;