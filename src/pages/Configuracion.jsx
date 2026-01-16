import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { 
  User, Mail, Camera, Save, Calendar, Shield, Loader2, CheckCircle, AlertCircle, 
  Image as ImageIcon, Palette, LayoutGrid, Link as LinkIcon 
} from 'lucide-react';
import { clsx } from 'clsx';

// --- CONSTANTES DE PRESETS ---
const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop", // Abstracto
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop", // Espacio
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop", // Naturaleza
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop", // Tech
];

const PRESET_GRADIENTS = [
  "linear-gradient(to right, #4f46e5, #9333ea)", // Indigo a Purple
  "linear-gradient(to right, #2563eb, #06b6d4)", // Blue a Cyan
  "linear-gradient(to right, #ea580c, #eab308)", // Orange a Yellow
  "linear-gradient(to right, #db2777, #7c3aed)", // Pink a Violet
  "#1e293b", // Slate Dark
  "#0f172a", // Slate Black
];

const Configuracion = () => {
  const { user } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    banner: '',
  });

  // Estado para controlar las pestañas del banner (presets | colors | custom)
  const [bannerTab, setBannerTab] = useState('presets'); 

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar datos
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.displayName || user.username || '',
        avatar: user.photoURL || user.avatar || '',
        banner: user.banner || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ type: '', text: '' });
  };

  // Función para seleccionar un preset (Imagen o Color)
  const handleSelectPreset = (value) => {
    setFormData({ ...formData, banner: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!user) throw new Error("No hay sesión activa");

      // 1. Auth Update
      await updateProfile(auth.currentUser, {
        displayName: formData.username,
        photoURL: formData.avatar
      });

      // 2. Firestore Update
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: formData.username,
        avatar: formData.avatar,
        banner: formData.banner
      });

      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error al actualizar.' });
    } finally {
      setLoading(false);
    }
  };

  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Desconocida';

  // Helper para saber si el banner actual es una URL de imagen o un CSS (gradiente/color)
  const isBannerUrl = formData.banner && (formData.banner.startsWith('http') || formData.banner.startsWith('data:image'));

  return (
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="text-primary-600" /> Configuración de Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- COLUMNA IZQUIERDA: VISTA PREVIA --- */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden">
            
            {/* 1. BANNER PREVIEW INTELIGENTE */}
            <div className="h-28 w-full bg-gray-200 dark:bg-gray-800 relative">
               {formData.banner ? (
                 isBannerUrl ? (
                   // Si es URL, usamos img
                   <img 
                     src={formData.banner} 
                     alt="Banner Preview" 
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   // Si es Color/Gradiente, usamos style background
                   <div 
                     className="w-full h-full"
                     style={{ background: formData.banner }}
                   ></div>
                 )
               ) : (
                 // Default
                 <div className="w-full h-full bg-gradient-to-r from-primary-600 to-purple-600"></div>
               )}
            </div>

            <div className="px-6 pb-6 text-center">
                <div className="relative w-24 h-24 mx-auto -mt-12 mb-3 group">
                  <div className="w-full h-full rounded-full p-[3px] bg-white dark:bg-[#1e1e1e]">
                    <img 
                      src={formData.avatar || "https://via.placeholder.com/150"} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#1e1e1e]"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {formData.username || "Usuario"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">{user?.email}</p>

                {/* Badges */}
                <div className="flex flex-col gap-2">
                  <div className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2",
                    user?.role === 'admin' 
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    <Shield size={14} />
                    {user?.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-medium flex items-center justify-center gap-2">
                    <Calendar size={14} />
                    Miembro desde: {joinDate}
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO --- */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
              Editar Información
            </h3>

            {/* Mensajes */}
            {message.text && (
              <div className={clsx(
                "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in-up",
                message.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              )}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre de Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" name="username" required
                    value={formData.username} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL del Avatar</label>
                <div className="relative group">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="url" name="avatar" placeholder="https://..."
                    value={formData.avatar} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              {/* ================= SECCIÓN DE BANNER MEJORADA ================= */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Diseño del Banner</label>
                
                {/* TABS SELECTORAS */}
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    <button
                        type="button"
                        onClick={() => setBannerTab('presets')}
                        className={clsx(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            bannerTab === 'presets' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        )}
                    >
                        <LayoutGrid size={14} /> Presets
                    </button>
                    <button
                        type="button"
                        onClick={() => setBannerTab('colors')}
                        className={clsx(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            bannerTab === 'colors' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        )}
                    >
                        <Palette size={14} /> Colores
                    </button>
                    <button
                        type="button"
                        onClick={() => setBannerTab('custom')}
                        className={clsx(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            bannerTab === 'custom' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        )}
                    >
                        <LinkIcon size={14} /> URL
                    </button>
                </div>

                {/* CONTENIDO DE TABS */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    
                    {/* TAB 1: PRESETS (IMÁGENES) */}
                    {bannerTab === 'presets' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PRESET_IMAGES.map((imgUrl, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPreset(imgUrl)}
                                    className={clsx(
                                        "h-16 w-full rounded-lg bg-gray-200 overflow-hidden border-2 transition-all hover:opacity-80",
                                        formData.banner === imgUrl ? "border-primary-500 ring-2 ring-primary-500/30" : "border-transparent"
                                    )}
                                >
                                    <img src={imgUrl} alt={`Preset ${index}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: COLORES (GRADIENTES) */}
                    {bannerTab === 'colors' && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {PRESET_GRADIENTS.map((gradient, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPreset(gradient)}
                                    className={clsx(
                                        "h-12 w-full rounded-lg border-2 transition-all hover:opacity-80 hover:scale-105",
                                        formData.banner === gradient ? "border-white ring-2 ring-primary-500 shadow-md" : "border-transparent"
                                    )}
                                    style={{ background: gradient }}
                                    title="Seleccionar color"
                                ></button>
                            ))}
                        </div>
                    )}

                    {/* TAB 3: CUSTOM URL */}
                    {bannerTab === 'custom' && (
                        <div className="relative group">
                           <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                           <input 
                             type="url" name="banner" placeholder="https://imgur.com/..."
                             value={formData.banner} onChange={handleChange}
                             className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                           />
                        </div>
                    )}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={clsx(
                    "px-8 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all w-full md:w-auto",
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 hover:scale-[1.02]"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Configuracion;