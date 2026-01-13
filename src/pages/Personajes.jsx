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
    const obtenerPersonajes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "personajes"));
        // Mapeamos los datos de Firebase a un array normal
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPersonajes(docs);
      } catch (error) {
        console.error("Error cargando personajes:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerPersonajes();
  }, []);

  // --- ESTADO DE CARGA (Loading Spinner) ---
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-primary-600 dark:text-primary-400">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-medium animate-pulse">Cargando el mundo...</p>
      </div>
    );
  }

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
          image={item.img} 
          title={item.nombre}
          downloads={item.descargas}
          creator={item.creador}
          tags={item.tags}
        />
      )}
    />
  );
};

export default Personajes;