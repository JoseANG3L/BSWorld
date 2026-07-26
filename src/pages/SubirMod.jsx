import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Save, Plus, Trash2, Image as ImageIcon, Tag, User, Link2, X, 
  ChevronRight, ChevronLeft, Layers, PenTool, Loader2, PlayCircle, 
  ChevronDown, FileText, Upload, Link as LinkIcon, Lock, Globe, Eye,
  Sparkles, Check, Edit3, Gamepad2, Map, Boxes, Package, Wrench, Shield
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
import { createPortal } from 'react-dom';

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

const TIPO_CARDS = [
  { id: 'mod', title: 'Mod General', desc: 'Scripts Python y modificaciones de código', icon: Wrench, color: 'from-blue-500 to-indigo-600' },
  { id: 'mapa', title: 'Mapa Custom', desc: 'Escenarios y terrenos personalizados', icon: Map, color: 'from-emerald-500 to-teal-600' },
  { id: 'personaje', title: 'Personaje / Skin', desc: 'Skins de personajes y apariencias', icon: User, color: 'from-purple-500 to-pink-600' },
  { id: 'minijuego', title: 'Minijuego', desc: 'Modos de juego y reglas personalizadas', icon: Gamepad2, color: 'from-amber-500 to-orange-600' },
  { id: 'modpack', title: 'Modpack', desc: 'Colección masiva de múltiples mods', icon: Boxes, color: 'from-red-500 to-rose-600' },
  { id: 'paquete', title: 'Paquete Texturas', desc: 'Interfaces, audios o texturas HD', icon: Package, color: 'from-cyan-500 to-blue-600' }
];

const SubirMod = ({ isOpen, onClose, editId: propEditId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  
  const editId = propEditId || searchParams.get('edit'); 
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [currentStep, setCurrentStep] = useState(0);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);

  // --- CONTROL DE ERRORES VISUALES EN ROJO ---
  const [errors, setErrors] = useState({
    titulo: false,
    imagen: false,
    creadores: false
  });

  // --- MODAL CONFIRMACIONES ---
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

  const steps = [
    { id: 'titulo', label: '1. Nombre' },
    { id: 'tipo', label: '2. Categoría' },
    { id: 'creadores', label: '3. Creadores' },
    { id: 'descripcion', label: '4. Detalles' },
    { id: 'imagenes', label: '5. Multimedia' },
    { id: 'descargas', label: '6. Archivos' },
    { id: 'visibilidad', label: '7. Privacidad' },
    { id: 'resumen', label: '8. Finalizar' },
  ];

  // Bloqueo estricto del scroll en el cuerpo y documento
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getProgress = () => {
    return Math.round(((currentStep + 1) / steps.length) * 100);
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

  useEffect(() => {
    if (formData.titulo) setErrors(prev => ({ ...prev, titulo: false }));
    if (formData.imagen) setErrors(prev => ({ ...prev, imagen: false }));
    if (selectedCreators.length > 0) setErrors(prev => ({ ...prev, creadores: false }));
  }, [formData.titulo, formData.imagen, selectedCreators]);

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
        onCancel: () => closeModal()
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
  };
  const removeCreator = (index) => { const newCreators = [...selectedCreators]; newCreators.splice(index, 1); setSelectedCreators(newCreators); };

  const handleNextStep = () => {
    if (currentStep === 0 && !formData.titulo.trim()) {
      setErrors(prev => ({ ...prev, titulo: true }));
      return;
    }
    if (currentStep === 2 && selectedCreators.length === 0) {
      setErrors(prev => ({ ...prev, creadores: true }));
      return;
    }
    if (currentStep === 4 && !formData.imagen.trim()) {
      setErrors(prev => ({ ...prev, imagen: true }));
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmitForm = async (action) => {
    const hasTituloError = !formData.titulo.trim();
    const hasImagenError = !formData.imagen.trim();
    const hasCreadoresError = selectedCreators.length === 0;

    if (hasTituloError || hasImagenError || hasCreadoresError) {
      setErrors({ titulo: hasTituloError, imagen: hasImagenError, creadores: hasCreadoresError });
      setModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Campos incompletos', 
        message: 'Asegúrate de haber ingresado un nombre, al menos un creador y la imagen principal.' 
      });
      return;
    }
    
    if (!isEncryptionReady || !encryptionKey) {
      setModal({ isOpen: true, type: 'error', title: 'Seguridad', message: 'Inicializando motor de encriptación. Intenta en un segundo.' });
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
        isOpen: true, type: 'success', title: '¡Publicación enviada!',
        message: finalStatus === 'published_editing' ? 'Cambios enviados a revisión.' : 'Tu contenido se procesó correctamente.',
        onConfirm: () => {
          if (onClose) onClose();
          navigate(user.role === 'admin' ? '/admin' : '/mis-mods');
        }
      });
    } catch (error) { 
      console.error(error); 
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo procesar la solicitud.' }); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  if (fetching) return createPortal(
    <div className="fixed inset-0 bg-white dark:bg-[#1e1e1e] flex items-center justify-center z-[99999]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>,
    document.body
  );

  return createPortal(
    <div className="fixed inset-0 h-screen w-screen bg-white dark:bg-dark-bg flex flex-col z-[99999] overflow-hidden animate-fade-in">
      
      {/* HEADER DINÁMICO PASO A PASO */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 px-4 pt-4 pb-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0", isEditing ? "bg-blue-600" : "bg-primary-600")}>
              {isEditing ? <PenTool size={18} strokeWidth={2.5} /> : <Sparkles size={18} strokeWidth={2.5} />}
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-none">
                {isEditing ? "Editar Publicación" : "Publicar Nuevo Mod"}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paso {currentStep + 1} de {steps.length}: <span className="font-semibold text-primary-600 dark:text-primary-400">{steps[currentStep].label}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${getProgress()}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{getProgress()}%</span>
            </div>
            <button type="button" onClick={handleClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN PASO A PASO */}
        <div className="max-w-4xl mx-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 pt-2 overflow-x-auto scrollbar-none gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
                currentStep === idx 
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800" 
                  : idx < currentStep 
                    ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
                    : "text-gray-400 dark:text-gray-600"
              )}
            >
              {idx < currentStep ? <Check size={12} className="text-green-500 stroke-[3]" /> : <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800 text-[10px] flex items-center justify-center">{idx + 1}</span>}
              <span>{step.label.split('. ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL POR PASO */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto my-auto">
          
          {/* PASO 1: NOMBRE */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center md:text-left mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">¿Cómo se llama tu proyecto?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa un título claro y llamativo para que la comunidad lo identifique rápidamente.</p>
              </div>

              <div className="space-y-2">
                <input 
                  type="text" 
                  name="titulo" 
                  value={formData.titulo} 
                  onChange={handleChange} 
                  autoFocus
                  placeholder="Ej: Super Mod Pack 2026..." 
                  className={clsx(
                    "w-full px-4 py-3.5 text-base md:text-lg bg-white dark:bg-[#191B1E] border rounded-2xl outline-none transition-all shadow-sm font-medium",
                    errors.titulo ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 dark:text-white"
                  )} 
                />
                {errors.titulo && <p className="text-xs text-red-500 font-semibold">El nombre del mod es obligatorio.</p>}
              </div>
            </div>
          )}

          {/* PASO 2: TIPO DE MOD CON TARJETAS INTERACTIVAS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Selecciona el tipo de contenido</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Elige la categoría principal a la que pertenece tu aporte.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPO_CARDS.map((card) => {
                  const IconComp = card.icon;
                  const isSelected = formData.tipo === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: card.id }))}
                      className={clsx(
                        "p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden group",
                        isSelected 
                          ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/50 shadow-md" 
                          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#191B1E] hover:border-gray-300 dark:hover:border-gray-700"
                      )}
                    >
                      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-sm", card.color)}>
                        <IconComp size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{card.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{card.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3: CREADORES */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Créditos y Autores</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Añade a los usuarios que participaron o crearon este mod.</p>
              </div>

              <div className="relative" ref={searchRef}>
                <div className={clsx(
                  "p-2 rounded-2xl border flex flex-wrap gap-2 shadow-sm items-center transition-all min-h-[56px]",
                  errors.creadores ? "border-red-500 bg-red-50/10" : "bg-white dark:bg-[#191B1E] border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500"
                )}>
                  {selectedCreators.map((creator, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 pl-1.5 pr-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-300 shrink-0">
                        <AvatarRenderer avatar={creator.imagen} name={creator.nombre} />
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
                                <AvatarRenderer avatar={u.imagen} name={u.nombre} />
                              </div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{u.nombre}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (!isSearching && <div className="p-3 text-center text-xs text-gray-400">Presiona <b>Enter</b> para agregarlo como creador externo.</div>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: DESCRIPCIÓN */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Descripción e Instrucciones</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detalla las funciones, cómo instalarlo o los créditos extendidos.</p>
              </div>

              <SimpleEditor value={formData.descripcion} onChange={handleDescriptionChange} />
            </div>
          )}

          {/* PASO 5: MULTIMEDIA */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Imagen Principal y Galería</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pega enlaces directos de tus capturas de pantalla o videos demostrativos.</p>
              </div>

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
              </div>

              {/* Galería Adicional */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Imágenes / Videos Adicionales</label>
                  <button type="button" onClick={handleAddGalleryImage} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus size={14} /> Añadir URL</button>
                </div>
                {formData.galeria.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="url" 
                      value={url} 
                      onChange={(e) => handleGalleryImageChange(idx, e.target.value)} 
                      placeholder="URL de imagen o YouTube..." 
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />
                    <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 6: ARCHIVOS Y ETIQUETAS */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Archivos de Descarga y Tags</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configura los enlaces para obtener el contenido y sus etiquetas.</p>
              </div>

              {/* Enlaces de descarga */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Enlaces de Descarga</span>
                  <button type="button" onClick={handleAddDownload} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus size={14} /> Añadir enlace</button>
                </div>

                {formData.descargas.map((d, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-gray-50 dark:bg-[#191B1E] p-3 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <input 
                      type="text" 
                      value={d.nombre} 
                      onChange={(e) => handleDownloadChange(idx, 'nombre', e.target.value)} 
                      placeholder="Etiqueta (Ej: API 9, Mediafire...)" 
                      className="w-full sm:w-1/3 px-3 py-2 text-xs bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />
                    <input 
                      type="url" 
                      value={d.url} 
                      onChange={(e) => handleDownloadChange(idx, 'url', e.target.value)} 
                      placeholder="https://..." 
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#222] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                    />
                    {formData.descargas.length > 1 && (
                      <button type="button" onClick={() => handleRemoveDownload(idx)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Etiquetas</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Escribe un tag y presiona Enter..." 
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white"
                  />
                  <button type="button" onClick={handleAddTag} className="px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold"><Plus size={16} /></button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.tags.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 7: PRIVACIDAD */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Visibilidad del Aporte</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Determina quién podrá acceder a este contenido.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'public', title: 'Público', icon: Globe, desc: 'Visible para toda la comunidad en el catálogo.', color: 'border-blue-500' },
                  { id: 'private', title: 'Privado', icon: Lock, desc: 'Solo tú podrás verlo desde tu panel de control.', color: 'border-red-500' },
                  { id: 'unlisted', title: 'No Listado', icon: LinkIcon, desc: 'Acceso únicamente mediante enlace directo.', color: 'border-amber-500' }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = formData.visibilidad === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibilidad: opt.id }))}
                      className={clsx(
                        "p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 relative",
                        isSelected ? `${opt.color} bg-primary-50/20 dark:bg-primary-950/20 ring-2 ring-primary-500/30` : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#191B1E]"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <IconComp size={16} /> {opt.title}
                        </span>
                        {isSelected && <Check size={16} className="text-primary-600" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 8: RESUMEN Y FINALIZAR (LISTADO DE MODIFICACIONES Y EDICIÓN RÁPIDA) */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Resumen de la Publicación</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revisa la lista de modificaciones y presiona publicar si todo está correcto.</p>
              </div>

              <div className="bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                
                {/* Ítem 1: Título y Categoría */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nombre & Tipo</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{formData.titulo || 'Sin nombre'}</h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-[10px] font-extrabold uppercase">
                      {formData.tipo}
                    </span>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(0)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar nombre">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 2: Creadores */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Creadores</span>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {selectedCreators.map(c => c.nombre).join(', ') || 'Sin creadores asignados'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(2)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar creadores">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 3: Multimedia y Portada */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Multimedia</span>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      Portada: {formData.imagen ? 'Configurada' : 'Falta configurar'} • Galería: {formData.galeria.length} elementos
                    </p>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(4)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar imágen">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 4: Archivos y Etiquetas */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Descargas & Tags</span>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {formData.descargas.filter(d => d.url).length} enlaces directos • {formData.tags.length} etiquetas
                    </p>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(5)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar descargas">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 5: Privacidad */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Visibilidad</span>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 capitalize mt-0.5">
                      {formData.visibilidad}
                    </p>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(6)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar privacidad">
                    <Edit3 size={16} />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER FIJO CON NAVEGACIÓN Y BOTONES DE ACCIÓN */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-3 justify-between items-center">
          <button 
            type="button" 
            onClick={handlePrevStep} 
            disabled={currentStep === 0} 
            className="px-4 py-2 bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <button 
                type="button" 
                onClick={handleNextStep} 
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <>
                {user?.role === 'admin' ? (
                  <button 
                    type="button" 
                    onClick={() => handleSubmitForm('publish')} 
                    disabled={loading || !isEncryptionReady} 
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Publicar Mod
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      onClick={() => handleSubmitForm('draft')} 
                      disabled={loading || !isEncryptionReady} 
                      className="px-4 py-2 bg-gray-100 dark:bg-[#191B1E] text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <FileText size={16} /> Borrador
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleSubmitForm('pending')} 
                      disabled={loading || !isEncryptionReady} 
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Publicar
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
    </div>,
    document.body
  );
};

export default SubirMod;