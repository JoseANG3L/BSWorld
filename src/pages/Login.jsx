import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, Lock, User, ArrowRight, Loader2, AlertCircle, 
  Image as ImageIcon, Sparkles, Eye, EyeOff, Sun, Moon, Home 
} from 'lucide-react';
import { FaGoogle, FaGithub, FaDiscord } from 'react-icons/fa';
import { clsx } from 'clsx';

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b', 
  '#18181b', '#78350f', '#881337', '#1e3a8a', '#134e4a'
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, signInWithProvider } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    // Leemos si existe el parámetro '?register=true' en la URL actual
    const searchParams = new URLSearchParams(location.search);
    const registerParam = searchParams.get('register') === 'true';

    if (registerParam) {
      setIsRegistering(true);
    } else if (location.state && location.state.isRegistering !== undefined) {
      setIsRegistering(location.state.isRegistering);
    } else {
      setIsRegistering(false);
    }

    // Limpiamos estados al montar
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
  }, [location.search, location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      
      // Sincroniza la pestaña de origen (si sigue abierta) y cierra la actual
      if (window.opener) {
        window.opener.location.reload(); 
        window.close();
      } else {
        navigate("/"); // Respaldo si entraron de forma directa
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
    } catch (err) {
      console.error(err);
      setError(`Error al iniciar sesión con ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center animate-fade-in-up" style={{ animationDuration: '200ms' }}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        {/* BOTÓN REGRESAR AL INICIO */}
        <Link 
          to="/" 
          className="p-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center"
          title="Volver al inicio"
        >
          <Home size={18} />
        </Link>

        {/* BOTÓN DARK MODE */}
        <button 
          type="button"
          onClick={toggleTheme} 
          className="p-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center"
          title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div className="w-full min-h-screen bg-white dark:bg-[#1e1e1e] relative overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* PANEL IZQUIERDO: DECORATIVO INSTITUCIONAL (Invisible en móviles) */}
        <div className={clsx(
          "hidden md:flex md:w-1/2 p-10 flex-col justify-between text-white relative transition-all duration-500",
          isRegistering ? "bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700" : "bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700"
        )}>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">BombSquad World</h3>
            <p className="text-white/80 text-sm">Gestiona y comparte las mejores modificaciones del ecosistema.</p>
          </div>
          
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight">
              {isRegistering ? "Sé parte de algo grande" : "¡Qué bueno verte de nuevo!"}
            </h1>
            <p className="text-white/90 text-sm leading-relaxed">
              {isRegistering 
                ? "Regístrate para interactuar con la comunidad, subir tus propios proyectos y personalizar tu perfil al máximo." 
                : "Inicia sesión para volver a tu panel de administración, revisar tus mods cargados y recibir notificaciones de moderación."}
            </p>
          </div>
          
          <div className="text-xs text-white/50 font-medium">
            &copy; {new Date().getFullYear()} BSWorld Network. Todos los derechos reservados.
          </div>
        </div>

        {/* PANEL DERECHO: FORMULARIO AUTÉNTICO */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center pt-16 md:pt-0">

          {/* 👇 CONTENEDOR RESTRICTOR (Ajusta el ancho para que no se estire) */}
          <div className="w-full max-w-md mx-auto flex flex-col justify-center">
          
            {/* Encabezado en móvil */}
            <div className="text-center md:text-left mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
                {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isRegistering ? "Únete a la plataforma global de mods" : "Ingresa tus credenciales para continuar"}
              </p>
            </div>

            {/* Manejo de Alertas */}
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" /> 
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* INICIO DE SESIÓN SOCIAL */}
            <div className="space-y-2.5 mb-5">
              <button 
                type="button"
                disabled={loading}
                onClick={() => handleSocialLogin('google')} 
                className="w-full py-2.5 flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all disabled:opacity-50 shadow-sm"
              >
                <FaGoogle className="text-red-500 text-base" /> Continuar con Google
              </button>
              
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('github')} 
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all disabled:opacity-50 shadow-sm"
                >
                  <FaGithub className="text-base" /> GitHub
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin('discord')} 
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all disabled:opacity-50 shadow-sm"
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
                <div className="flex flex-col gap-3.5 animate-fade-in-up" style={{ animationDuration: '150ms' }}>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input 
                      type="text" name="username" placeholder="Nombre de usuario" required={isRegistering}
                      value={formData.username} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  type="email" name="email" placeholder="Correo electrónico" required
                  value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
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
                  className="w-full pl-11 pr-11 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* verificar contraseña */}
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
                    className="w-full pl-11 pr-11 py-3 rounded-xl dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className={clsx(
                  "mt-2 w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform",
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

            {/* Alternador de Modo */}
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
    </div>
  );
};

export default Login;