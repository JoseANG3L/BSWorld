import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUserLikedContent } from '../services/api';
import Card from '../components/Card';
import { 
  Heart, Loader2, Search, ChevronDown, ArrowUpDown, Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

const MisLikes = () => {
  const { user } = useAuth();
  
  const [likedContent, setLikedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [activeTab, setActiveTab] = useState('todos');
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const ordenDropdownRef = useRef(null);

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
    const loadLikedContent = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await getUserLikedContent(user.id);
        // Extraer el contenido de la relación content
        const content = data.map(item => item.content).filter(Boolean);
        setLikedContent(content);
      } catch (error) {
        console.error('Error cargando contenido liked:', error);
        setLikedContent([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadLikedContent();
  }, [user]);

  // --- LÓGICA DE FILTRADO ---
  const filteredContent = useMemo(() => {
    let resultado = likedContent.filter(item => {
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
  }, [likedContent, activeTab, busqueda, orden]);

  // Obtener tipos únicos para los tabs
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(likedContent.map(item => item.tipo).filter(Boolean));
    return Array.from(tipos);
  }, [likedContent]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Heart size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Inicia Sesión</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Necesitas iniciar sesión para ver tus likes.</p>
        <Link to="/login" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary-600" size={48}/>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* SECCIÓN 1: HEADER */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <Heart size={36} className="text-red-500 fill-current" />
              Mis Likes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {likedContent.length} {likedContent.length === 1 ? 'mod' : 'mods'} que te gustan
            </p>
          </div>
          
          <Link
            to="/configuracion"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1D1F23] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors border border-gray-300 dark:border-gray-700 shadow-sm"
          >
            <Settings size={15} />
            <span>Configuración</span>
          </Link>
        </div>
      </div>

      {/* SECCIÓN 2: TABS DE FILTRO POR TIPO */}
      {tiposUnicos.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4 md:mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('todos')}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'todos'
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-[#1D1F23] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Todos
            </button>
            {tiposUnicos.map(tipo => (
              <button
                key={tipo}
                onClick={() => setActiveTab(tipo)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                  activeTab === tipo
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-[#1D1F23] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: BARRA DE BÚSQUEDA Y ORDENAMIENTO */}
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
              className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm" 
            />
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
            <div className="relative w-full md:w-64">
              <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setIsOrdenDropdownOpen(!isOrdenDropdownOpen)} 
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {orden === 'mas_descargas' ? 'Más Descargas' : orden === 'mas_vistas' ? 'Más Vistas' : orden === 'az' ? 'Nombre (A-Z)' : orden === 'za' ? 'Nombre (Z-A)' : orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden}
                </span>
              </button>
              <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", isOrdenDropdownOpen && "rotate-180")} />

              {isOrdenDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
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

      {/* SECCIÓN 4: CONTENIDO */}
      {filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {filteredContent.map((item) => (
              <Card key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <Heart size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {likedContent.length === 0 ? 'Aún no has dado like a ningún mod' : 'No se encontraron resultados'}
          </p>
          <p className="text-sm">
            {likedContent.length === 0 ? 'Explora el contenido y dale like a tus mods favoritos.' : 'Intenta con otro término de búsqueda.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MisLikes;
