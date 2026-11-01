import React, { useState, useCallback } from 'react';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ToastContext } from '../hooks/useToast';

const ICONS = {
  success: { Icon: CheckCircle, ring: 'text-green-400' },
  info: { Icon: Info, ring: 'text-blue-400' },
  error: { Icon: AlertCircle, ring: 'text-red-400' },
};

/**
 * Avisos flotantes que aparecen y se desvanecen solos.
 * Uso: const { showToast } = useToast(); showToast('Sesión iniciada');
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, 4500);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 items-center pointer-events-none px-4 w-full sm:w-auto">
        {toasts.map((t) => {
          const { Icon, ring } = ICONS[t.type] || ICONS.success;
          return (
            <div
              key={t.id}
              className={clsx(
                'relative flex items-center gap-2.5 pl-3 pr-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden',
                'bg-gray-900/90 dark:bg-[#1e1e1e]/95 border-gray-700/50 text-white',
                'transition-all duration-500 max-w-md',
                t.leaving ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100 toast-enter'
              )}
            >
              <Icon size={20} className={clsx('shrink-0 toast-icon-pop', ring)} />
              <span className="text-sm font-semibold">{t.message}</span>
              {!t.leaving && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-white/10">
                  <span className="block h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 toast-progress" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
