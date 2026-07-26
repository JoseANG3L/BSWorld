import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, Lock, User, ArrowRight, Loader2, AlertCircle, 
  Eye, EyeOff, X 
} from 'lucide-react';
import { FaGoogle, FaGithub, FaDiscord } from 'react-icons/fa';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b', 
  '#18181b', '#78350f', '#881337', '#1e3a8a', '#134e4a'
];

const Login = ({ isOpen = true, onClose, initialRegister = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, signInWithProvider } = useAuth();

  const [isRegistering, setIsRegistering] = useState(initialRegister);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  const randomColor = AVATAR_COLORS[randomIndex];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    avatar: `design|User|${randomColor}`
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Bloqueo de scroll cuando el modal esté abierto
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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const registerParam = searchParams.get('register') === 'true';

    if (registerParam || initialRegister) {
      setIsRegistering(true);
    } else if (location.state && location.state.isRegistering !== undefined) {
      setIsRegistering(location.state.isRegistering);
    } else {
      setIsRegistering(false);
    }

    setError("");
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      avatar: `design|User|${randomColor}`
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [location.search, location.state, initialRegister]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          throw { code: 'password-mismatch' };
        }
        if (formData.password.length < 6) throw { code: 'weak-password' };
        await signup(formData.email, formData.password, formData.username, formData.avatar);
      } else {
        await login(formData.email, formData.password);
      }
      
      if (onClose) {
        onClose();
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      let msg = "Ocurrió un error inesperado.";
      
      if (err.code === 'custom/username-taken') {
        msg = "Este nombre de usuario ya está ocupado.";
      } else if (err.message === 'Invalid login credentials') {
        msg = "Correo o contraseña incorrectos.";
      } else if (err.code === 'password-mismatch') {
        msg = "Las contraseñas no coinciden.";
      } else if (err.code === 'weak-password') {
        msg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.status === 422) {
        msg = "El correo no es válido o ya está registrado.";
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setError("");
      setLoading(true);
      await signInWithProvider(provider);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError(`Error al iniciar sesión con ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-bg flex flex-col animate-fade-in" style={{ animationDuration: '200ms' }}>
      
      {/* BOTÓN EQUIS DE CIERRE FLOTANTE EN LA ESQUINA SUPERIOR DERECHA */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="Cerrar"
      >
        <X size={20} />
      </button>

      {/* CONTENEDOR FULLSCREEN */}
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* PANEL IZQUIERDO DECORATIVO (Visible en desktop) */}
        <div className={clsx(
          "hidden md:flex md:w-1/2 lg:w-3/5 p-12 lg:p-16 flex-col justify-between text-white relative transition-all duration-500",
          isRegistering ? "bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700" : "bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700"
        )}>
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-tight">BombSquad World</h3>
            <p className="text-white/80 text-base">Gestiona y comparte las mejores modificaciones del ecosistema.</p>
          </div>
          
          <div className="relative z-10 space-y-4 max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              {isRegistering ? "Sé parte de algo grande" : "¡Qué bueno verte de nuevo!"}
            </h1>
            <p className="text-white/90 text-base leading-relaxed">
              {isRegistering 
                ? "Regístrate para interactuar con la comunidad, subir tus propios proyectos y personalizar tu perfil al máximo." 
                : "Inicia sesión para volver a tu panel de administración, revisar tus mods cargados y recibir notificaciones de moderación."}
            </p>
          </div>
          
          <div className="text-sm text-white/50 font-medium">
            &copy; {new Date().getFullYear()} BSWorld Network. Todos los derechos reservados.
          </div>
        </div>

        {/* PANEL DERECHO: FORMULARIO BÚSQUEDA / LOGIN */}
        <div className="w-full md:w-1/2 lg:w-2/5 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col justify-center bg-white dark:bg-dark-bg pt-16 md:pt-0">
          <div className="w-full max-w-md mx-auto my-auto">
          
            <div className="text-center md:text-left mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isRegistering ? "Únete a la gran comunidad de mods" : "Ingresa tus datos para continuar"}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" /> 
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* LOGIN SOCIAL */}
            <div className="space-y-2.5 mb-5">
              <button 
                type="button"
                disabled={loading}
                onClick={() => handleSocialLogin('google')} 
                className="w-full py-2.5 flex items-center justify-center gap-3 border border-gray-300 dark:border-transparent bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 shadow-sm"
              >
                <FaGoogle className="text-red-500 text-base" /> Continuar con Google
              </button>
              
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('github')} 
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-gray-300 dark:border-transparent bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 shadow-sm"
                >
                  <FaGithub className="text-base" /> GitHub
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('discord')} 
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-gray-300 dark:border-transparent bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 shadow-sm"
                >
                  <FaDiscord className="text-indigo-500 text-base" /> Discord
                </button>
              </div>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink mx-3 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">O mediante correo</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              
              {isRegistering && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type="text" name="username" placeholder="Nombre de usuario" required={isRegistering}
                    value={formData.username} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                  />
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  type="email" name="email" placeholder="Correo electrónico" required
                  value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Contraseña" 
                  required
                  value={formData.password} 
                  onChange={handleChange}
                  className="w-full pl-11 pr-11 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isRegistering && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    placeholder="Confirmar contraseña" 
                    required
                    value={formData.confirmPassword} 
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-transparent outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={clsx(
                  "mt-2 w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                  loading 
                    ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed shadow-none" 
                    : isRegistering
                      ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/10"
                      : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/10"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? "Crear Cuenta" : "Iniciar Sesión")}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                {isRegistering ? "¿Ya eres parte del equipo?" : "¿Aún no tienes cuenta?"}
              </p>
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(""); 
                  setFormData({ email: '', password: '', username: '', avatar: '' }); 
                  setShowPassword(false);
                }}
                className={clsx(
                  "text-sm font-bold hover:underline transition-all",
                  isRegistering ? "text-purple-600 dark:text-purple-400" : "text-primary-600 dark:text-primary-400"
                )}
              >
                {isRegistering ? "Inicia Sesión" : "Regístrate Ahora"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Login;