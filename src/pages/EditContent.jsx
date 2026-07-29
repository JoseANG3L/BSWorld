import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, AlertTriangle, Plus, Edit, Trash2, Tag, User, X } from 'lucide-react';
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
    descargas: [{ nombre: '', url: '' }]
  });

  const [tagInput, setTagInput] = useState('');
  const [creatorInput, setCreatorInput] = useState('');
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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
            if (creator.uid) { try { profile = await getUserPublicProfile(creator.uid); } catch (err) { } } 
            else if (creator.nombre) { try { profile = await getUserByUsername(creator.nombre); } catch (err) { } }
            return profile ? { nombre: profile.nombre, imagen: profile.imagen, uid: profile.uid } : { nombre: creator.nombre || "Desconocido", imagen: creator.imagen || null, uid: null };
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
          tags: data.tags ? data.tags.filter(t => t !== data.tipo) : [],
          galeria: data.galeria && Array.isArray(data.galeria) ? data.galeria : [],
          descargas: data.descargas && data.descargas.length > 0 ? data.descargas.map(d => ({ nombre: d.label || '', url: d.url || '' })) : [{ nombre: '', url: '' }]
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

  const handleGalleryImageChange = (index, value) => {
    const newGaleria = [...formData.galeria];
    newGaleria[index] = value;
    setFormData(prev => ({ ...prev, galeria: newGaleria }));
  };

  const handleRemoveGalleryImage = (index) => setFormData(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }));

  const handleAddDownload = () => setFormData(prev => ({ ...prev, descargas: [...prev.descargas, { nombre: '', url: '' }] }));

  const handleDownloadChange = (index, field, value) => {
    const newDescargas = [...formData.descargas];
    newDescargas[index][field] = value;
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
            return { label: d.nombre, url: encryptedUrl };
          } catch (error) { return { label: d.nombre, url: d.url }; }
        })
      );

      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        imagen: formData.imagen,
        galeria: formData.galeria.filter(url => url.trim() !== ''),
        redes: [],
        creadores: selectedCreators.map(c => ({ nombre: c.nombre, uid: c.uid || null })),
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
      <div className="flex items-center justify-between gap-4 mb-6">

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
          <div className="w-full space-y-5">
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
                  "p-2 rounded-2xl border flex flex-wrap gap-2 shadow-sm items-center transition-all min-h-[56px]",
                  errors.creadores ? "border-red-500 bg-red-50/10" : "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500"
                )}>
                  {selectedCreators.map((creator, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 pl-1.5 pr-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-300 shrink-0">
                        <AvatarRenderer username={creator.nombre} avatarUrl={creator.imagen} size={20} className="rounded-full" />
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
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Descargas</label>
              <div className="space-y-3">
                {formData.descargas.map((download, index) => (
                  <div key={index} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descarga {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDownload(index)}
                        className="text-xs text-red-500 hover:underline font-semibold"
                      >
                        Eliminar
                      </button>
                    </div>
                    <input
                      type="text"
                      value={download.nombre}
                      onChange={(e) => handleDownloadChange(index, 'nombre', e.target.value)}
                      placeholder="Nombre (ej: API 9)"
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />
                    <input
                      type="text"
                      value={download.url}
                      onChange={(e) => handleDownloadChange(index, 'url', e.target.value)}
                      placeholder="URL de descarga"
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDownload}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  + Agregar Descarga
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-semibold">
                    <Tag size={12} />
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
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Agregar tag..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="lg:min-w-[420px] xl:min-w-[480px] 2xl:min-w-[520px] space-y-5">
            {/* Imagen Principal */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Imagen de Portada *</label>
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
              {formData.imagen && (
                <div className="w-full aspect-video max-h-48 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black">
                  <img src={formData.imagen} alt="Portada" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
              {errors.imagen && <p className="text-xs text-red-500 font-semibold">La imagen es obligatoria.</p>}
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
                  <div key={index} className="relative group">
                    {url ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <img
                          src={url}
                          alt={`Galería ${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <span className="text-xs text-gray-400">URL vacía</span>
                      </div>
                    )}
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleGalleryImageChange(index, e.target.value)}
                      placeholder="URL de imagen..."
                      className="mt-2 w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo/Categoría */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
              >
                <option value="mod">Mod</option>
                <option value="mapa">Mapa</option>
                <option value="personaje">Personaje</option>
                <option value="minijuego">Minijuego</option>
                <option value="modpack">Modpack</option>
                <option value="paquete">Paquete</option>
              </select>
            </div>

            {/* Visibilidad */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visibilidad</label>
              <select
                name="visibilidad"
                value={formData.visibilidad}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
              >
                <option value="publico">Público</option>
                <option value="privado">Privado</option>
                <option value="no-listado">No listado</option>
              </select>
            </div>

            {/* Estado (solo para admins) */}
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                >
                  <option value="borrador">Borrador</option>
                  <option value="revision">En Revisión</option>
                  <option value="aceptado">Aceptado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditContent;
