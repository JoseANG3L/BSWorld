import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicContent, getUserPublicProfile } from '../services/api';
import { clsx } from 'clsx';
import AvatarRenderer from './AvatarRenderer';

// --- SUB-COMPONENTE: AVATAR INTELIGENTE DE CREADOR ---
const SmartCreatorAvatar = ({ creador, className = "w-10 h-10 md:w-12 md:h-12" }) => {
  const [userData, setUserData] = useState(() => ({
    nombre: creador?.nombre || creador?.username || (typeof creador === 'string' ? creador : 'Creador'),
    imagen: creador?.imagen || creador?.avatar || null,
    uid: creador?.uid || creador?.id || (typeof creador === 'string' ? creador : null)
  }));

  useEffect(() => {
    let isMounted = true;
    const targetUid = creador?.uid || creador?.id || (typeof creador === 'string' ? creador : null);

    if (targetUid) {
      getUserPublicProfile(targetUid).then(fresh => {
        if (fresh && isMounted) {
          setUserData({
            nombre: fresh.nombre,
            imagen: fresh.imagen,
            uid: fresh.uid
          });
        }
      }).catch(err => console.error("Error obteniendo avatar creador", err));
    }
    return () => { isMounted = false; };
  }, [creador]);

  return (
    <div className={clsx("rounded-full", className)}>
      <AvatarRenderer avatar={userData.imagen} name={userData.nombre} />
    </div>
  );
};

const Carousel = ({ title, limit = 6, tipo = null, autoPlayInterval = 5000 }) => {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getPublicContent();
        const filtered = tipo 
          ? data.filter(item => item.tipo === tipo)
          : data;
        setItems(filtered.slice(0, limit));
      } catch (error) {
        console.error('Error fetching carousel items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [limit, tipo]);

  // Auto-play seguro con reset al cambiar manualmente
  useEffect(() => {
    if (loading || items.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [loading, items.length, autoPlayInterval, isPaused, currentIndex]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setPreviousIndex(currentIndex);
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setPreviousIndex(currentIndex);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index) => {
    setPreviousIndex(currentIndex);
    setCurrentIndex(index);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[40vh] md:min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );

  if (items.length === 0) return null;

  return (
    <div 
      className="flex flex-col w-full h-96 p-2 md:p-4 relative animate-fade-in-up"
      style={{ animationDuration: '200ms' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
        
      {/* CONTENEDOR 3D CAROUSEL */}
      <div className="relative w-full h-full flex items-center justify-center">
        {items.map((item, index) => {
          const isCurrent = index === currentIndex;
          const isPrev1 = index === (currentIndex - 1 + items.length) % items.length;
          const isPrev2 = index === (currentIndex - 2 + items.length) % items.length;
          const isNext1 = index === (currentIndex + 1) % items.length;
          const isNext2 = index === (currentIndex + 2) % items.length;
          
          // Determinar dirección de la animación
          const isMovingForward = previousIndex < currentIndex && !(previousIndex === items.length - 1 && currentIndex === 0);
          const isMovingBackward = previousIndex > currentIndex && !(previousIndex === 0 && currentIndex === items.length - 1);
          const isWrappingForward = previousIndex === items.length - 1 && currentIndex === 0;
          const isWrappingBackward = previousIndex === 0 && currentIndex === items.length - 1;
          
          return (
            <div
              key={item.id}
              onClick={() => isCurrent ? navigate(`/view/${item.id}`) : goToSlide(index)}
              className={clsx(
                "absolute scale-40 transition-all duration-500 ease-in-out cursor-pointer h-full aspect-video rounded-2xl shadow-2xl",
                isCurrent 
                  ? "scale-100 z-50 left-1/2 -translate-x-1/2" 
                  : isPrev1 
                    ? "scale-75 z-40 left-1/2 -translate-x-[110%] blur-[5px] hover:blur-0" 
                  : isPrev2
                    ? "scale-50 z-30 left-1/2 -translate-x-[160%] blur-[10px] hover:blur-[1px]" 
                  : isNext1
                    ? "scale-75 z-40 left-1/2 translate-x-[10%] blur-[5px] hover:blur-0" 
                  : isNext2
                    ? "scale-50 z-30 left-1/2 translate-x-[60%] blur-[10px] hover:blur-[1px]" 
                  : isWrappingForward 
                    ? "z-0 scale-40 opacity-0 left-1/2 translate-x-[200%]"
                    : isWrappingBackward
                      ? "z-0 scale-40 opacity-0 left-1/2 -translate-x-[200%]"
                      : index < currentIndex 
                        ? "z-0 scale-40 opacity-0 left-1/2 -translate-x-[200%]" 
                        : "z-0 scale-40 opacity-0 left-1/2 translate-x-[200%]"
              )}
            >
              <img
                src={item.imagen || '/default.jpg'}
                alt={item.titulo}
                className="w-full h-full object-cover select-none rounded-lg"
                onError={(e) => { e.target.src = '/default.jpg'; }}
              />
              
              {/* OVERLAY NEGRO SOLO EN ELEMENTOS LATERALES */}
              {!isCurrent && (
                <div className={clsx(
                  "absolute inset-0 bg-black transition-opacity duration-300 rounded-2xl",
                  isPrev1 || isNext1 ? "opacity-30 hover:opacity-10" : "opacity-50 hover:opacity-30"
                )} />
              )}
              
              {/* OVERLAY SOLO EN EL SLIDE ACTUAL */}
              {isCurrent && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 z-20" />
                  
                  {/* CONTENIDO DENTRO DE LA IMAGEN */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-30 animate-fade-in">
                    <div className="flex items-center gap-2 md:gap-3">
                      {/* Avatar */}
                      {item.creadores && item.creadores.length > 0 && (
                        <SmartCreatorAvatar 
                          creador={(Array.isArray(item.creadores) ? item.creadores : [item.creadores])[0]}
                          className="w-10 h-10 md:w-12 md:h-12 shadow-lg"
                        />
                      )}

                      {/* Información en fila */}
                      <div className="flex flex-col min-w-0">
                        {/* Username */}
                        {item.creadores && item.creadores.length > 0 && (
                          <div className="text-white/90 text-[10px] md:text-xs font-semibold mb-0.5">
                            {(Array.isArray(item.creadores) ? item.creadores : [item.creadores])[0] ? 
                              (typeof (Array.isArray(item.creadores) ? item.creadores : [item.creadores])[0] === 'object' ? 
                                (Array.isArray(item.creadores) ? item.creadores : [item.creadores])[0].nombre : 
                                (Array.isArray(item.creadores) ? item.creadores : [item.creadores])[0]
                              ) : 'Unknown'}
                          </div>
                        )}

                        {/* Título del Mod */}
                        <h3 className="text-sm md:text-lg font-black text-white leading-tight tracking-tight drop-shadow-lg line-clamp-1">
                          {item.titulo}
                        </h3>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* FLECHAS DE NAVEGACIÓN SIMÉTRICAS (Visibles en Hover de escritorio) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/70 text-white border border-white/5 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 z-40 hidden md:block"
        aria-label="Anterior mod"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/70 text-white border border-white/5 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100 z-40 hidden md:block"
        aria-label="Siguiente mod"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

    </div>
  );
};

export default Carousel;