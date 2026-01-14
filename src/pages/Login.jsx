import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 1. Importar useLocation
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

const Login = () => {
  const location = useLocation(); // 2. Obtener el estado de la navegación
  
  // 3. Inicializar el estado basado en si venimos del botón "Registrarse"
  const [isRegistering, setIsRegistering] = useState(location.state?.isRegistering || false);
  
  // ... El resto de tus estados (email, password, etc) ...
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // ... (El resto de funciones handleSubmit y el return se mantienen IGUAL) ...
  // Solo asegúrate de que el código anterior esté aquí.
  
  const handleSubmit = async (e) => { 
      /* ... tu lógica de submit ... */ 
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        if (isRegistering) {
            await signup(email, password, username, avatar);
        } else {
            await login(email, password);
        }
        navigate("/");
      } catch (err) {
          // ... manejo errores ...
          setError("Error de autenticación");
      } finally {
          setLoading(false);
      }
  };

  return (
      // ... Tu JSX del Login ...
      // Asegúrate de que este botón al final cambie el estado:
      // onClick={() => setIsRegistering(!isRegistering)}
      
      <div className="min-h-[80vh] flex items-center justify-center animate-fade-in-up">
        {/* ... Contenido del form ... */}
        {/* Aquí solo pongo el trozo del form para resumir, usa tu código completo */}
        <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 relative">
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                {isRegistering ? "Crear Cuenta" : "Hola de nuevo"}
            </h2>
            {/* ... Inputs y Botones ... */}
             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                 {/* ... Inputs ... */}
                 {isRegistering && (
                    <>
                        {/* Inputs extra para registro */}
                         <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none dark:text-white"/></div>
                    </>
                 )}
                 {/* Inputs Email/Pass */}
                 <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none dark:text-white"/></div>
                 <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="password" placeholder="Pass" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none dark:text-white"/></div>

                 <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 rounded-xl bg-primary-600 text-white font-bold">{isRegistering ? "Registrarse" : "Entrar"}</button>
             </form>
             
             <div className="mt-6 text-center">
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-gray-600 dark:text-gray-400">
                    {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate"}
                </button>
             </div>
        </div>
      </div>
  );
};

export default Login;