import React from 'react';
import { Plus } from 'lucide-react';

const Personajes = () => {
  const personajesList = [
    { id: 1, nombre: 'Steve', rol: 'Explorador', img: 'https://via.placeholder.com/150/0d6efd/FFFFFF?text=Steve' },
    { id: 2, nombre: 'Alex', rol: 'Guerrera', img: 'https://via.placeholder.com/150/dc3545/FFFFFF?text=Alex' },
    { id: 3, nombre: 'Aldeano', rol: 'Comerciante', img: 'https://via.placeholder.com/150/ffc107/000000?text=Aldeano' },
    { id: 4, nombre: 'Zombie', rol: 'Enemigo', img: 'https://via.placeholder.com/150/198754/FFFFFF?text=Zombie' },
    { id: 5, nombre: 'Creeper', rol: 'Explosivo', img: 'https://via.placeholder.com/150/20c997/FFFFFF?text=Creeper' },
    { id: 6, nombre: 'Enderman', rol: 'Misterioso', img: 'https://via.placeholder.com/150/6610f2/FFFFFF?text=Enderman' },
  ];

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Galería de Personajes</h2>
        <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm font-medium">
          <Plus size={18} />
          Nuevo Personaje
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {personajesList.map((pj) => (
          <div key={pj.id} className="group bg-white dark:bg-[#252525] rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-transparent hover:border-blue-500/30">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 mb-4 rounded-full p-1 border-2 border-gray-100 dark:border-gray-700 group-hover:border-blue-500 transition-colors">
                <img 
                  src={pj.img} 
                  alt={pj.nombre} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              
              <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pj.nombre}</h5>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pj.rol}</p>
              
              <button className="w-full mt-auto py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Personajes;