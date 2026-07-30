import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, AlertTriangle, Plus, Edit, Trash2, Tag, User, X, ChevronDown } from 'lucide-react';
import { getContentById, updateContent, searchUsers, getUserPublicProfile, getUserByUsername } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SimpleEditor from "../components/SimpleEditor";
import AvatarRenderer from '../components/AvatarRenderer';
import { encryptionService, initializeEncryption } from '../services/encryption';
import { clsx } from 'clsx';

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchRef = useRef(null);
  
  // Refs para dropdowns
  const tipoDropdownRef = useRef(null);
  const visibilidadDropdownRef = useRef(null);
  const estadoDropdownRef = useRef(null);
  const versionDropdownRefs = useRef([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  
  const [errors, setErrors] = useState({
    titulo: false,
    imagen: false,
    creadores: false
  });

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mod',
    imagen: '',
    visibilidad: 'publico',
    estado: 'borrador',
    creado: new Date().toISOString().split('T')[0],
    tags: [],
    galeria: [],
    descargas: [
      { presetLabel: 'API 9 (1.7.44+)', label: 'API 9 (1.7.44+)', url: '' },
      { presetLabel: 'API 8 (1.7.20+)', label: 'API 8 (1.7.20+)', url: '' },
      { presetLabel: 'API 7 (1.7.42)', label: 'API 7 (1.7.42)', url: '' },
      { presetLabel: 'API 6 (1.7.41)', label: 'API 6 (1.7.41)', url: '' }
    ]
  });

  const [tagInput, setTagInput] = useState('');
  const [creatorInput, setCreatorInput] = useState('');
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [galleryMediaTypes, setGalleryMediaTypes] = useState({});
  
  // Estados para dropdowns personalizados
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Cierre de dropdowns al dar clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(event.target)) {
        setOpenDropdowns(prev => ({ ...prev, tipo: false }));
      }
      if (visibilidadDropdownRef.current && !visibilidadDropdownRef.current.contains(event.target)) {
        setOpenDropdowns(prev => ({ ...prev, visibilidad: false }));
      }
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target)) {
        setOpenDropdowns(prev => ({ ...prev, estado: false }));
      }
      versionDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setOpenDropdowns(prev => ({ ...prev, [`version-${index}`]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inicializar encriptación
  useEffect(() => {
    let isMounted = true;
    const initEncryption = async () => {
      try {
        const key = await initializeEncryption();
        if (isMounted) {
          setEncryptionKey(key);
          setIsEncryptionReady(true);
        }
      } catch (error) { console.error('Error inicializando encriptación:', error); }
    };
    initEncryption();
    return () => { isMounted = false; };
  }, []);

  // Cargar datos para edición
  useEffect(() => {
    const loadDataForEdit = async () => {
      try {
        const data = await getContentById(id, user?.id, user?.role);
        
        if (!data) {
          setError('No se encontró el contenido o no tienes permisos para editarlo');
          return;
        }
        
        setContent(data);
        
        // Enriquecer creadores
        if (data.creadores && Array.isArray(data.creadores)) {
          const enrichedCreators = await Promise.all(data.creadores.map(async (creator) => {
            let profile = null;
            // Si tiene uid, buscar perfil por uid para obtener avatar actualizado
            if (creator.uid) { 
              try { profile = await getUserPublicProfile(creator.uid); } catch (err) { } 
            } 
            // Si no tiene uid pero tiene nombre, buscar por nombre
            else if (creator.nombre) { 
              try { profile = await getUserByUsername(creator.nombre); } catch (err) { } 
            }
            // Si se encontró perfil, usar sus datos; si no, usar datos existentes
            return profile 
              ? { nombre: profile.nombre, imagen: profile.imagen, uid: profile.uid } 
              : { nombre: creator.nombre || "Desconocido", imagen: creator.imagen || null, uid: creator.uid || null };
          }));
          setSelectedCreators(enrichedCreators.filter(c => c && c.nombre));
        }

        const cleanAporteId = data.aporte && typeof data.aporte === 'object' ? data.aporte.uid || data.aporte.id : data.aporte;

        setFormData({
          titulo: data.titulo || '',
          descripcion: data.descripcion || '',
          tipo: data.tipo || 'mod',
          imagen: data.imagen || '',
          visibilidad: data.visibilidad || 'publico',
          estado: data.estado || data.status || 'borrador',
          creado: data.creado ? new Date(data.creado).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tags: data.tags ? data.tags.filter(t => t !== data.tipo) : [data.tipo || 'mod'],
          galeria: data.galeria && Array.isArray(data.galeria) ? data.galeria : [],
          descargas: data.descargas && data.descargas.length > 0 
            ? data.descargas.map(d => {
                const presetLabels = ['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.42)', 'API 6 (1.7.41)'];
                const isPreset = presetLabels.includes(d.label);
                return { 
                  presetLabel: isPreset ? d.label : 'Personalizado', 
                  label: d.label || '', 
                  url: d.url || '' 
                };
              })
            : [
                { presetLabel: 'API 9 (1.7.44+)', label: 'API 9 (1.7.44+)', url: '' },
                { presetLabel: 'API 8 (1.7.20+)', label: 'API 8 (1.7.20+)', url: '' },
                { presetLabel: 'API 7 (1.7.5+)', label: 'API 7 (1.7.5+)', url: '' },
                { presetLabel: 'API 6 (1.6.4+)', label: 'API 6 (1.6.4+)', url: '' },
                { presetLabel: 'API 4 (1.4.150+)', label: 'API 4 (1.4.150+)', url: '' }
              ]
        });
      } catch (err) {
        setError('Error al cargar el contenido');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDataForEdit();
    }
  }, [id, user?.id, user?.role]);

  // Click outside para sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => { 
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false); 
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda de creadores con debounce
  useEffect(() => {
    if (creatorInput.length < 2) { setUserSuggestions([]); setShowSuggestions(false); return; }
    const timerId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(creatorInput);
        setUserSuggestions(results.filter(u => !selectedCreators.some(sel => sel.uid === u.uid)));
        setShowSuggestions(true);
      } catch (err) { console.error(err); } finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(timerId);
  }, [creatorInput, selectedCreators]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (htmlContent) => setFormData(prev => ({ ...prev, descripcion: htmlContent }));

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !formData.tags.includes(cleanTag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));

  const handleAddGalleryImage = () => setFormData(prev => ({ ...prev, galeria: [...prev.galeria, ''] }));

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleGalleryImageChange = (index, value) => {
    const newGaleria = [...formData.galeria];
    newGaleria[index] = value;
    setFormData(prev => ({ ...prev, galeria: newGaleria }));
    
    // Detectar tipo de media
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv'];
    const isVideo = videoExtensions.some(ext => value.toLowerCase().endsWith(ext));
    
    // Detectar YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const isYoutube = youtubeRegex.test(value);
    
    setGalleryMediaTypes(prev => ({ ...prev, [index]: isYoutube ? 'youtube' : (isVideo ? 'video' : 'image') }));
  };

  const handleRemoveGalleryImage = (index) => setFormData(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }));

  const handleAddDownload = () => setFormData(prev => ({...prev, descargas: [...prev.descargas, { presetLabel: 'API 9 (1.7.44+)', label: 'API 9 (1.7.44+)', url: '' }] }));

  const handleDownloadChange = (index, field, value) => {
    const newDescargas = [...formData.descargas];
    newDescargas[index][field] = value;
    
    // Si cambia presetLabel y no es Personalizado, actualizar label automáticamente
    if (field === 'presetLabel' && value !== 'Personalizado') {
      newDescargas[index].label = value;
    }
    
    setFormData(prev => ({ ...prev, descargas: newDescargas }));
  };

  const handleRemoveDownload = (index) => setFormData(prev => ({ ...prev, descargas: prev.descargas.filter((_, i) => i !== index) }));

  const handleCreatorSearch = (e) => setCreatorInput(e.target.value);

  const addUserCreator = (user) => { 
    setSelectedCreators([...selectedCreators, user]); 
    setCreatorInput(''); 
    setShowSuggestions(false); 
  };

  const addTextCreator = (e) => {
    if (e.key === 'Enter' && creatorInput.trim()) {
      e.preventDefault();
      setSelectedCreators([...selectedCreators, { nombre: creatorInput.trim(), imagen: null, uid: null }]);
      setCreatorInput(''); 
      setShowSuggestions(false);
    }
  };

  const removeCreator = (index) => { 
    const newCreators = [...selectedCreators]; 
    newCreators.splice(index, 1); 
    setSelectedCreators(newCreators); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validaciones
    const hasTituloError = !formData.titulo.trim();
    const hasImagenError = !formData.imagen.trim();
    const hasCreadoresError = selectedCreators.length === 0;

    if (hasTituloError || hasImagenError || hasCreadoresError) {
      setErrors({ titulo: hasTituloError, imagen: hasImagenError, creadores: hasCreadoresError });
      setError('Asegúrate de haber ingresado un nombre, al menos un creador y la imagen principal.');
      setSaving(false);
      return;
    }

    if (!isEncryptionReady || !encryptionKey) {
      setError('Inicializando motor de encriptación. Intenta en un segundo.');
      setSaving(false);
      return;
    }

    try {
      // Determinar estado final
      let finalEstado;
      if (user.role === 'admin') {
        finalEstado = formData.estado || 'revision';
      } else {
        if (formData.visibilidad === 'privado') finalEstado = 'aceptado';
        else finalEstado = 'revision';
      }

      // Encriptar URLs de descargas
      let processedDescargas = formData.descargas.filter(d => d.url !== '');
      processedDescargas = await Promise.all(
        processedDescargas.map(async (d) => {
          try {
            const encryptedUrl = await encryptionService.encryptUrl(d.url, encryptionKey);
            // Solo enviamos label al backend, ignoramos presetLabel
            return { label: d.label || '', url: encryptedUrl };
          } catch (error) { 
            return { label: d.label || '', url: d.url }; 
          }
        })
      );

      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        imagen: formData.imagen,
        galeria: formData.galeria.filter(url => url.trim() !== ''),
        redes: [],
        creadores: selectedCreators.map(c => ({ nombre: c.nombre, uid: c.uid || null, imagen: c.imagen || null })),
        tags: [formData.tipo, ...formData.tags],
        descargas: processedDescargas,
        aporte: user?.id || '',
        creado: new Date(formData.creado).toISOString(),
        estado: finalEstado,
        visibilidad: formData.visibilidad
      };

      await updateContent(id, payload);
      navigate(-1);
    } catch (err) {
      setError('Error al guardar los cambios');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 md:p-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
        {/* Header */}
      <div className="flex md:flex-row flex-col items-center justify-between gap-2 md:gap-4 mb-2 md:mb-4">

        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white bg-gradient-to-br from-primary-500 to-primary-600">
              <Edit size={20} strokeWidth={2.5} />
          </div>
          Editar Contenido
        </h1>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="py-2 px-4 text-sm rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="py-2 px-4 text-sm rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Grid de dos columnas */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Columna Izquierda */}
          <div className="w-full space-y-5 bg-white dark:bg-[#1e1e1e] rounded-lg p-2 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
            {/* Título */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className={clsx(
                  "w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border rounded-xl outline-none dark:text-white",
                  errors.titulo ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                )}
                required
              />
              {errors.titulo && <p className="text-xs text-red-500 font-semibold">El título es obligatorio.</p>}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Descripción</label>
              <SimpleEditor
                value={formData.descripcion}
                onChange={handleDescriptionChange}
                placeholder="Describe tu contenido..."
              />
            </div>

            {/* Creadores */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Creadores *</label>
              <div ref={searchRef} className="relative">
                <div className={clsx(
                  "p-2 rounded-2xl border flex flex-wrap gap-2 shadow-sm items-center transition-all",
                  errors.creadores ? "border-red-500 bg-red-50/10" : "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500"
                )}>
                  {selectedCreators.map((creator, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 pl-1.5 pr-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-300 shrink-0">
                        <AvatarRenderer avatar={creator.imagen} name={creator.nombre} size={20} className="rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{creator.nombre}</span>
                      <button type="button" onClick={() => removeCreator(idx)} className="text-gray-400 hover:text-red-500 p-0.5"><X size={12} /></button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    value={creatorInput} 
                    onChange={handleCreatorSearch} 
                    onKeyDown={addTextCreator} 
                    placeholder="Buscar usuario..." 
                    className="flex-1 bg-transparent outline-none text-sm dark:text-white min-w-[140px] px-2 py-1" 
                  />
                </div>

                {showSuggestions && creatorInput.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {userSuggestions.length > 0 ? (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {userSuggestions.map((u) => (
                          <li key={u.uid}>
                            <button type="button" onClick={() => addUserCreator(u)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-left transition-colors">
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                <AvatarRenderer username={u.username} avatarUrl={u.imagen} size={28} className="rounded-full" />
                              </div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{u.nombre || u.username}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (!isSearching && <div className="p-3 text-center text-xs text-gray-400">Presiona <b>Enter</b> para agregarlo como creador externo.</div>)}
                  </div>
                )}
              </div>
              {errors.creadores && <p className="text-xs text-red-500 font-semibold">Debes agregar al menos un creador.</p>}
            </div>

            {/* Descargas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Descargas</label>
                <button
                  type="button"
                  onClick={handleAddDownload}
                  className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + Agregar
                </button>
              </div>
              
              <div className="space-y-2">
                {formData.descargas.map((download, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {/* Selector de preset */}
                    <div className="relative w-36" ref={(el) => versionDropdownRefs.current[index] = el}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdowns(prev => ({
                            ...prev,
                            [`version-${index}`]: !prev[`version-${index}`],
                            tipo: false,
                            visibilidad: false,
                            estado: false
                          }));
                        }}
                        className="w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                      >
                        <span className="truncate block">{download.presetLabel}</span>
                      </button>
                      <ChevronDown size={14} className={clsx("absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns[`version-${index}`] && "rotate-180")} />
                      
                      {openDropdowns[`version-${index}`] && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1">
                          <div className="flex flex-col gap-0.5">
                            {['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.42)', 'API 6 (1.7.41)', 'Personalizado'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  handleDownloadChange(index, 'presetLabel', preset);
                                  setOpenDropdowns(prev => ({ ...prev, [`version-${index}`]: false }));
                                }}
                                className={clsx(
                                  "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                  download.presetLabel === preset
                                    ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label editable (solo si es Personalizado) */}
                    {download.presetLabel === 'Personalizado' && (
                      <input
                        type="text"
                        value={download.label}
                        onChange={(e) => handleDownloadChange(index, 'label', e.target.value)}
                        placeholder="Etiqueta personalizada"
                        className="w-38 px-3 py-2 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                      />
                    )}

                    {/* URL */}
                    <input
                      type="text"
                      value={download.url}
                      onChange={(e) => handleDownloadChange(index, 'url', e.target.value)}
                      placeholder="URL de descarga"
                      className="flex-1 px-4 py-2 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemoveDownload(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tags</label>
              
              {/* Input inline con tags */}
              <div className="p-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#191B1E] flex flex-wrap gap-2 shadow-sm items-center transition-all min-h-[56px] focus-within:ring-2 focus-within:ring-primary-500">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 border border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-bold">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Escribe y presiona Enter..."
                  className="flex-1 bg-transparent outline-none text-sm dark:text-white min-w-[140px] px-2 py-1"
                />
              </div>

              {/* Tags recomendados */}
              <div className="space-y-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Tags recomendados:</span>
                <div className="flex flex-wrap gap-2">
                  {['pvp', 'pve', 'survival', 'adventure', 'creative', 'minigame', 'multiplayer', 'singleplayer'].map((recommendedTag) => (
                    <button
                      key={recommendedTag}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(recommendedTag) && formData.tags.length < 10) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, recommendedTag] }));
                        }
                      }}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        formData.tags.includes(recommendedTag)
                          ? "bg-primary-600 text-white cursor-default"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {recommendedTag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-5 w-full lg:w-[420px] xl:w-[480px] 2xl:w-[520px] flex-shrink-0 bg-white dark:bg-[#1e1e1e] rounded-lg p-2 md:p-4 shadow-sm border border-gray-300 dark:border-transparent">
            {/* Imagen Principal */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Imagen de Portada *</label>
              {formData.imagen && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black">
                  <img src={formData.imagen} alt="Portada" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
              {errors.imagen && <p className="text-xs text-red-500 font-semibold">La imagen es obligatoria.</p>}
              <div className="flex gap-2 items-center">
                <input 
                  type="url" 
                  name="imagen" 
                  value={formData.imagen} 
                  onChange={handleChange} 
                  placeholder="https://i.imgur.com/tu-imagen.png" 
                  className={clsx(
                    "flex-1 px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border rounded-xl outline-none dark:text-white",
                    errors.imagen ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                  )}
                />
              </div>
            </div>

            {/* Galería */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Galería</label>
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + Agregar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {formData.galeria.map((url, index) => (
                  <div key={index} className="relative group w-full">
                    {url ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        {galleryMediaTypes[index] === 'youtube' ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeId(url)}`}
                            title={`Galería ${index}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : galleryMediaTypes[index] === 'video' ? (
                          <video
                            src={url}
                            alt={`Galería ${index}`}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            onError={(e) => {
                              console.error('Error cargando video:', url, e);
                              e.target.style.display = 'none';
                              setGalleryMediaTypes(prev => ({ ...prev, [index]: 'image' }));
                            }}
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Galería ${index}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error cargando imagen:', url, e);
                              e.target.style.display = 'none';
                              // Intentar como video si falla la imagen
                              const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv'];
                              const isVideo = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
                              const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
                              const isYoutube = youtubeRegex.test(url);
                              if (isVideo) {
                                setGalleryMediaTypes(prev => ({ ...prev, [index]: 'video' }));
                              } else if (isYoutube) {
                                setGalleryMediaTypes(prev => ({ ...prev, [index]: 'youtube' }));
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <span className="text-xs text-gray-400">URL vacía</span>
                      </div>
                    )}
                    <div className="mt-2 flex gap-2 w-full">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handleGalleryImageChange(index, e.target.value)}
                        placeholder="URL de imagen, video o YouTube..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo/Categoría */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</label>
              <div className="relative" ref={tipoDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdowns(prev => ({
                      ...prev,
                      tipo: !prev.tipo,
                      visibilidad: false,
                      estado: false
                    }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="truncate block capitalize">{formData.tipo}</span>
                </button>
                <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.tipo && "rotate-180")} />
                
                {openDropdowns.tipo && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1">
                    <div className="flex flex-col gap-0.5">
                      {['mod', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete'].map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: 'tipo', value: tipo } });
                            setOpenDropdowns(prev => ({ ...prev, tipo: false }));
                          }}
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                            formData.tipo === tipo
                              ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visibilidad */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visibilidad</label>
              <div className="relative" ref={visibilidadDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdowns(prev => ({
                      ...prev,
                      visibilidad: !prev.visibilidad,
                      tipo: false,
                      estado: false
                    }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="truncate block capitalize">{formData.visibilidad === 'no-listado' ? 'No listado' : formData.visibilidad}</span>
                </button>
                <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.visibilidad && "rotate-180")} />
                
                {openDropdowns.visibilidad && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1">
                    <div className="flex flex-col gap-0.5">
                      {['publico', 'privado', 'no-listado'].map((vis) => (
                        <button
                          key={vis}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: 'visibilidad', value: vis } });
                            setOpenDropdowns(prev => ({ ...prev, visibilidad: false }));
                          }}
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                            formData.visibilidad === vis
                              ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          {vis === 'no-listado' ? 'No listado' : vis}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estado (solo para admins) */}
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</label>
                <div className="relative" ref={estadoDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdowns(prev => ({
                        ...prev,
                        estado: !prev.estado,
                        tipo: false,
                        visibilidad: false
                      }));
                    }}
                    className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                  >
                    <span className="truncate block capitalize">{formData.estado === 'borrador' ? 'Borrador' : formData.estado === 'revision' ? 'En Revisión' : formData.estado === 'aceptado' ? 'Aceptado' : formData.estado === 'rechazado' ? 'Rechazado' : formData.estado}</span>
                  </button>
                  <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.estado && "rotate-180")} />
                  
                  {openDropdowns.estado && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1">
                      <div className="flex flex-col gap-0.5">
                        {[
                          { val: 'borrador', label: 'Borrador' },
                          { val: 'revision', label: 'En Revisión' },
                          { val: 'aceptado', label: 'Aceptado' },
                          { val: 'rechazado', label: 'Rechazado' }
                        ].map((estado) => (
                          <button
                            key={estado.val}
                            type="button"
                            onClick={() => {
                              handleChange({ target: { name: 'estado', value: estado.val } });
                              setOpenDropdowns(prev => ({ ...prev, estado: false }));
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              formData.estado === estado.val
                                ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            {estado.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditContent;
