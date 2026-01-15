import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContentByCreator, getUserByUsername } from '../services/api';
import Card from '../components/Card';
import { 
  Calendar, Shield, Layers, Map, UserX, Loader2, Sparkles, CheckCircle 
} from 'lucide-react';
import { clsx } from 'clsx';

const PublicProfile = () => {
  const { username } = useParams(); // Obtenemos el nombre de la URL (ej: /u/Steve)
  
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Intentar buscar datos del usuario registrado
        const userData = await getUserByUsername(username);
        setProfile(userData);

        // 2. Buscar contenido creado por este nombre
        const userContent = await getContentByCreator(username);
        setContent(userContent);
        
        // 3. Si no hay usuario registrado NI contenido, no existe.
        if (!userData && userContent.length === 0) {
            setExists(false);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username]);

  // --- ESTADO DE CARGA ---
  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-primary-600" size={40}/>
      <p className="text-gray-400 text-sm font-medium animate-pulse">Buscando perfil...</p>
    </div>
  );

  // --- ESTADO DE NO ENCONTRADO ---
  if (!exists) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
           <UserX size={64} className="text-gray-400"/>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Usuario no encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          No existe nadie con el nombre <span className="font-bold text-primary-600">"{username}"</span> ni ha publicado contenido en la plataforma.
        </p>
    </div>
  );

  // --- DATOS DE VISUALIZACIÓN ---
  // Si no hay avatar real, usamos DiceBear con el nombre
  const displayAvatar = profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  
  // Formatear fecha
  const joinDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) 
    : null;

  return (
    <div className="animate-fade-in-up">
      
      {/* --- SECCIÓN HERO (BANNER + INFO) --- */}
      <div className="relative">
        
        {/* Banner de Fondo */}
        <div className="h-48 md:h-64 rounded-3xl bg-gradient-to-r from-primary-900 via-purple-900 to-indigo-900 relative overflow-hidden shadow-inner">
           {/* Decoración de fondo */}
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary-500/30 rounded-full blur-3xl"></div>
        </div>
        
        {/* Contenedor de Info Flotante */}
        <div className="absolute -bottom-16 md:-bottom-20 left-6 md:left-12 flex flex-col md:flex-row items-start md:items-end gap-6 w-[calc(100%-3rem)]">
          
          {/* Avatar Grande */}
          <div className="relative group">
            <div className="rounded-full shadow-xl">
              <img 
                src={displayAvatar} 
                alt={username} 
                className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 border-white dark:border-[#1e1e1e] bg-gray-200 dark:bg-gray-800"
              />
            </div>
            {/* Indicador Online (Opcional / Decorativo) */}
            <span className="absolute bottom-4 right-4 w-5 h-5 bg-green-500 border-4 border-white dark:border-[#1e1e1e] rounded-full"></span>
          </div>
          
          {/* Textos y Badges */}
          <div className="mb-2 md:mb-6 bg-white dark:bg-[#1e1e1e] rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-lg border border-gray-300 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white drop-shadow-sm tracking-tight">
                    {profile?.displayName || username}
                </h1>
                
                {/* Badge Verificado / Admin */}
                {profile?.role === 'admin' ? (
                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 text-xs font-bold uppercase border border-yellow-200 dark:border-yellow-500/30 shadow-sm self-start md:self-auto">
                       <Shield size={12} className="fill-current" /> Admin
                   </span>
                ) : profile ? (
                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-bold uppercase border border-blue-200 dark:border-blue-500/30 shadow-sm self-start md:self-auto">
                       <CheckCircle size={12} /> Verificado
                   </span>
                ) : (
                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs font-bold uppercase border border-gray-200 dark:border-gray-700 self-start md:self-auto">
                       Creador
                   </span>
                )}
            </div>

            {/* Estadísticas */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                {joinDate && (
                    <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400" /> 
                        <span>Miembro desde {joinDate}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <Layers size={16} className="text-gray-400" />
                    <span>{content.length} {content.length === 1 ? 'Publicación' : 'Publicaciones'}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ESPACIADOR RESPONSIVE --- */}
      <div className="h-24 md:h-28"></div> 
      {/* Ajustamos altura porque en móvil los elementos se apilan diferente */}

      {/* --- GRID DE CONTENIDO --- */}
      <div className="">
        <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portafolio Creativo
            </h2>
        </div>

        {content.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {content.map((item) => (
               <Card 
                 key={item.id}
                 {...item} // Pasamos todas las props (titulo, imagen, creadores, etc)
               />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#1e1e1e] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
             <Map size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
             <p className="text-gray-500 font-medium">Este usuario aún no ha publicado contenido.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default PublicProfile;