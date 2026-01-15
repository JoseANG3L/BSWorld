import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// 1. IMPORTAR Eye y EyeOff
import { 
  Mail, Lock, User, ArrowRight, Loader2, AlertCircle, 
  Image as ImageIcon, Sparkles, Eye, EyeOff 
} from 'lucide-react';
import { clsx } from 'clsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  
  // 2. ESTADO PARA LA CONTRASEÑA
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    avatar: ''
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.isRegistering !== undefined) {
      setIsRegistering(location.state.isRegistering);
      setError("");
      setFormData({ email: '', password: '', username: '', avatar: '' });
      setShowPassword(false); // Resetear visibilidad al cambiar modo
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (formData.password.length < 6) throw { code: 'weak-password' };
        await signup(formData.email, formData.password, formData.username, formData.avatar);
      } else {
        await login(formData.email, formData.password);
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      let msg = "Ocurrió un error inesperado.";
      if (err.code === 'custom/username-taken') msg = "Este nombre de usuario ya está ocupado.";
      else if (err.code === 'auth/invalid-credential') msg = "Correo o contraseña incorrectos.";
      else if (err.code === 'auth/user-not-found') msg = "No existe una cuenta con este correo.";
      else if (err.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
      else if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      else if (err.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
      else if (err.code === 'weak-password') msg = "La contraseña es muy corta (mínimo 6).";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-all duration-300">
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className={clsx(
            "w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-500",
            isRegistering ? "bg-gradient-to-br from-pink-500 to-purple-600" : "bg-gradient-to-br from-primary-600 to-indigo-600"
          )}>
            {isRegistering ? <Sparkles size={28} /> : <User size={28} />}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isRegistering ? "Únete a la comunidad de BSWorld" : "Ingresa para gestionar contenido"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle size={20} className="shrink-0" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          
          {isRegistering && (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  type="text" name="username" placeholder="Nombre de usuario" required={isRegistering}
                  value={formData.username} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                />
              </div>
              <div className="relative group">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input 
                  type="url" name="avatar" placeholder="URL de tu Avatar (Opcional)"
                  value={formData.avatar} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="email" name="email" placeholder="Correo electrónico" required
              value={formData.email} onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
            />
          </div>

          {/* 3. INPUT DE CONTRASEÑA CON OJO */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              // Cambiamos el tipo dinámicamente
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Contraseña" 
              required
              value={formData.password} 
              onChange={handleChange}
              // Agregamos pr-12 para que el texto no se monte sobre el ojo
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all dark:text-white"
            />
            
            {/* BOTÓN OJO */}
            <button
              type="button" // Importante: type="button" para que no envíe el formulario
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" disabled={loading}
            className={clsx(
              "mt-4 w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 transition-all transform active:scale-[0.98]",
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5"
            )}
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? "Crear Cuenta" : "Iniciar Sesión")}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center relative z-10">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {isRegistering ? "¿Ya eres parte del equipo?" : "¿Aún no tienes cuenta?"}
          </p>
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(""); 
              setFormData({ email: '', password: '', username: '', avatar: '' }); 
              setShowPassword(false);
            }}
            className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all"
          >
            {isRegistering ? "Inicia Sesión aquí" : "Regístrate gratis ahora"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;