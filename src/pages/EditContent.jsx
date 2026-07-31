import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, AlertTriangle, Plus, Edit, Trash2, Tag, User, X, ChevronDown } from 'lucide-react';
import { getContentById, updateContent, searchUsers, getUserPublicProfile, getUserByUsername } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SimpleEditor from "../components/SimpleEditor";
import AvatarRenderer from '../components/AvatarRenderer';
import CreatorsInput from '../components/CreatorsInput';
import TagsInput from '../components/TagsInput';
import DownloadsInput from '../components/DownloadsInput';
import GalleryInput from '../components/GalleryInput';
import { encryptionService, initializeEncryption } from '../services/encryption';
import { clsx } from 'clsx';

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Refs para dropdowns
  const tipoDropdownRef = useRef(null);
  const visibilidadDropdownRef = useRef(null);
  const estadoDropdownRef = useRef(null);
  
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
    tags: ['mod'],
    galeria: [],
    descargas: [
      { presetLabel: 'API 9 (1.7.44+)', label: 'API 9 (1.7.44+)', url: '' },
      { presetLabel: 'API 8 (1.7.20+)', label: 'API 8 (1.7.20+)', url: '' },
      { presetLabel: 'API 7 (1.7.42)', label: 'API 7 (1.7.42)', url: '' },
      { presetLabel: 'API 6 (1.7.41)', label: 'API 6 (1.7.41)', url: '' },
      { presetLabel: 'API 4 (1.4.150+)', label: 'API 4 (1.4.150+)', url: '' },
      { presetLabel: 'Personalizado', label: 'Mi URL personalizada', url: '' }
    ]
  });

  const [selectedCreators, setSelectedCreators] = useState([]);
  
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
                const presetLabels = ['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.5+)', 'API 6 (1.6.4+)', 'API 4 (1.4.150+)', 'API 4 (1.4.150+)', 'Personalizado'];
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
                { presetLabel: 'API 4 (1.4.150+)', label: 'API 4 (1.4.150+)', url: '' },
                { presetLabel: 'Personalizado', label: 'Mi URL personalizada', url: '' }
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

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo') {
      setFormData(prev => {
        const currentTags = prev.tags.filter(t => !['mod', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete'].includes(t));
        return { ...prev, [name]: value, tags: [value, ...currentTags] };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDescriptionChange = (htmlContent) => setFormData(prev => ({ ...prev, descripcion: htmlContent }));

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
                  "w-full px-4 py-2.5 text-sm bg-white dark:bg-[#191B1E] shadow-sm border rounded-xl outline-none dark:text-white transition-all duration-300",
                  errors.titulo ? "border-red-500" : "border-gray-300 dark:border-gray-700",
                  "focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
              <CreatorsInput
                creators={selectedCreators}
                onChange={setSelectedCreators}
                error={errors.creadores}
                placeholder="Buscar usuario..."
              />
              {errors.creadores && <p className="text-xs text-red-500 font-semibold">Debes agregar al menos un creador.</p>}
            </div>

            {/* Tags */}
            <TagsInput
              tags={formData.tags}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              fixedTags={[formData.tipo]}
            />

            {/* Descargas */}
            <DownloadsInput
              downloads={formData.descargas}
              onChange={(descargas) => setFormData(prev => ({ ...prev, descargas }))}
            />

            
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
            <GalleryInput
              gallery={formData.galeria}
              onChange={(galeria) => setFormData(prev => ({ ...prev, galeria }))}
            />

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
