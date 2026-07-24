import React, { useState } from 'react';
import { Server, Loader2 } from 'lucide-react';
import DataContainer from '../components/DataContainer';
import ServerCard from '../components/ServerCard';

const Servidores = () => {
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo de servidores
  const servidores = [
    {
      id: 1,
      nombre: "BSWorld Survival",
      jugadoresPromedio: 45,
      jugadoresMaximos: 100,
      ip: "play.bs-world.com",
      puerto: 25565,
      ubicacion: "Estados Unidos",
      estado: "online",
      version: "1.20.4",
      tipo: "Survival"
    },
    {
      id: 2,
      nombre: "BSWorld Creative",
      jugadoresPromedio: 28,
      jugadoresMaximos: 50,
      ip: "creative.bs-world.com",
      puerto: 25565,
      ubicacion: "Europa",
      estado: "online",
      version: "1.20.4",
      tipo: "Creative"
    },
    {
      id: 3,
      nombre: "BSWorld PvP Arena",
      jugadoresPromedio: 62,
      jugadoresMaximos: 80,
      ip: "pvp.bs-world.com",
      puerto: 25565,
      ubicacion: "Estados Unidos",
      estado: "online",
      version: "1.20.4",
      tipo: "PvP"
    },
    {
      id: 4,
      nombre: "BSWorld Skyblock",
      jugadoresPromedio: 35,
      jugadoresMaximos: 60,
      ip: "skyblock.bs-world.com",
      puerto: 25565,
      ubicacion: "Asia",
      estado: "maintenance",
      version: "1.20.4",
      tipo: "Skyblock"
    },
    {
      id: 5,
      nombre: "BSWorld Minigames",
      jugadoresPromedio: 78,
      jugadoresMaximos: 150,
      ip: "minigames.bs-world.com",
      puerto: 25565,
      ubicacion: "Europa",
      estado: "online",
      version: "1.20.4",
      tipo: "Minigames"
    }
  ];

  if (loading) return (
    <div className="h-full flex items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-primary-600" size={48} />
    </div>
  );

  return (
    <DataContainer
      title="Servidores"
      icon={Server}
      gradientClass="from-blue-500 to-cyan-400"
      items={servidores}
      searchKey="nombre"
      renderItem={(servidor) => (
        <ServerCard key={servidor.id} {...servidor} />
      )}
    />
  );
};

export default Servidores;
