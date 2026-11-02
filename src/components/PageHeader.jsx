import React from 'react';
import { clsx } from 'clsx';

const PageHeader = ({
  title,
  icon: Icon,
  gradientClass = 'from-primary-500 to-primary-700',
  trailing,
  className
}) => (
  <h1 className={clsx(
    'flex min-w-0 items-center gap-3 text-xl font-bold text-gray-800 dark:text-white md:text-2xl',
    className
  )}>
    <span className={clsx(
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
      gradientClass
    )}>
      {React.createElement(Icon, { size: 20, strokeWidth: 2.5 })}
    </span>
    <span className="min-w-0 truncate">{title}</span>
    {trailing}
  </h1>
);

export default PageHeader;
