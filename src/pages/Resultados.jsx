import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchGlobalContent } from '../services/api'; // Asegúrate de tener esta función en api.js
import Card from '../components/Card';
import { Search, Loader2, Frown, Sparkles } from 'lucide-react';

const Resultados = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // Obtiene el valor de ?q=...
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        // Llamamos a la función de búsqueda global
        const data = await searchGlobalContent(query);
        setResults(data);
      } catch (error) {
        console.error("Error al buscar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]); // Se ejecuta cada vez que cambia la búsqueda

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-0 animate-fade-in-up">
      
      {/* --- ENCABEZADO DE RESULTADOS --- */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 pt-2">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl">
            <Search size={28} />
        </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Resultados para: <span className="text-primary-600">"{query}"</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {loading ? 'Buscando...' : `Encontramos ${results.length} coincidencias`}
            </p>
        </div>
      </div>

      {/* --- ESTADO DE CARGA --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary-600" size={48}/>
            <p className="text-gray-400 text-sm font-medium animate-pulse">Explorando la base de datos...</p>
        </div>
      ) : results.length > 0 ? (
        
        /* --- GRID DE RESULTADOS --- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((item) => (
             <Card 
               key={item.id}
               {...item} // Pasamos todas las props automáticamente (titulo, imagen, creadores...)
             />
          ))}
        </div>

      ) : (
        
        /* --- SIN RESULTADOS --- */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <Frown size={48} className="text-gray-400"/>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No encontramos nada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                No hay mapas, personajes o creadores que coincidan con "<strong>{query}</strong>". 
                Intenta revisar la ortografía o busca términos más generales.
            </p>
        </div>
      )}

      {/* --- SUGERENCIA (Decorativo) --- */}
      {!loading && results.length > 0 && (
        <div className="mt-12 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Sparkles size={14} />
            <span>Fin de los resultados</span>
            <Sparkles size={14} />
        </div>
      )}

    </div>
  );
};

export default Resultados;