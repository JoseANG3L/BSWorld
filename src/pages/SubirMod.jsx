import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Plus, Trash2, Image as ImageIcon, Tag, User, CheckCircle, X, 
  ChevronRight, ChevronLeft, AlertTriangle, Loader2, PlayCircle, 
  ChevronDown, FileText, Upload, Link as LinkIcon, Lock, Globe, Eye,
  Sparkles, Check, Gamepad2, Map, Boxes, Package, Wrench, Edit3
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  createContent
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import SimpleEditor from "../components/SimpleEditor";
import AvatarRenderer from '../components/AvatarRenderer';
import CreatorsInput from '../components/CreatorsInput';
import TagsInput from '../components/TagsInput';
import DownloadsInput from '../components/DownloadsInput';
import GalleryInput from '../components/GalleryInput';
import { encryptionService, initializeEncryption } from '../services/encryption';
import { createPortal } from 'react-dom';

const DOWNLOAD_LABELS = ["API 9 (1.7.44+)", "API 8 (1.7.20+)", "API 7 (1.7.5+)", "API 6 (1.6.4+)", "API 4 (1.4.150+)"];
const RECOMMENDED_TAGS = ["api 9", "api 8", "api 7", "api 6", "api 4", "pvp", "texturas", "utilidad"];

const TIPO_CARDS = [
  { id: 'mod', title: 'Complemento', desc: 'Scripts Python y modificaciones de código', icon: Wrench, color: 'from-blue-500 to-indigo-600' },
  { id: 'mapa', title: 'Mapa', desc: 'Escenarios y terrenos personalizados', icon: Map, color: 'from-emerald-500 to-teal-600' },
  { id: 'minijuego', title: 'Minijuego', desc: 'Modos de juego y nuevas reglas', icon: Gamepad2, color: 'from-amber-500 to-orange-600' },
  { id: 'modpack', title: 'Modpack', desc: 'Juego completo personalizado', icon: Boxes, color: 'from-red-500 to-rose-600' },
  { id: 'paquete', title: 'Paquete', desc: 'Colección masiva de múltiples mods', icon: Package, color: 'from-cyan-500 to-blue-600' },
  { id: 'personaje', title: 'Personaje', desc: 'Skins de personajes y apariencias', icon: User, color: 'from-purple-500 to-pink-600' },
];

const SubirMod = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const pasosDropdownRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
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
    isOpen: false, type: 'success', title: '', message: '', showCancel: false, confirmText: 'Aceptar', cancelText: 'Cancelar', neutralText: '', onConfirm: null, onCancel: null, onNeutral: null, secondaryText: '', onSecondary: null
  });
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));
  const [createdContentId, setCreatedContentId] = useState(null);

  // FORMULARIO CENTRALIZADO
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mod',
    imagen: '',
    estado: 'borrador',
    visibilidad: 'publico',
    creado: new Date().toISOString().split('T')[0],
    aporte: user?.id || '', 
    tags: [],
    galeria: [], 
    descargas: [{ nombre: '', url: '' }]
  });

  const [initialFormData, setInitialFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [imagenUrlError, setImagenUrlError] = useState(false);

  const [openDropdowns, setOpenDropdowns] = useState({});

  // Cierre de dropdowns al dar clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pasosDropdownRef.current && !pasosDropdownRef.current.contains(event.target)) {
        setOpenDropdowns(prev => ({ ...prev, pasos: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isValidUrl = (url) => {
    if (!url) return true; // URLs vacías son válidas (opcional)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const canNavigateToStep = (targetStep) => {
    if (targetStep > 0 && !formData.titulo.trim()) return false;
    if (targetStep > 2 && selectedCreators.length === 0) return false;
    if (targetStep > 4 && !formData.imagen.trim()) return false;
    return true;
  };

  const handleStepClick = (index) => {
    if (index > 0 && !formData.titulo.trim()) {
      setErrors(prev => ({ ...prev, titulo: true }));
      setOpenDropdowns(prev => ({ ...prev, pasos: false }));
      return;
    }
    if (index > 2 && selectedCreators.length === 0) {
      setErrors(prev => ({ ...prev, creadores: true }));
      setOpenDropdowns(prev => ({ ...prev, pasos: false }));
      return;
    }
    if (index > 4 && !formData.imagen.trim()) {
      setErrors(prev => ({ ...prev, imagen: true }));
      setOpenDropdowns(prev => ({ ...prev, pasos: false }));
      return;
    }
    setCurrentStep(index);
    setOpenDropdowns(prev => ({ ...prev, pasos: false }));
  };

  const steps = [
    { id: 'titulo', label: 'Nombre', icon: FileText },
    { id: 'tipo', label: 'Categoría', icon: Gamepad2 },
    { id: 'creadores', label: 'Creadores', icon: User },
    { id: 'descripcion', label: 'Detalles', icon: Edit3 },
    { id: 'imagenes', label: 'Multimedia', icon: ImageIcon },
    { id: 'descargas', label: 'Archivos', icon: Upload },
    { id: 'visibilidad', label: 'Privacidad', icon: Globe },
    { id: 'resumen', label: 'Finalizar', icon: CheckCircle },
  ];

  const CurrentStepIcon = steps[currentStep].icon;
  
  // Bloqueo estricto del scroll en el cuerpo y documento
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      // Reiniciar formulario al cerrar
      setCurrentStep(0);
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'mod',
        imagen: '',
        estado: 'borrador',
        visibilidad: 'publico',
        creado: new Date().toISOString().split('T')[0],
        aporte: user?.id || '',
        tags: [],
        galeria: [],
        descargas: [{ nombre: '', url: '' }]
      });
      setInitialFormData(null);
      setHasChanges(false);
      setSelectedCreators([]);
      setErrors({ titulo: false, imagen: false, creadores: false });
      setCreatedContentId(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen, user?.id, user?.uid]);

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
    const hasData = formData.titulo || formData.descripcion || formData.imagen || formData.tags.length > 0 || formData.galeria.length > 0 || formData.descargas.some(d => d.url) || selectedCreators.length > 0;
    setHasChanges(hasData);
  }, [formData, selectedCreators]);

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
        message: 'Tienes modificaciones pendientes. ¿Qué deseas hacer antes de salir?',
        showCancel: true,
        confirmText: 'Guardar como borrador y salir',
        neutralText: 'Salir sin guardar',
        cancelText: 'Cancelar',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar URL de imagen
    if (name === 'imagen') {
      setImagenUrlError(!isValidUrl(value));
    }
  };

  const handleDescriptionChange = (value) => setFormData(prev => ({ ...prev, descripcion: value }));

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
      let finalEstado;
      
      if (user.role === 'admin') {
        // Admin puede establecer el estado directamente
        if (action === 'draft') finalEstado = 'borrador';
        else if (action === 'publish') finalEstado = 'aceptado';
        else finalEstado = formData.estado || 'revision';
      } else {
        // Usuarios no admin
        if (action === 'draft') finalEstado = 'borrador'; // Borrador tiene su propio estado
        else if (formData.visibilidad === 'privado') finalEstado = 'aceptado'; // Contenido privado no requiere revisión
        else finalEstado = 'revision'; // Cualquier edición/envío público va a revisión
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
        estado: finalEstado,
        visibilidad: formData.visibilidad
      };

      let result;
      result = await createContent(payload, false);
      setCreatedContentId(result?.id || result);

      const isDraft = action === 'draft';
      const isPublished = finalEstado === 'aceptado';

      setModal({
        isOpen: true,
        type: 'success',
        title: isDraft ? '¡Borrador guardado!' : (finalEstado === 'revision' ? '¡Enviado a revisión!' : '¡Publicación aceptada!'),
        message: isDraft ? 'Tu contenido se ha guardado como borrador.' : (finalEstado === 'revision' ? 'Tu mod está en revisión por los administradores.' : 'Tu contenido ha sido aceptado y publicado.'),
        showCancel: true,
        confirmText: 'Ver contenido',
        cancelText: user.role === 'admin' ? 'Ir al panel' : 'Ir a mis mods',
        secondaryText: isPublished ? 'Guardar como borrador' : '',
        onConfirm: () => {
          closeModal();
          if (onClose) onClose();
        },
        onCancel: () => {
          closeModal();
          if (onClose) onClose();
        },
        onSecondary: isPublished ? () => {
          closeModal();
          handleSubmitForm('draft');
        } : null
      });
    } catch (error) { 
      console.error(error); 
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo procesar la solicitud.' }); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed p-0 md:p-4 inset-0 h-[100dvh] w-screen bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] overflow-hidden animate-fade-in-up" style={{ animationDuration: '200ms' }}>

      <div className="w-full md:max-w-5xl h-full flex flex-col bg-white dark:bg-dark-bg rounded-none md:rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDuration: '200ms' }}>
        
        {/* HEADER SIMPLE */}
        <div className="flex-shrink-0 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 px-2 md:px-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white bg-gradient-to-br from-primary-500 to-primary-600">
                  <Upload size={20} strokeWidth={2.5} />
              </div>
              Nuevo Mod
            </h1>
            <button type="button" onClick={handleClose} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={22} />
            </button>
          </div>
          
          {/* Dropdown de navegación movil */}
          <div className="sm:hidden w-full relative mb-1" ref={pasosDropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenDropdowns(prev => ({
                    ...prev,
                    pasos: !prev.pasos,
                    tipo: false
                  }));
                }}
                className="w-full pl-3 pr-8 py-2.5 h-10 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left flex items-center gap-2.5"
              >
                <CurrentStepIcon size={18} className="text-primary-600 dark:text-primary-400 shrink-0" strokeWidth={2.5} />
                <span className="truncate block font-bold">
                  {currentStep + 1}. {steps[currentStep].label}
                </span>
              </button>
              <ChevronDown size={16} className={clsx("absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200", openDropdowns.pasos && "rotate-180")} />

              {openDropdowns.pasos && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-transparent rounded-xl shadow-lg z-50 p-1 overflow-y-auto custom-scrollbar transition-all duration-300 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                  <div className="flex flex-col gap-0.5">
                    {steps.map((step, idx) => {
                      const StepIconComp = step.icon;
                      const isLocked = !canNavigateToStep(idx) && idx > currentStep;
                      const isCurrent = currentStep === idx;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStepClick(idx)}
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
                            isCurrent
                              ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                              : isLocked
                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <StepIconComp size={16} strokeWidth={isCurrent ? 2.5 : 2} />
                            <span>{idx + 1}. {step.label}</span>
                          </div>
                          {isLocked && <Lock size={14} className="text-gray-400 dark:text-gray-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs de navegación */}
          <div className="hidden sm:flex w-full overflow-x-auto scrollbar-hide scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const hasError = 
                (step.id === 'titulo' && errors.titulo) ||
                (step.id === 'imagenes' && errors.imagen) ||
                (step.id === 'creadores' && errors.creadores);
              const isLocked = !canNavigateToStep(index) && index > currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={isLocked}
                  className={clsx(
                    "flex-1 px-3 py-2 text-xs font-medium transition-all whitespace-nowrap flex flex-col items-center justify-center gap-2 border-b-2",
                    currentStep === index
                      ? "text-primary-600 dark:text-primary-400 border-primary-500 font-semibold"
                      : hasError
                        ? "text-red-500 border-red-500"
                        : isLocked
                          ? "text-gray-400 dark:text-gray-600 border-transparent cursor-not-allowed opacity-50"
                          : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                  )}
                >
                  <StepIcon size={20} strokeWidth={currentStep === index ? 2.0 : 1.5} />
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>


        {/* CONTENIDO PRINCIPAL POR PASO */}
        <div className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-bg">
          
          {/* PASO 1: NOMBRE */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">¿Cómo se llama tu mod?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa un título claro y llamativo para que la comunidad lo encuentre rápidamente.</p>
              </div>

              <div className="space-y-2">
                <input 
                  type="text" 
                  name="titulo" 
                  value={formData.titulo} 
                  onChange={handleChange} 
                  autoFocus
                  placeholder="Ej: Mi Nuevo Super Mod..." 
                  className={clsx(
                    "w-full px-4 py-3 text-base md:text-lg bg-white dark:bg-[#1D1F23] border rounded-2xl outline-none transition-all duration-300 shadow-sm font-medium",
                    errors.titulo ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 dark:border-transparent focus:ring-1 focus:ring-primary-500 dark:text-white"
                  )} 
                />
                {errors.titulo && <p className="text-center md:text-left text-xs text-red-500 font-semibold">El nombre del mod es obligatorio.</p>}
              </div>
            </div>
          )}

          {/* PASO 2: TIPO DE MOD CON TARJETAS INTERACTIVAS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Selecciona el tipo de contenido</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Elige la categoría principal a la que pertenece tu mod.</p>
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
                        "p-4 rounded-2xl border text-left transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden group",
                        isSelected 
                          ? "border-primary-500 bg-primary-300/20 dark:bg-primary-600/20 ring-1 ring-primary-500 shadow-md" 
                          : "border-gray-300 dark:border-transparent bg-white dark:bg-[#1D1F23] hover:bg-gray-50 dark:hover:bg-[#232529]"
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
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Créditos y Autores</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Añade a los usuarios que participaron o crearon este mod.</p>
              </div>

              <CreatorsInput
                creators={selectedCreators}
                onChange={setSelectedCreators}
                error={errors.creadores}
                placeholder="Buscar usuario..."
              />
            </div>
          )}

          {/* PASO 4: DESCRIPCIÓN */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Descripción e Instrucciones</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detalla las funciones, cómo instalarlo o los créditos extendidos.</p>
              </div>

              <SimpleEditor value={formData.descripcion} onChange={handleDescriptionChange} />
            </div>
          )}

          {/* PASO 5: MULTIMEDIA */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Imagen Principal y Galería</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pega enlaces directos de tus capturas de pantalla o videos demostrativos.</p>
              </div>

              {/* Galería Adicional */}
              <GalleryInput
                showMainImage={true}
                mainImage={formData.imagen}
                onMainImageChange={handleChange}
                mainImageError={errors.imagen || (imagenUrlError && formData.imagen)}
                gallery={formData.galeria}
                onChange={(galeria) => setFormData(prev => ({ ...prev, galeria }))}
                layout="inline"
              />
            </div>
          )}

          {/* PASO 6: ARCHIVOS Y ETIQUETAS */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Archivos de Descarga y Tags</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configura los enlaces para obtener el contenido y sus etiquetas.</p>
              </div>

              {/* Enlaces de descarga */}
              <DownloadsInput
                downloads={formData.descargas.map(d => ({ 
                  presetLabel: d.nombre && DOWNLOAD_LABELS.includes(d.nombre) ? d.nombre : 'Personalizado', 
                  label: d.nombre && DOWNLOAD_LABELS.includes(d.nombre) ? d.nombre : '', 
                  url: d.url 
                }))}
                onChange={(newDownloads) => setFormData(prev => ({ ...prev, descargas: newDownloads.map(d => ({ nombre: d.label, url: d.url })) }))}
                presets={DOWNLOAD_LABELS}
                defaultPreset={DOWNLOAD_LABELS[0]}
              />

              {/* Tags */}
              <TagsInput
                tags={[formData.tipo, ...formData.tags.filter(tag => tag !== formData.tipo)]}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags: tags.filter(tag => tag !== formData.tipo) }))}
                recommendedTags={RECOMMENDED_TAGS}
                fixedTags={[formData.tipo]}
              />
            </div>
          )}

          {/* PASO 7: PRIVACIDAD */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Visibilidad del Aporte</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Determina quién podrá acceder a este contenido.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'publico', title: 'Público', icon: Globe, desc: 'Visible para toda la comunidad en el catálogo.', color: 'border-blue-500' },
                  { id: 'privado', title: 'Privado', icon: Lock, desc: 'Solo tú podrás verlo desde tu panel de control.', color: 'border-red-500' },
                  { id: 'no-listado', title: 'No Listado', icon: LinkIcon, desc: 'Acceso únicamente mediante enlace directo.', color: 'border-amber-500' }
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
                        isSelected ? `${opt.color} bg-primary-50/20 dark:bg-primary-950/20 ring-2 ring-primary-500/30` : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1D1F23]"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <IconComp size={16} /> {opt.title}
                        </span>
                        {isSelected && <Check size={16} className="text-primary-600" />}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 8: RESUMEN Y FINALIZAR (LISTADO DE MODIFICACIONES Y EDICIÓN RÁPIDA) */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="text-center md:text-left mb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Resumen de la Publicación</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revisa la lista de modificaciones y presiona publicar si todo está correcto.</p>
              </div>

              <div className="bg-white dark:bg-[#1D1F23] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                
                {/* Ítem 1: Título */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nombre</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{formData.titulo || 'Sin nombre'}</h3>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(0)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar nombre">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 1.5: Categoría */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Categoría</span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">{formData.tipo || 'Sin categoría'}</h3>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(1)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Editar categoría">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Ítem 2: Creadores */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Creadores</span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
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
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
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
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
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
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize mt-0.5">
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

        {/* FOOTER FIJO CON NAVEGACIÓN Y BOTONES DE ACCIÓN */}
        <div className="flex-shrink-0 bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex gap-3 justify-between items-center">
            <button 
              type="button" 
              onClick={handlePrevStep} 
              disabled={currentStep === 0} 
              className="px-4 py-2 bg-white dark:bg-[#2a2d34] border border-gray-300 dark:border-transparent text-gray-700 dark:text-white rounded-xl text-sm font-bold flex items-center gap-1 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <button 
                  type="button" 
                  onClick={handleNextStep} 
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
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
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Publicar Mod
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => handleSubmitForm('draft')} 
                        disabled={loading || !isEncryptionReady} 
                        className="px-4 py-2 bg-gray-100 dark:bg-[#1D1F23] text-gray-700 dark:text-gray-200 font-bold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <FileText size={16} /> Borrador
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleSubmitForm('pending')} 
                        disabled={loading || !isEncryptionReady} 
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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

      </div>

      {/* CUSTOM MODAL - MISMO ESTILO QUE LA PÁGINA */}
      {modal.isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
            onClick={closeModal}
          ></div>
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up border border-gray-200 dark:border-gray-700 z-50">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>

            <div className="p-6">
              {/* Icono y Título */}
              <div className="flex items-start gap-4 mb-4">
                <div className={clsx(
                  "p-3 rounded-xl shrink-0",
                  modal.type === 'success' ? "bg-green-100 dark:bg-green-900/30" :
                  modal.type === 'error' ? "bg-red-100 dark:bg-red-900/30" :
                  modal.type === 'warning' ? "bg-yellow-100 dark:bg-yellow-900/30" :
                  "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {modal.type === 'success' && <CheckCircle size={24} className="text-green-500" />}
                  {modal.type === 'error' && <AlertTriangle size={24} className="text-red-500" />}
                  {modal.type === 'warning' && <AlertTriangle size={24} className="text-yellow-500" />}
                  {modal.type === 'info' && <Info size={24} className="text-blue-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{modal.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{modal.message}</p>
                </div>
              </div>

              {/* Botones */}
              <div className={clsx(
                "flex gap-2 mt-6",
                modal.secondaryText ? "flex-col" : modal.neutralText ? "flex-col sm:flex-row-reverse" : "flex"
              )}>
                {modal.secondaryText && (
                  <button 
                    onClick={modal.onSecondary || closeModal}
                    className="w-full px-4 py-2.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-950/40 transition-colors"
                  >
                    {modal.secondaryText}
                  </button>
                )}
                {modal.neutralText && (
                  <button 
                    onClick={modal.onNeutral || closeModal}
                    className={clsx("w-full px-4 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors", modal.secondaryText ? "" : "sm:flex-1")}
                  >
                    {modal.neutralText}
                  </button>
                )}
                <button 
                  onClick={modal.onConfirm || closeModal}
                  className={clsx(
                    "px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-colors",
                    modal.secondaryText ? "w-full" : modal.neutralText ? "w-full sm:flex-1" : "flex-1",
                    modal.type === 'success' ? "bg-green-600 hover:bg-green-700" :
                    modal.type === 'error' ? "bg-red-600 hover:bg-red-700" :
                    modal.type === 'warning' ? "bg-yellow-600 hover:bg-yellow-700" :
                    "bg-primary-600 hover:bg-primary-700"
                  )}
                >
                  {modal.confirmText}
                </button>
                {modal.showCancel && (
                  <button 
                    onClick={modal.onCancel || closeModal}
                    className={clsx(
                      "px-4 py-2.5 bg-gray-100 dark:bg-[#1D1F23] text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                      modal.secondaryText ? "w-full" : modal.neutralText ? "w-full sm:flex-1" : "flex-1"
                    )}
                  >
                    {modal.cancelText}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};

export default SubirMod;