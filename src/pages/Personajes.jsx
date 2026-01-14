import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react'; // Importamos Loader2 para carga
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

// FIREBASE IMPORTS
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Personajes = () => {
  const [personajes, setPersonajes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // SOLICITAMOS SOLO EL TIPO 'personaje'
        const data = await getContentByType("personaje");
        setPersonajes(data);
      } catch (error) {
        console.error("Error cargando personajes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;

  return (
    <DataContainer
      title="Personajes"
      icon={Sparkles} // Icono personalizado
      gradientClass="from-pink-500 to-purple-500" // Color personalizado
      items={personajes}
      searchKey="nombre" // Buscamos por la propiedad 'nombre'
      dateKey="fecha"    // Ordenamos por la propiedad 'fecha'
      
      // Aquí defines cómo se ve CADA item
      renderItem={(item) => (
        <Card 
          image={item.imagen} 
          title={item.titulo}
          downloads={item.descargas}
          creator={item.creador}
          tags={item.tags}
        />
      )}
    />
  );
};

export default Personajes;