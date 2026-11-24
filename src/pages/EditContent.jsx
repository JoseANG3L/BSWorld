import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, Edit, ChevronDown } from 'lucide-react';
import { getContentById, updateContent, getUserPublicProfile, getUserByUsername } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canManageContent } from '../utils/contentPermissions';
import { useToast } from '../hooks/useToast';
import SimpleEditor from "../components/SimpleEditor";
import CreatorsInput from '../components/CreatorsInput';
import TagsInput from '../components/TagsInput';
import DownloadsInput from '../components/DownloadsInput';
import GalleryInput from '../components/GalleryInput';
import PageHeader from '../components/PageHeader';
import { clsx } from 'clsx';
import LoadingSpinner from '../components/LoadingSpinner';

function getEditableValues(form, creators) {
  return {
    titulo: form.titulo.trim(),
    descripcion: form.descripcion,
    tipo: form.tipo,
    imagen: form.imagen.trim(),
    galeria: form.galeria.filter(url => url.trim() !== ''),
    creadores: creators.map(c => ({ nombre: c.nombre, uid: c.uid || null, imagen: c.imagen || null })),
    tags: [...new Set([form.tipo, ...form.tags].filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))],
    descargas: form.descargas.filter(d => d.url.trim()).map(({ presetLabel: _presetLabel, ...download }) => ({
      ...download,
      label: download.label?.trim() || '',
      url: download.url.trim()
    })),
    visibilidad: form.visibilidad,
    estado: form.estado
  };
}

function editableSnapshot(values) {
  // Los contadores y metadatos de descarga no son campos del formulario.
  return JSON.stringify({ ...values, descargas: values.descargas.map(({ label, url }) => [label, url]) });
}

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Refs para dropdowns
  const tipoDropdownRef = useRef(null);
  const visibilidadDropdownRef = useRef(null);
  const estadoDropdownRef = useRef(null);
  const loadedContentRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  
  const [errors, setErrors] = useState({
    titulo: false,
    imagen: false,
    creadores: false
  });

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'complemento',
    imagen: '',
    visibilidad: 'publico',
    estado: 'borrador',
    creado: new Date().toISOString().split('T')[0],
    tags: ['complemento'],
    galeria: [],
    descargas: []
  });

  const [selectedCreators, setSelectedCreators] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const editableValues = getEditableValues(formData, selectedCreators);
  const hasChanges = savedSnapshot !== null && editableSnapshot(editableValues) !== savedSnapshot;
  
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

  // Cargar datos para edición (esperamos a que el perfil tenga rol para no recargar y perder cambios)
  useEffect(() => {
    if (!id || !user?.id || !user?.role) return undefined;

    // La renovación de sesión puede retirar/restaurar el rol temporalmente.
    // No volver a cargar el mismo contenido sobre los cambios sin guardar.
    const loadKey = `${id}:${user.id}`;
    if (loadedContentRef.current === loadKey) return undefined;

    let active = true;

    const loadDataForEdit = async () => {
      try {
        setError(null);
        const data = await getContentById(id, user.id, user.role);
        if (!active) return;

        if (!data) {
          setError('No se encontró el contenido o no tienes permisos para editarlo');
          return;
        }

        // Solo el dueño o un admin pueden editar (el id de la URL no es prueba)
        if (!canManageContent(user, data.aporte)) {
          setError('No tienes permiso para editar este contenido');
          return;
        }

        // Enriquecer creadores
        let creators = [];
        if (data.creadores && Array.isArray(data.creadores)) {
          const enrichedCreators = await Promise.all(data.creadores.map(async (creator) => {
            let profile = null;
            // Si tiene uid, buscar perfil por uid para obtener avatar actualizado
            if (creator.uid) {
              try { profile = await getUserPublicProfile(creator.uid); } catch { /* sin perfil */ }
            }
            // Si no tiene uid pero tiene nombre, buscar por nombre
            else if (creator.nombre) {
              try { profile = await getUserByUsername(creator.nombre); } catch { /* sin perfil */ }
            }
            // Si se encontró perfil, usar sus datos; si no, usar datos existentes
            return profile
              ? { nombre: profile.nombre, imagen: profile.imagen, uid: profile.uid }
              : { nombre: creator.nombre || "Desconocido", imagen: creator.imagen || null, uid: creator.uid || null };
          }));
          if (!active) return;
          creators = enrichedCreators.filter(c => c && c.nombre);
        }

        const initialForm = {
          titulo: data.titulo || '',
          descripcion: data.descripcion || '',
          tipo: data.tipo || 'complemento',
          imagen: data.imagen || '',
          visibilidad: data.visibilidad || 'publico',
          estado: data.estado || data.status || 'borrador',
          creado: data.creado ? new Date(data.creado).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tags: data.tags && Array.isArray(data.tags)
            ? [...new Set(data.tags)] // Remove duplicates
            : [data.tipo || 'complemento'],
          galeria: data.galeria && Array.isArray(data.galeria) ? data.galeria : [],
          descargas: data.descargas && Array.isArray(data.descargas) && data.descargas.length > 0
            ? data.descargas.map(d => {
                const presetLabels = ['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.5+)', 'API 6 (1.6.4+)', 'API 4 (1.4.150+)', 'Personalizado'];
                const label = d.label || d.nombre || '';
                const isPreset = presetLabels.includes(label);
                return {
                  ...d,
                  presetLabel: isPreset ? label : 'Personalizado',
                  label,
                  url: d.url || ''
                };
              })
            : []
        };
        setContent(data);
        setFormData(initialForm);
        setSelectedCreators(creators);
        setSavedSnapshot(editableSnapshot(getEditableValues(initialForm, creators)));
        loadedContentRef.current = loadKey;
      } catch (err) {
        if (!active) return;
        setError('Error al cargar el contenido');
        console.error('Error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDataForEdit();
    return () => { active = false; };
  }, [id, user?.id, user?.role]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo') {
      setFormData(prev => {
        const currentTags = prev.tags.filter(t => !['complemento', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete'].includes(t));
        return { ...prev, [name]: value, tags: [value, ...currentTags] };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDescriptionChange = (htmlContent) => setFormData(prev => ({ ...prev, descripcion: htmlContent }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !hasChanges) return;
    setSaving(true);
    setError(null);
    setErrors({ titulo: false, imagen: false, creadores: false });

    // Defensa en profundidad: revalidar dueño/admin al guardar
    if (!content || !canManageContent(user, content.aporte)) {
      showToast('No tienes permiso para editar este contenido', 'error');
      setSaving(false);
      return;
    }

    // Validaciones
    const hasTituloError = !formData.titulo.trim();
    const hasImagenError = !formData.imagen.trim();
    const hasCreadoresError = selectedCreators.length === 0;

    if (hasTituloError || hasImagenError || hasCreadoresError) {
      setErrors({ titulo: hasTituloError, imagen: hasImagenError, creadores: hasCreadoresError });
      showToast('Asegúrate de haber ingresado un nombre, al menos un creador y la imagen principal.', 'error');
      setSaving(false);
      return;
    }

    try {
      const currentEstado = content?.estado || content?.status || 'borrador';
      let finalEstado;

      if (user.role === 'admin') {
        finalEstado = formData.estado || currentEstado;
      } else if (currentEstado === 'aceptado' || currentEstado === 'published') {
        // Los cambios del dueño se aplican directamente sin sacar el contenido del catálogo.
        finalEstado = 'aceptado';
      } else if (currentEstado === 'borrador' || currentEstado === 'draft') {
        finalEstado = 'borrador';
      } else if (formData.visibilidad === 'privado') {
        finalEstado = 'aceptado';
      } else {
        finalEstado = 'revision';
      }

      const payload = { ...editableValues, estado: finalEstado };
      await updateContent(id, payload);

      setSavedSnapshot(editableSnapshot(payload));
      setContent(prev => ({ ...prev, ...payload }));
      setFormData(prev => prev.estado === formData.estado ? { ...prev, estado: finalEstado } : prev);
      const successMessage = finalEstado === 'revision'
        ? 'Tus cambios se guardaron y quedaron en revisión.'
        : finalEstado === 'borrador'
          ? 'Tu borrador se actualizó correctamente.'
          : 'Cambios guardados correctamente.';
      showToast(successMessage, 'success');
    } catch (err) {
      console.error('Error guardando cambios:', err);
      showToast(err?.message || 'Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!content && !error)) {
    return <LoadingSpinner variant="page" />;
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
    <div className="mx-auto flex w-full max-w-6xl flex-col p-2 md:p-3 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
        {/* Header */}
      <header className="mb-3 md:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Editar Contenido" icon={Edit} gradientClass="from-primary-500 to-primary-600" />
      </header>

      {/* Form */}
      {/* noValidate: los valores heredados (URLs cifradas, rutas relativas) no son
          URLs válidas para el navegador y bloqueaban el guardado sin avisar. */}
      <form onSubmit={handleSubmit} noValidate className="edit-content-form space-y-5 pb-3">
        {/* Grid de dos columnas */}
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
          {/* Columna Izquierda */}
          <div className="w-full space-y-3 md:space-y-4 rounded-xl">
            {/* Título */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Título *</label>
              <input
                type="text"
                name="titulo"
                aria-invalid={errors.titulo}
                value={formData.titulo}
                onChange={handleChange}
                className={clsx(
                  "w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all duration-300 dark:bg-[#1D1F23] dark:text-white",
                  errors.titulo ? "border-red-500" : "border-gray-300 dark:border-transparent"
                )}
                required
              />
              {errors.titulo && <p className="text-xs text-red-500 font-semibold">El título es obligatorio.</p>}
            </div>

            {/* Descripción */}
            <SimpleEditor
              autoGrow
              value={formData.descripcion}
              onChange={handleDescriptionChange}
              placeholder="Describe tu contenido..."
              label="Descripción"
            />

            {/* Creadores */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Créditos *
              </label>
              <CreatorsInput
                creators={selectedCreators}
                onChange={setSelectedCreators}
                error={errors.creadores}
                placeholder="Buscar usuario..."
                withBorder={false}
              />
              {errors.creadores && <p className="text-xs text-red-500 font-semibold">Debes agregar al menos un creador.</p>}
            </div>

            {/* Tags */}
            <TagsInput
              tags={formData.tags}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              fixedTags={[formData.tipo]}
              withBorder={false}
            />

            {/* Descargas */}
            <DownloadsInput
              downloads={formData.descargas}
              onChange={(descargas) => setFormData(prev => ({ ...prev, descargas }))}
              withBorder={false}
            />
          </div>

          {/* Divisor vertical */}
          <div className="hidden lg:block w-px bg-gray-300 dark:bg-gray-700"></div>

          {/* Columna Derecha */}
          <div className="w-full flex-shrink-0 space-y-3 md:space-y-4 rounded-xl lg:w-[390px] xl:w-[440px] 2xl:w-[480px]">
            
            {/* Imagen Principal y Galería Unificadas */}
            <GalleryInput
              showMainImage={true}
              mainImage={formData.imagen}
              onMainImageChange={handleChange}
              mainImageError={errors.imagen}
              gallery={formData.galeria}
              onChange={(galeria) => setFormData(prev => ({ ...prev, galeria }))}
              withBorder={false}
            />
            {errors.imagen && <p className="text-xs text-red-500 font-semibold -mt-3">La imagen es obligatoria.</p>}

            {/* Tipo/Categoría */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</label>
              <div className="relative" ref={tipoDropdownRef}>
                <button
                  type="button"
                  aria-expanded={Boolean(openDropdowns.tipo)}
                  onClick={() => {
                    setOpenDropdowns(prev => ({
                      ...prev,
                      tipo: !prev.tipo,
                      visibilidad: false,
                      estado: false
                    }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="truncate block capitalize">{formData.tipo}</span>
                </button>
                <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.tipo && "rotate-180")} />
                
                {openDropdowns.tipo && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-0 rounded-xl shadow-lg z-50 p-1">
                    <div className="flex flex-col gap-0.5">
                      {['complemento', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete'].map((tipo) => (
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
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visibilidad</label>
              <div className="relative" ref={visibilidadDropdownRef}>
                <button
                  type="button"
                  aria-expanded={Boolean(openDropdowns.visibilidad)}
                  onClick={() => {
                    setOpenDropdowns(prev => ({
                      ...prev,
                      visibilidad: !prev.visibilidad,
                      tipo: false,
                      estado: false
                    }));
                  }}
                  className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="truncate block capitalize">{formData.visibilidad === 'no-listado' ? 'No listado' : formData.visibilidad}</span>
                </button>
                <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.visibilidad && "rotate-180")} />
                
                {openDropdowns.visibilidad && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-0 rounded-xl shadow-lg z-50 p-1">
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
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</label>
                <div className="relative" ref={estadoDropdownRef}>
                  <button
                    type="button"
                    aria-expanded={Boolean(openDropdowns.estado)}
                    onClick={() => {
                      setOpenDropdowns(prev => ({
                        ...prev,
                        estado: !prev.estado,
                        tipo: false,
                        visibilidad: false
                      }));
                    }}
                    className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
                  >
                    <span className="truncate block capitalize">{formData.estado === 'borrador' ? 'Borrador' : formData.estado === 'revision' ? 'En Revisión' : formData.estado === 'aceptado' ? 'Aceptado' : formData.estado === 'rechazado' ? 'Rechazado' : formData.estado}</span>
                  </button>
                  <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.estado && "rotate-180")} />
                  
                  {openDropdowns.estado && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-0 rounded-xl shadow-lg z-50 p-1">
                      <div className="flex flex-col gap-0.5">
                        {[
                          { val: 'borrador', label: 'Borrador' },
                          { val: 'revision', label: 'En Revisión' },
                          { val: 'aceptado_con_edicion', label: 'Aceptado con Edición' },
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

        <div className="sticky bottom-16 z-30 flex items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white p-2 shadow-md dark:border-transparent dark:bg-[#1c1d20] sm:px-3 lg:bottom-6">
          <span className="hidden text-xs font-medium text-gray-500 dark:text-gray-400 sm:block">
            Guarda los cambios para actualizar.
          </span>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-xs font-bold text-white shadow-sm shadow-primary-600/25 transition-all enabled:hover:bg-primary-700 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {saving ? <LoadingSpinner variant="inline" size={14} /> : <Save size={14} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
};

export default EditContent;
