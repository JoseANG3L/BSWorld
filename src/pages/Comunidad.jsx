import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/api';
import CreatorCard from '../components/CreatorCard';
import { Crown, Loader2 } from 'lucide-react';
import DataContainer from '../components/DataContainer';

const Comunidad = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        
        // Normalizamos los datos inyectando la prop 'id' que DataContainer 
        // necesita para el React.cloneElement interno.
        const normalizedData = data.map(user => ({
            ...user,
            id: user.uid || user.id
        }));

        setUsers(normalizedData);
      } catch (error) {
        console.error("Error cargando comunidad:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <DataContainer
      title="Comunidad"
      icon={Crown}
      gradientClass="from-yellow-600 to-orange-500"
      items={users} // 👈 Pasamos la lista completa directa, DataContainer la filtrará internamente
      searchKey="username" // 👈 Mapea con el input de búsqueda de DataContainer
      renderItem={(user) => (
        <CreatorCard
          username={user.username}
          avatar={user.avatar}
          banner={user.banner}
          role={user.role}
          createdat={user.createdat}
        />
      )}
    />
  );
};

export default Comunidad;