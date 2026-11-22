import React from 'react';
import { Boxes } from 'lucide-react'; 
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Modpacks = () => {
  return (
    <DataContainer
      title="Modpacks"
      icon={Boxes} 
      gradientClass="from-orange-500 to-red-400"
      catalogMode="category"
      catalogType="modpack"
      searchKey="titulo"
      renderItem={(item) => (
        <Card key={item.id} {...item} />
      )}
    />
  );
};

export default Modpacks;