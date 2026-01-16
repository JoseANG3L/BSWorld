import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // 1. Imports de navegación
import { 
  Save, Plus, Trash2, Image as ImageIcon, 
  Link as LinkIcon, Users, Tag, Type, Layers, Calendar, Eye, PenTool 
} from 'lucide-react';
import { clsx } from 'clsx';
// 2. Importar nuevas funciones de la API
import { createContent, getContentById, updateContent } from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const AdminUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 3. DETECTAR MODO EDICIÓN
  // Si la URL tiene ?edit=xyz, guardamos ese ID
  const editId = searchParams.get('edit'); 
  const isEditing = !!editId; // Booleano: true si estamos editando

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId); // Estado de carga inicial (solo si editamos)

  // --- ESTADOS DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'mod',
    imagen: '',
    creadores: '', 
    tags: '',
    creado: new Date().toISOString().split('T')[0] 
  });

  const [descargas, setDescargas] = useState([
    { label: 'Descarga Principal', url: '' }
  ]);

  // --- 4. EFECTO PARA CARGAR DATOS (SI EDITAMOS) ---
  useEffect(() => {
    const loadDataForEdit = async () => {
      if (!isEditing) return;

      try {
        const data = await getContentById(editId);
        if (data) {
          // CONVERTIR DATOS DE DB A FORMATO FORMULARIO
          
          // A. Creadores (Array de objetos -> String "Nombre1, Nombre2")
          const creadoresString = data.creadores 
            ? data.creadores.map(c => c.nombre).join(', ') 
            : '';

          // B. Tags (Array -> String, quitando el Tipo para que no se duplique)
          // Filtramos el tag que sea igual al tipo para no mostrarlo en el input
          const tagsString = data.tags 
            ? data.tags.filter(t => t !== data.tipo).join(', ') 
            : '';

          // C. Fecha (ISO String -> YYYY-MM-DD para el input date)
          const fechaInput = data.creado 
            ? new Date(data.creado).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];

          setFormData({
            titulo: data.titulo || '',
            tipo: data.tipo || 'mod',
            imagen: data.imagen || '',
            creadores: creadoresString,
            tags: tagsString,
            creado: fechaInput
          });

          if (data.descargas && data.descargas.length > 0) {
            setDescargas(data.descargas);
          }
        } else {
          alert("No se encontró el contenido a editar");
          navigate('/admin'); // Volver si no existe
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };

    loadDataForEdit();
  }, [editId, isEditing, navigate]);


  // --- MANEJADORES ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDownloadChange = (index, field, value) => {
    const newDescargas = [...descargas];
    newDescargas[index][field] = value;
    setDescargas(newDescargas);
  };

  const addDownloadField = () => {
    setDescargas([...descargas, { label: '', url: '' }]);
  };

  const removeDownloadField = (index) => {
    const newDescargas = descargas.filter((_, i) => i !== index);
    setDescargas(newDescargas);
  };

  // --- PREVIEW HELPERS ---
  const getPreviewCreators = () => {
    if (!formData.creadores) return [];
    
    return formData.creadores.split(',').map(text => {
      const nombreLimpio = text.trim();
      if (!nombreLimpio) return null;

      const miNombre = user?.displayName || user?.username;
      
      if (miNombre && nombreLimpio.toLowerCase() === miNombre.toLowerCase()) {
        return {
          nombre: nombreLimpio,
          imagen: user.photoURL || user.avatar
        };
      }

      return {
        nombre: nombreLimpio,
        imagen: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nombreLimpio}`
      };
    }).filter(Boolean);
  };

  const getPreviewTags = () => {
    const userTags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : ["TAG1", "TAG2"];
    return [formData.tipo, ...userTags];
  };

  // --- ENVÍO A FIREBASE (LÓGICA DUAL) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const creadoresProcesados = getPreviewCreators();
      const nombresBusqueda = creadoresProcesados.map(c => c.nombre);
      const userTags = formData.tags.split(',').map(s => s.trim()).filter(s => s);
      const finalTags = [formData.tipo, ...userTags];

      const payload = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        imagen: formData.imagen,
        creadores: creadoresProcesados,
        nombresBusqueda: nombresBusqueda,
        tags: finalTags,
        descargas: descargas.filter(d => d.url !== ''),
        creado: new Date(formData.creado).toISOString() 
      };

      // 5. DECISIÓN: CREAR O ACTUALIZAR
      if (isEditing) {
        await updateContent(editId, payload);
        alert("¡Contenido actualizado correctamente!");
        navigate('/admin'); // Redirigir al panel tras editar
      } else {
        await createContent(payload);
        alert("¡Contenido creado con éxito!");
        // Resetear solo si estamos creando
        setFormData({
            titulo: '', tipo: 'mod', imagen: '', creadores: '', tags: '', 
            creado: new Date().toISOString().split('T')[0] 
        });
        setDescargas([{ label: 'Descarga Principal', url: '' }]);
      }

    } catch (error) {
      console.error(error);
      alert("Error al guardar. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  // Si estamos cargando los datos para editar, mostramos un loader simple
  if (fetching) return <div className="p-10 text-center">Cargando datos...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in-up px-4 md:px-0">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <div className={clsx(
          "p-3 rounded-xl text-white shadow-lg",
          isEditing ? "bg-blue-600 shadow-blue-600/30" : "bg-primary-600 shadow-primary-600/30"
        )}>
          {isEditing ? <PenTool size={24} /> : <Layers size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Editar Contenido" : "Panel de Carga"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isEditing ? `Editando ID: ${editId}` : "Sube nuevo contenido a la base de datos."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                Información General
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" name="titulo" required
                      value={formData.titulo} onChange={handleChange}
                      placeholder="Ej: SkyBlock Ultimate"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select 
                    name="tipo" 
                    value={formData.tipo} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  >
                    <option value="mapa">Mapa</option>
                    <option value="minijuego">Minijuego</option>
                    <option value="modpack">Modpack</option>
                    <option value="mod">Mod</option>
                    <option value="paquete">Paquete</option>
                    <option value="personaje">Personaje</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Publicado el</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" name="creado" required
                      value={formData.creado} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white appearance-none"
                    />
                  </div>
                </div>

                {/* Imagen */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">URL de Imagen (Horizontal)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="url" name="imagen" required
                      value={formData.imagen} onChange={handleChange}
                      placeholder="https://imgur.com/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Creadores */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Creadores (separar por comas)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" name="creadores"
                      value={formData.creadores} onChange={handleChange}
                      placeholder="Ej: Mojang, TuUsuario"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Si pones tu nombre de usuario, se usará tu avatar.</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags (separar por comas)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" name="tags"
                      value={formData.tags} onChange={handleChange}
                      placeholder="Ej: Aventura, PvP"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DESCARGAS */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Enlaces de Descarga</h3>
                <button 
                  type="button" onClick={addDownloadField}
                  className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                >
                  <Plus size={16} /> Agregar Link
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {descargas.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end animate-fade-in-up">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Etiqueta</label>
                      <input 
                        type="text" placeholder="Ej: Mediafire"
                        value={item.label}
                        onChange={(e) => handleDownloadChange(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary-500 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-xs text-gray-500 mb-1 block">URL</label>
                      <div className="relative">
                         <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                         <input 
                          type="url" placeholder="https://..."
                          value={item.url}
                          onChange={(e) => handleDownloadChange(index, 'url', e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary-500 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    {descargas.length > 1 && (
                      <button 
                        type="button" onClick={() => removeDownloadField(index)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors mb-[1px]"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className={clsx(
                "w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all",
                loading ? "bg-gray-400 cursor-not-allowed" : (
                    isEditing 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 hover:scale-[1.01]" 
                    : "bg-primary-600 hover:bg-primary-700 shadow-primary-600/20 hover:scale-[1.01]"
                )
              )}
            >
              {loading 
                ? (isEditing ? "Actualizando..." : "Publicando...") 
                : (isEditing ? <><Save size={20} /> Actualizar Contenido</> : <><Save size={20} /> Guardar Contenido</>)
              }
            </button>
          </form>
        </div>

        {/* --- COLUMNA DERECHA: PREVIEW STICKY --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Eye size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wider">Vista Previa</h3>
            </div>

            <Card 
              imagen={formData.imagen || "/default.jpg"} 
              titulo={formData.titulo || "Título del Contenido"}
              descargas={descargas}
              creadores={getPreviewCreators().length > 0 ? getPreviewCreators() : [{nombre: "Creador", imagen: "https://via.placeholder.com/50"}]}
              tags={getPreviewTags()}
              isPreview={true}
            />

            <div className={clsx(
                "p-4 border rounded-xl text-xs",
                isEditing 
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-200" 
                  : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200"
            )}>
              <p>
                <strong>{isEditing ? "Modo Edición" : "Nota"}:</strong> 
                {isEditing ? " Estás modificando un contenido existente." : " Así se verá la tarjeta. El tipo se agregará como primer tag."}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUpload;