import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const DataContainer = ({ 
  title, 
  icon: Icon = Sparkles, // Icono por defecto
  gradientClass = "from-pink-500 to-purple-500", // Color del icono
  items = [], // La lista de datos crudos
  searchKey = 'nombre', // ¿Por qué campo buscamos texto?
  dateKey = 'fecha',    // ¿Por qué campo ordenamos fecha?
  renderItem,           // Función para dibujar cada tarjeta
}) => {
  // 1. ESTADO INTERNO
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');

  // 2. LÓGICA GENÉRICA (Funciona con cualquier array)
  const itemsFiltrados = useMemo(() => {
    // A. Filtrar
    let resultado = items.filter(item => {
      const valor = item[searchKey];
      return valor && valor.toLowerCase().includes(busqueda.toLowerCase());
    });

    // B. Ordenar
    resultado.sort((a, b) => {
      if (orden === 'recientes') {
        return new Date(b[dateKey]) - new Date(a[dateKey]);
      } else if (orden === 'antiguos') {
        return new Date(a[dateKey]) - new Date(b[dateKey]);
      } else if (orden === 'az') {
        return a[searchKey].localeCompare(b[searchKey]);
      } else if (orden === 'za') {
        return b[searchKey].localeCompare(a[searchKey]);
      }
      return 0;
    });

    return resultado;
  }, [items, busqueda, orden, searchKey, dateKey]);

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
        <h2 className="flex text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white",
              `bg-gradient-to-br ${gradientClass}`
          )}>
              <Icon size={20} strokeWidth={2.5} />
          </div>
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 self-end mb-1 ml-1">
            ({itemsFiltrados.length})
          </span>
        </h2>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        {/* Input */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Buscar por ${searchKey}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>

        {/* Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="az">Nombre (A-Z)</option>
              <option value="za">Nombre (Z-A)</option>
              <option value="recientes">Más Recientes</option>
              <option value="antiguos">Más Antiguos</option>
            </select>
            <ArrowUpDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* GRILLA DE RESULTADOS */}
      {itemsFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-4">
          {itemsFiltrados.map((item) => (
             // Aquí llamamos a la función que nos pasaron para dibujar
             <React.Fragment key={item.id}>
                {renderItem(item)}
             </React.Fragment>
          ))}
        </div>
      ) : (
        // Estado Vacío
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron resultados</p>
          <p className="text-sm">Intenta con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default DataContainer;