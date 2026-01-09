import React from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/Card.jsx';

const Personajes = () => {
  const personajesList = [
    { id: 1, nombre: 'Steve', rol: 'Explorador', img: 'https://via.placeholder.com/150/0d6efd/FFFFFF?text=Steve', downloads: [{ label: 'Descargar', url: '#' }] },
    { id: 2, nombre: 'Alex', rol: 'Guerrera', img: 'https://via.placeholder.com/150/dc3545/FFFFFF?text=Alex', downloads: [{ label: 'Descargar', url: '#' }] },
    { id: 3, nombre: 'Aldeano', rol: 'Comerciante', img: 'https://via.placeholder.com/150/ffc107/000000?text=Aldeano', downloads: [{ label: 'Descargar', url: '#' }] },
    { id: 4, nombre: 'Zombie', rol: 'Enemigo', img: 'https://via.placeholder.com/150/198754/FFFFFF?text=Zombie', downloads: [{ label: 'Descargar', url: '#' }] },
    { id: 5, nombre: 'Creeper', rol: 'Explosivo', img: 'https://via.placeholder.com/150/20c997/FFFFFF?text=Creeper', downloads: [{ label: 'Descargar', url: '#' }] },
    { id: 6, nombre: 'Enderman', rol: 'Misterioso', img: 'https://via.placeholder.com/150/6610f2/FFFFFF?text=Enderman', downloads: [{ label: 'Descargar', url: '#' }] },
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

      {/* Grilla Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {personajesList.map((personaje) => (
          <Card 
            key={personaje.id}
            image={personaje.img}
            title={personaje.nombre}
            downloads={personaje.downloads}
            creator="Desconocido"
            tags={[personaje.rol]}
          />
        ))}
      </div>
    </div>
  );
};

export default Personajes;