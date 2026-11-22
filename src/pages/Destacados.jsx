import React from 'react';
import { Trophy } from 'lucide-react';
import DataContainer from '../components/DataContainer';
import Card from '../components/Card';

const Destacados = () => {
  return (
    <DataContainer
      title="Destacados"
      icon={Trophy}
      gradientClass="from-amber-500 to-orange-600"
      catalogMode="category"
      initialSort="mas_descargas"
      searchKey="titulo"
      renderItem={(item, index) => (
        <div key={item.id} className="relative">
          {index < 3 && (
            <div className="absolute -top-3 -left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 border-2 border-white dark:border-gray-800 text-yellow-900 font-black shadow-lg transform -rotate-12">
              #{index + 1}
            </div>
          )}
          <Card {...item} />
        </div>
      )}
    />
  );
};

export default Destacados;
