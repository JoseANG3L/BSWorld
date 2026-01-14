import React, { useState } from 'react';
import { 
  Save, Plus, Trash2, Image as ImageIcon, 
  Link as LinkIcon, Users, Tag, Type, Layers, Calendar, Eye 
} from 'lucide-react';
import { clsx } from 'clsx';
import { createContent } from '../services/api';
import Card from '../components/Card'; // Importamos el componente Card existente

const AdminUpload = () => {
  const [loading, setLoading] = useState(false);
  
  // Estado principal del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'personaje',
    imagen: '',
    creadores: '',
    tags: '',
    creado: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto (YYYY-MM-DD)
  });

  // Estado para las descargas (Array dinámico)
  const [descargas, setDescargas] = useState([
    { label: 'Descarga Principal', url: '' }
  ]);

  // --- HANDLERS ---
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

  // --- ENVÍO A FIREBASE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Procesar datos (Strings a Arrays)
      const creadoresArray = formData.creadores.split(',').map(s => s.trim()).filter(s => s);
      const tagsArray = formData.tags.split(',').map(s => s.trim()).filter(s => s);

      // 2. Construir objeto final
      const payload = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        imagen: formData.imagen,
        creadores: creadoresArray,
        tags: tagsArray,
        descargas: descargas.filter(d => d.url !== ''), // Limpiar descargas vacías
        // Convertir la fecha del input a ISO String completo para Firebase
        creado: new Date(formData.creado).toISOString() 
        // 'actualizado' se genera automáticamente en la API
      };

      // 3. Llamar a la API
      await createContent(payload);
      
      alert("¡Contenido subido correctamente!");
      
      // 4. Limpiar formulario
      setFormData({
        titulo: '',
        tipo: 'personaje',
        imagen: '',
        creadores: '',
        tags: '',
        creado: new Date().toISOString().split('T')[0]
      });
      setDescargas([{ label: 'Descarga Principal', url: '' }]);

    } catch (error) {
      alert("Error al subir contenido. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in-up">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-600/30">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestor de Contenido</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sube mapas, mods y personajes a la base de datos.</p>
        </div>
      </div>

      {/* GRID PRINCIPAL: 2 Columnas (Formulario izq, Preview der) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- COLUMNA 1: FORMULARIO (Ocupa 2 espacios) --- */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* SECCIÓN DATOS BÁSICOS */}
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
                    <option value="personaje">Personaje</option>
                    <option value="mapa">Mapa</option>
                    <option value="minijuego">Minijuego</option>
                    <option value="mod">Mod</option>
                    <option value="modpack">Modpack</option>
                    <option value="paquete">Texture Pack</option>
                  </select>
                </div>

                {/* Fecha Creación */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha Publicación</label>
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">URL de Imagen (16:9 Recomendado)</label>
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Creadores (separar con comas)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" name="creadores"
                      value={formData.creadores} onChange={handleChange}
                      placeholder="Ej: Mojang, Notch"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags (separar con comas)</label>
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

            {/* SECCIÓN ENLACES DE DESCARGA */}
            <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Gestor de Enlaces</h3>
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
                        type="text" placeholder="Ej: Versión PC"
                        value={item.label}
                        onChange={(e) => handleDownloadChange(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:border-primary-500 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-xs text-gray-500 mb-1 block">URL de Descarga</label>
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
                "w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 transition-all",
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 hover:scale-[1.01]"
              )}
            >
              {loading ? "Subiendo..." : <><Save size={20} /> Guardar Contenido</>}
            </button>
          </form>
        </div>

        {/* --- COLUMNA 2: PREVISUALIZACIÓN (STICKY) --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Eye size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wider">Vista Previa</h3>
            </div>

            {/* AQUI RENDERIZAMOS EL COMPONENTE CARD REAL */}
            {/* Pasamos los datos del form al componente Card simulando cómo se verá */}
            <div className="pointer-events-none select-none"> {/* pointer-events-none para que no cliquen 'Descargar' en el preview */}
              <Card 
                image={formData.imagen || "https://via.placeholder.com/640x360?text=Sin+Imagen"} 
                title={formData.titulo || "Título del Contenido"}
                creator={formData.creadores || "Creador"}
                downloads={descargas} // Pasamos el array de descargas actual
                // Convertimos el string de tags a array para que el Card lo lea bien
                tags={formData.tags ? formData.tags.split(',').filter(t => t.trim()) : ["TAG1", "TAG2"]}
              />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl text-xs text-yellow-800 dark:text-yellow-200">
              <p><strong>Nota:</strong> Esta es una representación aproximada de cómo se verá la tarjeta en el listado.</p>
            </div>

            {/* Debug (Opcional, para ver el JSON crudo) */}
            <details className="mt-4">
              <summary className="text-xs text-gray-400 cursor-pointer">Ver JSON Crudo</summary>
              <pre className="mt-2 p-3 bg-gray-100 dark:bg-black/30 rounded-lg text-[10px] text-gray-500 font-mono overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </details>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUpload;