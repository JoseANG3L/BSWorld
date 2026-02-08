import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importar useNavigate
import { Edit3, Trash2, PackageOpen, Loader2, AlertTriangle } from 'lucide-react';
import { getUserContent, deleteContent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataContainer from '../components/DataContainer';
import Modal from '../components/Modal'; // <--- 1. IMPORTANTE: Importar el Modal

const MisMods = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook para navegar al editar
  
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'Aceptar',
    onConfirm: null
  });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  // Cargar datos
  useEffect(() => {
    if (user?.uid) {
      fetchMyMods();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyMods = async () => {
    setLoading(true);
    const data = await getUserContent(user.uid);
    setMods(data);
    setLoading(false);
  };

  // 2. FUNCIÓN REAL DE BORRADO
  const executeDelete = async (id) => {
    closeModal(); 
    setDeletingId(id); 

    try {
      await deleteContent(id);
      setMods(prev => prev.filter(mod => mod.id !== id));
      // No mostramos modal de éxito para hacerlo más rápido, pero podrías descomentarlo
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el contenido. Intenta nuevamente.',
        showCancel: false
      });
    } finally {
      setDeletingId(null);
    }
  };

  // 3. FUNCIÓN QUE ABRE EL MODAL
  const handleDeleteClick = (id, titulo) => {
    setModal({
      isOpen: true,
      type: 'error', // Rojo para peligro
      title: '¿Eliminar contenido?',
      message: `Estás a punto de eliminar permanentemente "${titulo}". Esta acción no se puede deshacer.`,
      showCancel: true,
      confirmText: 'Sí, Eliminar',
      onConfirm: () => executeDelete(id)
    });
  };

  // --- RENDERIZADO CONDICIONAL ---
  
  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-primary-600" size={48} /></div>
  );

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
    <>
      <DataContainer
        title="Mis Mods"
        icon={PackageOpen}
        gradientClass="from-yellow-500 to-amber-400"
        items={mods}
        searchKey="titulo"
        renderItem={(item) => (
          <Card 
             key={item.id} 
             {...item} 
             // Props para edición
             isEditable={true} 
             handleDelete={handleDeleteClick}
             isDeleting={deletingId === item.id} // <-- Agregamos esto para el spinner
          />
        )}
      />

      {/* 2. IMPORTANTE: Renderizar el Modal aquí al final */}
      <Modal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
      />
    </>
  );
};

export default MisMods;