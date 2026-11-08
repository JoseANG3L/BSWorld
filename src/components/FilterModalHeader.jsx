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
      className="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
      aria-label="Cerrar filtros"
    >
      <X size={20} />
    </button>
  </div>
);

export default FilterModalHeader;
