import React from 'react';
import { Filter, X } from 'lucide-react';

const FilterModalHeader = ({ onClose }) => (
  <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
      <Filter size={18} className="text-primary-600 dark:text-primary-400" />
      <span>Filtros</span>
    </h3>
    <button
      type="button"
      onClick={onClose}
      className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
      aria-label="Cerrar filtros"
    >
      <X size={20} />
    </button>
  </div>
);

export default FilterModalHeader;
