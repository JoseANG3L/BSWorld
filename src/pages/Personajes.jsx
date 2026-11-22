import React from 'react';
import { User } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Personajes = () => {
  return (
    <DataContainer
      title="Personajes"
      icon={User} 
      gradientClass="from-pink-500 to-purple-400"
      catalogMode="category"
      catalogType="personaje"
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Personajes;