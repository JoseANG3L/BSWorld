import React, { useState } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

const GalleryInput = ({ 
  gallery = [], 
  onChange,
  showMainImage = false,
  mainImage = '',
  onMainImageChange,
  mainImageError = false,
  placeholder = "URL de imagen, video o YouTube...",
  layout = 'grid'
}) => {
  const [urlErrors, setUrlErrors] = useState({});

  const isValidUrl = (url) => {
    if (!url) return true;
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
    if (!url || !url.trim()) return 'empty';
    
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

    if (value.trim()) {
      setUrlErrors(prev => ({ ...prev, [index]: !isValidUrl(value) }));
    } else {
      setUrlErrors(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    }
  };

  const handleRemoveImage = (index) => {
    onChange(gallery.filter((_, i) => i !== index));
    setUrlErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  return (
    <div className="space-y-4">
      {/* SECCIÓN DE IMAGEN PRINCIPAL (PORTADA) */}
      {showMainImage && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Imagen de Portada *
          </label>
          
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 relative shadow-sm flex items-center justify-center">
            {mainImage && mainImage.trim() ? (
              <img 
                key={`main-cover-${mainImage}`}
                src={mainImage} 
                alt="Portada" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.style.opacity = '0';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-xs font-medium gap-1.5">
                <ImageIcon size={24} className="opacity-40" />
                <span>URL de portada vacía</span>
              </div>
            )}
          </div>

          <input 
            type="url" 
            name="imagen" 
            value={mainImage} 
            onChange={(e) => onMainImageChange && onMainImageChange(e)} 
            placeholder="https://i.imgur.com/tu-imagen.png" 
            className={clsx(
              "w-full px-4 py-2.5 text-sm bg-white dark:bg-[#1D1F23] border rounded-xl outline-none dark:text-white transition-colors",
              mainImageError ? "border-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
            )}
          />
        </div>
      )}

      {/* SECCIÓN DE GALERÍA SECUNDARIA */}
      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Galería Secundaria
          </label>
          <button
            type="button"
            onClick={handleAddImage}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            + Agregar
          </button>
        </div>

        <div className={layout === 'inline' ? "space-y-2" : "grid grid-cols-2 gap-3"}>
          {gallery.map((url, index) => {
            const mediaType = detectMediaType(url);
            const ytId = mediaType === 'youtube' ? getYoutubeId(url) : null;

            return (
              <div key={`gallery-item-${index}`} className="relative group w-full">
                {layout === 'inline' ? (
                  /* ESTILO INLINE */
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1D1F23] p-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="h-14 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0 flex items-center justify-center">
                      {mediaType === 'empty' && (
                        <span className="text-[10px] text-gray-400">Vacío</span>
                      )}

                      {mediaType === 'youtube' && (
                        <div className="w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900/20">
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">YouTube</span>
                        </div>
                      )}

                      {mediaType === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Video</span>
                        </div>
                      )}

                      {mediaType === 'image' && (
                        <img
                          key={`img-${url}`}
                          src={url}
                          alt={`Galería ${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.opacity = '0';
                          }}
                        />
                      )}
                    </div>

                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={placeholder}
                      className={clsx(
                        "flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#1D1F23] border outline-none dark:text-white min-w-0",
                        urlErrors[index] ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  /* ESTILO GRID */
                  <>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      {mediaType === 'empty' && (
                        <span className="text-xs text-gray-400">URL vacía</span>
                      )}

                      {mediaType === 'youtube' && ytId && (
                        <iframe
                          key={`yt-${ytId}`}
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={`Galería ${index}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}

                      {mediaType === 'video' && (
                        <video
                          key={`vid-${url}`}
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      )}

                      {mediaType === 'image' && (
                        <img
                          key={`img-${url}`}
                          src={url}
                          alt={`Galería ${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.opacity = '0';
                          }}
                        />
                      )}
                    </div>

                    <div className="mt-2 flex gap-2 w-full">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white min-w-0"
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GalleryInput;