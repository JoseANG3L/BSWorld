import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageOpen, Eye, Heart, Download, FileBox, Wrench, UserRound, Map, Gamepad2, Boxes, Package } from 'lucide-react';
import { getUserContent, deleteContent, getCommentCountByContent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ContentTable from '../components/ContentTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPublishedContentStats } from '../utils/publishedContentStats';

const MisMods = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [stats, setStats] = useState({ published: 0, publishedTypes: {}, views: 0, likes: 0, comments: 0, downloads: 0 });

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

  // Cargar datos (solo una vez al montar)
  useEffect(() => {
    if (user?.id && !hasLoaded) {
      fetchMyMods();
      setHasLoaded(true);
    } else if (!user?.id) {
      setLoading(false);
    }
  }, [user, hasLoaded]);

  const fetchMyMods = async () => {
    setLoading(true);
    try {
      const data = await getUserContent(user?.id);
      const modsData = data || [];
      setMods(modsData);

      // Calcular estadísticas (total de todos los mods)
      const totalViews = modsData.reduce((acc, item) => acc + (item.vistas || 0), 0);
      const totalLikes = modsData.reduce((acc, item) => acc + (item.likes_count || 0), 0);

      // Cargar conteos de comentarios para cada mod
      const commentCounts = {};
      await Promise.all(
        modsData.map(async (item) => {
          const count = await getCommentCountByContent(item.id);
          commentCounts[item.id] = count;
        })
      );

      const totalComments = Object.values(commentCounts).reduce((acc, count) => acc + count, 0);

      const totalDownloads = modsData.reduce((acc, item) => {
        const itemDownloads = item.descargas?.reduce((subAcc, version) => subAcc + (version.count || 0), 0) || 0;
        return acc + itemDownloads;
      }, 0);
      const publishedStats = getPublishedContentStats(modsData);

      setStats({
        published: publishedStats.total,
        publishedTypes: publishedStats.byType,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        downloads: totalDownloads
      });
    } catch (error) {
      console.error('Error al cargar mods:', error);
      setMods([]);
      setStats({ published: 0, publishedTypes: {}, views: 0, likes: 0, comments: 0, downloads: 0 });
    } finally {
      setLoading(false);
    }
  };

  // --- EDICIÓN EN MASA ---
  const handleBulkUpdate = (selectedIds, actionType, value) => {
    // Recargar datos después de la edición en masa
    fetchMyMods();
  };

  // --- RECARGAR ESTADÍSTICAS ---
  const reloadStats = () => {
    fetchMyMods();
  };

  // --- ELIMINAR CONTENIDO ---
  const handleDeleteClick = (id, titulo) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Eliminar Mod',
      message: `¿Estás seguro de que deseas eliminar "${titulo}"? Esta acción no se puede deshacer.`,
      showCancel: true,
      confirmText: 'Eliminar',
      onConfirm: () => executeDelete(id)
    });
  };

  const executeDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteContent(id);
      setMods(prev => {
        const newMods = prev.filter(mod => mod.id !== id);

        // Recalcular estadísticas después de eliminar
        const totalViews = newMods.reduce((acc, item) => acc + (item.vistas || 0), 0);
        const totalLikes = newMods.reduce((acc, item) => acc + (item.likes_count || 0), 0);

        // Recargar conteos de comentarios para los mods restantes
        const recalculateComments = async () => {
          const commentCounts = {};
          await Promise.all(
            newMods.map(async (item) => {
              const count = await getCommentCountByContent(item.id);
              commentCounts[item.id] = count;
            })
          );
          return Object.values(commentCounts).reduce((acc, count) => acc + count, 0);
        };

        const totalDownloads = newMods.reduce((acc, item) => {
          const itemDownloads = item.descargas?.reduce((subAcc, version) => subAcc + (version.count || 0), 0) || 0;
          return acc + itemDownloads;
        }, 0);
        const publishedStats = getPublishedContentStats(newMods);

        // Actualizar stats inmediatamente con lo que podemos calcular sin async
        setStats({
          published: publishedStats.total,
          publishedTypes: publishedStats.byType,
          views: totalViews,
          likes: totalLikes,
          comments: 0, // Se actualizará después
          downloads: totalDownloads
        });

        // Luego actualizar comentarios de forma asíncrona
        recalculateComments().then(totalComments => {
          setStats(prev => ({ ...prev, comments: totalComments }));
        });

        return newMods;
      });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Eliminado',
        message: 'El mod ha sido eliminado exitosamente.',
        showCancel: false,
        confirmText: 'Aceptar',
        onConfirm: null
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Hubo un error al intentar eliminar el mod. Por favor, intenta nuevamente.',
        showCancel: false,
        confirmText: 'Aceptar',
        onConfirm: null
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner variant="page" />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <PackageOpen size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Inicia Sesión</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Necesitas iniciar sesión para ver tus publicaciones.</p>
        <Link to="/login" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <ContentTable
        data={mods}
        loading={loading}
        title="Mis Mods"
        icon={PackageOpen}
        gradientClass="from-green-600 to-emerald-700"
        hideHeaderTitleOnMobile
        headerStats={[
          { icon: FileBox, label: 'Publicado', value: stats.published, iconColor: 'text-blue-600 dark:text-blue-400', iconBgClass: 'bg-blue-50 dark:bg-blue-950/40' },
          { icon: Wrench, label: 'Complementos', value: stats.publishedTypes.complemento || 0, iconColor: 'text-indigo-600 dark:text-indigo-400', iconBgClass: 'bg-indigo-50 dark:bg-indigo-950/40', group: 'type' },
          { icon: UserRound, label: 'Personajes', value: stats.publishedTypes.personaje || 0, iconColor: 'text-purple-600 dark:text-purple-400', iconBgClass: 'bg-purple-50 dark:bg-purple-950/40', group: 'type' },
          { icon: Map, label: 'Mapas', value: stats.publishedTypes.mapa || 0, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/40', group: 'type' },
          { icon: Gamepad2, label: 'Minijuegos', value: stats.publishedTypes.minijuego || 0, iconColor: 'text-amber-600 dark:text-amber-400', iconBgClass: 'bg-amber-50 dark:bg-amber-950/40', group: 'type' },
          { icon: Boxes, label: 'Modpacks', value: stats.publishedTypes.modpack || 0, iconColor: 'text-red-600 dark:text-red-400', iconBgClass: 'bg-red-50 dark:bg-red-950/40', group: 'type' },
          { icon: Package, label: 'Paquetes', value: stats.publishedTypes.paquete || 0, iconColor: 'text-cyan-600 dark:text-cyan-400', iconBgClass: 'bg-cyan-50 dark:bg-cyan-950/40', group: 'type' },
          { icon: Eye, label: 'Vistas', value: stats.views, iconColor: 'text-green-600 dark:text-green-400', iconBgClass: 'bg-green-50 dark:bg-green-950/40' },
          { icon: Heart, label: 'Likes', value: stats.likes, iconColor: 'text-red-600 dark:text-red-400', iconBgClass: 'bg-red-50 dark:bg-red-950/40' },
          { icon: Download, label: 'Descargas', value: stats.downloads, iconColor: 'text-purple-600 dark:text-purple-400', iconBgClass: 'bg-purple-50 dark:bg-purple-950/40' }
        ]}
        columns={{
          image: true,
          title: true,
          category: true,
          creator: true,
          aporte: false,
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
        onDelete={handleDeleteClick}
        updatingId={deletingId}
        adminMode={false}
        onBulkUpdate={handleBulkUpdate}
        mobileCardLayout
        mobileBulkActionsMenu
      />

      {/* MODAL */}
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
