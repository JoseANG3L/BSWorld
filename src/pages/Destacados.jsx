import React, { useState, useEffect } from 'react';
import { Star, Loader2, Trophy } from 'lucide-react'; // Agregué Trophy para darle estilo
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getAllContent } from '../services/api';

const Destacados = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Obtenemos todo el contenido
        const data = await getAllContent();

        // 2. LÓGICA DE ORDENAMIENTO (TOP DOWNLOADS)
        // Calculamos el total y ordenamos de Mayor a Menor
        const sortedData = data.sort((a, b) => {
          // Sumar descargas del item A
          const totalA = a.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
          
          // Sumar descargas del item B
          const totalB = b.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

          // Orden descendente (B - A)
          return totalB - totalA;
        });

        setItems(sortedData);
      } catch (error) {
        console.error("Error cargando destacados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <DataContainer
      title="Destacados" // Cambio de título para reflejar el contenido
      icon={Trophy}         // Icono de Trofeo queda mejor para un Top
      gradientClass="from-amber-500 to-orange-600"
      items={items}
      searchKey="titulo"
      renderItem={(item, index) => {
        // Calculamos el total aquí también para pasárselo a la Card
        // y evitar que la Card tenga que recalcularlo
        const total = item.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

        return (
          <div key={item.id} className="relative">
            {/* Opcional: Medalla para el Top 3 */}
            {index < 3 && (
              <div className="absolute -top-3 -left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 border-2 border-white dark:border-gray-800 text-yellow-900 font-black shadow-lg transform -rotate-12">
                #{index + 1}
              </div>
            )}
            
            <Card 
              id={item.id} // ¡Importante pasar el ID!
              {...item} 
              totalDownloads={total} // Pasamos el total ya calculado
            />
          </div>
        );
      }}
    />
  );
};

export default Destacados;