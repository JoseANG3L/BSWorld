import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { 
  User, Mail, Camera, Save, Calendar, Shield, Loader2, CheckCircle, AlertCircle, 
  Image as ImageIcon, Palette, LayoutGrid, Link as LinkIcon,
  // --- ICONOS PARA EL AVATAR ---
  Ghost, Gamepad2, Sparkles, Anchor, Coffee, Rocket, Crown, Zap, Heart, Star, 
  Music, Smile, Sword, Skull, Flame, Code, Terminal, Cpu, Globe, Headphones, 
  Cat, Dog, Sun, Moon, Cloud, Umbrella
} from 'lucide-react';
import { clsx } from 'clsx';

// --- CONSTANTES ---
const AVATAR_ICONS_MAP = {
  User, Ghost, Gamepad2, Sparkles, Anchor, Coffee, Rocket, Crown, Zap, Heart, Star, 
  Music, Smile, Sword, Skull, Flame, Code, Terminal, Cpu, Globe, Headphones, 
  Cat, Dog, Sun, Moon, Cloud, Umbrella
};
const AVATAR_ICON_NAMES = Object.keys(AVATAR_ICONS_MAP);

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b', 
  '#18181b', '#78350f', '#881337', '#1e3a8a', '#134e4a'
];

const PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
];

const PRESET_COLORS = [
  "linear-gradient(to right, #4f46e5, #9333ea)", 
  "linear-gradient(to right, #2563eb, #06b6d4)", 
  "linear-gradient(to right, #ea580c, #eab308)", 
  "linear-gradient(to right, #db2777, #7c3aed)", 
  "linear-gradient(to right, #059669, #10b981)", 
  "#1e293b", 
  "#000000", 
];

const Configuracion = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({ username: '', avatar: '', banner: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [bannerTab, setBannerTab] = useState('presets'); 
  const [avatarTab, setAvatarTab] = useState('url');

  const [selectedIcon, setSelectedIcon] = useState('User');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.displayName || user.username || '',
        avatar: user.photoURL || user.avatar || '',
        banner: user.banner || '',
      });
      
      if (user.avatar && user.avatar.startsWith('design|')) {
          const parts = user.avatar.split('|');
          if(parts.length === 3) {
              setAvatarTab('design');
              setSelectedIcon(parts[1]);
              setSelectedColor(parts[2]);
          }
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateAvatarDesign = (newIcon, newColor) => {
    setSelectedIcon(newIcon);
    setSelectedColor(newColor);
    setFormData(prev => ({
        ...prev, 
        avatar: `design|${newIcon}|${newColor}`
    }));
  };

  const updateBanner = (val) => {
      setFormData(prev => ({ ...prev, banner: val }));
  };

  const renderPreviewAvatar = () => {
    const avatarSrc = formData.avatar;
    
    // 1. Si es diseño
    if (avatarSrc && avatarSrc.startsWith('design|')) {
        const parts = avatarSrc.split('|');
        const iconName = parts[1];
        const colorHex = parts[2];
        const IconComp = AVATAR_ICONS_MAP[iconName] || User;
        
        return (
            <div className="w-full h-full flex items-center justify-center text-white select-none rounded-full" style={{ backgroundColor: colorHex }}>
                <IconComp style={{ width: '55%', height: '55%' }} strokeWidth={1.5} />
            </div>
        );
    }
    
    // 2. Si es imagen
    return (
        <img 
            src={avatarSrc || "https://via.placeholder.com/150"} 
            alt="Avatar" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
        />
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!user) throw new Error("No hay sesión activa");

      await updateProfile(auth.currentUser, {
        displayName: formData.username,
        photoURL: formData.avatar
      });

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

  const isBannerUrl = formData.banner && (formData.banner.startsWith('http') || formData.banner.startsWith('data:image'));

  return (
    <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="text-primary-600" /> Configuración de Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* =========================================================
            COLUMNA IZQUIERDA: TARJETA DE VISTA PREVIA
           ========================================================= */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden sticky top-24">
            
            {/* VISTA PREVIA BANNER */}
            <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 relative transition-all duration-300">
               {formData.banner ? (
                 isBannerUrl ? (
                   <img 
                     src={formData.banner} 
                     alt="Banner Preview" 
                     className="w-full h-full object-cover"
                     referrerPolicy="no-referrer"
                   />
                 ) : (
                   <div className="w-full h-full" style={{ background: formData.banner }}></div>
                 )
               ) : (
                 <div className="w-full h-full bg-gradient-to-r from-primary-600 to-purple-600"></div>
               )}
            </div>

            <div className="px-6 pb-6 text-center">
                
                {/* VISTA PREVIA AVATAR (CÍRCULO PERFECTO) */}
                <div className="relative w-28 h-28 mx-auto -mt-14 mb-3 group">
                  {/* Contenedor con aspect-square y rounded-full para asegurar circularidad */}
                  <div className="w-full h-full rounded-full p-1 bg-white dark:bg-[#1e1e1e] shadow-lg overflow-hidden aspect-square shrink-0">
                    {/* Render interno */}
                    <div className="w-full h-full rounded-full overflow-hidden">
                        {renderPreviewAvatar()}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate mt-2">
                  {formData.username || "Usuario"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">{user?.email}</p>

                <div className="flex flex-col gap-2">
                  <div className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2", user?.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>
                    <Shield size={14} /> {user?.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-medium flex items-center justify-center gap-2">
                    <Calendar size={14} /> Miembro desde: {joinDate}
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA: FORMULARIO
           ========================================================= */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm">
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
              Editar Información
            </h3>

            {message.text && (
              <div className={clsx("mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in-up", message.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300")}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* 1. USERNAME */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre de Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white" />
                </div>
              </div>

              {/* 2. AVATAR CONFIGURATION */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Avatar</label>
                
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    <button type="button" onClick={() => setAvatarTab('url')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", avatarTab === 'url' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LinkIcon size={14} /> URL
                    </button>
                    <button type="button" onClick={() => setAvatarTab('design')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", avatarTab === 'design' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <Palette size={14} /> Diseñar
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    {/* Avatar: URL */}
                    {avatarTab === 'url' && (
                        <div className="relative group">
                            <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input type="url" name="avatar" placeholder="https://..." value={formData.avatar} onChange={handleChange} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white" />
                        </div>
                    )}

                    {/* Avatar: Designer */}
                    {avatarTab === 'design' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">1. Elige Icono</p>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {AVATAR_ICON_NAMES.map((name) => {
                                        const Icon = AVATAR_ICONS_MAP[name];
                                        return (
                                            <button 
                                                key={name} 
                                                type="button" 
                                                onClick={() => updateAvatarDesign(name, selectedColor)} 
                                                className={clsx(
                                                    "aspect-square rounded-xl flex items-center justify-center transition-all border-2 bg-white dark:bg-gray-800", 
                                                    selectedIcon === name 
                                                        ? "border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20 scale-105 shadow-sm" 
                                                        : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                <Icon size={24} strokeWidth={1.5} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">2. Elige Color</p>
                                <div className="flex flex-wrap gap-2">
                                    {AVATAR_COLORS.map((color) => (
                                        <button 
                                            key={color} 
                                            type="button" 
                                            onClick={() => updateAvatarDesign(selectedIcon, color)} 
                                            className={clsx(
                                                "w-8 h-8 rounded-full border-2 transition-all hover:scale-110", 
                                                selectedColor === color ? "border-white ring-2 ring-primary-500 shadow-md" : "border-transparent shadow-sm"
                                            )} 
                                            style={{ backgroundColor: color }} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              {/* 3. BANNER CONFIGURATION */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Diseño del Banner</label>
                
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    <button type="button" onClick={() => setBannerTab('presets')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", bannerTab === 'presets' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LayoutGrid size={14} /> Presets
                    </button>
                    <button type="button" onClick={() => setBannerTab('colors')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", bannerTab === 'colors' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <Palette size={14} /> Colores
                    </button>
                    <button type="button" onClick={() => setBannerTab('custom')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", bannerTab === 'custom' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LinkIcon size={14} /> URL
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                    {bannerTab === 'presets' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PRESET_BANNERS.map((imgUrl, index) => (
                                <button key={index} type="button" onClick={() => updateBanner(imgUrl)} className={clsx("h-16 w-full rounded-lg bg-gray-200 overflow-hidden border-2 transition-all hover:opacity-80", formData.banner === imgUrl ? "border-primary-500 ring-2 ring-primary-500/30" : "border-transparent")}>
                                    <img src={imgUrl} alt={`Preset ${index}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {bannerTab === 'colors' && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {PRESET_COLORS.map((gradient, index) => (
                                <button key={index} type="button" onClick={() => updateBanner(gradient)} className={clsx("h-12 w-full rounded-lg border-2 transition-all hover:opacity-80 hover:scale-105", formData.banner === gradient ? "border-white ring-2 ring-primary-500 shadow-md" : "border-transparent")} style={{ background: gradient }}></button>
                            ))}
                        </div>
                    )}

                    {bannerTab === 'custom' && (
                        <div className="relative group">
                           <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                           <input type="url" name="banner" placeholder="https://imgur.com/..." value={formData.banner} onChange={handleChange} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white" />
                        </div>
                    )}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="submit" disabled={loading} className={clsx("px-8 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all w-full md:w-auto", loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 hover:scale-[1.02]")}>
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