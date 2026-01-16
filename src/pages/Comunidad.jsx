import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/api';
import CreatorCard from '../components/CreatorCard';
import { Search, Crown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import DataContainer from '../components/DataContainer';

const Comunidad = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        
        // --- CORRECCIÓN AQUÍ ---
        // DataContainer espera una propiedad 'id' para usarla como key.
        // Creamos una copia de los datos añadiendo 'id' (que será igual al uid).
        const normalizedData = data.map(user => ({
            ...user,
            id: user.uid // <--- CLAVE PARA QUE REACT NO SE QUEJE
        }));

        setUsers(normalizedData);
        setFilteredUsers(normalizedData);
        
      } catch (error) {
        console.error("Error cargando comunidad:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filtro en tiempo real
  useEffect(() => {
    const results = users.filter(user => 
      (user.username || user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  return (
    <DataContainer
      title="Comunidad"
      icon={Crown}
      gradientClass="from-yellow-500 to-orange-400"
      items={filteredUsers}
      searchKey="username"
      renderItem={(user) => (
        <CreatorCard 
          // Ya no es estrictamente necesario pasar la key aquí si DataContainer lo maneja,
          // pero es buena práctica dejarla por si acaso.
          key={user.id} 
          username={user.username || user.displayName}
          avatar={user.avatar || user.photoURL}
          role={user.role}
          createdAt={user.createdAt}
        />
      )}
    />
  );
};

export default Comunidad;