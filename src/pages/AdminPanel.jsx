import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Plus, FileBox, Users, Download, Loader2, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { deleteContent, updateContent, getAdminContent } from '../services/api';
import { clsx } from 'clsx';
import Modal from '../components/Modal';
import ContentTable from '../components/ContentTable';

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
  const [stats, setStats] = useState({ total: 0, users: 0, downloads: 0, likes: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Modal de rechazo
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    itemId: null,
    motivo: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentData = await getAdminContent();

        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;

        const totalDownloads = contentData.reduce((acc, item) => {
            const itemDownloads = item.descargas?.reduce((subAcc, version) => subAcc + (version.count || 0), 0) || 0;
            return acc + itemDownloads;
        }, 0);

        // Obtener conteo real de likes
        const { count: totalLikes, error: likesError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true });
        
        // Obtener conteo real de comentarios
        const { count: totalComments, error: commentsError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true });

        setContent(contentData);
        setStats({
          total: contentData.length,
          users: usersCount || 0,
          downloads: totalDownloads,
          likes: totalLikes || 0,
          comments: totalComments || 0
        });

      } catch (error) {
        console.error("Error cargando panel:", error);
      }   finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Aceptar mod
  const handleAccept = async (id) => {
    setUpdatingId(id);
    try {
      await updateContent(id, { estado: 'aceptado' });
      setContent(prev => prev.map(item => item.id === id ? { ...item, estado: 'aceptado' } : item));
    } catch (error) {
      console.error(error);
      alert("Error al aceptar el contenido.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir modal de rechazo
  const handleRejectClick = (id) => {
    setRejectModal({
      isOpen: true,
      itemId: id,
      motivo: ''
    });
  };

  // Confirmar rechazo con motivo
  const handleRejectConfirm = async () => {
    if (!rejectModal.motivo.trim()) {
      alert('Por favor ingresa el motivo del rechazo.');
      return;
    }

    setUpdatingId(rejectModal.itemId);
    try {
      await updateContent(rejectModal.itemId, { 
        estado: 'rechazado',
        mensaje_rechazo: rejectModal.motivo 
      });
      setContent(prev => prev.map(item => 
        item.id === rejectModal.itemId 
          ? { ...item, estado: 'rechazado', mensaje_rechazo: rejectModal.motivo } 
          : item
      ));
      setRejectModal({ isOpen: false, itemId: null, motivo: '' });
    } catch (error) {
      console.error(error);
      alert("Error al rechazar el contenido.");
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

  // --- EDICIÓN EN MASA ---
  const handleBulkUpdate = (selectedIds, actionType, value) => {
    // Recargar datos después de la edición en masa
    const fetchData = async () => {
      try {
        const contentData = await getAdminContent();

        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        if (usersError) throw usersError;

        const totalDownloads = contentData.reduce((acc, item) => {
            const itemDownloads = item.descargas?.reduce((subAcc, version) => subAcc + (version.count || 0), 0) || 0;
            return acc + itemDownloads;
        }, 0);

        // Obtener conteo real de likes
        const { count: totalLikes, error: likesError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true });
        
        // Obtener conteo real de comentarios
        const { count: totalComments, error: commentsError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true });

        setContent(contentData);
        setStats({
          total: contentData.length,
          users: usersCount || 0,
          downloads: totalDownloads,
          likes: totalLikes || 0,
          comments: totalComments || 0
        });

      } catch (error) {
        console.error("Error cargando panel:", error);
      }
    };

    fetchData();
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <>
      {/* TABLA DE CONTENIDO */}
      <ContentTable
        data={content}
        loading={loading}
        title="Panel de Administración"
        icon={LayoutDashboard}
        gradientClass="from-blue-500 to-indigo-600"
        showNewButton={false}
        headerStats={[
          { icon: FileBox, label: 'Contenido', value: stats.total, iconColor: 'text-blue-500' },
          { icon: Users, label: 'Usuarios', value: stats.users, iconColor: 'text-purple-500' },
          { icon: Heart, label: 'Likes', value: stats.likes, iconColor: 'text-red-500' },
          { icon: MessageCircle, label: 'Comentarios', value: stats.comments, iconColor: 'text-green-500' },
          { icon: Download, label: 'Descargas', value: stats.downloads, iconColor: 'text-emerald-500' }
        ]}
        columns={{
          image: true,
          title: true,
          category: true,
          creator: true,
          aporte: true,
          visibility: true,
          date: true,
          views: true,
          likes: true,
          comments: true,
          status: true,
          downloads: true,
          actions: true
        }}
        actions={{
          view: true,
          edit: true,
          delete: true,
        }}
        onDelete={handleDelete}
        updatingId={updatingId}
        adminMode={true}
        onBulkUpdate={handleBulkUpdate}
      />

      {/* MODAL DE RECHAZO */}
      <Modal 
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, itemId: null, motivo: '' })}
        onConfirm={handleRejectConfirm}
        title="Rechazar Mod"
        message="Por favor, ingresa el motivo del rechazo. Este mensaje será visible para el creador del mod."
        type="warning"
        showCancel={true}
        confirmText="Rechazar"
        cancelText="Cancelar"
      >
        <textarea
          value={rejectModal.motivo}
          onChange={(e) => setRejectModal({ ...rejectModal, motivo: e.target.value })}
          placeholder="Describe el motivo del rechazo..."
          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white text-sm resize-none"
          rows={4}
        />
      </Modal>
    </>
  );
};

export default AdminPanel;