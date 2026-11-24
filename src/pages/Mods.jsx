import React from 'react';
import { Gamepad2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Mods = () => {
  return (
    <DataContainer
      title="Mods"
      icon={Gamepad2} 
      gradientClass="from-purple-500 to-pink-500"
      catalogMode="category"
      searchKey="titulo"
      searchPlaceholder="Buscar mods"
      enableTypeFilter={true}
      typeKey="tipo"
      customTypes={['complemento', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete']}
      hideHeaderTitleOnMobile
      compactPagination
      renderItem={(item) => (
        <Card {...item} />
      )}
    />
  );
};

export default Mods;
