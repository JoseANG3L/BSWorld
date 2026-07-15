import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Plus, Search, Trash2, Edit, 
  FileBox, Users, Download, Filter, Loader2, ChevronDown, CheckCircle, Clock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { deleteContent, updateContent } from '../services/api';
import { clsx } from 'clsx';

const StatCard = ({ icon: Icon, label, value, gradient }) => (
  <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
    <div className={clsx("p-3 rounded-xl text-white shadow-md bg-gradient-to-br", gradient)}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{value}</h3>
    </div>
  </div>
);

const AdminPanel = () => {
  const [content, setContent] = useState([]);
  const [stats, setStats] = useState({ total: 0, users: 0, downloads: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [updatingId, setUpdatingId] = useState(null); // Estado visual de carga inline

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .order('creado', { ascending: false });
        if (contentError) throw contentError;

        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;

        const totalDownloads = contentData.reduce((acc, item) => {
            const itemDownloads = item.descargas?.reduce((subAcc, version) => subAcc + (version.count || 0), 0) || 0;
            return acc + itemDownloads;
        }, 0);

        setContent(contentData);
        setStats({
          total: contentData.length,
          users: usersCount || 0,
          downloads: totalDownloads
        });

      } catch (error) {
        console.error("Error cargando panel:", error);
      }   finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 👇 FUNCIÓN CLAVE: Actualiza el estado del mod inline directamente a Supabase
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateContent(id, { status: newStatus }); // Llama a tu api.js
      setContent(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado del contenido.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este contenido? Esta acción no se puede deshacer.")) {
      try {
        await deleteContent(id);
        setContent(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      } catch (error) {
        alert("Error al eliminar el contenido.");
      }
    }
  };

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
    <div className="p-4 md:p-6 space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="text-primary-600" size={24} /> Panel de Administración
          </h1>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">Control global de modificaciones e indicadores clave.</p>
        </div>
        
        <Link 
          to="/subir" 
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-600/10 self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} /> Nuevo Contenido
        </Link>
      </div>

      {/* INDICADORES (STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FileBox} label="Contenido Total" value={stats.total} gradient="from-blue-500 to-indigo-600" />
        <StatCard icon={Users} label="Usuarios Registrados" value={stats.users} gradient="from-purple-500 to-pink-600" />
        <StatCard icon={Download} label="Descargas Totales" value={stats.downloads} gradient="from-emerald-500 to-teal-600" />
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
        
        {/* FILTROS DE BÚSQUEDA */}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 text-xs bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl py-1.5 h-9 px-3 text-xs font-semibold dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none cursor-pointer shadow-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="mod">Mods</option>
              <option value="mapa">Mapas</option>
              <option value="personaje">Personajes</option>
              <option value="minijuego">Minijuegos</option>
              <option value="modpack">Modpacks</option>
            </select>
          </div>
        </div>

        {/* TABLA RESPONSIVA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="p-3.5 pl-4">Contenido</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5 text-center">Descargas</th>
                <th className="p-3.5">Creador(es)</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredContent.length > 0 ? (
                filteredContent.map((item) => {
                  const itemTotalDownloads = item.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                      {/* MINIATURA Y TÍTULO */}
                      <td className="p-3 pl-4 flex items-center gap-3">
                        <img 
                          src={item.imagen} 
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer" crossOrigin="anonymous"
                          className="w-8 h-8 rounded-lg object-cover bg-gray-100 border dark:border-gray-700 shrink-0 shadow-sm"
                        />
                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px] md:max-w-xs" title={item.titulo}>
                          {item.titulo}
                        </span>
                      </td>

                      {/* TIPO */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          {item.tipo}
                        </span>
                      </td>

                      {/* DESCARGAS */}
                      <td className="p-3 text-center font-black text-gray-700 dark:text-gray-300">
                        {itemTotalDownloads.toLocaleString()}
                      </td>

                      {/* CREADORES */}
                      <td className="p-3 text-gray-500 dark:text-gray-400 font-medium truncate max-w-[120px]">
                        {Array.isArray(item.creadores) 
                          ? item.creadores.map(c => c.nombre).join(', ') 
                          : 'Desconocido'}
                      </td>

                      {/* 👇 GESTIÓN DE ESTADO INLINE SELECTOR */}
                      <td className="p-3">
                        <div className="relative inline-block w-36">
                          {updatingId === item.id ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 py-1 pl-2">
                              <Loader2 size={12} className="animate-spin text-primary-500" /> Guardando...
                            </div>
                          ) : (
                            <>
                              <select
                                value={item.status || 'published'}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className={clsx(
                                  "w-full pl-2 pr-6 py-1 text-[11px] font-bold rounded-lg border appearance-none outline-none cursor-pointer transition-all shadow-sm capitalize",
                                  item.status === 'published' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30",
                                  item.status === 'pending' && "bg-amber-50 text-orange-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
                                  item.status === 'published_editing' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
                                  item.status === 'rejected' && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
                                  item.status === 'draft' && "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                )}
                              >
                                <option value="published">Publicado</option>
                                <option value="pending">En revisión</option>
                                <option value="published_editing">Editado en revisión</option>
                                <option value="rejected">Rechazado</option>
                                <option value="draft">Borrador</option>
                              </select>
                              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </>
                          )}
                        </div>
                      </td>

                      {/* BOTONES ACCIONES */}
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link 
                            to={`/subir?edit=${item.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                            title="Editar completo"
                          >
                            <Edit size={15} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                            title="Eliminar permanentemente"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400 italic">
                    No se encontraron resultados en el servidor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PIE DE TABLA */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-400 font-semibold flex justify-between bg-gray-50/30">
          <span>Mostrando {filteredContent.length} registros del total</span>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;