import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel,
  onNeutral, // 👈 Nuevo manejador para la acción intermedia (Cerrar sin guardar)
  title, 
  message, 
  type = 'success', 
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  neutralText = "", // 👈 Nuevo texto opcional para el tercer botón
  showCancel = false,
  children // 👈 Nuevo prop para contenido personalizado
}) => {
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
        document.addEventListener('keydown', handleEsc);
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
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgIcon: "bg-yellow-100 dark:bg-yellow-900/30",
      btn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Overlay (Fondo oscuro) */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Ventana Modal */}
      <div className={clsx(
        "relative bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl w-full overflow-hidden transform transition-all animate-scale-up border border-gray-200 dark:border-gray-700/50 z-50",
        neutralText ? "max-w-md" : "max-w-sm"
      )}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all">
          <X size={22} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className={clsx(
            "p-5 rounded-2xl mb-5 shadow-lg",
            currentConfig.bgIcon,
            type === 'success' && "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30",
            type === 'error' && "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30",
            type === 'warning' && "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30",
            type === 'info' && "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
          )}>
            <Icon size={48} className={currentConfig.color} />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base mb-8 leading-relaxed">{message}</p>

          {/* Contenido personalizado */}
          {children && <div className="w-full mb-8 text-left">{children}</div>}

          {/* SECCIÓN DE BOTONES */}
          <div className={clsx(
            "w-full gap-3",
            neutralText ? "flex flex-col sm:flex-row-reverse" : "flex"
          )}>
            
            {/* Botón Principal */}
            <button 
              onClick={handleConfirmClick}
              className={clsx(
                "py-3 px-5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 text-sm hover:shadow-xl",
                neutralText ? "w-full sm:flex-1" : "flex-1",
                type === 'success' && "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
                type === 'error' && "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
                type === 'warning' && "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700",
                type === 'info' && "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
                !config[type] && currentConfig.btn
              )}
            >
              {confirmText}
            </button>

            {/* Botón Neutral */}
            {neutralText && (
              <button 
                onClick={onNeutral || onClose}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all text-sm"
              >
                {neutralText}
              </button>
            )}

            {/* Botón Secundario */}
            {showCancel && (
              <button 
                onClick={onCancel || onClose}
                className={clsx(
                  "py-3 px-5 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#1D1F23] hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm",
                  neutralText ? "w-full sm:flex-1" : "flex-1"
                )}
              >
                {cancelText}
              </button>
            )}

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;