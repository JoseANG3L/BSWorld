import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Bomb, HardHat, Heart, Fan, BicepsFlexed, ChefHat, Anchor, CandyCane, Snowflake, Skull, Panda,
  IceCreamCone, Gamepad2, Bot, Glasses, WandSparkles, Sparkles, Rabbit, Bone, User, Ghost,
  Coffee, Rocket, Crown, Zap, Star, Music, Smile, Sword, Flame, Code, Terminal, Cpu, Globe,
  Headphones, PawPrint, Cat, Dog, Sun, Moon, Cloud, Umbrella
} from 'lucide-react';

// 1. Mapa de iconos disponibles (Sincronizado con Configuracion.jsx)
export const ICON_MAP = {
  Bomb, HardHat, Heart, Fan, BicepsFlexed, ChefHat, Anchor, CandyCane, Snowflake, Skull, Panda,
  IceCreamCone, Gamepad2, Bot, Glasses, WandSparkles, Sparkles, Rabbit, Bone, User, Ghost,
  Coffee, Rocket, Crown, Zap, Star, Music, Smile, Sword, Flame, Code, Terminal, Cpu, Globe,
  Headphones, PawPrint, Cat, Dog, Sun, Moon, Cloud, Umbrella
};

const AvatarRenderer = ({ avatar, name, className }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatar]);

  // --- CASO 1: NO HAY AVATAR (Null/Empty) ---
  // "Si no existe el avatar del usuario usar icono de user"
  if (!avatar) {
    return (
      <div className={clsx("flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-400 select-none", className)}>
        <User style={{ width: '60%', height: '60%' }} strokeWidth={1.5} />
      </div>
    );
  }

  // --- CASO 2: DISEÑO PERSONALIZADO (design|Icono|#Color) ---
  if (avatar.startsWith('design|')) {
    const parts = avatar.split('|');
    const iconName = parts[1]; 
    const colorHex = parts[2]; 
    
    const IconComponent = ICON_MAP[iconName] || User;

    return (
      <div 
        className={clsx("flex items-center justify-center w-full h-full text-white select-none", className)}
        style={{ backgroundColor: colorHex }}
        title={name}
      >
        <IconComponent style={{ width: '55%', height: '55%' }} strokeWidth={1.5} />
      </div>
    );
  }

  // --- CASO 3: IMAGEN URL (Con Fallback) ---
  // Si la imagen falla (hasError), usamos DiceBear como respaldo final
  const seed = name || 'User';
  const fallbackImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  const imageSource = hasError ? fallbackImage : avatar;

  return (
    <img 
      src={imageSource} 
      alt={name || "Avatar"} 
      className={clsx("w-full h-full object-cover select-none", className)}
      loading="lazy"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
    />
  );
};

export default AvatarRenderer;