import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // 1. Importación corregida
import { 
  User, Camera, Save, Calendar, Shield, Loader2, CheckCircle, AlertCircle, 
  Image as ImageIcon, Palette, LayoutGrid, Link as LinkIcon, Edit2 
} from 'lucide-react';
import { clsx } from 'clsx';
import { ICON_MAP } from '../components/AvatarRenderer';

// --- CONSTANTES ---
const AVATAR_ICONS_MAP = ICON_MAP;
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
  const { user, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({ username: '', avatar: '', banner: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [bannerTab, setBannerTab] = useState('presets'); 
  const [avatarTab, setAvatarTab] = useState('url');

  const [selectedIcon, setSelectedIcon] = useState('User');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Estados para eliminar cuenta
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        avatar: user.avatar || '',
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      if (!user) {
        throw new Error('No hay sesión activa');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }

      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') {
      setPasswordMessage({ type: 'error', text: 'Debes escribir ELIMINAR para confirmar' });
      return;
    }

    setDeleteLoading(true);

    try {
      if (!user) {
        throw new Error('No hay sesión activa');
      }

      // 1. Eliminar de la tabla users
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (dbError) {
        console.error('Error deleting from users table:', dbError);
        throw dbError;
      }

      // 2. Cerrar sesión
      await supabase.auth.signOut();
      
      // 3. Redirigir a home
      window.location.href = '/';
    } catch (error) {
      console.error('Delete account error:', error);
      setPasswordMessage({ type: 'error', text: 'Error al eliminar cuenta: ' + (error.message || 'Error desconocido') });
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPreviewAvatar = () => {
    const avatarSrc = formData.avatar;
    
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

      // 1. Verificar si el username ya existe (solo si cambió)
      if (formData.username !== user.username) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("username")
          .ilike("username", formData.username)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          throw new Error("El nombre de usuario ya está en uso");
        }
      }

      // 2. Actualizar Auth de Supabase
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: formData.username, avatar: formData.avatar }
      });
      if (authError) {
        // Traducir errores comunes de Supabase
        if (authError.message.includes('duplicate')) {
          throw new Error("El nombre de usuario ya está en uso");
        }
        throw new Error("Error al actualizar autenticación: " + authError.message);
      }

      // 3. Actualizar Tabla 'users' de Supabase
      const { error: dbError } = await supabase
        .from("users")
        .update({
          username: formData.username,
          avatar: formData.avatar,
          banner: formData.banner
        })
        .eq('id', user.id);
      
      if (dbError) {
        // Traducir errores comunes de la base de datos
        if (dbError.code === '23505') {
          throw new Error("El nombre de usuario ya está en uso");
        }
        throw new Error("Error al actualizar perfil: " + dbError.message);
      }

      // 4. Actualizar el contexto del usuario localmente
      updateUserProfile({
        username: formData.username,
        avatar: formData.avatar,
        banner: formData.banner
      });

      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });

    } catch (error) {
      console.error('Profile update error:', error);
      
      // Mensajes de error en español
      let errorMessage = 'Error al actualizar perfil';
      if (error.message) {
        if (error.message.includes('username') || error.message.includes('usuario')) {
          errorMessage = error.message;
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'El nombre de usuario ya está en uso';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Error de autenticación';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const joinDate = user?.createdat 
    ? new Date(user.createdat).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Desconocida';

  const isBannerUrl = formData.banner && (formData.banner.startsWith('http') || formData.banner.startsWith('data:image'));

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in-up" style={{ animationDuration: '200ms' }}>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6">
        <h1 className="flex text-xl md:text-2xl font-bold text-gray-800 dark:text-white items-center gap-3">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white bg-primary-600")}>
              <User size={22} strokeWidth={2.5} />
          </div>
          Configuración
        </h1>
      </div>

      <div className="space-y-4 md:space-y-6">
        
        {/* =========================================================
            TARJETA DE VISTA PREVIA
           ========================================================= */}
        <div>
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            
            {/* VISTA PREVIA BANNER */}
            <div className="h-28 sm:h-36 w-full bg-gray-200 dark:bg-[#191B1E] relative transition-all duration-500">
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

            <div className="px-3 sm:px-4 md:px-8 pb-4 sm:pb-6 md:pb-8 text-center">
                
                {/* VISTA PREVIA AVATAR */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto -mt-12 sm:-mt-16 mb-3 sm:mb-4">
                  {/* Contenedor con aspect-square y rounded-full para asegurar circularidad */}
                  <div className="w-full h-full rounded-full p-1 sm:p-1.5 bg-white dark:bg-[#1e1e1e] shadow-xl overflow-hidden aspect-square shrink-0 ring-4 ring-white dark:ring-[#1e1e1e] transition-transform duration-300">
                    {/* Render interno */}
                    <div className="w-full h-full rounded-full overflow-hidden">
                        {renderPreviewAvatar()}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate mt-2 sm:mt-3">
                  {formData.username || "Usuario"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-5 truncate">{user?.email}</p>

                <div className="flex flex-col gap-2">
                  <div className={clsx("px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all", user?.role === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800" : "bg-gray-100 text-gray-600 dark:bg-[#191B1E] dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700")}>
                    <Shield size={12} /> {user?.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </div>
                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-[10px] sm:text-xs font-medium flex items-center justify-center gap-2 ring-1 ring-blue-200 dark:ring-blue-800">
                    <Calendar size={12} /> Miembro desde: {joinDate}
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            FORMULARIO DE EDICIÓN
           ========================================================= */}
        <div>
          <div className="bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            
            <h3 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
              <Edit2 size={18} className="text-primary-500" /> Editar Perfil
            </h3>

            {message.text && (
              <div className={clsx("mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm animate-fade-in-up ring-1", message.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 ring-green-200 dark:ring-green-800" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 ring-red-200 dark:ring-red-800")}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
              
              {/* 1. USERNAME */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2.5">Nombre de Usuario</label>
                <div className="relative group">
                  <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                  <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm dark:text-white" />
                </div>
              </div>

              {/* 2. AVATAR CONFIGURATION */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
                
                <div className="flex gap-1.5 mb-3 p-1 bg-gray-100 dark:bg-[#191B1E] rounded-lg w-full">
                    <button type="button" onClick={() => setAvatarTab('url')} className={clsx("flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5", avatarTab === 'url' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LinkIcon size={12} /> URL
                    </button>
                    <button type="button" onClick={() => setAvatarTab('design')} className={clsx("flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5", avatarTab === 'design' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <Palette size={12} /> Diseñar
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                    {avatarTab === 'url' && (
                        <div className="relative group">
                            <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                            <input type="url" name="avatar" placeholder="https://..." value={formData.avatar} onChange={handleChange} className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm dark:text-white" />
                        </div>
                    )}

                    {avatarTab === 'design' && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">1. Icono</p>
                                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-1.5">
                                    {AVATAR_ICON_NAMES.map((name) => {
                                        const Icon = AVATAR_ICONS_MAP[name];
                                        return (
                                            <button 
                                                key={name} 
                                                type="button" 
                                                onClick={() => updateAvatarDesign(name, selectedColor)} 
                                                className={clsx(
                                                    "aspect-square rounded-lg flex items-center justify-center transition-all border bg-white dark:bg-[#191B1E] hover:scale-105", 
                                                    selectedIcon === name 
                                                        ? "border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-sm" 
                                                        : "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                <Icon size={18} strokeWidth={1.5} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">2. Color</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {AVATAR_COLORS.map((color) => (
                                        <button 
                                            key={color} 
                                            type="button" 
                                            onClick={() => updateAvatarDesign(selectedIcon, color)} 
                                            className={clsx(
                                                "w-10 h-10 rounded-full border-2 transition-all hover:scale-110", 
                                                selectedColor === color ? "border-white ring-2 ring-primary-500 shadow-sm" : "border-gray-200 dark:border-gray-700 shadow-sm"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Diseño del Banner</label>
                
                <div className="flex gap-1.5 mb-3 p-1 bg-gray-100 dark:bg-[#191B1E] rounded-lg w-full">
                    <button type="button" onClick={() => setBannerTab('presets')} className={clsx("flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5", bannerTab === 'presets' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LayoutGrid size={12} /> Presets
                    </button>
                    <button type="button" onClick={() => setBannerTab('colors')} className={clsx("flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5", bannerTab === 'colors' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <Palette size={12} /> Colores
                    </button>
                    <button type="button" onClick={() => setBannerTab('custom')} className={clsx("flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5", bannerTab === 'custom' ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400")}>
                        <LinkIcon size={12} /> URL
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                    {bannerTab === 'presets' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {PRESET_BANNERS.map((imgUrl, index) => (
                                <button key={index} type="button" onClick={() => updateBanner(imgUrl)} className={clsx("h-16 w-full rounded-lg bg-gray-200 overflow-hidden border transition-all hover:opacity-80 hover:scale-105", formData.banner === imgUrl ? "border-primary-500 ring-2 ring-primary-500/30 shadow-sm" : "border-gray-200 dark:border-gray-700")}>
                                    <img src={imgUrl} alt={`Preset ${index}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {bannerTab === 'colors' && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {PRESET_COLORS.map((gradient, index) => (
                                <button key={index} type="button" onClick={() => updateBanner(gradient)} className={clsx("h-10 w-full rounded-lg border transition-all hover:opacity-80 hover:scale-105", formData.banner === gradient ? "border-white ring-2 ring-primary-500 shadow-sm" : "border-gray-200 dark:border-gray-700")} style={{ background: gradient }}></button>
                            ))}
                        </div>
                    )}

                    {bannerTab === 'custom' && (
                        <div className="relative group">
                           <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                           <input type="url" name="banner" placeholder="https://imgur.com/..." value={formData.banner} onChange={handleChange} className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm dark:text-white" />
                        </div>
                    )}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-2">
                <button type="submit" disabled={loading} className={clsx("px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-lg hover:shadow-xl text-sm sm:text-base", loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700")}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* SECCIÓN DE CAMBIO DE CONTRASEÑA */}
        <div className="bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="flex items-center gap-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            <Shield size={16} className="text-primary-500" /> Cambiar Contraseña
          </h3>

          {passwordMessage.text && (
            <div className={clsx("mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center gap-2 text-xs sm:text-sm", passwordMessage.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300")}>
              {passwordMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Nueva Contraseña</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm dark:text-white"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#191B1E] border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm dark:text-white"
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className={clsx("px-5 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-fit text-sm sm:text-base", passwordLoading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700")}
            >
              {passwordLoading ? <Loader2 className="animate-spin" size={14} /> : <Shield size={14} />}
              {passwordLoading ? "Actualizando..." : "Cambiar Contraseña"}
            </button>
          </form>
        </div>

        {/* SECCIÓN DE ELIMINAR CUENTA */}
        <div className="bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-red-200 dark:border-red-900 shadow-lg">
          <h3 className="flex items-center gap-3 text-base sm:text-lg font-bold text-red-600 dark:text-red-400 mb-3 sm:mb-4">
            <AlertCircle size={16} /> Zona de Peligro
          </h3>

          {!showDeleteSection ? (
            <button
              type="button"
              onClick={() => setShowDeleteSection(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/30 transition-all text-sm sm:text-base"
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
              </p>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Escribe <span className="font-bold text-red-600">ELIMINAR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#191B1E] border border-red-200 dark:border-red-900 outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm dark:text-white"
                  placeholder="ELIMINAR"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteSection(false);
                    setDeleteConfirmation('');
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmation !== 'ELIMINAR'}
                  className={clsx("px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all text-sm sm:text-base", deleteLoading || deleteConfirmation !== 'ELIMINAR' ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700")}
                >
                  {deleteLoading ? <Loader2 className="animate-spin" size={14} /> : <AlertCircle size={14} />}
                  {deleteLoading ? "Eliminando..." : "Eliminar Cuenta Definitivamente"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Configuracion;