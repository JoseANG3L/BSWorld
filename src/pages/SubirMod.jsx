import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Save, Plus, Trash2, Image as ImageIcon, Lock, ArrowLeft, LogIn, UserX,
  Link as LinkIcon, Users, Tag, Type, Layers, Calendar, Eye, PenTool, X, Search, Loader2,
  Globe, PlayCircle, Activity, ChevronDown, FileText, Upload
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  createContent, 
  getContentById, 
  updateContent, 
  searchUsers, 
  getUserPublicProfile,
  getUserByUsername
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import SimpleEditor from '../components/SimpleEditor';
import Modal from '../components/Modal';


// --- HELPER 1: DETECTAR YOUTUBE ---
const getYouTubeId = (url) => {
    if (!url) return null;
    // Soporta formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- HELPER 2: DETECTAR VIDEO MP4 LOCAL ---
const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
};

const DOWNLOAD_LABELS = [
  "API 9 (1.7.44+)",
  "API 8 (1.7.20+)",
  "API 7 (1.7.5+)",
  "API 6 (1.6.4+)",
  "API 4 (1.4.150+)"
];
const RECOMMENDED_TAGS = [
  "api 9", "api 8", "api 7", "api 6", "api 4",
];

const SubirMod = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  
  const editId = searchParams.get('edit'); 
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

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

  // ESTADOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mod',
    status: 'published',
    imagen: '',
    aporte: { 
      uid: user?.uid || '', 
      nombre: user?.displayName || user?.username || '', 
      imagen: user?.avatar || user?.photoURL || '' 
    },
    creado: new Date().toISOString().split('T')[0],
  });

  // ESTADOS ESPECÍFICOS (Arrays)
  const [descargas, setDescargas] = useState([    { id: Date.now(), label: '', url: '' }]);
  const [galeriaUrls, setGaleriaUrls] = useState(['']); 
  // NUEVO ESTADO: REDES SOCIALES
  const [redes, setSocialLinks] = useState([{ label: '', url: '' }]);
  
  // ESTADO PARA TAGS (NUEVO)
  const [tagsList, setTagsList] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // ESTADOS CREDITOS
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [creatorInput, setCreatorInput] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // --- CARGAR DATOS PARA EDICIÓN ---
  useEffect(() => {
    const loadDataForEdit = async () => {
      if (!isEditing) return;

      try {
        const data = await getContentById(editId);
        if (data) {
          // --- BLOQUE AVANZADO: Recuperación de Perfiles ---
          if (data.creditos && Array.isArray(data.creditos)) {
             
             const enrichedCreators = await Promise.all(data.creditos.map(async (creator) => {
                let profile = null;

                // CASO 1: Tiene UID (El enlace es fuerte y directo)
                if (creator.uid) {
                   try {
                      profile = await getUserPublicProfile(creator.uid);
                   } catch (err) {
                      console.error("Error buscando por UID:", err);
                   }
                } 
                
                // CASO 2: No tiene UID, intentamos buscar por Nombre (Reparación automática)
                else if (creator.nombre) {
                   try {
                      // Intentamos encontrar al usuario por su nombre actual
                      profile = await getUserByUsername(creator.nombre);
                      if (profile) {
                         console.log(`¡Enlace automático! Se conectó "${creator.nombre}" con UID: ${profile.uid}`);
                      }
                   } catch (err) {
                      console.error("Error buscando por Nombre:", err);
                   }
                }

                // SI ENCONTRAMOS PERFIL (Por UID o por Nombre), lo usamos
                if (profile) {
                   return {
                      nombre: profile.nombre,
                      imagen: profile.imagen,
                      uid: profile.uid // Ahora sí guardaremos el UID para la próxima
                   };
                }

                // SI NO ENCONTRAMOS NADA, mantenemos los datos originales (Usuario externo)
                return {
                   nombre: creator.nombre || "Desconocido",
                   imagen: creator.imagen || null,
                   uid: null
                };
             }));

             // Filtramos nulos y actualizamos el estado
             setSelectedCreators(enrichedCreators.filter(c => c && c.nombre));
          }

          if (data.galeria && Array.isArray(data.galeria)) {
              setGaleriaUrls(data.galeria.length > 0 ? data.galeria : ['']);
          }

          // Cargar Redes Sociales
          if (data.redes && Array.isArray(data.redes) && data.redes.length > 0) {
              setSocialLinks(data.redes);
          }

          // CARGAR TAGS (Si existen, filtramos el tipo para no duplicarlo)
          if (data.tags && Array.isArray(data.tags)) {
             const cleanTags = data.tags.filter(t => t !== data.tipo);
             setTagsList(cleanTags);
          }

          const fechaInput = data.creado 
            ? new Date(data.creado).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];

          setFormData({
            titulo: data.titulo || '',
            descripcion: data.descripcion || '',
            tipo: data.tipo || 'mod',
            imagen: data.imagen || '',
            aporte: data.aporte || formData.aporte,
            creado: fechaInput,
            status: data.status || 'published'
          });

          if (data.descargas && data.descargas.length > 0) {
            setDescargas(data.descargas);
          }
        } else {
          alert("No se encontró el contenido a editar");
          navigate('/admin'); 
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };

    loadDataForEdit();
  }, [editId, isEditing, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el buscador está abierto y el clic fue fuera del contenedor referenciado
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDescriptionChange = (newValue) => {
    setFormData({ ...formData, descripcion: newValue });
  };

  // --- MANEJADORES GENERALES ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- MANEJADORES DE TAGS (NUEVO) ---
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      // Validar que no esté vacío y no esté duplicado
      if (newTag && !tagsList.includes(newTag)) {
        setTagsList([...tagsList, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (index) => {
    const newTags = tagsList.filter((_, i) => i !== index);
    setTagsList(newTags);
  };

  // --- MANEJADORES DE GALERÍA ---
  const handleGaleriaChange = (index, value) => {
      const newGaleria = [...galeriaUrls];
      newGaleria[index] = value;
      setGaleriaUrls(newGaleria);
  };

  const addGaleriaField = () => {
      setGaleriaUrls([...galeriaUrls, '']);
  };

  const removeGaleriaField = (index) => {
      const newGaleria = galeriaUrls.filter((_, i) => i !== index);
      setGaleriaUrls(newGaleria);
  };

  // --- MANEJADORES DE REDES SOCIALES ---
  const handleSocialChange = (index, field, value) => {
    const newLinks = [...redes];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const addSocialField = () => {
    setSocialLinks([...redes, { label: '', url: '' }]);
  };

  const removeSocialField = (index) => {
    const newLinks = redes.filter((_, i) => i !== index);
    setSocialLinks(newLinks);
  };

  const addTagDirect = (tag) => {
    if (!tagsList.includes(tag)) {
      setTagsList([...tagsList, tag]);
    }
  };

  // --- MANEJADORES DE DESCARGAS ---
  const handleDownloadChange = (index, field, value) => {
    const newDescargas = [...descargas];
    newDescargas[index][field] = value;
    setDescargas(newDescargas);
  };

  const addDownloadField = () => {
    setDescargas([...descargas, { id: Date.now(), label: '', url: '' }]);
  };

  const removeDownloadField = (index) => {
    const newDescargas = descargas.filter((_, i) => i !== index);
    setDescargas(newDescargas);
  };

  // --- LÓGICA DE BÚSQUEDA DE CREDITOS ---
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
        const filtered = results.filter(u => !selectedCreators.some(sel => sel.uid === u.uid));
        setUserSuggestions(filtered);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [creatorInput, selectedCreators]);

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

  // --- PREPARAR PREVIEW ---
  const getPreviewTags = () => {
    // Unimos el tipo seleccionado con los tags de la lista
    return [formData.tipo, ...tagsList];
  };

  // --- GUARDAR CONTENIDO ---
  const handleSave = async (action) => {
    
    if (action === 'pending' && (!formData.titulo || !formData.imagen)) {
        setModal({ isOpen: true, type: 'error', title: 'Faltan datos', message: 'El título y la imagen principal son obligatorios para publicar.' });
        return;
    }
    if (action in ['draft', 'published'] && !formData.titulo) {
        setModal({ isOpen: true, type: 'error', title: 'Faltan datos', message: 'El título es obligatorio para guardar el borrador.' });
        return;
    }

    setLoading(true);

    try {
      // 1. Determinar Status Final
      let finalStatus = 'pending';
      
      if (action === 'draft') {
        finalStatus = 'draft';
      } else {
        // Si es publicar:
        if (user.role === 'admin') {
            // Admin puede elegir (usamos el del form si existe, o active por defecto)
            finalStatus = formData.status === 'draft' ? 'published' : formData.status;
        } else {
            // Usuario normal siempre pasa a revisión
            finalStatus = 'pending';
        }
      }

      // 2. Construir Payload
      const creditosParaGuardar = selectedCreators.map(c => ({ nombre: c.nombre, uid: c.uid || null }));
      const nombresBusqueda = selectedCreators.map(c => c.nombre);
      const finalTags = [formData.tipo, ...tagsList];
      const finalGaleria = galeriaUrls.filter(url => url.trim() !== '');
      const finalRedes = redes.filter(link => link.url.trim() !== '');

      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        imagen: formData.imagen,
        galeria: finalGaleria,
        redes: finalRedes,
        creditos: creditosParaGuardar,
        nombresBusqueda: nombresBusqueda,
        tags: finalTags,
        descargas: descargas.filter(d => d.url !== ''),
        aporte: formData.aporte,
        creado: new Date(formData.creado).toISOString(),
        status: finalStatus
      };

      if (isEditing) {
        await updateContent(editId, payload);
        setModal({
            isOpen: true, type: 'success', title: '¡Actualizado!', message: `Contenido guardado correctamente como: ${finalStatus === 'draft' ? 'Borrador' : (finalStatus === 'active' ? 'Publicado' : 'Pendiente')}`,
            onConfirm: () => navigate(user.role === 'admin' ? '/admin' : '/mis-mods')
        });
      } else {
        await createContent(payload, false); // false para respetar el status que calculamos aquí
        setModal({
            isOpen: true, type: 'success', title: '¡Creado!', message: `Contenido ${finalStatus === 'draft' ? 'guardado como borrador' : 'enviado exitosamente'}.`,
            onConfirm: () => {
                if(action === 'draft') navigate('/mis-mods'); 
                else navigate('/mis-mods');
            }
        });
      }

    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo guardar. Verifica tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="h-full flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;
  // --- PROTECCIÓN DE RUTA ---
  // Si está intentando editar Y ya terminó de cargar la auth Y no hay usuario:
  if (isEditing && !fetching && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-fade-in-up">
        
        {/* Icono de Candado con fondo */}
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6 shadow-lg shadow-red-500/10 border border-red-100 dark:border-red-900/30">
          <Lock size={48} className="text-red-500 dark:text-red-400" />
        </div>

        {/* Títulos */}
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
          Acceso Restringido
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-lg">
          Para editar este contenido necesitas verificar tu identidad. Por favor, inicia sesión con tu cuenta de administrador o creador.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} /> Volver
          </button>
          
          <button 
            onClick={() => navigate('/login', { state: { from: `/subir?edit=${editId}` } })}
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Iniciar Sesión
          </button>
        </div>

      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up">
      
      <button onClick={() => navigate(-1)} className="mb-4 md:mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
        <ArrowLeft size={20} /> Volver al listado
      </button>

      <div className="flex items-center gap-3 mb-4 md:mb-8">
        <div className={clsx("p-3 rounded-xl text-white", isEditing ? "bg-blue-600" : "bg-primary-600")}>
          {isEditing ? <PenTool size={24} /> : <Layers size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? "Editar Contenido" : "Panel de Carga"}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{isEditing ? `Editando ID: ${editId}` : "Comparte contenido nuevo."}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* --- FORMULARIO --- */}
        <div className="lg:col-span-2 flex flex-col gap-3 md:gap-5">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 md:gap-5">
            
            {/* SECCIÓN 1: INFO GENERAL */}
            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 ps-0.5 pb-3 md:pb-4 border-b border-gray-300 dark:border-gray-700">
                <Layers size={20} className="text-primary-600 dark:text-primary-300" /> Información General
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* ... (Campos anteriores: Título, Descripción, Tipo, Fecha, Imagen, Créditos, Tags) ... */}
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Ej: Super Mod" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" />
                  </div>
                </div>

                {/* Descripción */}
                {/* <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} placeholder="Descripción detallada..." rows={6} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white resize-y" />
                </div> */}
                {/* Descripción con Editor Simple */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>

                  <SimpleEditor 
                    value={formData.descripcion} 
                    onChange={handleDescriptionChange} 
                    placeholder="Describe tu mod aquí. Usa los botones para listas y negritas."
                  />
                </div>

                {/* Tipo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white">
                    <option value="mapa">Mapa</option>
                    <option value="minijuego">Minijuego</option>
                    <option value="modpack">Modpack</option>
                    <option value="mod">Mod</option>
                    <option value="paquete">Paquete</option>
                    <option value="personaje">Personaje</option>
                  </select>
                </div>

                {/* Imagen */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Imagen Principal (Portada)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="url" name="imagen" value={formData.imagen} onChange={handleChange} placeholder="https://imgur.com/..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" />
                  </div>
                </div>

                {/* Creditos */}
                <div className="md:col-span-2 relative" ref={searchRef}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Créditos</label>
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 transition-all flex flex-wrap gap-2 min-h-[50px]">
                    {selectedCreators.map((creator, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 pl-1 pr-2 py-1 rounded-full shadow-sm animate-fade-in-up">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                           {creator.imagen ? <img src={creator.imagen} alt={creator.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-xs font-bold">{creator.nombre.charAt(0).toUpperCase()}</div>}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{creator.nombre}</span>
                        <button type="button" onClick={() => removeCreator(idx)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                    <div className="relative flex-1 min-w-[120px]">
                       <input type="text" value={creatorInput} onChange={handleCreatorSearch} onKeyDown={addTextCreator} placeholder={selectedCreators.length === 0 ? "Buscar usuario..." : "Agregar otro..."} className="w-full h-full bg-transparent outline-none text-sm dark:text-white py-1" />
                       {isSearching && <div className="absolute right-2 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-gray-400" size={14} /></div>}
                    </div>
                  </div>
                  {/* LÓGICA DE DROPDOWN MEJORADA */}
                  {showSuggestions && creatorInput.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#252525] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-up">
                      
                      {/* CASO A: HAY RESULTADOS */}
                      {userSuggestions.length > 0 ? (
                        <ul>
                          {userSuggestions.map((user) => (
                            <li key={user.uid}>
                              <button 
                                type="button" 
                                onClick={() => addUserCreator(user)} 
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-300 dark:border-gray-600 shrink-0">
                                    {user.imagen ? (
                                      <img src={user.imagen} alt={user.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                                        {user.nombre.charAt(0)}
                                      </div>
                                    )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800 dark:text-white">{user.nombre}</p>
                                  <p className="text-[10px] text-gray-400">Usuario registrado</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        /* CASO B: NO HAY RESULTADOS (Y NO ESTÁ CARGANDO) */
                        !isSearching && (
                          <div className="px-3 py-4 text-center flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-2">
                              <UserX size={20} />
                            </div>
                            <p className="text-sm font-medium">No encontramos a "{creatorInput}"</p>
                            <p className="text-xs mt-1 text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md">
                              Presiona Enter para agregarlo como texto
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* --- SECCIÓN TAGS ACTUALIZADA --- */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Etiquetas (Tags)</label>
                  
                  {/* Input y Tags Seleccionados */}
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 transition-all flex flex-wrap gap-2 min-h-[50px]">
                    {tagsList.map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-full animate-fade-in-up">
                        <Tag size={12} className="text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">{tag}</span>
                        <button type="button" onClick={() => removeTag(idx)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tagsList.length === 0 ? "Ej: Aventura, PvP (Presiona Enter)" : "Agregar otro..."}
                      className="flex-1 bg-transparent outline-none text-sm dark:text-white py-1 min-w-[150px]"
                    />
                  </div>

                  {/* Instrucciones y Sugerencias */}
                  <div className="flex flex-col gap-2 mt-2">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Type size={10} /> Escribe una palabra y presiona <b>Enter</b> para agregarla.
                      </p>

                      {/* --- TAGS RECOMENDADOS --- */}
                      <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mr-1">Sugeridos:</span>
                          {RECOMMENDED_TAGS.map((tag) => {
                              // Solo mostrar si no está seleccionado ya
                              if (tagsList.includes(tag)) return null;
                              
                              return (
                                  <button
                                      key={tag}
                                      type="button"
                                      onClick={() => addTagDirect(tag)}
                                      className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                  >
                                      {tag}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                </div>

                {/* --- ESTADO (SOLO VISIBLE PARA ADMINS) --- */}
                {user?.role === 'admin' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Estado de Publicación
                    </label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white">
                      <option value="published">Publicado</option>
                      <option value="pending">Pendiente</option>
                      <option value="rejected">Rechazado</option>
                      <option value="draft">Borrador</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                )}

              </div>
            </div>

            {/* SECCIÓN 2: GALERÍA */}
            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><ImageIcon size={20} className="text-primary-300" /> Galería</h3>
                    <button type="button" onClick={addGaleriaField} className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-500 transition-colors">
                      <Plus size={16} /> Agregar Imagen
                    </button>
                </div>
                
                <div className="flex flex-col gap-3">
                    {galeriaUrls.map((url, index) => {
                        // Lógica de detección para la vista previa del input
                        const isYt = getYouTubeId(url);
                        const isVid = isVideo(url);
                        const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : url;

                        return (
                            <div key={index} className="flex flex-wrap flex-column md:flex-row gap-2 md:gap-3 items-center animate-fade-in-up">
                                <div className="flex-1 relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input 
                                        type="url" 
                                        placeholder="URL de imagen o video (mp4/youtube)" 
                                        value={url} 
                                        onChange={(e) => handleGaleriaChange(index, e.target.value)} 
                                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:border-primary-500 focus:ring-2 dark:focus:ring-primary-500 dark:text-white text-sm" 
                                    />
                                </div>
                                
                                {/* Vista previa miniatura al lado del input */}
                                {url && url.length > 10 && (
                                    <div className="relative w-12 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-300 dark:border-gray-600 group">
                                        
                                        {/* Icono de Play si es video */}
                                        {(isYt || isVid) && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                                                <PlayCircle size={16} className="text-white drop-shadow-md" />
                                            </div>
                                        )}

                                        <img 
                                            src={thumbSrc} 
                                            alt="preview" 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                // Si falla la carga, ocultamos el contenedor
                                                e.target.style.display='none'; 
                                                e.target.parentElement.style.display='none'; 
                                            }} 
                                        />
                                    </div>
                                )}

                                {galeriaUrls.length > 1 && (
                                    <button type="button" onClick={() => removeGaleriaField(index)} className="p-2 w-full md:w-auto flex justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-800 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <p className="text-xs text-gray-400 italic mt-1">Soporta enlaces directos a imágenes, videos .mp4 y videos de YouTube.</p>
                </div>
            </div>

            {/* SECCIÓN 3: CONOCE MÁS / REDES SOCIALES (NUEVA) */}
            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Globe size={20} className="text-blue-500" /> Redes Sociales</h3>
                    <button type="button" onClick={addSocialField} className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-500 transition-colors">
                      <Plus size={16} /> Agregar Red
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    {redes.map((item, index) => (
                        <div key={index} className="flex flex-wrap flex-column md:flex-row gap-2 md:gap-3 items-end animate-fade-in-up">
                            <div className="w-full md:flex-1">
                                <label className="text-xs text-gray-500 mb-1 block">Plataforma/Texto</label>
                                <input type="text" placeholder="Ej: Discord, Mi Web" value={item.label} onChange={(e) => handleSocialChange(index, 'label', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 dark:text-white text-sm" />
                            </div>
                            <div className="w-full md:flex-[2]">
                                <label className="text-xs text-gray-500 mb-1 block">URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input type="url" placeholder="https://..." value={item.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 dark:text-white text-sm" />
                                </div>
                            </div>
                            {redes.length > 1 && <button type="button" onClick={() => removeSocialField(index)} className="p-2 w-full md:w-auto flex justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-800 text-sm transition-colors mb-[1px]"><Trash2 size={18} /></button>}
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 4: DESCARGAS */}
            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-5 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><LinkIcon size={20} className="text-primary-300" /> Descargas</h3>
                    <button type="button" onClick={addDownloadField} className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-500 transition-colors">
                        <Plus size={16} /> Agregar Descarga
                    </button>
                </div>
                
                <div className="flex flex-col gap-4">
                    {descargas.map((item, index) => {
                        // Verificamos si la etiqueta actual está en la lista de presets
                        const isCustom = !DOWNLOAD_LABELS.includes(item.label) && item.label !== '';

                        return (
                            <div key={index} className="flex flex-wrap flex-column md:flex-row gap-2 md:gap-3 items-start animate-fade-in-up">
                                
                                {/* COLUMNA ETIQUETA (Select + Input) */}
                                <div className="w-full md:flex-1 flex flex-col gap-2">
                                    <label className="text-xs text-gray-500 font-bold ml-1">Etiqueta / Versión</label>
                                    
                                    {/* 1. SELECTOR */}
                                    <div className="relative">
                                        <select 
                                            value={DOWNLOAD_LABELS.includes(item.label) ? item.label : 'custom'} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Si elige 'custom', limpiamos el label para que escriba. 
                                                // Si elige un preset, lo asignamos directo.
                                                handleDownloadChange(index, 'label', val === 'custom' ? '' : val);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm appearance-none cursor-pointer font-medium"
                                        >
                                            <option value="" hidden disabled>Seleccionar etiqueta...</option>
                                            {DOWNLOAD_LABELS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                            <option value="custom">Otro / Manual...</option>
                                        </select>
                                        
                                        {/* Icono flecha para el select */}
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>

                                    {/* 2. INPUT MANUAL (Solo si elige 'Otro') */}
                                    {(!DOWNLOAD_LABELS.includes(item.label)) && (
                                        <input 
                                            type="text" 
                                            placeholder="Escribe la etiqueta (Ej: Mediafire)" 
                                            value={item.label} 
                                            onChange={(e) => handleDownloadChange(index, 'label', e.target.value)} 
                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm animate-fade-in" 
                                             // Enfocar automáticamente al seleccionar 'Otro'
                                        />
                                    )}
                                </div>

                                {/* COLUMNA URL */}
                                <div className="w-full md:flex-[2] flex flex-col gap-2">
                                    <label className="text-xs text-gray-500 font-bold ml-1">Enlace (URL)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            type="url" 
                                            placeholder="https://..." 
                                            value={item.url} 
                                            onChange={(e) => handleDownloadChange(index, 'url', e.target.value)} 
                                            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm" 
                                        />
                                    </div>
                                </div>

                                {/* BOTÓN ELIMINAR */}
                                {descargas.length > 1 && (
                                    <div className="mt-0 md:mt-6 w-full md:w-auto"> {/* Margen para alinear con los inputs */}
                                        <button 
                                            type="button" 
                                            onClick={() => removeDownloadField(index)} 
                                            className="w-full md:w-auto flex justify-center p-2.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-800 transition-colors"
                                            title="Quitar opción"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- ZONA DE ACCIONES (2 BOTONES) --- */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              
              {user?.role === 'admin' ? (
                // --- BOTONES PARA ADMIN (Solo uno principal) ---
                <button 
                  type="button" 
                  onClick={() => handleSave('publish')}
                  disabled={loading}
                  className="w-full py-3 md:py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin"/> : <Save size={20} />}
                  Guardar Contenido
                </button>
              ) : (
                // --- BOTONES PARA USUARIOS NORMALES ---
                <>
                  <button 
                    type="button" 
                    onClick={() => handleSave('draft')}
                    disabled={loading}
                    className="flex-1 py-3 md:py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin"/> : <FileText size={20} />}
                    Guardar Borrador
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleSave('pending')}
                    disabled={loading}
                    className="flex-[2] py-3 md:py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin"/> : <Upload size={20} />}
                    Enviar para Revisión
                  </button>
                </>
              )}
            </div>

          </form>
        </div>

        {/* --- PREVIEW --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Eye size={18} /><h3 className="font-bold text-sm uppercase tracking-wider">Vista Previa</h3></div>
            <Card
              imagen={formData.imagen || "/default.jpg"}
              titulo={formData.titulo || "Título del Contenido"}
              descargas={descargas}
              creditos={selectedCreators}
              tags={getPreviewTags()}
              aporte={formData.aporte}
              isPreview={true}
              key={JSON.stringify(selectedCreators)}
            />
            
            {galeriaUrls.some(u => u.length > 10) && (
                <div className="bg-white dark:bg-[#1e1e1e] p-3 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Multimedia ({galeriaUrls.filter(u=>u.length>5).length})</p>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
                        {galeriaUrls.filter(u => u.length > 10).map((media, index) => {
                            const isYt = getYouTubeId(media);
                            const isVid = isVideo(media);
                            const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : media;

                            return (
                                <div key={index} className="relative h-16 w-28 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 snap-start group/thumb">
                                    {(isYt || isVid) && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                                            <PlayCircle size={24} className="text-white drop-shadow-md opacity-80" />
                                        </div>
                                    )}
                                    <img 
                                        src={thumbSrc} 
                                        alt={`Preview ${index}`} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {e.target.style.display='none';}} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={clsx("p-4 border rounded-xl text-xs", isEditing ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700/30 text-blue-800 dark:text-blue-200" : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700/30 text-yellow-800 dark:text-yellow-200")}><p><strong>{isEditing ? "Modo Edición" : "Nota"}:</strong> {isEditing ? " Estás modificando un contenido existente." : " Así se verá la tarjeta."}</p></div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default SubirMod;