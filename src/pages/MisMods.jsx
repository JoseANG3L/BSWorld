import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit3, Trash2, Plus, PackageOpen, Loader2, AlertTriangle } from 'lucide-react';
import { getUserContent, deleteContent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const MisMods = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Cargar datos
  useEffect(() => {
    if (user?.uid) {
      fetchMyMods();
    } else {
      setLoading(false); // Si no hay usuario, deja de cargar (se mostrará mensaje de login)
    }
  }, [user]);

  const fetchMyMods = async () => {
    setLoading(true);
    const data = await getUserContent(user.uid);
    setMods(data);
    setLoading(false);
  };

  // Manejar eliminación
  const handleDelete = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${titulo}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(id);
      try {
        await deleteContent(id);
        // Filtrar localmente para no tener que recargar la API
        setMods(mods.filter(mod => mod.id !== id));
      } catch (error) {
        alert("Error al eliminar. Intenta de nuevo.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  // --- RENDERIZADO CONDICIONAL ---
  
  // 1. Cargando
  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  // 2. No logueado
  if (!user) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-full mb-4 text-orange-500">
        <AlertTriangle size={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Requerido</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Necesitas iniciar sesión para ver tus publicaciones.</p>
      <Link to="/login" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
        Iniciar Sesión
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <PackageOpen className="text-primary-600" size={32} /> Mis Publicaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona, edita o elimina el contenido que has subido.
          </p>
        </div>
        
        <Link 
          to="/subir" 
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-600/20 active:scale-95"
        >
          <Plus size={20} /> Crear Nuevo
        </Link>
      </div>

      {/* GRID DE MODS */}
      {mods.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mods.map((mod) => (
            <div key={mod.id} className="relative group">
              
              {/* COMPONENTE CARD EXISTENTE */}
              {/* Le pasamos isPreview=true para que los links internos no interfieran, 
                  o lo dejamos normal si queremos que la imagen lleve al detalle */}
              <div className="opacity-100 transition-opacity duration-300 group-hover:opacity-100">
                 <Card 
                    {...mod} 
                    // Opcional: si quieres que la card sea solo visual y no clickable:
                    // isPreview={true} 
                 />
              </div>

              {/* --- CAPA DE ACCIONES (OVERLAY) --- */}
              {/* Esta capa aparece encima de la card */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                
                {/* Botón Editar */}
                <button 
                  onClick={() => navigate(`/subir?edit=${mod.id}`)}
                  className="p-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-lg hover:scale-110 transition-all border border-gray-200 dark:border-gray-700"
                  title="Editar Contenido"
                >
                  <Edit3 size={18} />
                </button>

                {/* Botón Eliminar */}
                <button 
                  onClick={() => handleDelete(mod.id, mod.titulo)}
                  className="p-2.5 bg-white dark:bg-gray-800 text-red-500 rounded-xl shadow-lg hover:scale-110 transition-all border border-gray-200 dark:border-gray-700"
                  disabled={deletingId === mod.id}
                  title="Eliminar permanentemente"
                >
                  {deletingId === mod.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>

              </div>

              {/* BADGE DE ESTADO (Opcional) */}
              <div className="absolute top-3 left-3 z-20">
                 <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-lg border border-white/10">
                    {mod.tipo}
                 </span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* ESTADO VACÍO */
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="bg-gray-200 dark:bg-gray-800 p-6 rounded-full mb-4">
             <PackageOpen size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Aún no has subido nada</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-sm text-center">
            ¡Comparte tu primer mod, mapa o textura con la comunidad!
          </p>
          <Link 
            to="/subir" 
            className="px-6 py-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          >
            Subir mi primer aporte
          </Link>
        </div>
      )}
    </div>
  );
};

export default MisMods;