import { SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

export default function MobileFilterButton({ active, open, onClick, className, label }) {
  return (
    <button type="button" onClick={onClick} aria-haspopup="dialog" aria-expanded={open}
      aria-label={label || (active ? 'Abrir filtros activos' : 'Abrir filtros')}
      className={clsx(
        'flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-primary-500',
        active ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1D1F23] dark:text-gray-200',
        className
      )}>
      <SlidersHorizontal size={18} aria-hidden="true" />
      <span className="hidden min-[420px]:inline">Filtros</span>
    </button>
  );
}
