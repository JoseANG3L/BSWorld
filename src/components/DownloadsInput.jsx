import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Trash2 } from 'lucide-react';

const DownloadsInput = ({ 
  downloads = [], 
  onChange,
  presets = ['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.42)', 'API 6 (1.7.41)'],
  defaultPreset = 'API 9 (1.7.44+)',
  customLabel = 'Personalizado',
  customPlaceholder = 'Mi URL personalizada'
}) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [urlErrors, setUrlErrors] = useState({});
  const versionDropdownRefs = useRef([]);

  const isValidUrl = (url) => {
    if (!url) return true; // URLs vacías son válidas (opcional)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddDownload = () => {
    onChange([...downloads, { presetLabel: defaultPreset, label: defaultPreset, url: '' }]);
  };

  const handleDownloadChange = (index, field, value) => {
    const newDownloads = [...downloads];
    newDownloads[index][field] = value;
    
    // Si cambia presetLabel y no es Personalizado, actualizar label automáticamente
    if (field === 'presetLabel' && value !== customLabel) {
      newDownloads[index].label = value;
    } else if (field === 'presetLabel' && value === customLabel) {
      // Si es Personalizado, asegurarse de que label tenga un valor vacío para mostrar el input
      newDownloads[index].label = '';
    }
    
    // Validar URL si cambia el campo url
    if (field === 'url') {
      setUrlErrors(prev => ({
        ...prev,
        [index]: !isValidUrl(value)
      }));
    }
    
    onChange(newDownloads);
  };

  const handleRemoveDownload = (index) => {
    onChange(downloads.filter((_, i) => i !== index));
  };

  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [`version-${index}`]: !prev[`version-${index}`]
    }));
  };

  // Click outside para cerrar dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      versionDropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setOpenDropdowns(prev => ({ ...prev, [`version-${index}`]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Descargas</label>
        <button
          type="button"
          onClick={handleAddDownload}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          + Agregar
        </button>
      </div>
      
      <div className="space-y-2">
        {downloads.map((download, index) => (
          <div key={index} className="flex items-center gap-1">
            {/* Selector de preset */}
            <div className="relative min-w-40 w-40" ref={(el) => versionDropdownRefs.current[index] = el}>
              <button
                type="button"
                onClick={() => toggleDropdown(index)}
                className="w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left"
              >
                <span className="truncate block">{download.presetLabel}</span>
              </button>
              <ChevronDown 
                size={14} 
                className={clsx(
                  "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200",
                  openDropdowns[`version-${index}`] && "rotate-180"
                )} 
              />
              
              {openDropdowns[`version-${index}`] && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1">
                  <div className="flex flex-col gap-0.5">
                    {[...presets, customLabel].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          handleDownloadChange(index, 'presetLabel', preset);
                          setOpenDropdowns(prev => ({ ...prev, [`version-${index}`]: false }));
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          download.presetLabel === preset
                            ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Label editable (solo si es Personalizado) */}
            {download.presetLabel === customLabel && (
              <input
                type="text"
                value={download.label || ''}
                onChange={(e) => handleDownloadChange(index, 'label', e.target.value)}
                placeholder={customPlaceholder}
                className="min-w-42 w-42 px-3 py-2 text-sm bg-white dark:bg-[#1D1F23] transition-all duration-300 border border-gray-300 dark:border-gray-700 rounded-xl outline-none dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            )}

            {/* URL */}
            <input
              type="url"
              value={download.url}
              onChange={(e) => handleDownloadChange(index, 'url', e.target.value)}
              placeholder="URL de descarga"
              className={clsx(
                "w-full px-4 py-2 text-sm bg-white dark:bg-[#1D1F23] transition-all duration-300 border rounded-xl outline-none dark:text-white focus:ring-1 focus:ring-primary-500",
                urlErrors[index] ? "border-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-700 focus:border-primary-500"
              )}
            />
            {urlErrors[index] && download.url && (
              <span className="text-xs text-red-500">URL inválida</span>
            )}

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => handleRemoveDownload(index)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadsInput;
