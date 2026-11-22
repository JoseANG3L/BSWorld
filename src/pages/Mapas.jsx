import React from 'react';
import { Map } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Mapas = () => {
  return (
    <DataContainer
      title="Mapas"
      icon={Map} 
      gradientClass="from-blue-500 to-cyan-400"
      catalogMode="category"
      catalogType="mapa"
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Mapas;