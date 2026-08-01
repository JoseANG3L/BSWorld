import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Trash2 } from 'lucide-react';

const DownloadsInput = ({ 
  downloads = [], 
  onChange,
  presets = ['API 9 (1.7.44+)', 'API 8 (1.7.20+)', 'API 7 (1.7.5+)', 'API 6 (1.6.4+)', 'API 4 (1.4.150+)'],
  defaultPreset = 'API 9 (1.7.44+)',
  customLabel = 'Personalizado',
  customPlaceholder = 'Mi URL personalizada',
  withBorder = true
}) => {
  const [internalDownloads, setInternalDownloads] = useState([
    { presetLabel: defaultPreset, label: defaultPreset, url: '' }
  ]);

  const [openDropdowns, setOpenDropdowns] = useState({});
  const [urlErrors, setUrlErrors] = useState({});
  const versionDropdownRefs = useRef([]);

  const activeDownloads = downloads && downloads.length > 0 ? downloads : internalDownloads;

  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const updateDownloads = (newDownloads) => {
    setInternalDownloads(newDownloads);
    if (onChange) {
      onChange(newDownloads);
    }
  };

  const handleAddDownload = () => {
    const preset = defaultPreset || presets[0] || 'API 9 (1.7.44+)';
    const newEntry = { presetLabel: preset, label: preset, url: '' };
    updateDownloads([...activeDownloads, newEntry]);
  };

  const handleDownloadChange = (index, field, value) => {
    const newDownloads = activeDownloads.map((item, i) => {
      if (i !== index) return item;

      const updatedItem = { ...item };

      if (field === 'presetLabel') {
        updatedItem.presetLabel = value;
        if (value !== customLabel) {
          updatedItem.label = value;
        } else {
          updatedItem.label = item.label && !presets.includes(item.label) ? item.label : '';
        }
      } else if (field === 'label') {
        updatedItem.label = value;
        if (presets.includes(value)) {
          updatedItem.presetLabel = value;
        } else {
          updatedItem.presetLabel = customLabel;
        }
      } else if (field === 'url') {
        updatedItem.url = value;
      }

      return updatedItem;
    });

    if (field === 'url') {
      setUrlErrors(prev => ({
        ...prev,
        [index]: !isValidUrl(value)
      }));
    }

    updateDownloads(newDownloads);
  };

  const handleRemoveDownload = (index) => {
    const filtered = activeDownloads.filter((_, i) => i !== index);
    updateDownloads(filtered);
  };

  const toggleDropdown = (index) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [`version-${index}`]: !prev[`version-${index}`]
    }));
  };

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
      
      <div className="space-y-3 md:space-y-2">
        {activeDownloads.map((download, index) => {
          const currentLabel = download.label || download.nombre || '';
          const currentPreset = download.presetLabel || (presets.includes(currentLabel) ? currentLabel : customLabel);
          const isCustom = currentPreset === customLabel || (!presets.includes(currentPreset) && !presets.includes(currentLabel));
          
          return (
            <div key={`download-item-${index}`} className="flex flex-col md:flex-row items-center gap-1">
              {/* Selector de preset */}
              <div className="relative w-full md:min-w-40 md:max-w-40" ref={(el) => versionDropdownRefs.current[index] = el}>
                <button
                  type="button"
                  onClick={() => toggleDropdown(index)}
                  className={clsx("w-full pl-3 pr-8 py-2 text-sm bg-white dark:bg-[#1D1F23] border border-gray-300 rounded-xl outline-none appearance-none cursor-pointer transition-all font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left", withBorder ? "dark:border-gray-700" : "dark:border-transparent")}
                >
                  <span className="truncate block">
                    {isCustom ? customLabel : (download.presetLabel || defaultPreset)}
                  </span>
                </button>
                <ChevronDown 
                  size={14} 
                  className={clsx(
                    "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200",
                    openDropdowns[`version-${index}`] && "rotate-180"
                  )} 
                />
                
                {openDropdowns[`version-${index}`] && (
                  <div className={clsx("absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1D1F23] border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1", withBorder ? "dark:border-gray-700" : "dark:border-transparent")}>
                    <div className="flex flex-col gap-0.5">
                      {[...presets, customLabel].map((preset) => {
                        const isSelected = preset === customLabel ? isCustom : (currentPreset === preset && !isCustom);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              handleDownloadChange(index, 'presetLabel', preset);
                              setOpenDropdowns(prev => ({ ...prev, [`version-${index}`]: false }));
                            }}
                            className={clsx(
                              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isSelected
                                ? "text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 font-semibold"
                                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Label editable (solo si es Personalizado) */}
              {isCustom && (
                <input
                  type="text"
                  value={download.label || ''}
                  onChange={(e) => handleDownloadChange(index, 'label', e.target.value)}
                  placeholder={customPlaceholder}
                  className={clsx("w-full md:min-w-42 md:max-w-42 px-3 py-2 text-sm bg-white dark:bg-[#1D1F23] transition-all duration-300 border border-gray-300 rounded-xl outline-none dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-sm", withBorder ? "dark:border-gray-700" : "dark:border-transparent")}
                />
              )}

              {/* URL */}
              <input
                type="url"
                value={download.url || ''}
                onChange={(e) => handleDownloadChange(index, 'url', e.target.value)}
                placeholder="URL de descarga"
                className={clsx(
                  "w-full px-4 py-2 text-sm bg-white dark:bg-[#1D1F23] transition-all duration-300 border rounded-xl outline-none dark:text-white shadow-sm",
                  urlErrors[index] ? "border-red-500 dark:border-red-500 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-500" : withBorder ? "border-gray-300 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500" : "border-gray-300 dark:border-transparent focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-500"
                )}
              />

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => handleRemoveDownload(index)}
                className="w-full md:w-auto flex items-center justify-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-500 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg shadow-sm transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DownloadsInput;
