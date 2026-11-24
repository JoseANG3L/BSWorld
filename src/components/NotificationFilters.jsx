import MobileFilterButton from './MobileFilterButton';
import MobileFilterSheet from './MobileFilterSheet';
import React, { useState } from 'react';
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
      className="h-10 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-9 pr-9 text-sm font-medium text-gray-700 outline-none transition-all dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200"
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
  searchRef
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState(filter);
  const [draftDate, setDraftDate] = useState(dateFilter);
  const activeTab = NOTIFICATION_TABS.find((tab) => tab.id === filter);
  const activeDateFilter = NOTIFICATION_DATE_FILTERS.find((option) => option.id === dateFilter);
  const hasActiveFilter = filter !== 'all' || dateFilter !== 'all';


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
    <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-3">
      <div className="relative min-w-0 flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          aria-label="Buscar notificaciones"
          placeholder="Buscar notificaciones"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className={clsx(
            'block h-10 w-full rounded-xl border border-gray-300 bg-white pl-9 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 dark:border-transparent dark:bg-[#1D1F23] dark:text-gray-200',
            searchTerm ? 'pr-10' : 'pr-2'
          )}
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

      <div className="shrink-0 lg:hidden">
        <MobileFilterButton open={isOpen} label={`Filtrar notificaciones: ${activeTab?.label}, ${activeDateFilter?.label}`}
          onClick={() => { setDraftFilter(filter); setDraftDate(dateFilter); setIsOpen(true); }} active={hasActiveFilter} />
        {isOpen && (
          <MobileFilterSheet desktopWidth={1024} onClose={() => setIsOpen(false)} onApply={() => {
            onFilterChange(draftFilter);
            onDateFilterChange(draftDate);
            setIsOpen(false);
          }}>
            {[
              { label: 'Estado de lectura', options: NOTIFICATION_TABS, value: draftFilter, select: setDraftFilter },
              { label: 'Fecha', options: NOTIFICATION_DATE_FILTERS, value: draftDate, select: setDraftDate }
            ].map(({ label, options, value, select }) => (
              <fieldset key={label}>
                <legend className="mb-2 text-sm font-semibold">{label}</legend>
                <div className="flex flex-wrap gap-2">
                  {options.map(option => (
                    <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => select(option.id)}
                      className="min-h-10 rounded-full border border-gray-200 px-4 text-sm font-medium aria-pressed:border-primary-400 aria-pressed:bg-primary-50 aria-pressed:text-primary-700 dark:border-gray-700 dark:aria-pressed:bg-primary-500/15 dark:aria-pressed:text-primary-300">
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </MobileFilterSheet>
        )}
      </div>

      <div className="hidden w-40 shrink-0 lg:block">
        {statusSelect('notification-filter-desktop')}
      </div>
      <div className="hidden w-48 shrink-0 lg:block">
        {dateSelect('notification-date-filter-desktop')}
      </div>
    </div>
  );
};

export default NotificationFilters;
