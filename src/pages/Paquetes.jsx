import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getContentByType } from '../services/api';

const Paquetes = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("paquete");
        setPaquetes(data);
      } catch (error) {
        console.error("Error cargando paquetes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DataContainer
      title="Paquetes"
      icon={Package}
      gradientClass="from-yellow-500 to-amber-400"
      items={paquetes}
      loading={loading}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Paquetes;