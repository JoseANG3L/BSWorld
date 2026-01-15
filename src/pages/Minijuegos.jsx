import React, { useState, useEffect } from 'react';
import { Gamepad2, Loader2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getContentByType } from '../services/api';

const Minijuegos = () => {
  const [minijuegos, setMinijuegos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("minijuego");
        setMinijuegos(data);
      } catch (error) {
        console.error("Error cargando minijuegos:", error);
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
      title="Minijuegos"
      icon={Gamepad2} 
      gradientClass="from-green-500 to-emerald-400"
      items={minijuegos}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Minijuegos;