import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getContentByType } from '../services/api';

const Personajes = () => {
  const [personajes, setPersonajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("personaje");
        setPersonajes(data);
      } catch (error) {
        console.error("Error cargando personajes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DataContainer
      title="Personajes"
      icon={User} 
      gradientClass="from-pink-500 to-purple-400"
      items={personajes}
      loading={loading}
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Personajes;