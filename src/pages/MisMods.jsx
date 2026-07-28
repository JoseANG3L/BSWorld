import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit3, Trash2, PackageOpen, Loader2, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Filter, Search, ArrowUpDown, ChevronDown, X, Check } from 'lucide-react';
import { getUserContent, deleteContent } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ControlPanelCard from '../components/ControlPanelCard';
import Modal from '../components/Modal';

const MisMods = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('todos'); // todos, borrador, revision, aceptado, rechazado
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes'); // recientes, antiguos, az, za, mas_vistas, mas_descargas
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);

  const typeDropdownRef = useRef(null);
  const ordenDropdownRef = useRef(null);

  // Obtener tipos disponibles
  const availableTypes = useMemo(() => {
    const types = [...new Set(mods.map(item => item.tipo))];
    return types.filter(Boolean);
  }, [mods]);

  // Cierre de menús al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setIsOrdenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearTypes = () => setSelectedTypes([]);

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
    if (user?.id) {
      fetchMyMods();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyMods = async () => {
    setLoading(true);
    const data = await getUserContent(user?.id);
    setMods(data);
    setLoading(false);
  };

  // Filtrar mods por estado, tipo y búsqueda (misma lógica que DataContainer)
  const filteredMods = mods.filter(mod => {
    const estado = mod.estado || mod.status || 'borrador';
    
    // Filtro por estado
    const estadoMatch = filter === 'todos' || estado === filter;
    
    // Filtro por búsqueda
    const searchMatch = !busqueda || 
      mod.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      mod.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      mod.tags?.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
    
    // Filtro por tipo (misma lógica que DataContainer)
    let tipoMatch = true;
    if (selectedTypes.length > 0) {
      const typesInLowerCase = selectedTypes.map(t => t.toString().toLowerCase());
      const itemType = mod.tipo?.toString().toLowerCase();
      tipoMatch = itemType && typesInLowerCase.includes(itemType);
    }
    
    return estadoMatch && searchMatch && tipoMatch;
  }).sort((a, b) => {
    // Ordenamiento (misma lógica que DataContainer)
    if (orden === 'recientes') return new Date(b.creado || 0) - new Date(a.creado || 0);
    if (orden === 'antiguos') return new Date(a.creado || 0) - new Date(b.creado || 0);
    if (orden === 'az') return (a.titulo || '').localeCompare(b.titulo || '');
    if (orden === 'za') return (b.titulo || '').localeCompare(a.titulo || '');
    if (orden === 'mas_vistas') return (b.vistas || 0) - (a.vistas || 0);
    if (orden === 'mas_descargas') {
      const totalA = (a.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
      const totalB = (b.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
      return totalB - totalA;
    }
    return 0;
  });

  // Contar mods por estado
  const stats = {
    total: mods.length,
    borrador: mods.filter(m => (m.estado || m.status) === 'borrador' || (m.estado || m.status) === 'draft').length,
    revision: mods.filter(m => (m.estado || m.status) === 'revision' || (m.estado || m.status) === 'pending').length,
    aceptado: mods.filter(m => (m.estado || m.status) === 'aceptado' || (m.estado || m.status) === 'published').length,
    rechazado: mods.filter(m => (m.estado || m.status) === 'rechazado' || (m.estado || m.status) === 'rejected').length,
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
    <div className="w-full max-w-6xl mx-auto flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white bg-gradient-to-br from-yellow-500 to-amber-400">
            <PackageOpen size={22} strokeWidth={2.5} />
          </div>
          Panel de Control
        </h1>
        <button
          onClick={() => navigate('/subir')}
          className="mt-3 md:mt-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <PackageOpen size={16} /> Nuevo Mod
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setFilter('todos')}
          className={`p-3 rounded-xl border transition-all ${filter === 'todos' ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </button>
        <button
          onClick={() => setFilter('borrador')}
          className={`p-3 rounded-xl border transition-all ${filter === 'borrador' ? 'bg-gray-100 dark:bg-gray-800 border-gray-400' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.borrador}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Borradores</div>
        </button>
        <button
          onClick={() => setFilter('revision')}
          className={`p-3 rounded-xl border transition-all ${filter === 'revision' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.revision}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">En Revisión</div>
        </button>
        <button
          onClick={() => setFilter('aceptado')}
          className={`p-3 rounded-xl border transition-all ${filter === 'aceptado' ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.aceptado}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Aceptados</div>
        </button>
        <button
          onClick={() => setFilter('rechazado')}
          className={`p-3 rounded-xl border transition-all ${filter === 'rechazado' ? 'bg-red-50 dark:bg-red-900/30 border-red-500' : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rechazado}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Rechazados</div>
        </button>
      </div>

      {/* BUSCADOR Y FILTROS (estilo DataContainer) */}
      <div className="mb-4 flex flex-row gap-2 md:gap-3 items-start md:items-center">
        {/* Búsqueda */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar mods..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
          />
        </div>

        {/* Dropdown de tipos */}
        <div ref={typeDropdownRef} className="relative">
          <button
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-all dark:text-white text-sm font-medium"
          >
            <Filter size={16} />
            <span>Tipos</span>
            {selectedTypes.length > 0 && (
              <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">{selectedTypes.length}</span>
            )}
            <ChevronDown size={16} className={isTypeDropdownOpen ? 'rotate-180' : ''} />
          </button>
          
          {isTypeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 p-2">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Filtrar por tipo</span>
                {selectedTypes.length > 0 && (
                  <button onClick={clearTypes} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Limpiar
                  </button>
                )}
              </div>
              {availableTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm dark:text-white"
                >
                  <div className={`w-4 h-4 rounded border ${selectedTypes.includes(type) ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selectedTypes.includes(type) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown de ordenamiento */}
        <div ref={ordenDropdownRef} className="relative">
          <button
            onClick={() => setIsOrdenDropdownOpen(!isOrdenDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-all dark:text-white text-sm font-medium"
          >
            <ArrowUpDown size={16} />
            <span>Ordenar</span>
            <ChevronDown size={16} className={isOrdenDropdownOpen ? 'rotate-180' : ''} />
          </button>
          
          {isOrdenDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 p-2">
              {[
                { value: 'recientes', label: 'Más recientes' },
                { value: 'antiguos', label: 'Más antiguos' },
                { value: 'az', label: 'A-Z' },
                { value: 'za', label: 'Z-A' },
                { value: 'mas_vistas', label: 'Más vistas' },
                { value: 'mas_descargas', label: 'Más descargas' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => { setOrden(option.value); setIsOrdenDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm dark:text-white ${orden === option.value ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}
                >
                  {orden === option.value && <Check size={12} className="text-primary-600 dark:text-primary-400" />}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicador de filtro de estado */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Mostrando: <span className="font-bold text-gray-900 dark:text-white capitalize">{filter === 'todos' ? 'Todos' : filter.replace('_', ' ')}</span>
          </span>
          <span className="text-xs text-gray-400">({filteredMods.length} mods)</span>
        </div>
      </div>

      {/* GRID DE MODS */}
      {filteredMods.length === 0 ? (
        <div className="text-center py-12">
          <PackageOpen size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No hay mods en esta categoría</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'todos' ? 'Aún no has publicado ningún mod.' : `No tienes mods con estado "${filter.replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredMods.map((item) => (
            <ControlPanelCard 
              key={item.id} 
              {...item} 
              status={item.estado || item.status}
              isEditable={true} 
              handleDelete={handleDeleteClick}
              isDeleting={deletingId === item.id}
              onEdit={() => navigate(`/subir?edit=${item.id}`)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
};

export default MisMods;