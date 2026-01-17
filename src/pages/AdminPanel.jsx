import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Plus, Search, Trash2, Edit, 
  FileBox, Users, Eye, Filter, Loader2 
} from 'lucide-react';

// 1. LIMPIAR IMPORTS DE FIREBASE (Quitamos deleteDoc y doc)
// Mantenemos collection y getDocs porque tu useEffect todavía los usa (podríamos mover eso también luego)
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// 2. IMPORTAR LA NUEVA FUNCIÓN
import { deleteContent } from '../services/api';

const AdminPanel = () => {
  const [content, setContent] = useState([]);
  const [stats, setStats] = useState({ total: 0, users: 0, views: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentRef = collection(db, "content");
        const contentSnap = await getDocs(contentRef);
        const contentData = contentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        setContent(contentData);
        setStats({
          total: contentData.length,
          users: usersSnap.size,
          views: contentData.reduce((acc, curr) => acc + (curr.vistas || 0), 0)
        });

      } catch (error) {
        console.error("Error cargando panel:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 3. LÓGICA DE ELIMINAR ACTUALIZADA ---
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este contenido? Esta acción no se puede deshacer.")) {
      try {
        // Usamos la función de la API
        await deleteContent(id);
        
        // Actualizar estado local (UI)
        setContent(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        
      } catch (error) {
        // El error ya se imprime en la API, pero mostramos alerta al usuario
        alert("Error al eliminar el contenido.");
      }
    }
  };

  // --- FILTRADO ---
  const filteredContent = content.filter(item => {
    const matchesSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.tipo === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-0 animate-fade-in-up">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-primary-600" /> Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Bienvenido al centro de control.</p>
        </div>
        
        <Link 
          to="/admin-upload" 
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20"
        >
          <Plus size={20} /> Nuevo Contenido
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={FileBox} label="Contenido Total" value={stats.total} color="bg-blue-500" />
        <StatCard icon={Users} label="Usuarios Registrados" value={stats.users} color="bg-purple-500" />
        <StatCard icon={Eye} label="Vistas Globales" value="N/A" color="bg-green-500" />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-gray-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
            >
              <option value="all">Todos los tipos</option>
              <option value="mod">Mods</option>
              <option value="mapa">Mapas</option>
              <option value="personaje">Personajes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Contenido</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Creadores</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredContent.length > 0 ? (
                filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="p-4 flex items-center gap-3">
                      <img 
                        src={item.imagen} 
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer" crossOrigin="anonymous"
                        className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                      />
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-xs" title={item.titulo}>
                        {item.titulo}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                      {Array.isArray(item.creadores) 
                        ? item.creadores.map(c => c.nombre).join(', ') 
                        : 'Desconocido'}
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(item.creado).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                            to={`/admin-upload?edit=${item.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                            title="Editar"
                            >
                            <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                    No se encontraron resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex justify-between">
            <span>Mostrando {filteredContent.length} items</span>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
    <div className={`p-4 rounded-xl text-white shadow-lg ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
  </div>
);

export default AdminPanel;