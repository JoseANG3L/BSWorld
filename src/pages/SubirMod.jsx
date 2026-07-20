import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Save, Plus, Trash2, Image as ImageIcon, Tag, User, Link2, X, 
  ChevronRight, ChevronLeft, Layers, PenTool, Loader2, PlayCircle, 
  ChevronDown, FileText, Upload, Link as LinkIcon, Lock, Globe, X as CloseIcon, Eye
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
import SimpleEditor from "../components/SimpleEditor";
import Modal from '../components/Modal';
import AvatarRenderer from '../components/AvatarRenderer';
import { encryptionService, initializeEncryption } from '../services/encryption';

// --- HELPERS ---
const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
};

const DOWNLOAD_LABELS = ["API 9 (1.7.44+)", "API 8 (1.7.20+)", "API 7 (1.7.5+)", "API 6 (1.6.4+)", "API 4 (1.4.150+)"];
const RECOMMENDED_TAGS = ["api 9", "api 8", "api 7", "api 6", "api 4", "pvp", "texturas", "utilidad"];
const PREDEFINED_NETWORKS = ["YouTube", "Twitter/X", "Discord", "Sitio Web"];

const SubirMod = ({ isOpen, onClose, editId: propEditId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  
  const editId = propEditId || searchParams.get('edit'); 
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [currentTab, setCurrentTab] = useState(0);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);

  // --- CONTROL DE ERRORES VISUALES EN ROJO ---
  const [errors, setErrors] = useState({
    titulo: false,
    imagen: false,
    creadores: false
  });

  // --- MODAL ---
  const [modal, setModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', showCancel: false, confirmText: 'Aceptar', cancelText: 'Cancelar', onConfirm: null, onCancel: null
  });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  // FORMULARIO CENTRALIZADO
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mod',
    imagen: '',
    status: 'published',
    visibilidad: 'public', 
    creado: new Date().toISOString().split('T')[0],
    aporte: user?.id || user?.uid || '', 
    tags: [],
    galeria: [], 
    descargas: [{ nombre: '', url: '' }]
  });

  const [initialFormData, setInitialFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [creatorInput, setCreatorInput] = useState('');
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);

  const tabs = [
    { id: 'basico', label: 'Básico', icon: User },
    { id: 'imagenes', label: 'Imágenes', icon: ImageIcon },
    { id: 'descargas_tags', label: 'Descargas y Tags', icon: Tag },
    { id: 'visibilidad_seccion', label: 'Visibilidad', icon: Eye },
  ];

  const getProgress = () => {
    let score = 0;
    let total = 6;
    if (formData.titulo) score++;
    if (formData.descripcion) score++;
    if (formData.imagen) score++;
    if (formData.tags.length > 0) score++;
    if (formData.descargas.some(d => d.url)) score++;
    if (selectedCreators.length > 0) score++;
    return Math.round((score / total) * 100);
  };

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

  useEffect(() => {
    const loadDataForEdit = async () => {
      if (!isEditing) return;
      try {
        const data = await getContentById(editId);
        if (data) {
          setOriginalStatus(data.status);
          
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

          const newFormData = {
            titulo: data.titulo || '',
            descripcion: data.descripcion || '',
            tipo: data.tipo || 'mod',
            imagen: data.imagen || '',
            aporte: cleanAporteId || user?.id || user?.uid || '', 
            creado: data.creado ? new Date(data.creado).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: data.status || 'published',
            visibilidad: data.visibilidad || 'public', 
            tags: data.tags ? data.tags.filter(t => t !== data.tipo) : [],
            galeria: data.galeria && Array.isArray(data.galeria) ? data.galeria : [], 
            descargas: data.descargas && data.descargas.length > 0 ? data.descargas.map(d => ({ nombre: d.label || '', url: d.url || '' })) : [{ nombre: '', url: '' }],
          };
          
          setFormData(newFormData);
          setInitialFormData(JSON.parse(JSON.stringify(newFormData)));
        } else { alert("No se encontró el contenido"); navigate('/admin'); }
      } catch (error) { console.error(error); } finally { setFetching(false); }
    };
    loadDataForEdit();
  }, [editId, isEditing, navigate, user?.id]);

  useEffect(() => {
    if (!initialFormData) {
      const hasData = formData.titulo || formData.descripcion || formData.imagen || formData.tags.length > 0 || formData.galeria.length > 0 || formData.descargas.some(d => d.url) || selectedCreators.length > 0;
      setHasChanges(hasData);
    } else {
      const formDataChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasChanges(formDataChanged);
    }
  }, [formData, selectedCreators, initialFormData]);

  // Limpiar estados de error individuales dinámicamente cuando el usuario escribe
  useEffect(() => {
    if (formData.titulo) setErrors(prev => ({ ...prev, titulo: false }));
  }, [formData.titulo]);

  useEffect(() => {
    if (formData.imagen) setErrors(prev => ({ ...prev, imagen: false }));
  }, [formData.imagen]);

  useEffect(() => {
    if (selectedCreators.length > 0) setErrors(prev => ({ ...prev, creadores: false }));
  }, [selectedCreators]);

  const handleClose = () => {
    if (hasChanges) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Cambios sin guardar',
        message: 'Tienes modificaciones en el formulario. ¿Qué deseas hacer antes de salir?',
        showCancel: true,
        confirmText: 'Guardar borrador',
        neutralText: 'Cerrar sin guardar',
        cancelText: 'Volver al editor',
        onConfirm: () => {
          closeModal();
          handleSubmitForm('draft');
        },
        onNeutral: () => {
          closeModal();
          if (onClose) onClose();
        },
        onCancel: () => {
          closeModal();
        }
      });
    } else {
      if (onClose) onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => { if (searchRef.current && !searchRef.current.contains(event.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    } else if (formData.tags.length >= 10) { setTagInput(''); }
  };
  const handleRemoveTag = (tagToRemove) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  const addTagDirect = (tag) => { if (!formData.tags.includes(tag.toLowerCase()) && formData.tags.length < 10) { setFormData(prev => ({ ...prev, tags: [...prev.tags, tag.toLowerCase()] })); } };

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

  const handleCreatorSearch = (e) => setCreatorInput(e.target.value);
  const addUserCreator = (user) => { setSelectedCreators([...selectedCreators, user]); setCreatorInput(''); setShowSuggestions(false); };
  const addTextCreator = (e) => {
    if (e.key === 'Enter' && creatorInput.trim()) {
      e.preventDefault();
      setSelectedCreators([...selectedCreators, { nombre: creatorInput.trim(), imagen: null, uid: null }]);
      setCreatorInput(''); setShowSuggestions(false);
    }
    if (e.key === 'Backspace' && !creatorInput && selectedCreators.length > 0) {
      e.preventDefault();
      const lastCreator = selectedCreators[selectedCreators.length - 1];
      setCreatorInput(lastCreator.nombre);
      removeCreator(selectedCreators.length - 1);
    }
  };
  const removeCreator = (index) => { const newCreators = [...selectedCreators]; newCreators.splice(index, 1); setSelectedCreators(newCreators); };

  const handleNextTab = () => { if (currentTab < tabs.length - 1) setCurrentTab(currentTab + 1); };
  const handlePrevTab = () => { if (currentTab > 0) setCurrentTab(currentTab - 1); };

  const handleSubmitForm = async (action) => {
    // Evaluar estado de errores obligatorios
    const hasTituloError = !formData.titulo.trim();
    const hasImagenError = !formData.imagen.trim();
    const hasCreadoresError = selectedCreators.length === 0;

    if (hasTituloError || hasImagenError || hasCreadoresError) {
      setErrors({
        titulo: hasTituloError,
        imagen: hasImagenError,
        creadores: hasCreadoresError
      });

      // Redirigir de forma automática al Tab correspondiente para mostrar la advertencia visual
      if (hasTituloError || hasCreadoresError) {
        setCurrentTab(0);
      } else if (hasImagenError) {
        setCurrentTab(1);
      }

      setModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Faltan datos obligatorios', 
        message: 'Por favor, rellena todos los campos marcados en rojo antes de guardar el mod.' 
      });
      return;
    }
    
    if (!isEncryptionReady || !encryptionKey) {
      setModal({ isOpen: true, type: 'error', title: 'Seguridad', message: 'El sistema de encriptación se está inicializando. Reintente en un segundo.' });
      return;
    }

    setLoading(true);
    try {
      let finalStatus = formData.status;
      if (user.role !== 'admin') {
        if (action === 'draft') finalStatus = 'draft';
        else finalStatus = (originalStatus === 'published' || originalStatus === 'published_editing') ? 'published_editing' : 'pending';
      }

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
        aporte: formData.aporte, 
        creado: new Date(formData.creado).toISOString(),
        status: finalStatus,
        visibilidad: formData.visibilidad
      };

      if (isEditing) await updateContent(editId, payload);
      else await createContent(payload, false);

      setModal({
        isOpen: true, type: 'success', title: '¡Éxito!',
        message: finalStatus === 'published_editing' ? 'Cambios enviados a revisión. La versión anterior seguirá pública.' : `Contenido guardado exitosamente.`,
        onConfirm: () => navigate(user.role === 'admin' ? '/admin' : '/mis-mods')
      });
    } catch (error) { console.error(error); setModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo guardar el mod.' }); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  if (fetching) return <div className="fixed inset-0 bg-white dark:bg-[#1e1e1e] flex items-center justify-center z-[100]"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-[#0d0d0d] flex flex-col z-[100] animate-fade-in">
      
      {/* HEADER FIJO */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1e1e1e] border-b border-gray-300 dark:border-gray-800 px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0", isEditing ? "bg-blue-600" : "bg-primary-600")}>
              {isEditing ? <PenTool size={18} /> : <Layers size={18} />}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white tracking-tight">{isEditing ? "Editar Contenido" : "Subir Mod"}</h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{getProgress()}%</span>
            <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#191B1E] rounded-xl transition-colors">
              <CloseIcon size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* TABS FIJOS */}
        <div className="flex border-b border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 overflow-x-auto scrollbar-none snap-x">
          {tabs.map((tab, index) => (
            <button key={tab.id} type="button" onClick={() => setCurrentTab(index)} className={clsx("flex-1 min-w-[140px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-4 px-2 snap-start transition-all relative outline-none text-xs font-bold", currentTab === index ? "text-primary-600 dark:text-primary-400 bg-white dark:bg-[#1e1e1e]" : "text-gray-400 dark:text-gray-500 hover:text-gray-500")}>
              {currentTab === index && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
              <tab.icon size={14} className="shrink-0" />
              <span className={clsx("text-[10px] sm:text-xs tracking-tight whitespace-nowrap", 
                index === 0 && (errors.titulo || errors.creadores) && "text-red-500 font-extrabold",
                index === 1 && errors.imagen && "text-red-500 font-extrabold"
              )}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={(e) => e.preventDefault()}>
              
              {/* TAB 1: INFORMACIÓN BÁSICA + CRÉDITOS */}
              {currentTab === 0 && (
                <div className="space-y-4 animate-fade-in bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-gray-300 dark:border-gray-700/80 p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="titulo" className={clsx("block text-xs font-bold uppercase tracking-wide", errors.titulo ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>Nombre *</label>
                      <input id="titulo" type="text" name="titulo" value={formData.titulo} onChange={handleChange} required className={clsx("w-full px-3 py-2 h-9 text-xs md:text-sm bg-white dark:bg-[#191B1E]/60 border rounded-xl outline-none transition-all shadow-sm", errors.titulo ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:text-white")} placeholder="Ej: Super Mod Pack" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="tipo" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</label>
                      <div className="relative">
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} className="w-full pl-3 pr-8 py-1.5 h-9 text-xs md:text-sm bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none dark:text-white cursor-pointer appearance-none capitalize shadow-sm">
                          {['mod', 'mapa', 'personaje', 'minijuego', 'modpack', 'paquete'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="relative" ref={searchRef}>
                    <label className={clsx("text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1", errors.creadores ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>Creadores / Créditos *</label>
                    <div className={clsx("py-1 px-1.5 rounded-xl border flex flex-wrap gap-1.5 shadow-sm items-center transition-all duration-200", errors.creadores ? "bg-red-50/20 dark:bg-red-950/10 border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500" : "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500")}>
                      {selectedCreators.map((creator, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-700 pl-1 pr-1.5 py-1 rounded-full shadow-sm max-w-full">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 dark:bg-[#191B1E] flex items-center justify-center shrink-0 border dark:border-gray-600">
                            <AvatarRenderer avatar={creator.imagen} name={creator.nombre} />
                          </div>
                          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200 truncate max-w-[100px]">{creator.nombre}</span>
                          <button type="button" onClick={() => removeCreator(idx)} className="text-gray-400 hover:text-red-500 p-0.5 shrink-0 transition-colors"><X size={10} /></button>
                        </div>
                      ))}
                      <input type="text" value={creatorInput} onChange={handleCreatorSearch} onKeyDown={addTextCreator} placeholder="Buscar creador de la comunidad..." className="flex-1 bg-transparent outline-none text-sm dark:text-white min-w-[120px] p-1" />
                    </div>

                    {showSuggestions && creatorInput.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#252525] rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 z-50 overflow-hidden max-h-40 overflow-y-auto">
                        {userSuggestions.length > 0 ? (
                          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {userSuggestions.map((u) => (
                              <li key={u.uid}>
                                <button type="button" onClick={() => addUserCreator(u)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-left transition-colors">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-[#191B1E] flex items-center justify-center shrink-0 border dark:border-gray-700">
                                    <AvatarRenderer avatar={u.imagen} name={u.nombre} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{u.nombre}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (!isSearching && <div className="p-2.5 text-center text-[11px] text-gray-400 italic">Presiona <b>Enter</b> para agregarlo como creador externo.</div>)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descripción</label>
                    <SimpleEditor value={formData.descripcion} onChange={handleDescriptionChange} />
                  </div>
                </div>
              )}

              {/* TAB 2: IMÁGENES Y GALERÍA */}
              {currentTab === 1 && (
                <div className="space-y-4 animate-fade-in bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-gray-300 dark:border-gray-700/80 p-4 sm:p-5">
                  <div className="space-y-1.5">
                    <label htmlFor="imagen" className={clsx("block text-xs font-bold uppercase tracking-wide", errors.imagen ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>Imagen Principal *</label>
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                      <div className="relative flex-1 w-full">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input id="imagen" type="url" name="imagen" value={formData.imagen} onChange={handleChange} className={clsx("w-full pl-9 pr-4 py-2 h-9 text-xs bg-white dark:bg-[#191B1E]/60 border rounded-xl outline-none font-medium shadow-sm transition-all", errors.imagen ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:text-white")} placeholder="https://i.imgur.com/imagen.png" />
                      </div>
                      {formData.imagen && formData.imagen.length > 10 && (
                        <div className="w-full md:w-36 shrink-0 rounded-xl border border-gray-300 dark:border-gray-800 aspect-video overflow-hidden bg-white dark:bg-gray-900/20 shadow-md animate-fade-in">
                          <img src={formData.imagen} className="w-full h-full object-cover" alt="Vista previa" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 w-full border-t border-gray-300 dark:border-gray-800/60">
                    <div className="flex items-center justify-between pb-1">
                      <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Galería</span>
                      <button type="button" onClick={handleAddGalleryImage} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200/40 dark:border-primary-800/60 rounded-xl text-xs font-bold transition-colors"><Plus size={12} /> Añadir</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {formData.galeria.map((url, index) => {
                        const isYt = getYouTubeId(url);
                        const isVid = isVideo(url);
                        return (
                          <div key={index} className="flex flex-col sm:flex-row gap-2 bg-white/50 dark:bg-gray-900/20 p-2.5 rounded-xl border border-gray-300 dark:border-gray-800 relative shadow-sm">
                            <div className="flex-1 relative self-center">
                              <input aria-label="URL de galería" type="url" value={url} onChange={(e) => handleGalleryImageChange(index, e.target.value)} className="w-full px-3 py-1.5 h-9 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500" placeholder="URL de imagen o video (mp4/YouTube)" />
                            </div>
                            {url && url.length > 10 && (
                              <div className="relative w-full sm:w-20 h-12 rounded-lg bg-gray-100 dark:bg-[#191B1E] overflow-hidden shrink-0 border border-gray-300 dark:border-gray-700 shadow-inner flex items-center justify-center">
                                {(isYt || isVid) && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><PlayCircle size={14} className="text-white" /></div>}
                                <img src={isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100x60?text=Error"; }} />
                              </div>
                            )}
                            <button type="button" onClick={() => handleRemoveGalleryImage(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors self-center"><Trash2 size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                    {formData.galeria.length === 0 && (<div className="text-center py-6 border border-dashed border-gray-300 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 text-xs italic">No has añadido imágenes adicionales todavía.</div>)}
                  </div>
                </div>
              )}

              {/* TAB 3: DESCARGAS Y TAGS */}
              {currentTab === 2 && (
                <div className="space-y-4 animate-fade-in bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-gray-300 dark:border-gray-700/80 p-4 sm:p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                        Descargas
                      </span>
                      <button type="button" onClick={handleAddDownload} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200/40 dark:border-primary-800/60 rounded-xl text-xs font-bold transition-colors"><Plus size={12} /> Añadir</button>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {formData.descargas.map((download, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2 bg-white/50 dark:bg-gray-900/20 p-2.5 rounded-xl border border-gray-300 dark:border-gray-800 relative shadow-sm">
                          <div className="relative w-full sm:w-44 shrink-0">
                            <select value={DOWNLOAD_LABELS.includes(download.nombre) ? download.nombre : 'custom'} onChange={(e) => handleDownloadChange(index, 'nombre', e.target.value === 'custom' ? '' : e.target.value)} className="w-full pl-3 pr-8 py-1.5 h-9 text-xs rounded-lg bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 font-bold cursor-pointer appearance-none dark:text-white outline-none shadow-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                              {DOWNLOAD_LABELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              <option value="custom">Otro</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                          </div>
                          
                          {!DOWNLOAD_LABELS.includes(download.nombre) && (
                            <input aria-label="Nombre del servidor" type="text" value={download.nombre} onChange={(e) => handleDownloadChange(index, 'nombre', e.target.value)} placeholder="Ej: Mediafire" className="w-full sm:flex-1 px-3 h-9 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                          )}
                          
                          <div className="flex-1 relative">
                            <input aria-label="URL de descarga" type="url" value={download.url} onChange={(e) => handleDownloadChange(index, 'url', e.target.value)} placeholder="https://..." required className="w-full px-3 h-9 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:text-white shadow-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                          </div>
                          
                          {formData.descargas.length > 1 && (
                            <button type="button" onClick={() => handleRemoveDownload(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors self-center"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 w-full border-t border-gray-300 dark:border-gray-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                        Etiquetas
                      </span>
                      <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md", formData.tags.length >= 10 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500 dark:bg-[#191B1E]")}>
                        {formData.tags.length} / 10
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">#</span>
                        <input aria-label="Escribe una etiqueta" type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} disabled={formData.tags.length >= 10} className="w-full pl-7 pr-3 py-1.5 h-9 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:opacity-50 shadow-sm" placeholder="skins, pvp... (Enter)" />
                      </div>
                      <button type="button" onClick={handleAddTag} disabled={formData.tags.length >= 10 || !tagInput.trim()} className="px-3 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm flex items-center justify-center shrink-0"><Plus size={14} /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white dark:bg-[#252525] border border-gray-300 dark:border-gray-800 rounded-xl shadow-inner">
                      {formData.tags.length > 0 ? formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 bg-white dark:bg-[#191B1E] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg text-[11px] font-bold shadow-sm">
                          <span className="text-primary-500 font-black">#</span>{tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="p-0.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><X size={11} strokeWidth={2.5} /></button>
                        </span>
                      )) : <span className="text-[10px] text-gray-400 italic px-1 self-center">Ninguna etiqueta añadida...</span>}
                    </div>
                    {formData.tags.length < 10 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {RECOMMENDED_TAGS.map(tag => !formData.tags.includes(tag) && (
                          <button key={tag} type="button" onClick={() => addTagDirect(tag)} className="px-2 py-0.5 rounded-md border border-dashed text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:border-primary-400 bg-white dark:bg-[#191B1E] dark:border-gray-700 transition-colors">+ {tag}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SECCIÓN DE VISIBILIDAD INTERACTIVA POR TARJETAS CON CHECK DE SELECCIÓN */}
              {currentTab === 3 && (
                <div className="animate-fade-in bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-md border border-gray-300 dark:border-gray-700/80 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Ajustes de Publicación
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Selecciona directamente una de las siguientes opciones para configurar el alcance y la privacidad de tu mod en la plataforma:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    
                    {/* Tarjeta Opción: Público */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibilidad: 'public' }))}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 outline-none focus:ring-1 focus:ring-primary-500",
                        formData.visibilidad === 'public' 
                          ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 ring-1 ring-blue-400/30 shadow-sm" 
                          : "bg-white dark:bg-[#181818] border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className={formData.visibilidad === 'public' ? "text-blue-500" : "text-gray-400"} /> 
                          Público
                        </div>
                        {/* Círculo indicador de selección */}
                        <div className={clsx(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                          formData.visibilidad === 'public' ? "border-blue-500 bg-white dark:bg-gray-900" : "border-gray-300 dark:border-gray-600"
                        )}>
                          {formData.visibilidad === 'public' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-scale-up" />}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Cualquier usuario de la plataforma podrá buscar, ver los detalles y descargar el archivo directamente desde el catálogo general.
                      </p>
                    </button>

                    {/* Tarjeta Opción: Privado */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibilidad: 'private' }))}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 outline-none focus:ring-1 focus:ring-primary-500",
                        formData.visibilidad === 'private' 
                          ? "bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 ring-1 ring-red-400/30 shadow-sm" 
                          : "bg-white dark:bg-[#181818] border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <Lock size={14} className={formData.visibilidad === 'private' ? "text-red-500" : "text-gray-400"} /> 
                          Privado
                        </div>
                        {/* Círculo indicador de selección */}
                        <div className={clsx(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                          formData.visibilidad === 'private' ? "border-red-500 bg-white dark:bg-gray-900" : "border-gray-300 dark:border-gray-600"
                        )}>
                          {formData.visibilidad === 'private' && <div className="w-2 h-2 rounded-full bg-red-500 animate-scale-up" />}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Solo tú podrás visualizar este aporte desde tu panel de control de mods. Nadie más en la comunidad tendrá acceso al contenido ni a las descargas.
                      </p>
                    </button>

                    {/* Tarjeta Opción: No Listado */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibilidad: 'unlisted' }))}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 outline-none focus:ring-1 focus:ring-primary-500",
                        formData.visibilidad === 'unlisted' 
                          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 ring-1 ring-amber-400/30 shadow-sm" 
                          : "bg-white dark:bg-[#181818] border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full font-bold text-xs">
                        <div className="flex items-center gap-2">
                          <LinkIcon size={14} className={formData.visibilidad === 'unlisted' ? "text-amber-500" : "text-gray-400"} /> 
                          No listado
                        </div>
                        {/* Círculo indicador de selección */}
                        <div className={clsx(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0",
                          formData.visibilidad === 'unlisted' ? "border-amber-500 bg-white dark:bg-gray-900" : "border-gray-300 dark:border-gray-600"
                        )}>
                          {formData.visibilidad === 'unlisted' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-scale-up" />}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        El mod no aparecerá indexado en el buscador global. Solamente los usuarios a quienes les compartas la URL directa podrán verlo y descargarlo.
                      </p>
                    </button>

                  </div>
                </div>
              )}

          </form>
        </div>
      </div>

      {/* FOOTER FIJO CON BOTONES */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-2 justify-between items-center">
          <button type="button" onClick={handlePrevTab} disabled={currentTab === 0} className={clsx("w-24 py-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-0.5 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed")}>
            <ChevronLeft size={14} /> Atrás
          </button>
          
          <div className="flex gap-2">
            {currentTab < tabs.length - 1 ? (
              <button type="button" onClick={handleNextTab} className="w-24 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-0.5 shadow-sm">
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <>
                {user?.role === 'admin' ? (
                  <button type="button" onClick={() => handleSubmitForm('publish')} disabled={loading || !isEncryptionReady} className="w-24 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Guardar
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => handleSubmitForm('draft')} disabled={loading || !isEncryptionReady} className="w-24 py-2 bg-gray-100 dark:bg-[#191B1E] text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50">
                      <FileText size={14} /> Borrador
                    </button>
                    <button type="button" onClick={() => handleSubmitForm('pending')} disabled={loading || !isEncryptionReady} className="w-24 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Publicar
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        onConfirm={modal.onConfirm} 
        onCancel={modal.onCancel} 
        onNeutral={modal.onNeutral} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
        showCancel={modal.showCancel} 
        confirmText={modal.confirmText} 
        cancelText={modal.cancelText} 
        neutralText={modal.neutralText} 
      />
    </div>
  );
};

export default SubirMod;