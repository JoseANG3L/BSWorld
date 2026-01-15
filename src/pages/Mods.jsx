import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

// ✅ CORRECCIÓN: Importamos la función desde la API, no usamos Firebase directo aquí
import { getContentByType } from '../services/api';

const Mods = () => {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getContentByType("mod");
        setMods(data);
      } catch (error) {
        console.error("Error cargando mods:", error);
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
      title="Mods"
      icon={Sparkles} 
      gradientClass="from-pink-500 to-purple-500"
      items={mods}
      searchKey="titulo" // ⚠️ OJO: Generalmente buscamos por 'titulo', no 'nombre'
      
      // Renderizado de tarjetas
      renderItem={(item) => (
        <Card 
          key={item.id} // Siempre es bueno poner la key aquí
          {...item}     // Pasamos todas las propiedades (imagen, titulo, creadores, etc) automáticamente
        />
      )}
    />
  );
};

export default Mods;