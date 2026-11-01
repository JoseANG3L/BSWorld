import React, { useState, useEffect } from 'react';
import { Map } from 'lucide-react'; 
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

  return (
    <DataContainer
      title="Mapas"
      icon={Map} 
      gradientClass="from-blue-500 to-cyan-400"
      items={mapas}
      loading={loading}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Mapas;