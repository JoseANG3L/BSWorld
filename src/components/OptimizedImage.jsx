import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';

const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  fallback = '/default.jpg',
  loading = 'lazy',
  preload = false,
  decoding = 'async',
  style = {},
  onLoad,
  onError,
  srcSet,
  sizes,
  placeholder = true,
  blur = '10px',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!loading || loading === 'eager');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer para lazy loading mejorado
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        {
          rootMargin: '50px', // Cargar imagen 50px antes de que sea visible
          threshold: 0.01
        }
      );

      observerRef.current.observe(imgRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [loading]);

  // Preloading optimizado
  useEffect(() => {
    if (preload && src && !imageError && isVisible) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (srcSet) {
        link.imagesrcset = srcSet;
      }
      if (sizes) {
        link.imagesizes = sizes;
      }
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [preload, src, srcSet, sizes, imageError, isVisible]);

  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    if (!imageError) {
      console.warn('Error loading image:', src);
      setImageError(true);
      if (onError) onError(e);
    }
  }, [imageError, src, onError]);

  const imageSrc = imageError ? fallback : src;

  return (
    <div
      ref={imgRef}
      className={clsx('relative overflow-hidden', className)}
      style={style}
    >
      {/* Placeholder con blur */}
      {placeholder && !isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{
            filter: `blur(${blur})`,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
      
      <img
        src={isVisible ? imageSrc : undefined}
        alt={alt}
        srcSet={isVisible && !imageError ? srcSet : undefined}
        sizes={isVisible && !imageError ? sizes : undefined}
        className={clsx(
          'w-full h-full object-cover',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100'
        )}
        loading={isVisible ? loading : 'lazy'}
        decoding={decoding}
        style={{
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;