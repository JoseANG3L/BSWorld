import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Filter, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

const NOTIFICATION_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'read', label: 'Leídas' }
];

const NOTIFICATION_DATE_FILTERS = [
  { id: 'all', label: 'Todas las fechas' },
  { id: 'today', label: 'Hoy' },
  { id: '7days', label: 'Últimos 7 días' },
  { id: '30days', label: 'Últimos 30 días' }
];

const FilterSelect = ({ id, label, value, options, onChange, icon }) => (
  <div className="relative min-w-0">
    {React.createElement(icon, { size: 16, className: 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' })}
    <label className="sr-only" htmlFor={id}>{label}</label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-9 pr-9 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
  </div>
);

const NotificationFilters = ({
  filter,
  dateFilter,
  onFilterChange,
  onDateFilterChange,
  searchTerm,
  onSearchChange,
  searchRef,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const activeTab = NOTIFICATION_TABS.find((tab) => tab.id === filter);
  const activeDateFilter = NOTIFICATION_DATE_FILTERS.find((option) => option.id === dateFilter);
  const hasActiveFilter = filter !== 'all' || dateFilter !== 'all';

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  const statusSelect = (id) => (
    <FilterSelect
      id={id}
      label="Filtrar notificaciones"
      value={filter}
      options={NOTIFICATION_TABS}
      onChange={onFilterChange}
      icon={Filter}
    />
  );

  const dateSelect = (id) => (
    <FilterSelect
      id={id}
      label="Filtrar por fecha"
      value={dateFilter}
      options={NOTIFICATION_DATE_FILTERS}
      onChange={onDateFilterChange}
      icon={CalendarDays}
    />
  );

  return (
    <div className={clsx('mb-3 flex min-w-0 items-center gap-1 lg:mb-0', className)}>
      <div className="relative min-w-0 flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          aria-label="Buscar notificaciones"
          placeholder="Buscar notificaciones"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-6 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative sm:hidden" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={`Filtrar notificaciones: ${activeTab?.label}, ${activeDateFilter?.label}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title="Filtrar notificaciones"
          className={clsx(
            'relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-600 transition-colors dark:bg-[#1D1F23] dark:text-gray-300',
            hasActiveFilter
              ? 'border-primary-400 dark:border-primary-500'
              : 'border-gray-300 dark:border-transparent'
          )}
        >
          <Filter size={18} />
          {hasActiveFilter && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500" />}
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full z-30 mt-1.5 flex w-[min(19rem,calc(100vw-1rem))] flex-col gap-2 rounded-xl border border-gray-300 bg-white p-2 shadow-xl dark:border-transparent dark:bg-[#1D1F23]">
            {statusSelect('notification-filter-mobile')}
            {dateSelect('notification-date-filter-mobile')}
          </div>
        )}
      </div>

      <div className="hidden w-40 shrink-0 sm:block">
        {statusSelect('notification-filter-desktop')}
      </div>
      <div className="hidden w-40 shrink-0 sm:block">
        {dateSelect('notification-date-filter-desktop')}
      </div>
    </div>
  );
};

export default NotificationFilters;
