import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';
import { getPublicContent } from '../services/api';

const Mods = () => {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
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

  return (
    <DataContainer
      title="Mods"
      icon={Gamepad2} 
      gradientClass="from-purple-500 to-pink-500"
      items={mods}
      loading={loading}
      searchKey="titulo"
      searchPlaceholder="Buscar mods"
      enableTypeFilter={true}
      typeKey="tipo"
      customTypes={['complemento', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete']}
      hideHeaderTitleOnMobile
      renderItem={(item) => (
        <Card {...item} />
      )}
    />
  );
};

export default Mods;