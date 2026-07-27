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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Ventana Modal */}
      <div className={clsx(
        "relative bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full overflow-hidden transform transition-all animate-scale-up border border-gray-200 dark:border-gray-700 z-50",
        neutralText ? "max-w-md" : "max-w-sm" // 👈 Si hay 3 botones, expande ligeramente el ancho para que no se amontone el texto
      )}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X size={20} />
        </button>

        <div className="p-6 flex flex-col items-center text-center">
          <div className={clsx("p-4 rounded-full mb-4", currentConfig.bgIcon)}>
            <Icon size={40} className={currentConfig.color} />
          </div>

          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

          {/* Contenido personalizado */}
          {children && <div className="w-full mb-6 text-left">{children}</div>}

          {/* 👇 SECCIÓN DE BOTONES INTEGRADA */}
          <div className={clsx(
            "w-full gap-2.5",
            neutralText ? "flex flex-col sm:flex-row-reverse" : "flex" // 👈 Si hay 3 botones, los apila de forma inteligente en móvil y los distribuye horizontalmente en PC
          )}>
            
            {/* Botón Principal (Confirmación / Guardar) */}
            <button 
              onClick={handleConfirmClick}
              className={clsx(
                "py-2.5 px-4 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 text-xs md:text-sm",
                neutralText ? "w-full sm:flex-1" : "flex-1",
                currentConfig.btn
              )}
            >
              {confirmText}
            </button>

            {/* Botón Neutral (Acción destructiva intermedia / Cerrar sin guardar) */}
            {neutralText && (
              <button 
                onClick={onNeutral || onClose}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors text-xs md:text-sm"
              >
                {neutralText}
              </button>
            )}

            {/* Botón Secundario (Cancelar / Volver atrás) */}
            {showCancel && (
              <button 
                onClick={onCancel || onClose}
                className={clsx(
                  "py-2.5 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#191B1E] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm",
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