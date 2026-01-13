import React from 'react';
import { User, Sparkles } from 'lucide-react';
import DataContainer from '../components/DataContainer'; // Importa el contenedor
import Card from '../components/Card';

const Minijuegos = () => {
  // DATOS
  const minijuegosList = [
    { id: 1, nombre: 'Steve', tags: ['Explorador'], fecha: '2023-11-01', img: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 2, nombre: 'Alex', tags: ['Guerrera'], fecha: '2023-12-15', img: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 3, nombre: 'Aldeano', tags: ['Comerciante'], fecha: '2023-10-20', img: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 4, nombre: 'Zombie', tags: ['Enemigo'], fecha: '2024-01-05', img: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 5, nombre: 'Creeper', tags: ['Explosivo'], fecha: '2023-09-10', img: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 6, nombre: 'Enderman', tags:['Misterioso'] , fecha:'2024-01-20' , img:'https://via.placeholder.com/640x360' , descargas:[{ label:'Descargar' , url:'#' }] },
  ];

  return (
    <DataContainer
      title="Minijuegos"
      icon={Sparkles} // Icono personalizado
      gradientClass="from-pink-500 to-purple-500" // Color personalizado
      items={minijuegosList}
      searchKey="nombre" // Buscamos por la propiedad 'nombre'
      dateKey="fecha"    // Ordenamos por la propiedad 'fecha'
      
      // Aquí defines cómo se ve CADA item
      renderItem={(item) => (
        <Card 
          image={item.img} 
          title={item.nombre}
          downloads={item.descargas}
          creator={item.creador}
          tags={item.tags}
        />
      )}
    />
  );
};

export default Minijuegos;