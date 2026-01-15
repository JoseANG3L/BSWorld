import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/api';
import CreatorCard from '../components/CreatorCard';
import { Search, Users, Loader2 } from 'lucide-react';

const Creadores = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error("Error cargando creadores:", error);
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
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-0 animate-fade-in-up">
      
      {/* Header de la Sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comunidad</h1>
            <p className="text-gray-500 dark:text-gray-400">Descubre a los creadores de contenido.</p>
          </div>
        </div>

        {/* Buscador Local */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Grid de Creadores */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <CreatorCard 
              key={user.uid}
              username={user.username || user.displayName}
              avatar={user.avatar || user.photoURL}
              role={user.role}
              createdAt={user.createdAt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-60">
           <p className="text-xl font-bold">No se encontraron usuarios.</p>
        </div>
      )}
    </div>
  );
};

export default Creadores;