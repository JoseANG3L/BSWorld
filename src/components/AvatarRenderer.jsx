import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  User, Ghost, Gamepad2, Sparkles, Anchor, Coffee, Rocket, Crown, Zap, Heart, Star
} from 'lucide-react';

// 1. Mapa de iconos disponibles
// IMPORTANTE: Debe tener los mismos iconos que usaste en Configuracion.jsx
const ICON_MAP = {
  User, Ghost, Gamepad2, Sparkles, Anchor, Coffee, Rocket, Crown, Zap, Heart, Star
};

const AvatarRenderer = ({ avatar, name, className }) => {
  const [hasError, setHasError] = useState(false);

  // Reiniciar el estado de error si cambia la URL del avatar
  useEffect(() => {
    setHasError(false);
  }, [avatar]);

  // CASO A: Diseño Personalizado (formato "design|Icono|#Color")
  if (avatar && avatar.startsWith('design|')) {
    const parts = avatar.split('|');
    const iconName = parts[1]; // Ej: "Ghost"
    const colorHex = parts[2]; // Ej: "#ff0000"
    
    // Buscamos el componente, si no existe usamos User por defecto
    const IconComponent = ICON_MAP[iconName] || User;

    return (
      <div 
        className={clsx("flex items-center justify-center w-full h-full text-white select-none", className)}
        style={{ backgroundColor: colorHex }}
        title={name}
      >
        {/* El icono se escala al 60% del contenedor padre */}
        <IconComponent style={{ width: '60%', height: '60%' }} strokeWidth={1.5} />
      </div>
    );
  }

  // CASO B: Imagen normal (URL)
  // Si la imagen falló (hasError) o no hay avatar, usamos DiceBear con el nombre del usuario
  const seed = name || 'User';
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  
  const imageSource = (hasError || !avatar) ? fallbackImage : avatar;

  return (
    <img 
      src={imageSource} 
      alt={name || "Avatar"} 
      className={clsx("w-full h-full object-cover select-none", className)}
      
      // Trucos para evitar bloqueos de imágenes externas (Discord, Imgur)
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      
      // Si la imagen falla, activamos el error para mostrar el fallback
      onError={() => setHasError(true)}
    />
  );
};

export default AvatarRenderer;