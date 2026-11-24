import React, { useState } from 'react';
import { ChevronDown, Trash2, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import YouTubePreview from './YouTubePreview';
import { thumbnailImageSrc } from '../utils/image';

function moveToPosition(items, from, to) {
  const reordered = [...items];
  const [item] = reordered.splice(from, 1);
  reordered.splice(to, 0, item);
  return reordered;
}

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
  // Las claves siguen a cada elemento aunque su URL cambie, esté vacía o se repita.
  const [itemKeys, setItemKeys] = useState([]);
  const nextKey = itemKeys.reduce((next, key) => Math.max(next, key + 1), 0);
  const keys = gallery.map((_, index) => itemKeys[index] ?? nextKey + index);

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
  };

  const handleRemoveImage = (index) => {
    setItemKeys(keys.filter((_, i) => i !== index));
    onChange(gallery.filter((_, i) => i !== index));
  };

  const moveItem = (from, to) => {
    if (from === to) return;
    setItemKeys(moveToPosition(keys, from, to));
    onChange(moveToPosition(gallery, from, to));
  };

  return (
    <div className="space-y-4">
      {/* SECCIÓN DE IMAGEN PRINCIPAL (PORTADA) */}
      {showMainImage && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Imagen de Portada *
          </label>
          
          <div className="w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 relative shadow-sm flex items-center justify-center">
            {mainImage && mainImage.trim() ? (
              <img 
                key={`main-cover-${mainImage}`}
                src={thumbnailImageSrc(mainImage)}
                alt="Portada" 
                className="w-full h-full object-cover" 
                loading="lazy"
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
            aria-invalid={Boolean(mainImageError)}
            value={mainImage} 
            onChange={(e) => onMainImageChange && onMainImageChange(e)} 
            placeholder="https://i.imgur.com/tu-imagen.png" 
            className={clsx(
              "w-full px-4 py-2.5 text-sm bg-white dark:bg-[#1D1F23] border rounded-xl outline-none dark:text-white transition-colors",
              mainImageError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
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
            const inline = layout === 'inline';
            const invalid = !!url.trim() && !isValidUrl(url);
            const position = index + 1;

            return (
              <div key={keys[index]} role="group" aria-label={`Elemento ${position} de la galería`}
                className={clsx("min-w-0", inline
                  ? "flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1D1F23]"
                  : "space-y-1.5")}>
                <div className={clsx("flex aspect-video items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900",
                  inline ? "w-20 shrink-0 rounded-lg sm:w-24" : "w-full rounded-xl border border-gray-200 dark:border-gray-800")}>
                  {mediaType === 'empty' && <span className="text-xs text-gray-400">URL vacía</span>}
                  {mediaType === 'image' && (
                    <img key={url} src={thumbnailImageSrc(url)} alt={`Galería ${position}`} loading="lazy"
                      className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                  )}
                  {inline && (mediaType === 'youtube' || mediaType === 'video') && (
                    <span className={clsx("flex h-full w-full items-center justify-center text-xs font-bold", mediaType === 'youtube'
                      ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400")}>
                      {mediaType === 'youtube' ? 'YouTube' : 'Video'}
                    </span>
                  )}
                  {!inline && mediaType === 'youtube' && ytId && (
                    <YouTubePreview key={ytId} videoId={ytId} title={`video de la galería, posición ${position}`} />
                  )}
                  {!inline && mediaType === 'video' && (
                    <video key={url} src={url} className="h-full w-full object-cover" controls preload="metadata" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    type={inline ? 'url' : 'text'}
                    value={url}
                    aria-label={`URL del elemento ${position} de la galería`}
                    aria-invalid={invalid}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder={placeholder}
                    className={clsx("w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-xs outline-none dark:bg-[#1D1F23] dark:text-white",
                      invalid ? "border-red-500" : "border-gray-300 dark:border-gray-700")}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <div className="relative min-w-0">
                      <select
                        aria-label={`Posición del elemento ${position}`}
                        value={index}
                        disabled={gallery.length < 2}
                        onChange={(event) => moveItem(index, Number(event.target.value))}
                        className="h-9 max-w-full cursor-pointer appearance-none rounded-lg bg-transparent pl-2 pr-6 text-xs font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-primary-500 disabled:cursor-default dark:text-gray-300 dark:hover:bg-white/5 dark:[color-scheme:dark]"
                      >
                        {gallery.map((_, i) => <option key={i} value={i}>Posición {i + 1}</option>)}
                      </select>
                      <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(index)}
                      aria-label={`Eliminar elemento ${position} de la galería`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GalleryInput;
