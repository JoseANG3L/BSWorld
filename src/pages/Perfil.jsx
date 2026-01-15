import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { 
  User, Mail, Camera, Save, Calendar, Shield, Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';
import { clsx } from 'clsx';

const Perfil = () => {
  const { user } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.displayName || user.username || '',
        avatar: user.photoURL || user.avatar || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar mensajes al escribir
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!user) throw new Error("No hay sesión activa");

      // 1. Actualizar en Firebase Authentication (Para el Header y Auth)
      await updateProfile(auth.currentUser, {
        displayName: formData.username,
        photoURL: formData.avatar
      });

      // 2. Actualizar en Firestore (Base de datos)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: formData.username,
        avatar: formData.avatar
      });

      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      
      // Opcional: Recargar la página después de 1.5s para ver cambios reflejados en toda la app
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha de registro
  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Desconocida';

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in-up">
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="text-primary-600" /> Mi Perfil
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- COLUMNA IZQUIERDA: TARJETA DE VISTA PREVIA --- */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center sticky top-24">
            
            {/* Avatar Preview */}
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-primary-600 to-purple-600 shadow-lg">
                <img 
                  src={formData.avatar || "https://via.placeholder.com/150"} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md border border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300">
                <Camera size={16} />
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

        {/* --- COLUMNA DERECHA: FORMULARIO DE EDICIÓN --- */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
              Editar Información
            </h3>

            {/* Mensajes de feedback */}
            {message.text && (
              <div className={clsx(
                "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in-up",
                message.type === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              )}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre de Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
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
                    type="url" 
                    name="avatar"
                    placeholder="https://..."
                    value={formData.avatar}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Pega un enlace de imagen (Imgur, Discord, etc). Si lo dejas vacío, se usará el avatar por defecto.
                </p>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">El correo electrónico no se puede cambiar por seguridad.</p>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={clsx(
                    "px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all",
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

export default Perfil;