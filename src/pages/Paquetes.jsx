import React from 'react';
import { Package } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Paquetes = () => {
  return (
    <DataContainer
      title="Paquetes"
      icon={Package}
      gradientClass="from-yellow-500 to-amber-400"
      catalogMode="category"
      catalogType="paquete"
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Paquetes;