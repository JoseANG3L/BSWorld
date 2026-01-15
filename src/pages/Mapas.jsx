import React, { useState, useEffect } from 'react';
import { Map, Loader2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getContentByType } from '../services/api';

const Mapas = () => {
  const [mapas, setMapas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("mapa");
        setMapas(data);
      } catch (error) {
        console.error("Error cargando mapas:", error);
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
      title="Mapas"
      icon={Map} 
      gradientClass="from-blue-500 to-cyan-400"
      items={mapas}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Mapas;