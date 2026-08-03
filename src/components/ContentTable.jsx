import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Edit3, Trash2, Loader2, Filter, Search, ArrowUpDown, ChevronDown, X, Check, Eye, Heart, MessageCircle, Layers, CheckCircle, XCircle, CheckSquare, Square, Download } from 'lucide-react';
import { getCommentCountByContent, getUserPublicProfile, updateContent, searchUsers, deleteContent } from '../services/api';
import { clsx } from 'clsx';

const ContentTable = ({
  data,
  loading,
  title,
  icon: Icon = Layers,
  gradientClass = "from-blue-500 to-indigo-600",
  headerStats = null,
  columns = {
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
    downloads: false,
    actions: true
  },
  actions = {
    view: true,
    edit: true,
    delete: true,
    accept: false,
    reject: false
  },
  onDelete,
  updatingId,
  adminMode = false,
  onBulkUpdate
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedVisibilidad, setSelectedVisibilidad] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isVisibilidadDropdownOpen, setIsVisibilidadDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isOrdenDropdownOpen, setIsOrdenDropdownOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});
  const [usernames, setUsernames] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);

  // Estados para selección múltiple
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null); // 'titulo', 'categoria', 'creador', 'visibilidad', 'estado'
  const [bulkValue, setBulkValue] = useState('');

  // Estados para modal de edición individual por campo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'imagen', 'titulo', 'categoria', 'creador', 'visibilidad'
  const [editingValue, setEditingValue] = useState('');

  // Estados para búsqueda de usuarios (modal creador)
  const [creatorInput, setCreatorInput] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const creatorSearchRef = useRef(null);

  // Estados temporales para el modal en móvil
  const [tempOrden, setTempOrden] = useState('recientes');
  const [tempSelectedTypes, setTempSelectedTypes] = useState([]);
  const [tempSelectedVisibilidad, setTempSelectedVisibilidad] = useState([]);
  const [tempSelectedStatus, setTempSelectedStatus] = useState([]);

  const typeDropdownRef = useRef(null);
  const visibilidadDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const ordenDropdownRef = useRef(null);

  // Obtener tipos disponibles
  const availableTypes = useMemo(() => {
    const types = [...new Set(data.map(item => item.tipo))];
    return types.filter(Boolean);
  }, [data]);

  // Configuración de visibilidad
  const getVisibilityConfig = (visibilidad) => {
    switch (visibilidad) {
      case 'publico':
      case 'public':
        return { label: 'Público', style: 'text-green-600 dark:text-green-400' };
      case 'privado':
      case 'private':
        return { label: 'Privado', style: 'text-red-600 dark:text-red-400' };
      case 'no-listado':
      case 'unlisted':
        return { label: 'No listado', style: 'text-yellow-600 dark:text-yellow-400' };
      default:
        return { label: visibilidad, style: 'text-gray-600 dark:text-gray-400' };
    }
  };

  // Configuración de estado
  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'aceptado':
      case 'published':
        return { 
          label: 'Aceptado', 
          style: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
        };
      case 'revision':
      case 'pending':
        return { 
          label: 'En Revisión', 
          style: 'bg-amber-50 text-orange-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
        };
      case 'rechazado':
      case 'rejected':
        return { 
          label: 'Rechazado', 
          style: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
        };
      case 'borrador':
      case 'draft':
        return { 
          label: 'Borrador', 
          style: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-[#1D1F23] dark:text-gray-400 dark:border-gray-700'
        };
      default:
        return { 
          label: 'Desconocido', 
          style: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-[#1D1F23] dark:text-gray-500'
        };
    }
  };

  // Formatear números grandes
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Cierre de-menús al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (visibilidadDropdownRef.current && !visibilidadDropdownRef.current.contains(event.target)) {
        setIsVisibilidadDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target)) {
        setIsOrdenDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloqueo de scroll cuando el modal de filtros está abierto
  useEffect(() => {
    if (isFiltersModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFiltersModalOpen]);

  // Cargar datos adicionales (comentarios y usernames)
  useEffect(() => {
    if (data.length > 0 && !hasLoaded) {
      const loadAdditionalData = async () => {
        // Cargar conteos de comentarios
        const counts = {};
        await Promise.all(
          data.map(async (item) => {
            const count = await getCommentCountByContent(item.id);
            counts[item.id] = count;
          })
        );
        setCommentCounts(counts);

        // Cargar usernames de los aportes
        const uniqueAporteIds = [...new Set(data.map(item => {
          if (item.creditos && item.creditos.length > 0 && item.creditos[0].uid) {
            return item.creditos[0].uid;
          }
          if (item.aporte?.uid) {
            return item.aporte.uid;
          }
          if (item.aporte) {
            return item.aporte;
          }
          return null;
        }).filter(Boolean))];
        const usernameMap = {};
        await Promise.all(
          uniqueAporteIds.map(async (userId) => {
            const userProfile = await getUserPublicProfile(userId);
            if (userProfile) {
              usernameMap[userId] = userProfile.username || userProfile.nombre || 'N/A';
            }
          })
        );
        setUsernames(usernameMap);

        setHasLoaded(true);
      };
      loadAdditionalData();
    }
  }, [data, hasLoaded]);

  // Abrir modal e inicializar estados temporales
  const handleOpenFiltersModal = () => {
    setTempOrden(orden);
    setTempSelectedTypes(selectedTypes);
    setTempSelectedVisibilidad(selectedVisibilidad);
    setTempSelectedStatus(selectedStatus);
    setIsFiltersModalOpen(true);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleVisibilidad = (vis) => {
    setSelectedVisibilidad(prev => 
      prev.includes(vis) ? prev.filter(v => v !== vis) : [...prev, vis]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatus(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearTypes = () => setSelectedTypes([]);
  const clearVisibilidad = () => setSelectedVisibilidad([]);
  const clearStatus = () => setSelectedStatus([]);

  // Filtrar y ordenar datos
  const filteredData = useMemo(() => {
    let resultado = data.filter(item => {
      // Filtro por búsqueda
      const searchMatch = !busqueda || 
        item.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));

      // Filtro por tipo
      const tipoMatch = selectedTypes.length === 0 || selectedTypes.includes(item.tipo);

      // Filtro por visibilidad
      const visibilidad = item.visibilidad || 'publico';
      const visibilidadMatch = selectedVisibilidad.length === 0 || selectedVisibilidad.includes(visibilidad);

      // Filtro por estado
      const estado = item.estado || item.status || 'borrador';
      const statusMatch = selectedStatus.length === 0 || selectedStatus.includes(estado);

      return searchMatch && tipoMatch && visibilidadMatch && statusMatch;
    });

    // Ordenamiento
    resultado.sort((a, b) => {
      if (orden === 'recientes') return new Date(b.creado) - new Date(a.creado);
      if (orden === 'antiguos') return new Date(a.creado) - new Date(b.creado);
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

    return resultado;
  }, [data, busqueda, selectedTypes, selectedVisibilidad, selectedStatus, orden]);

  // Funciones para selección múltiple
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = filteredData.map(item => item.id);
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const isAllSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredData.length;

  // Abrir modal de edición en masa
  const openBulkModal = (actionType) => {
    setBulkActionType(actionType);
    setBulkValue('');
    setIsBulkModalOpen(true);
  };

  // Ejecutar edición en masa
  const handleBulkUpdate = async () => {
    if (!bulkActionType || selectedIds.length === 0) return;

    // Caso especial para eliminación masiva
    if (bulkActionType === 'eliminar') {
      try {
        await Promise.all(selectedIds.map(id => deleteContent(id)));
        
        if (onDelete) {
          selectedIds.forEach(id => onDelete(id));
        }

        if (onBulkUpdate) {
          onBulkUpdate(selectedIds, 'eliminar', null);
        }

        clearSelection();
        setIsBulkModalOpen(false);
      } catch (error) {
        console.error('Error al eliminar elementos:', error);
        alert('Error al eliminar los elementos');
      }
      return;
    }

    try {
      const updateData = {};
      switch (bulkActionType) {
        case 'titulo':
          updateData.titulo = bulkValue;
          break;
        case 'categoria':
          updateData.tipo = bulkValue;
          break;
        case 'visibilidad':
          updateData.visibilidad = bulkValue;
          break;
        case 'estado':
          updateData.estado = bulkValue;
          break;
        case 'creador':
          // Para creador, necesitamos manejarlo de forma especial
          // Por ahora, lo dejamos pendiente
          break;
      }

      await Promise.all(
        selectedIds.map(id => updateContent(id, updateData))
      );

      if (onBulkUpdate) {
        onBulkUpdate(selectedIds, bulkActionType, bulkValue);
      }

      clearSelection();
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error('Error en edición en masa:', error);
      alert('Error al actualizar los elementos seleccionados');
    }
  };

  // Funciones para modal de edición individual por campo
  const openEditModal = (item, field) => {
    setEditingItem(item);
    setEditingField(field);
    
    let currentValue = '';
    switch (field) {
      case 'imagen':
        currentValue = item.imagen || (item.imagenes && item.imagenes[0]) || '';
        break;
      case 'titulo':
        currentValue = item.titulo || '';
        break;
      case 'categoria':
        currentValue = item.tipo || '';
        break;
      case 'creador':
        currentValue = item.aporte?.uid || item.aporte || '';
        break;
      case 'visibilidad':
        currentValue = item.visibilidad || 'publico';
        break;
    }
    
    setEditingValue(currentValue);
    setIsEditModalOpen(true);
  };

  const saveEditModal = async () => {
    if (!editingItem || !editingField) return;

    try {
      const updateData = {};
      switch (editingField) {
        case 'imagen':
          updateData.imagen = editingValue;
          break;
        case 'titulo':
          updateData.titulo = editingValue;
          break;
        case 'categoria':
          updateData.tipo = editingValue;
          break;
        case 'creador':
          updateData.aporte = editingValue;
          break;
        case 'visibilidad':
          updateData.visibilidad = editingValue;
          break;
      }

      await updateContent(editingItem.id, updateData);
      if (onBulkUpdate) {
        onBulkUpdate([editingItem.id], editingField, editingValue);
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditingField(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios');
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditingField(null);
    setEditingValue('');
    setCreatorInput('');
    setUserSuggestions([]);
    setShowSuggestions(false);
  };

  // Búsqueda de usuarios para el modal de creador
  useEffect(() => {
    if (creatorInput.length < 2) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(creatorInput);
        setUserSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [creatorInput]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (creatorSearchRef.current && !creatorSearchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreatorSearch = (e) => {
    setCreatorInput(e.target.value);
    setEditingValue(e.target.value);
  };

  const selectUser = (user) => {
    setEditingValue(user.uid);
    setCreatorInput(user.nombre);
    setShowSuggestions(false);
  };

  const handleCreatorKeyDown = (e) => {
    if (e.key === 'Enter' && creatorInput.trim()) {
      e.preventDefault();
      setEditingValue(creatorInput.trim());
      setShowSuggestions(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-6 gap-3">
        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white", `bg-gradient-to-br ${gradientClass}`)}>
              <Icon size={20} strokeWidth={2.5} />
          </div>
          {title}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 self-end mb-1 ml-1">({filteredData.length})</span>
        </h1>
        
        {/* Estadísticas en el header */}
        {headerStats && (
          <div className="flex flex-wrap gap-3 md:gap-4">
            {headerStats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-transparent">
                <stat.icon size={16} className={clsx("text-gray-600 dark:text-gray-400", stat.iconColor)} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{stat.label}:</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS */}
      <div className="mb-2 md:mb-6 flex flex-row gap-2 md:gap-3 items-start md:items-center">
        {/* Búsqueda */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Botón para abrir modal de filtros en móvil */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={handleOpenFiltersModal}
            className="relative px-4 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-medium flex items-center gap-2 shrink-0"
          >
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <span>Filtros</span>
            {(selectedTypes.length > 0 || selectedVisibilidad.length > 0 || selectedStatus.length > 0 || orden !== 'recientes') && (
              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>
            )}
          </button>
        </div>

        {/* Filtro de tipos (Desktop) */}
        {columns.category && availableTypes.length > 0 && (
          <div className="hidden md:block relative w-full md:w-auto" ref={typeDropdownRef}>
            <div className="relative w-full md:w-56 lg:w-64">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsOrdenDropdownOpen(false); setIsVisibilidadDropdownOpen(false); setIsStatusDropdownOpen(false); }}
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {selectedTypes.length === 0 
                    ? 'Categoría' 
                    : selectedTypes.length === 1 
                      ? selectedTypes[0].charAt(0).toUpperCase() + selectedTypes[0].slice(1).toLowerCase()
                      : `${selectedTypes.length} categorías`}
                </span>
              </button>
              <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => { clearTypes(); setIsTypeDropdownOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedTypes.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedTypes.length === 0 && <Check size={12} className="text-white" />}
                    </div>
                    <span>Todas las categorías</span>
                  </button>
                  {availableTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedTypes.includes(type) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedTypes.includes(type) ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {selectedTypes.includes(type) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-ellipsis overflow-hidden shrink">{type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtro de visibilidad (Desktop) */}
        {columns.visibility && (
          <div className="hidden md:block relative w-full md:w-auto" ref={visibilidadDropdownRef}>
            <div className="relative w-full md:w-56 lg:w-64">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => { setIsVisibilidadDropdownOpen(!isVisibilidadDropdownOpen); setIsTypeDropdownOpen(false); setIsOrdenDropdownOpen(false); setIsStatusDropdownOpen(false); }}
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {selectedVisibilidad.length === 0 
                    ? 'Visibilidad' 
                    : selectedVisibilidad.length === 1 
                      ? getVisibilityConfig(selectedVisibilidad[0]).label
                      : `${selectedVisibilidad.length} visibilidades`}
                </span>
              </button>
              <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${isVisibilidadDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isVisibilidadDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => { clearVisibilidad(); setIsVisibilidadDropdownOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedVisibilidad.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedVisibilidad.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedVisibilidad.length === 0 && <Check size={12} className="text-white" />}
                    </div>
                    <span>Toda la visibilidad</span>
                  </button>
                  {['publico', 'privado', 'no-listado'].map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => toggleVisibilidad(vis)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedVisibilidad.includes(vis) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedVisibilidad.includes(vis) ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {selectedVisibilidad.includes(vis) && <Check size={12} className="text-white" />}
                      </div>
                      <span>{getVisibilityConfig(vis).label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtro de estado (Desktop, solo admin) */}
        {adminMode && columns.status && (
          <div className="hidden md:block relative w-full md:w-auto" ref={statusDropdownRef}>
            <div className="relative w-full md:w-48">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsTypeDropdownOpen(false); setIsOrdenDropdownOpen(false); setIsVisibilidadDropdownOpen(false); }}
                className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left"
              >
                <span className="truncate block">
                  {selectedStatus.length === 0 
                    ? 'Estado' 
                    : selectedStatus.length === 1 
                      ? getStatusConfig(selectedStatus[0]).label
                      : `${selectedStatus.length} estados`}
                </span>
              </button>
              <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => { clearStatus(); setIsStatusDropdownOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedStatus.length === 0 ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedStatus.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedStatus.length === 0 && <Check size={12} className="text-white" />}
                    </div>
                    <span>Todos los estados</span>
                  </button>
                  {['borrador', 'revision', 'aceptado', 'rechazado'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${selectedStatus.includes(status) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedStatus.includes(status) ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {selectedStatus.includes(status) && <Check size={12} className="text-white" />}
                      </div>
                      <span>{getStatusConfig(status).label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ordenamiento (Desktop) */}
        <div className="hidden md:flex items-center gap-2 w-full md:w-auto" ref={ordenDropdownRef}>
          <div className="relative w-full md:w-56 lg:w-64">
            <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <button type="button" onClick={() => { setIsOrdenDropdownOpen(!isOrdenDropdownOpen); setIsTypeDropdownOpen(false); setIsVisibilidadDropdownOpen(false); setIsStatusDropdownOpen(false); }} className="w-full pl-10 pr-10 py-2.5 h-10 rounded-xl bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium text-left">
              <span className="truncate block">
                {orden === 'mas_descargas' ? 'Más Descargas' : orden === 'mas_vistas' ? 'Más Vistas' : orden === 'az' ? 'Nombre (A-Z)' : orden === 'za' ? 'Nombre (Z-A)' : orden === 'recientes' ? 'Más Recientes' : orden === 'antiguos' ? 'Más Antiguos' : orden}
              </span>
            </button>
            <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 ${isOrdenDropdownOpen ? "rotate-180" : ""}`} />

            {isOrdenDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1">
                <div className="flex flex-col gap-0.5">
                  {[
                    { val: 'mas_descargas', label: 'Más Descargas' },
                    { val: 'mas_vistas', label: 'Más Vistas' },
                    { val: 'az', label: 'Nombre (A-Z)' },
                    { val: 'za', label: 'Nombre (Z-A)' },
                    { val: 'recientes', label: 'Más Recientes' },
                    { val: 'antiguos', label: 'Más Antiguos' }
                  ].map((opt) => (
                    <button key={opt.val} type="button" onClick={() => { setOrden(opt.val); setIsOrdenDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${orden === opt.val ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES GLOBALES */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {selectedIds.length} {selectedIds.length === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openBulkModal('titulo')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cambiar Título
            </button>
            <button
              type="button"
              onClick={() => openBulkModal('categoria')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cambiar Categoría
            </button>
            <button
              type="button"
              onClick={() => openBulkModal('visibilidad')}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cambiar Visibilidad
            </button>
            {adminMode && (
              <button
                type="button"
                onClick={() => openBulkModal('estado')}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cambiar Estado
              </button>
            )}
            <button
              type="button"
              onClick={() => openBulkModal('eliminar')}
              className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-700 dark:text-red-400"
            >
              Eliminar
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE DATOS */}
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No se encontraron resultados</p>
          <p className="text-sm">Intenta con otra búsqueda o limpiando filtros.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-300 dark:border-gray-800">
                <th className="p-3 text-center w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} className="text-primary-600 dark:text-primary-400" />
                    ) : isSomeSelected ? (
                      <div className="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 rounded bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-sm"></div>
                      </div>
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                  </button>
                </th>
                {columns.image && <th className="p-3 text-center">Imagen</th>}
                {columns.title && <th className="p-3">Título</th>}
                {columns.category && <th className="p-3 text-center">Categoría</th>}
                {columns.creator && <th className="p-3 text-center">Creador</th>}
                {columns.aporte && <th className="p-3 text-center">Aporte</th>}
                {columns.visibility && <th className="p-3 text-center">Visibilidad</th>}
                {columns.date && <th className="p-3 text-center">Fecha</th>}
                {columns.views && <th className="p-3 text-center">Visualizaciones</th>}
                {columns.likes && <th className="p-3 text-center">Likes</th>}
                {columns.comments && <th className="p-3 text-center">Comentarios</th>}
                {columns.downloads && <th className="p-3 text-center">Descargas</th>}
                {columns.status && <th className="p-3 text-center">Estado</th>}
                {columns.actions && <th className="p-3 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredData.map((item) => {
                const estado = item.estado || item.status || 'borrador';
                const visibilidad = item.visibilidad || 'publico';
                const statusConfig = getStatusConfig(estado);
                const visibilityConfig = getVisibilityConfig(visibilidad);
                const totalDownloads = (item.descargas || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
                const mainImage = item.imagen || (item.imagenes && item.imagenes[0]) || null;
                const canApprove = adminMode && (estado === 'revision' || estado === 'pending');
                
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${selectedIds.includes(item.id) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                    {/* Checkbox de selección */}
                    <td className="p-3 text-center w-10">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare size={16} className="text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                      </button>
                    </td>
                    {/* Imagen principal */}
                    {columns.image && (
                      <td className="p-3 w-20">
                        <Link to={`/view/${item.id}`}>
                          <div 
                            className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                            // onClick={() => openEditModal(item, 'imagen')}
                            // title="Clic para editar imagen"
                          >
                          {mainImage ? (
                            <img 
                              src={mainImage} 
                              alt={item.titulo} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Layers size={16} />
                            </div>
                          )}
                        </div>
                        </Link>
                      </td>
                    )}
                    
                    {/* Título */}
                    {columns.title && (
                      <td className="p-3">
                        <Link to={`/view/${item.id}`}>
                          <div 
                            className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px] cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                            // onClick={() => openEditModal(item, 'titulo')}
                            // title="Clic para editar título"
                          >
                            {item.titulo || 'Sin título'}
                          </div>
                        </Link>
                      </td>
                    )}
                    
                    {/* Categoría */}
                    {columns.category && (
                      <td className="p-3 text-center">
                        <span 
                          className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 capitalize"
                          // onClick={() => openEditModal(item, 'categoria')}
                          // title="Clic para editar categoría"
                        >
                          {item.tipo || 'complemento'}
                        </span>
                      </td>
                    )}
                    
                    {/* Creador */}
                    {columns.creator && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div 
                          className="truncate max-w-[120px]"
                          // onClick={() => openEditModal(item, 'creador')}
                          // title="Clic para editar creador"
                        >
                          {item.creadores && item.creadores.length > 0 
                            ? item.creadores[0].nombre || item.creadores[0].username || 'N/A'
                            : 'N/A'}
                        </div>
                      </td>
                    )}
                    
                    {/* Aporte */}
                    {columns.aporte && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div className="truncate max-w-[120px]">
                          {(() => {
                            const userId = item.creditos?.[0]?.uid || item.aporte?.uid || item.aporte;
                            return usernames[userId] || 'N/A';
                          })()}
                        </div>
                      </td>
                    )}
                    
                    {/* Visibilidad */}
                    {columns.visibility && (
                      <td className="p-3 text-center">
                        <span 
                          className={`text-xs font-medium ${visibilityConfig.style}`}
                          // onClick={() => openEditModal(item, 'visibilidad')}
                          // title="Clic para editar visibilidad"
                        >
                          {visibilityConfig.label}
                        </span>
                      </td>
                    )}
                    
                    {/* Fecha */}
                    {columns.date && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        {new Date(item.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    )}
                    
                    {/* Visualizaciones */}
                    {columns.views && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1">
                          <Eye size={12} />
                          {formatNumber(item.vistas || 0)}
                        </div>
                      </td>
                    )}
                    
                    {/* Likes */}
                    {columns.likes && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1">
                          <Heart size={12} />
                          {formatNumber(item.likes_count || 0)}
                        </div>
                      </td>
                    )}
                    
                    {/* Comentarios */}
                    {columns.comments && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1">
                          <MessageCircle size={12} />
                          {formatNumber(commentCounts[item.id] || 0)}
                        </div>
                      </td>
                    )}

                    {/* Descargas */}
                    {columns.downloads && (
                      <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-1">
                          <Download size={12} />
                          {formatNumber(totalDownloads)}
                        </div>
                      </td>
                    )}
                    
                    {/* Estado */}
                    {columns.status && (
                      <td className="p-3 text-center">
                        {updatingId === item.id ? (
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400 py-1">
                            <Loader2 size={12} className="animate-spin text-primary-500" /> Procesando...
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${statusConfig.style}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </td>
                    )}
                    
                    {/* Acciones */}
                    {columns.actions && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {actions.view && (
                            <Link 
                              to={`/view/${item.id}`}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" 
                              title="Ver"
                            >
                              <Eye size={18} strokeWidth={2} />
                            </Link>
                          )}
                          {actions.edit && (
                            <Link 
                              to={`/edit/${item.id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                              title="Editar"
                            >
                              <Edit3 size={18} strokeWidth={2} />
                            </Link>
                          )}
                          {actions.delete && (
                            <button 
                              onClick={() => onDelete && onDelete(item.id, item.titulo)}
                              disabled={updatingId === item.id}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50" 
                              title="Eliminar"
                            >
                              {updatingId === item.id ? (
                                <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} strokeWidth={2} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE FILTROS EN MÓVIL */}
      {isFiltersModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:hidden"
          onClick={() => setIsFiltersModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 max-w-sm w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '200ms' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={18} className="text-primary-600 dark:text-primary-400" />
                <span>Filtros</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido desplazable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar">
              {/* Sección: Ordenar por */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Ordenar por
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'recientes', label: 'Más Recientes' },
                    { val: 'antiguos', label: 'Más Antiguos' },
                    { val: 'az', label: 'Nombre (A-Z)' },
                    { val: 'za', label: 'Nombre (Z-A)' },
                    { val: 'mas_vistas', label: 'Más Vistas' },
                    { val: 'mas_descargas', label: 'Más Descargas' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setTempOrden(opt.val)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left border ${
                        tempOrden === opt.val
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección: Filtrar por tipo */}
              {columns.category && availableTypes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Categoría
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempSelectedTypes([])}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                        tempSelectedTypes.length === 0
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${tempSelectedTypes.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {tempSelectedTypes.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>Todas las categorías</span>
                    </button>

                    {availableTypes.map((type) => {
                      const isSelected = tempSelectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTempSelectedTypes(prev =>
                              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                            );
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                            isSelected
                              ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                              : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span>{type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Filtrar por visibilidad */}
              {columns.visibility && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Visibilidad
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempSelectedVisibilidad([])}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                        tempSelectedVisibilidad.length === 0
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${tempSelectedVisibilidad.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {tempSelectedVisibilidad.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>Toda la visibilidad</span>
                    </button>

                    {['publico', 'privado', 'no-listado'].map((vis) => {
                      const isSelected = tempSelectedVisibilidad.includes(vis);
                      return (
                        <button
                          key={vis}
                          type="button"
                          onClick={() => {
                            setTempSelectedVisibilidad(prev =>
                              prev.includes(vis) ? prev.filter(v => v !== vis) : [...prev, vis]
                            );
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                            isSelected
                              ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                              : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span>{getVisibilityConfig(vis).label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Filtrar por estado (solo admin) */}
              {adminMode && columns.status && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Estado
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempSelectedStatus([])}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                        tempSelectedStatus.length === 0
                          ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${tempSelectedStatus.length === 0 ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {tempSelectedStatus.length === 0 && <Check size={12} className="text-white" />}
                      </div>
                      <span>Todos los estados</span>
                    </button>

                    {['borrador', 'revision', 'aceptado', 'rechazado'].map((status) => {
                      const isSelected = tempSelectedStatus.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setTempSelectedStatus(prev =>
                              prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                            );
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left border ${
                            isSelected
                              ? "bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400 font-bold"
                              : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300 dark:border-gray-600"}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span>{getStatusConfig(status).label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pie de página con acciones */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFiltersModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrden(tempOrden);
                  setSelectedTypes(tempSelectedTypes);
                  setSelectedVisibilidad(tempSelectedVisibilidad);
                  setSelectedStatus(tempSelectedStatus);
                  setIsFiltersModalOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE EDICIÓN EN MASA */}
      {isBulkModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBulkModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 max-w-md w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '200ms' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {bulkActionType === 'titulo' && 'Cambiar Título'}
                {bulkActionType === 'categoria' && 'Cambiar Categoría'}
                {bulkActionType === 'visibilidad' && 'Cambiar Visibilidad'}
                {bulkActionType === 'estado' && 'Cambiar Estado'}
                {bulkActionType === 'creador' && 'Cambiar Creador'}
                {bulkActionType === 'eliminar' && 'Eliminar Elementos'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="py-4">
              {bulkActionType === 'eliminar' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ¿Estás seguro de eliminar <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.length}</span> {selectedIds.length === 1 ? 'elemento' : 'elementos'}?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Se actualizarán {selectedIds.length} {selectedIds.length === 1 ? 'elemento' : 'elementos'}.
                  </p>

                  {bulkActionType === 'titulo' && (
                    <input
                      type="text"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      placeholder="Nuevo título..."
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    />
                  )}

                  {bulkActionType === 'categoria' && (
                    <select
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  )}

                  {bulkActionType === 'visibilidad' && (
                    <select
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    >
                      <option value="">Seleccionar visibilidad...</option>
                      <option value="publico">Público</option>
                      <option value="privado">Privado</option>
                      <option value="no-listado">No listado</option>
                    </select>
                  )}

                  {bulkActionType === 'estado' && (
                    <select
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    >
                      <option value="">Seleccionar estado...</option>
                      <option value="borrador">Borrador</option>
                      <option value="revision">En Revisión</option>
                      <option value="aceptado">Aceptado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  )}

                  {bulkActionType === 'creador' && (
                    <input
                      type="text"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      placeholder="ID del creador..."
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    />
                  )}
                </>
              )}
            </div>

            {/* Pie de página con acciones */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={bulkActionType !== 'eliminar' && !bulkValue}
                className={clsx(
                  "flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                  bulkActionType === 'eliminar' ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700"
                )}
              >
                {bulkActionType === 'eliminar' ? 'Eliminar' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE EDICIÓN INDIVIDUAL POR CAMPO */}
      {isEditModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 max-w-md w-full border border-gray-200 dark:border-transparent shadow-2xl relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: '200ms' }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editingField === 'imagen' && 'Editar Imagen'}
                {editingField === 'titulo' && 'Editar Título'}
                {editingField === 'categoria' && 'Editar Categoría'}
                {editingField === 'creador' && 'Editar Creador'}
                {editingField === 'visibilidad' && 'Editar Visibilidad'}
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido dinámico según el campo */}
            <div className="py-4">
              {editingField === 'imagen' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    URL de Imagen
                  </label>
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    autoFocus
                  />
                  {(editingValue || (editingItem?.imagen || (editingItem?.imagenes && editingItem.imagenes[0]))) && (
                    <div className="mt-3">
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm relative">
                        <img
                          src={editingValue || (editingItem?.imagen || (editingItem?.imagenes && editingItem.imagenes[0]))}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-medium">No se pudo cargar la imagen</div>';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingField === 'titulo' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    placeholder="Título del contenido"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    autoFocus
                  />
                </div>
              )}

              {editingField === 'categoria' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    autoFocus
                  >
                    <option value="">Seleccionar categoría...</option>
                    {availableTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingField === 'creador' && (
                <div className="relative" ref={creatorSearchRef}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Buscar Creador
                  </label>
                  <input
                    type="text"
                    value={creatorInput}
                    onChange={handleCreatorSearch}
                    onKeyDown={handleCreatorKeyDown}
                    placeholder="Escribe para buscar usuarios..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    autoFocus
                  />
                  {showSuggestions && creatorInput.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {userSuggestions.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                          {userSuggestions.map((u) => (
                            <li key={u.uid}>
                              <button
                                type="button"
                                onClick={() => selectUser(u)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                  {u.imagen ? (
                                    <img src={u.imagen} alt={u.nombre} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      {u.nombre?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{u.nombre}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        !isSearching && (
                          <div className="p-3 text-center text-xs text-gray-400">
                            No se encontraron usuarios. Presiona <b>Enter</b> para usar el ID manualmente.
                          </div>
                        )
                      )}
                      {isSearching && (
                        <div className="p-3 text-center text-xs text-gray-400">
                          Buscando...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editingField === 'visibilidad' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Visibilidad
                  </label>
                  <select
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white text-sm"
                    autoFocus
                  >
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                    <option value="no-listado">No listado</option>
                  </select>
                </div>
              )}
            </div>

            {/* Pie de página con acciones */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEditModal}
                disabled={!editingValue}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ContentTable;
