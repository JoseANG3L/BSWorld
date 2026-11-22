import React from 'react';
import { Gamepad2 } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Minijuegos = () => {
  return (
    <DataContainer
      title="Minijuegos"
      icon={Gamepad2} 
      gradientClass="from-green-500 to-emerald-400"
      catalogMode="category"
      catalogType="minijuego"
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Minijuegos;