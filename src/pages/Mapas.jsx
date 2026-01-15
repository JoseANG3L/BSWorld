import React from 'react';
import { User, Sparkles } from 'lucide-react';
import DataContainer from '../components/DataContainer'; // Importa el contenedor
import Card from '../components/Card';

const Mapas = () => {
  // DATOS
  const mapasList = [
    { id: 1, titulo: 'Steve', creadores: ['Minecraft'], tags: ['Explorador'], fecha: '2023-11-01', imagen: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 2, titulo: 'Alex', creadores: ['Minecraft'], tags: ['Guerrera'], fecha: '2023-12-15', imagen: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 3, titulo: 'Aldeano', creadores: ['Minecraft'], tags: ['Comerciante'], fecha: '2023-10-20', imagen: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 4, titulo: 'Zombie', creadores: ['Minecraft'], tags: ['Enemigo'], fecha: '2024-01-05', imagen: 'https://via.placeholder.com/640x360', descargas: [{ label: 'Descargar', url: '#' }] },
    { id: 5, titulo:'Creeper' , creadores:['Minecraft'] , tags:['Explosivo'] , fecha:'2023-09-10' , imagen:'https://via.placeholder.com/640x360' , descargas:[{ label:'Descargar' , url:'#' }] },
    { id: 6, titulo:'Enderman' , creadores:['Minecraft'] , tags:['Misterioso'] , fecha:'2024-01-20' , imagen:'https://via.placeholder.com/640x360' , descargas:[{ label:'Descargar' , url:'#' }] },
  ];

  return (
    <DataContainer
      title="Mapas"
      icon={Sparkles} // Icono personalizado
      gradientClass="from-pink-500 to-purple-500" // Color personalizado
      items={mapasList}
      searchKey="nombre" // Buscamos por la propiedad 'nombre'
      dateKey="fecha"    // Ordenamos por la propiedad 'fecha'
      
      // Aquí defines cómo se ve CADA item
      renderItem={(item) => (
        <Card 
          imagen={item.imagen} 
          titulo={item.titulo}
          descargas={item.descargas}
          creadores={item.creadores}
          tags={item.tags}
        />
      )}
    />
  );
};

export default Mapas;