import React from 'react';

const RING_MASK = {
  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
  mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))',
};

// Degradado en la paleta de la página (violetas primary)
const RING_GRADIENT = {
  background: 'conic-gradient(from 0deg, #a78bfa, #7c3aed 40%, rgba(124, 58, 237, 0) 72%)',
};

/** Figura de carga con la paleta de BSWorld. Sin texto. */
const BrandLoader = ({ size = 72 }) => {
  const orb = Math.max(10, Math.round(size * 0.24));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Círculo base */}
      <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-white/10" style={RING_MASK} />
      {/* Carga giratoria */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          ...RING_MASK,
          ...RING_GRADIENT,
          animationDuration: '0.9s',
          filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.55))',
        }}
      />
      {/* Orbe central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full animate-pulse bg-gradient-to-br from-primary-400 via-primary-600 to-primary-900"
          style={{ width: orb, height: orb, boxShadow: '0 0 14px rgba(124, 58, 237, 0.6)' }}
        />
      </div>
    </div>
  );
};

/** Mini anillo para botones y estados en línea. Sin texto. */
const InlineLoader = ({ size = 16 }) => (
  <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    <span className="absolute inset-0 rounded-full bg-current opacity-20" style={RING_MASK} />
    <span
      className="absolute inset-0 rounded-full animate-spin"
      style={{ ...RING_MASK, ...RING_GRADIENT, animationDuration: '0.9s' }}
    />
  </span>
);

/**
 * Animación de carga única de la app. Solo figuras, sin letras.
 *
 * Variantes:
 * - "fullscreen": pantalla completa (arranque, rutas protegidas)
 * - "page": bloque de página (carga de una vista)
 * - "section": bloque compacto (paneles, listas, desplegables)
 * - "inline": mini anillo en línea (botones, envíos)
 */
const LoadingSpinner = ({ size, variant = 'page' }) => {
  if (variant === 'inline') {
    return <InlineLoader size={size || 16} />;
  }

  if (variant === 'section') {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <BrandLoader size={size || 40} />
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in-up">
        <BrandLoader size={size || 64} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <BrandLoader size={size || 56} />
    </div>
  );
};

export default LoadingSpinner;
