import React, { useState, useEffect } from 'react';
import { Boxes, Loader2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getContentByType } from '../services/api';

const Modpacks = () => {
  const [modpacks, setModpacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("modpack");
        setModpacks(data);
      } catch (error) {
        console.error("Error cargando modpacks:", error);
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
      title="Modpacks"
      icon={Boxes} 
      gradientClass="from-orange-500 to-red-400"
      items={modpacks}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Modpacks;