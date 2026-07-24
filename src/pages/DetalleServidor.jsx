import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Globe, Server, Activity, MapPin, Clock,
  Copy, Check, ShieldCheck, Star, MessageCircle, Share2, ExternalLink,
  Loader2, AlertCircle, Info, Lock, Unlock, Heart
} from 'lucide-react';
import { clsx } from 'clsx';

const DetalleServidor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  // Datos de ejemplo del servidor (simulando una API)
  const [servidor, setServidor] = useState(null);

  useEffect(() => {
    // Simular carga de datos del servidor
    const loadServidor = async () => {
      setLoading(true);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Datos de ejemplo basados en el ID
      const servidoresData = {
        1: {
          id: 1,
          nombre: "BSWorld Survival",
          descripcion: "El servidor survival original de BSWorld. Explora, construye y sobrevive en un mundo vasto con una comunidad activa. Cuenta con economía, protecciones de terreno, eventos semanales y mucho más.",
          jugadoresPromedio: 45,
          jugadoresMaximos: 100,
          jugadoresActuales: 52,
          ip: "play.bs-world.com",
          puerto: 25565,
          ubicacion: "Estados Unidos",
          estado: "online",
          version: "1.20.4",
          tipo: "Survival",
          imagen: null,
          caracteristicas: [
            "Economía balanceada",
            "Protecciones de terreno",
            "Eventos semanales",
            "Tienda del servidor",
            "Sistema de clans",
            "Mundo PvP opcional"
          ],
          reglas: [
            "Respetar a todos los jugadores",
            "No usar hacks o cheats",
            "No hacer griefing",
            "Seguir las normas del chat",
            "No explotar bugs"
          ],
          staff: [
            { nombre: "AdminMaster", rol: "Admin", verificado: true },
            { nombre: "ModeratorPro", rol: "Moderador", verificado: true },
            { nombre: "HelperX", rol: "Helper", verificado: false }
          ],
          uptime: "99.9%",
          ping: 45,
          creado: "2023-01-15"
        },
        2: {
          id: 2,
          nombre: "BSWorld Creative",
          descripcion: "Libera tu creatividad en nuestro servidor Creative. Cuenta con WorldEdit, parcelas gigantes, y competiciones de construcción mensuales.",
          jugadoresPromedio: 28,
          jugadoresMaximos: 50,
          jugadoresActuales: 32,
          ip: "creative.bs-world.com",
          puerto: 25565,
          ubicacion: "Europa",
          estado: "online",
          version: "1.20.4",
          tipo: "Creative",
          imagen: null,
          caracteristicas: [
            "WorldEdit ilimitado",
            "Parcelas de 256x256",
            "Competiciones mensuales",
            "Galería de creaciones",
            "Votación del servidor"
          ],
          reglas: [
            "No construir contenido ofensivo",
            "Respetar las parcelas ajenas",
            "No usar WorldEdit para lag",
            "Seguir las normas del chat"
          ],
          staff: [
            { nombre: "CreativeAdmin", rol: "Admin", verificado: true },
            { nombre: "BuilderPro", rol: "Moderador", verificado: true }
          ],
          uptime: "99.5%",
          ping: 65,
          creado: "2023-03-20"
        },
        3: {
          id: 3,
          nombre: "BSWorld PvP Arena",
          descripcion: "Demuestra tus habilidades de combate en nuestra arena PvP. KitPvP, Battle Royale y torneos semanales con premios exclusivos.",
          jugadoresPromedio: 62,
          jugadoresMaximos: 80,
          jugadoresActuales: 58,
          ip: "pvp.bs-world.com",
          puerto: 25565,
          ubicacion: "Estados Unidos",
          estado: "online",
          version: "1.20.4",
          tipo: "PvP",
          imagen: null,
          caracteristicas: [
            "KitPvP balanceado",
            "Battle Royale",
            "Torneos semanales",
            "Sistema de ELO",
            "Tienda de kits",
            "Leaderboards globales"
          ],
          reglas: [
            "No usar hacks",
            "Respetar a los oponentes",
            "No toxicidad en chat",
            "No explotar glitches"
          ],
          staff: [
            { nombre: "PvPMaster", rol: "Admin", verificado: true },
            { nombre: "ArenaMod", rol: "Moderador", verificado: true }
          ],
          uptime: "98.5%",
          ping: 35,
          creado: "2023-05-10"
        },
        4: {
          id: 4,
          nombre: "BSWorld Skyblock",
          descripcion: "Inicia tu aventura en una isla flotante. Desafíos diarios, cooperativo, y un sistema de economía avanzado para progresar.",
          jugadoresPromedio: 35,
          jugadoresMaximos: 60,
          jugadoresActuales: 0,
          ip: "skyblock.bs-world.com",
          puerto: 25565,
          ubicacion: "Asia",
          estado: "maintenance",
          version: "1.20.4",
          tipo: "Skyblock",
          imagen: null,
          caracteristicas: [
            "Ilanas personalizables",
            "Desafíos diarios",
            "Sistema de cooperativo",
            "Minas personalizadas",
            "Auctions house",
            "Nether y End islands"
          ],
          reglas: [
            "No hacer griefing en islas cooperativas",
            "No usar exploits",
            "Respetar las normas del chat",
            "No scam"
          ],
          staff: [
            { nombre: "SkyAdmin", rol: "Admin", verificado: true },
            { nombre: "IslandHelper", rol: "Helper", verificado: false }
          ],
          uptime: "99.0%",
          ping: 120,
          creado: "2023-07-01"
        },
        5: {
          id: 5,
          nombre: "BSWorld Minigames",
          descripcion: "Diviértete con nuestra variedad de minijuegos. Bed Wars, Sky Wars, Murder Mystery y más. ¡Perfecto para jugar con amigos!",
          jugadoresPromedio: 78,
          jugadoresMaximos: 150,
          jugadoresActuales: 95,
          ip: "minigames.bs-world.com",
          puerto: 25565,
          ubicacion: "Europa",
          estado: "online",
          version: "1.20.4",
          tipo: "Minigames",
          imagen: null,
          caracteristicas: [
            "Bed Wars",
            "Sky Wars",
            "Murder Mystery",
            "Hide and Seek",
            "Spleef",
            "TNT Run"
          ],
          reglas: [
            "No teaming en juegos solo",
            "No usar hacks",
            "Respetar a todos",
            "No abandonar partidas intencionalmente"
          ],
          staff: [
            { nombre: "GamesMaster", rol: "Admin", verificado: true },
            { nombre: "MiniMod", rol: "Moderador", verificado: true },
            { nombre: "GameHelper", rol: "Helper", verificado: false }
          ],
          uptime: "99.8%",
          ping: 55,
          creado: "2023-02-28"
        }
      };

      setServidor(servidoresData[id] || null);
      setLoading(false);
    };

    loadServidor();
  }, [id]);

  const copyToClipboard = () => {
    const fullIp = `${servidor.ip}:${servidor.puerto}`;
    navigator.clipboard.writeText(fullIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEstadoConfig = (status) => {
    switch (status) {
      case 'online':
        return { 
          label: 'En Línea', 
          style: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
          dotColor: 'bg-green-500'
        };
      case 'offline':
        return { 
          label: 'Desconectado', 
          style: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
          dotColor: 'bg-red-500'
        };
      case 'maintenance':
        return { 
          label: 'Mantenimiento', 
          style: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
          dotColor: 'bg-yellow-500'
        };
      default:
        return { 
          label: 'Desconocido', 
          style: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
          dotColor: 'bg-gray-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!servidor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle size={64} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Servidor no encontrado</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">El servidor que buscas no existe o ha sido eliminado.</p>
        <Link to="/servidores" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Volver a Servidores
        </Link>
      </div>
    );
  }

  const estadoConfig = getEstadoConfig(servidor.estado);
  const fullIp = `${servidor.ip}:${servidor.puerto}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* HEADER CON NAVEGACIÓN */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Volver</span>
        </button>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Servidor</span>
      </div>

      {/* HEADER DEL SERVIDOR */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
        {/* IMAGEN HERO */}
        <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {servidor.imagen ? (
            <img 
              src={servidor.imagen} 
              alt={servidor.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Server size={96} className="text-white/30" />
            </div>
          )}
          
          {/* OVERLAY CON INFO */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{servidor.nombre}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoConfig.style}`}>
                    {estadoConfig.label}
                  </span>
                </div>
                <p className="text-gray-200 text-sm max-w-2xl">{servidor.descripcion}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLiked(!liked)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    liked ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                  )}
                >
                  <Heart size={20} className={liked ? "fill-current" : ""} />
                </button>
                <button className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INFO BÁSICA */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* JUGADORES */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-xl">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Jugadores</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {servidor.jugadoresActuales} / {servidor.jugadoresMaximos}
                </p>
              </div>
            </div>

            {/* VERSIÓN */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Versión</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{servidor.version}</p>
              </div>
            </div>

            {/* UBICACIÓN */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-xl">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ubicación</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{servidor.ubicacion}</p>
              </div>
            </div>

            {/* UPTIME */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-xl">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Clock size={20} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Uptime</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{servidor.uptime}</p>
              </div>
            </div>
          </div>

          {/* IP DEL SERVIDOR */}
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={24} className="text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">IP del Servidor</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{fullIp}</p>
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Copiado' : 'Copiar IP'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARACTERÍSTICAS */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Star size={20} className="text-yellow-500" />
              Características
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servidor.caracteristicas.map((caracteristica, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-lg">
                  <Check size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{caracteristica}</span>
                </div>
              ))}
            </div>
          </div>

          {/* REGLAS */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-500" />
              Reglas del Servidor
            </h2>
            <ul className="space-y-2">
              {servidor.reglas.map((regla, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{index + 1}.</span>
                  <span>{regla}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DESCRIPCIÓN COMPLETA */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info size={20} className="text-purple-500" />
              Acerca del Servidor
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {servidor.descripcion}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Creado: {new Date(servidor.creado).toLocaleDateString('es-ES')}</span>
                <span>•</span>
                <span>Ping promedio: {servidor.ping}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          {/* STAFF */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-500" />
              Staff del Servidor
            </h2>
            <div className="space-y-3">
              {servidor.staff.map((miembro, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#191B1E] rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                    {miembro.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{miembro.nombre}</span>
                      {miembro.verificado && <ShieldCheck size={10} className="text-blue-500" />}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{miembro.rol}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Copy size={18} />
                <span>Copiar IP</span>
              </button>
              <a
                href={`minecraft:?addExternalServer=${servidor.nombre}|${fullIp}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink size={18} />
                <span>Agregar al Servidor</span>
              </a>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
                <MessageCircle size={18} />
                <span>Reportar Problema</span>
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Capacidad</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round((servidor.jugadoresActuales / servidor.jugadoresMaximos) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${(servidor.jugadoresActuales / servidor.jugadoresMaximos) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{servidor.jugadoresPromedio}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Promedio 24h</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{servidor.ping}ms</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ping</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleServidor;
