import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';

const GalleryInput = ({ 
  gallery = [], 
  onChange,
  placeholder = "URL de imagen, video o YouTube...",
  layout = 'grid' // 'grid' (estilo actual) o 'inline' (horizontal)
}) => {
  const [mediaTypes, setMediaTypes] = useState({});
  const [urlErrors, setUrlErrors] = useState({});

  const isValidUrl = (url) => {
    if (!url) return true; // URLs vacías son válidas (opcional)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const detectMediaType = (url) => {
    if (!url) return 'image';
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (youtubeRegex.test(url)) return 'youtube';
    
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv'];
    if (videoExtensions.some(ext => url.toLowerCase().endsWith(ext))) return 'video';
    
    return 'image';
  };

  const handleAddImage = () => {
    onChange([...gallery, '']);
  };

  const handleImageChange = (index, value) => {
    const newGallery = [...gallery];
    newGallery[index] = value;
    onChange(newGallery);
    
    // Detectar tipo de media automáticamente
    if (value) {
      setMediaTypes(prev => ({ ...prev, [index]: detectMediaType(value) }));
    }
    
    // Validar URL
    setUrlErrors(prev => ({
      ...prev,
      [index]: !isValidUrl(value)
    }));
  };

  const handleRemoveImage = (index) => {
    onChange(gallery.filter((_, i) => i !== index));
    setMediaTypes(prev => {
      const newTypes = { ...prev };
      delete newTypes[index];
      return newTypes;
    });
  };

  const handleMediaError = (index, currentType) => {
    if (currentType === 'image') {
      // Intentar como video si falla la imagen
      const url = gallery[index];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv'];
      const isVideo = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      const isYoutube = youtubeRegex.test(url);
      
      if (isVideo) {
        setMediaTypes(prev => ({ ...prev, [index]: 'video' }));
      } else if (isYoutube) {
        setMediaTypes(prev => ({ ...prev, [index]: 'youtube' }));
      }
    } else if (currentType === 'video') {
      // Fallback a imagen si falla el video
      setMediaTypes(prev => ({ ...prev, [index]: 'image' }));
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Galería</label>
        <button
          type="button"
          onClick={handleAddImage}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          + Agregar
        </button>
      </div>
      <div className={layout === 'inline' ? "space-y-2" : "grid grid-cols-2 gap-3"}>
        {gallery.map((url, index) => (
          <div key={index} className="relative group w-full">
            {layout === 'inline' ? (
              // Estilo inline: imagen, URL y botón en la misma fila
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#191B1E] p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                {/* Thumbnail */}
                <div className="h-14 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                  {url ? (
                    mediaTypes[index] === 'youtube' ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900/20">
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold">YouTube</span>
                      </div>
                    ) : mediaTypes[index] === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Video</span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Galería ${index}`}
                        className="w-full h-full object-cover"
                        onError={() => handleMediaError(index, 'image')}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <span className="text-xs text-gray-400">Vacio</span>
                    </div>
                  )}
                </div>
                {/* Input URL */}
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder={placeholder}
                  className={clsx(
                    "flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#191B1E] border outline-none dark:text-white min-w-0",
                    urlErrors[index] ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                  )}
                />
                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              // Estilo grid: imagen arriba, URL abajo
              <>
                {url ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    {mediaTypes[index] === 'youtube' ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(url)}`}
                        title={`Galería ${index}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : mediaTypes[index] === 'video' ? (
                      <video
                        src={url}
                        alt={`Galería ${index}`}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        onError={() => handleMediaError(index, 'video')}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Galería ${index}`}
                        className="w-full h-full object-cover"
                        onError={() => handleMediaError(index, 'image')}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <span className="text-xs text-gray-400">URL vacía</span>
                  </div>
                )}
                <div className="mt-2 flex gap-2 w-full">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#191B1E] border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryInput;
