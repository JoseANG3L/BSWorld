import React, { useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- 1. IMPORTANTE
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'success', 
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false 
}) => {
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
        document.addEventListener('keydown', handleEsc);
        // Opcional: Bloquear el scroll del fondo cuando el modal está abierto
        document.body.style.overflow = 'hidden';
    }
    return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bgIcon: "bg-green-100 dark:bg-green-900/30",
      btn: "bg-green-600 hover:bg-green-700 focus:ring-green-500"
    },
    error: {
      icon: AlertTriangle,
      color: "text-red-500",
      bgIcon: "bg-red-100 dark:bg-red-900/30",
      btn: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bgIcon: "bg-blue-100 dark:bg-blue-900/30",
      btn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
    }
  };

  const currentConfig = config[type] || config.info;
  const Icon = currentConfig.icon;

  const handleConfirmClick = () => {
      if (onConfirm) onConfirm();
      else onClose();
  };

  // --- 2. USAR PORTAL ---
  // Esto saca el HTML del modal y lo pone al final del body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Overlay (Fondo oscuro) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Ventana Modal */}
      <div className="relative bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-up border border-gray-200 dark:border-gray-700 z-50">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X size={20} />
        </button>

        <div className="p-6 flex flex-col items-center text-center">
          <div className={clsx("p-4 rounded-full mb-4", currentConfig.bgIcon)}>
            <Icon size={40} className={currentConfig.color} />
          </div>

          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3 w-full">
            {showCancel && (
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {cancelText}
                </button>
            )}
            <button 
                onClick={handleConfirmClick}
                className={clsx(
                "flex-1 py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95",
                currentConfig.btn
                )}
            >
                {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body // <--- Destino del Portal (al final del body)
  );
};

export default Modal;