import React, { useState, useEffect } from 'react';
import { Wrench, Loader2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getPublicContent } from '../services/api';

const Mods = () => {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamamos a la función importada
        const data = await getPublicContent();
        // const data = await getContentByType("mod");
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
      icon={Wrench} 
      gradientClass="from-purple-500 to-pink-500"
      items={mods}
      searchKey="titulo"
      enableTypeFilter={true}
      typeKey="tipo"
      customTypes={['mod', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete']}
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Mods;