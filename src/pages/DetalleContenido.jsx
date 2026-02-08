// VERSIÓN CORRECTA - SMART MARKDOWN RENDERER
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Download, Calendar, Tag, User, Users, ArrowLeft, Globe,
    Share2, ShieldCheck, MessageCircle, Facebook, Twitter, Eye,
    Image as ImageIcon, Layers, Loader2, ChevronLeft, ChevronRight, PlayCircle,
    Link as LinkIcon, Mail, Send, Check, Copy, Youtube, AlertCircle, Code
} from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkUnwrapImages from 'remark-unwrap-images';
import { getContentById, registerDownload, registerView, getUserPublicProfile } from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { useAuth } from '../context/AuthContext';


const InlineCode = ({ children, ...props }) => {
    return (
        <code 
            style={{
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: '#dc2626',
                border: '1px solid #d1d5db',
                display: 'inline-block',
                lineHeight: '1.4',
            }}
            className="dark:bg-gray-800 dark:text-red-400 dark:border-gray-700"
            {...props}
        >
            {children}
        </code>
    );
};

const SafeMarkdownRenderer = ({ content }) => {
    if (!content) {
        return (
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 italic py-4">
                <AlertCircle size={20} />
                Sin descripción disponible.
            </div>
        );
    }

    // Función para procesar el markdown manteniendo la estructura original
    const processMarkdown = () => {
        const elements = [];
        let textBuffer = '';
        let insideCodeBlock = false;
        let codeBlockContent = '';
        let codeLanguage = 'text';
        
        // Dividir por líneas para procesar mejor
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detectar inicio de bloque de código
            if (line.startsWith('```') && !insideCodeBlock) {
                // Si hay texto acumulado, agregarlo como elemento de texto
                if (textBuffer.trim()) {
                    elements.push({
                        type: 'text',
                        content: textBuffer.trim()
                    });
                    textBuffer = '';
                }
                
                insideCodeBlock = true;
                codeLanguage = line.substring(3).trim() || 'text';
                codeBlockContent = '';
                continue;
            }
            
            // Detectar fin de bloque de código
            if (line === '```' && insideCodeBlock) {
                insideCodeBlock = false;
                elements.push({
                    type: 'code',
                    language: codeLanguage,
                    content: codeBlockContent.trim(),
                    raw: `\`\`\`${codeLanguage}\n${codeBlockContent}\`\`\``
                });
                continue;
            }
            
            // Si estamos dentro de un bloque de código
            if (insideCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }
            
            // Si no es un bloque de código, acumular en el buffer de texto
            textBuffer += line + '\n';
        }
        
        // Agregar el texto restante
        if (textBuffer.trim()) {
            elements.push({
                type: 'text',
                content: textBuffer.trim()
            });
        }
        
        // Si no se detectaron bloques de código, usar todo el contenido como texto
        if (elements.length === 0 && content.trim()) {
            elements.push({
                type: 'text',
                content: content.trim()
            });
        }
        
        return elements;
    };

    const elements = processMarkdown();
    
    return (
        <div className="markdown-content">
            {elements.map((element, index) => {
                if (element.type === 'code') {
                    return (
                        <div key={index} className="my-6">
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-xs font-mono">
                                    <span className="flex items-center gap-2">
                                        <Code size={12} />
                                        {element.language}
                                    </span>
                                    <CopyCodeButton text={element.content} />
                                </div>
                                <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto m-0 text-sm">
                                    <code>{element.content}</code>
                                </pre>
                            </div>
                        </div>
                    );
                }
                
                // Para texto, usar ReactMarkdown con remark-unwrap-images
                return (
                    <ReactMarkdown
                        key={index}
                        remarkPlugins={[remarkGfm, remarkUnwrapImages]}
                        components={{
                            // PÁRRAFOS - Asegurar que los saltos de línea se mantengan
                            p: ({node, children, ...props}) => {
                                const hasBlockElements = React.Children.toArray(children).some(child => 
                                    React.isValidElement(child) && 
                                    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'table', 'pre'].includes(child.props.node?.tagName)
                                );
                                
                                // Si el párrafo contiene elementos de bloque, no aplicar estilos
                                if (hasBlockElements) {
                                    return <>{children}</>;
                                }
                                
                                return <p className="my-3 leading-relaxed" {...props}>{children}</p>;
                            },
                            
                            // IMÁGENES
                            img: ({node, alt, title, ...props}) => (
                                <div className="my-6">
                                    <div className="flex flex-col items-center">
                                        <img 
                                            src={props.src} 
                                            alt={alt || ''}
                                            title={title}
                                            className="max-w-full h-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700" 
                                            loading="lazy" 
                                        />
                                        {alt && alt.trim() !== '' && (
                                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic max-w-2xl mx-auto">
                                                {alt}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ),
                            
                            // CÓDIGO INLINE - ESTILOS FIXED
                            code: ({node, inline, className, children, ...props}) => {
                                if (inline) {
                                    return (
                                        <code 
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.875rem',
                                                fontFamily: 'monospace',
                                                color: '#dc2626',
                                                border: '1px solid #d1d5db',
                                                display: 'inline-block',
                                                lineHeight: '1.4',
                                            }}
                                            className="dark:bg-gray-800 dark:text-red-400 dark:border-gray-700"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                }
                                return <code className={className} {...props}>{children}</code>;
                            },
                            
                            // ENCABEZADOS
                            h1: ({node, children, ...props}) => (
                                <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700" {...props}>
                                    {children}
                                </h1>
                            ),
                            h2: ({node, children, ...props}) => (
                                <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </h2>
                            ),
                            h3: ({node, children, ...props}) => (
                                <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </h3>
                            ),
                            h4: ({node, children, ...props}) => (
                                <h4 className="text-base font-bold mt-3 mb-2 text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </h4>
                            ),
                            h5: ({node, children, ...props}) => (
                                <h5 className="text-sm font-bold mt-2 mb-2 text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </h5>
                            ),
                            h6: ({node, children, ...props}) => (
                                <h6 className="text-xs font-bold mt-2 mb-2 text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </h6>
                            ),
                            
                            // LISTAS
                            ul: ({node, children, ...props}) => (
                                <ul className="list-disc pl-5 my-3 space-y-1" {...props}>
                                    {children}
                                </ul>
                            ),
                            ol: ({node, children, ...props}) => (
                                <ol className="list-decimal pl-5 my-3 space-y-1" {...props}>
                                    {children}
                                </ol>
                            ),
                            li: ({node, children, ...props}) => (
                                <li className="pl-1 mb-1" {...props}>
                                    {children}
                                </li>
                            ),
                            
                            // ENLACES
                            a: ({node, children, ...props}) => (
                                <a 
                                    className="text-primary-500 hover:underline font-bold" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    {...props}
                                >
                                    {children}
                                </a>
                            ),
                            
                            // TEXTO ENFATIZADO
                            strong: ({node, children, ...props}) => (
                                <strong className="font-bold text-gray-900 dark:text-white" {...props}>
                                    {children}
                                </strong>
                            ),
                            em: ({node, children, ...props}) => (
                                <em className="italic" {...props}>
                                    {children}
                                </em>
                            ),
                            del: ({node, children, ...props}) => (
                                <del className="line-through text-gray-500 dark:text-gray-400" {...props}>
                                    {children}
                                </del>
                            ),
                            
                            // CITAS
                            blockquote: ({node, children, ...props}) => (
                                <blockquote className="border-l-4 border-primary-500 pl-4 italic my-3 bg-gray-50 dark:bg-gray-800/30 py-2 rounded-r" {...props}>
                                    {children}
                                </blockquote>
                            ),
                            
                            // LÍNEA HORIZONTAL
                            hr: ({node, ...props}) => (
                                <hr className="my-4 border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            
                            // TABLAS
                            table: ({node, children, ...props}) => (
                                <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                                        {children}
                                    </table>
                                </div>
                            ),
                            thead: ({node, children, ...props}) => (
                                <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
                                    {children}
                                </thead>
                            ),
                            tbody: ({node, children, ...props}) => (
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                                    {children}
                                </tbody>
                            ),
                            tr: ({node, children, ...props}) => (
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props}>
                                    {children}
                                </tr>
                            ),
                            th: ({node, children, ...props}) => (
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props}>
                                    {children}
                                </th>
                            ),
                            td: ({node, children, ...props}) => (
                                <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700" {...props}>
                                    {children}
                                </td>
                            ),
                        }}
                    >
                        {element.content}
                    </ReactMarkdown>
                );
            })}
        </div>
    );
};

// --- COMPONENTE PARA COPIAR CÓDIGO ---
const CopyCodeButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            title="Copiar código"
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span className="text-xs">{copied ? '¡Copiado!' : 'Copiar'}</span>
        </button>
    );
};

// --- COMPONENTE REUTILIZABLE: FILA DE USUARIO INTELIGENTE ---
const SmartUserRow = ({ user, role = "creator" }) => {
    const [profile, setProfile] = useState(user);

    useEffect(() => {
        if (user.uid) {
            const fetchFreshProfile = async () => {
                try {
                    const freshData = await getUserPublicProfile(user.uid);
                    if (freshData) {
                        setProfile(prev => ({
                            ...prev,
                            nombre: freshData.nombre,
                            imagen: freshData.imagen
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching user profile", error);
                }
            };
            fetchFreshProfile();
        }
    }, [user.uid]);

    const esUsuarioRegistrado = !!user.uid;
    
    let roleText = "Autor Externo";
    if (esUsuarioRegistrado) {
        roleText = role === "uploader" ? "Usuario Verificado" : "Creador Verificado";
    }

    return (
        <Link 
            to={`/u/${profile.nombre}`} 
            className="flex items-center gap-3 group p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
            <div className="w-10 h-10 shrink-0 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 relative">
                <AvatarRenderer avatar={profile.imagen} name={profile.nombre} />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                        {profile.nombre}
                    </p>
                    {esUsuarioRegistrado && (
                        <ShieldCheck size={12} className="text-blue-500" title="Verificado" />
                    )}
                </div>
                
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {roleText}
                </p>
            </div>
        </Link>
    );
};

// --- HELPERS (se mantienen igual) ---
const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
};

const getSocialConfig = (url) => {
    const lower = url ? url.toLowerCase() : '';
    
    if (lower.includes('discord')) return { 
        icon: MessageCircle,
        color: "bg-[#5865F2] hover:bg-[#4752c4] text-white",
        label: "Discord"
    };
    if (lower.includes('twitter') || lower.includes('x.com')) return { 
        icon: Twitter, 
        color: "bg-[#1DA1F2] hover:bg-[#0c85d0] text-white", 
        label: "Twitter" 
    };
    if (lower.includes('youtube') || lower.includes('youtu.be')) return { 
        icon: Youtube, 
        color: "bg-[#FF0000] hover:bg-[#cc0000] text-white", 
        label: "YouTube" 
    };
    if (lower.includes('facebook')) return { 
        icon: Facebook, 
        color: "bg-[#1877F2] hover:bg-[#0c5dc7] text-white", 
        label: "Facebook" 
    };
    if (lower.includes('whatsapp')) return { 
        icon: MessageCircle, 
        color: "bg-[#25D366] hover:bg-[#128C7E] text-white", 
        label: "WhatsApp" 
    };
    if (lower.includes('telegram') || lower.includes('t.me')) return { 
        icon: Send, 
        color: "bg-[#0088cc] hover:bg-[#007dbb] text-white", 
        label: "Telegram" 
    };
    if (lower.includes('instagram')) return { 
        icon: ImageIcon, 
        color: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white hover:opacity-90", 
        label: "Instagram" 
    };
    
    return { 
        icon: Globe, 
        color: "bg-gray-700 hover:bg-gray-900 text-white dark:bg-gray-600 dark:hover:bg-gray-500", 
        label: "Web" 
    };
};

// --- COMPONENTE PRINCIPAL ---
const DetalleContenido = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const viewRegistered = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getContentById(id);
                if (!data) {
                    navigate('/404');
                    return;
                }
                setItem(data);

                const viewKey = `viewed_${id}`;
                const hasViewedSession = sessionStorage.getItem(viewKey);

                if (!hasViewedSession && !viewRegistered.current) {
                    viewRegistered.current = true;
                    sessionStorage.setItem(viewKey, 'true');
                    registerView(id).catch(err => console.error("Error contando vista", err));
                }
            } catch (error) {
                console.error("Error cargando detalle:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const galleryItems = item ? [
        item.imagen,
        ...(item.galeria || [])
    ].filter(Boolean) : [];

    const currentMedia = galleryItems[selectedIndex];
    const youtubeId = getYouTubeId(currentMedia);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrev = () => {
        setSelectedIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
    };

    const handleDownload = async (url) => {
        if (!item) return;
        setDownloading(url);
        setTimeout(() => setDownloading(null), 2000);

        const COOLDOWN_TIME = 60000;
        const storageKey = `download_limit_${id}_${url}`;
        const lastDownloadTime = localStorage.getItem(storageKey);
        const now = Date.now();

        window.open(url, '_blank');

        if (lastDownloadTime && (now - parseInt(lastDownloadTime)) < COOLDOWN_TIME) return;

        localStorage.setItem(storageKey, now.toString());
        await registerDownload(id, url);

        setItem(prev => ({
            ...prev,
            descargas: prev.descargas.map(d =>
                d.url === url ? { ...d, count: (d.count || 0) + 1 } : d
            )
        }));
    };

    const shareUrl = window.location.href;
    const shareText = `¡Mira este increíble mod: ${item?.titulo}!`;
    const socialLinks = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        email: `mailto:?subject=${encodeURIComponent(item?.titulo)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const totalDownloads = item?.descargas?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

    if (loading) return (
        <div className="h-full flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );
    if (!item) return null;

    return (
        <div className="animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <div className="max-w-7xl mx-auto relative z-10">
                {/* BOTÓN VOLVER */}
                <button onClick={() => navigate(-1)} className="mb-4 md:mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
                    <ArrowLeft size={20} /> Volver al listado
                </button>

                {/* ENCABEZADO */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 tracking-wider">
                                {item.tipo}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
                                <ShieldCheck size={12} /> Verificado
                            </span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                <Calendar size={14} /> {new Date(item.creado).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black text-dark dark:text-dark leading-tight tracking-tight">
                            {item.titulo}
                        </h1>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                        <div>
                            <p className="text-md md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-end gap-2">
                                <Download size={16} /> {formatNumber(totalDownloads)}
                            </p>
                            <p className="text-xs uppercase font-bold tracking-wider">Descargas</p>
                        </div>
                        <div className="w-px bg-gray-300 dark:bg-gray-700"></div>
                        <div>
                            <p className="text-md md:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-end gap-2">
                                <Eye size={16} /> {formatNumber(item.vistas || 0)}
                            </p>
                            <p className="text-xs uppercase font-bold tracking-wider">Vistas</p>
                        </div>
                    </div>
                </div>

                {/* LAYOUT GRID PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5">
                    {/* COLUMNA IZQUIERDA */}
                    <div className="lg:col-span-8 flex flex-col gap-3 md:gap-5">
                        {/* VISOR DE GALERÍA (se mantiene igual) */}
                        <div>
                            <div className="rounded-2xl relative group aspect-video mb-2 shadow-md">
                                {youtubeId ? (
                                    <iframe 
                                        key={youtubeId} 
                                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                        title="YouTube video player" 
                                        className="w-full h-full rounded-2xl" 
                                        frameBorder="0" 
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                                ) : isVideo(currentMedia) ? (
                                    <video 
                                        src={currentMedia} 
                                        key={currentMedia} 
                                        className="w-full h-full object-contain bg-black rounded-2xl" 
                                        controls 
                                        muted 
                                        loop 
                                    />
                                ) : (
                                    <img 
                                        src={currentMedia} 
                                        key={currentMedia} 
                                        className="w-full h-full object-cover transition-transform duration-700 rounded-2xl" 
                                        alt={item.titulo} 
                                    />
                                )}

                                {galleryItems.length > 1 && (
                                    <>
                                        <button 
                                            onClick={handlePrev} 
                                            className="absolute top-1/2 left-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button 
                                            onClick={handleNext} 
                                            className="absolute top-1/2 right-4 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 z-10"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* TIRA DE MINIATURAS */}
                            {galleryItems.length > 1 && (
                                <div className="flex gap-1 overflow-auto scrollbar-hide snap-x">
                                    {galleryItems.map((media, index) => {
                                        const isYt = getYouTubeId(media);
                                        const isVid = isVideo(media);
                                        const thumbSrc = isYt ? `https://img.youtube.com/vi/${isYt}/mqdefault.jpg` : media;

                                        return (
                                            <button 
                                                key={index} 
                                                onClick={() => setSelectedIndex(index)}
                                                className={clsx(
                                                    "relative h-20 w-34 shrink-0 rounded-lg border-2 transition-all cursor-pointer snap-start group/thumb",
                                                    selectedIndex === index ? "border-primary-500" : "border-transparent"
                                                )}
                                            >
                                                {(isYt || isVid) && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-lg">
                                                        <PlayCircle size={38} className="text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                                <img src={thumbSrc} alt={`Vista ${index}`} className="w-full h-full object-cover rounded-lg" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* DESCRIPCIÓN CON EL NUEVO SMART RENDERER */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 ps-0.5 pb-4 border-b border-gray-300 dark:border-gray-700">
                                <Layers size={20} className="text-primary-600 dark:text-primary-300" /> Descripción
                            </h3>
                            
                            <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                                <SafeMarkdownRenderer content={item.descripcion} />
                            </div>

                            {/* TAGS */}
                            <div className="mt-6 pt-5 border-t border-gray-300 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ps-0.5">
                                    <Tag size={16} className="text-primary-600 dark:text-primary-300" /> Etiquetas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {item.tags?.map((tag, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Tag size={10} className="text-gray-600 dark:text-gray-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                                {tag}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA (se mantiene igual) */}
                    <div className="lg:col-span-4 space-y-3 md:space-y-5">
                        {/* TARJETA DE DESCARGA */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 md:mb-5 flex items-center gap-2 ps-0.5">
                                <Download size={20} className="text-primary-600 dark:text-primary-300" /> Descargar Archivos
                            </h3>
                            <div className="flex flex-col gap-3">
                                {item.descargas.map((d, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => handleDownload(d.url)}
                                        className={clsx(
                                            "relative flex items-center justify-between px-4 py-3 rounded-xl transition-all w-full text-left group/item cursor-pointer",
                                            "bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="truncate font-bold text-sm text-white">{d.label}</span>
                                            <span className="text-[10px] flex items-center gap-1 font-medium text-primary-100">
                                                <Download size={12} /> {formatNumber(d.count || 0)} descargas
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-lg transition-colors bg-white/20">
                                            <Download size={20} className="text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* CREDITOS Y APORTE */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                    <Users size={16} className="text-primary-600 dark:text-primary-300" /> Créditos
                                </h4>
                                <div className="space-y-3">
                                    {item.creditos?.map((creador, i) => (
                                        <SmartUserRow key={i} user={creador} role="creator" />
                                    ))}
                                </div>
                            </div>

                            {item.aporte && (
                                <div className="pt-5 border-t border-gray-300 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ps-0.5">
                                        <User size={16} className="text-primary-600 dark:text-primary-300" /> Aportado por
                                    </h4>
                                    <SmartUserRow user={item.aporte} role="uploader" />
                                </div>
                            )}
                        </div>

                        {/* REDES SOCIALES */}
                        {item.redes && item.redes.length > 0 && (
                            <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ps-0.5">
                                    <Globe size={16} className="text-blue-500" /> Redes y Enlaces
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {item.redes.map((link, idx) => {
                                        const config = getSocialConfig(link.url);
                                        const IconComponent = config.icon;
                                        return (
                                            <SocialButton key={idx} href={link.url} icon={IconComponent} color={config.color} />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* COMPARTIR PÁGINA */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md">
                            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 ps-0.5">
                                <Share2 size={16} className="text-blue-500" /> Compartir
                            </h4>
                            <div className="flex gap-2">
                                <SocialButton href={socialLinks.whatsapp} icon={MessageCircle} color="text-white bg-green-600 hover:bg-green-700" />
                                <SocialButton href={socialLinks.telegram} icon={Send} color="text-white bg-[#0088cc] hover:bg-[#007dbb]" />
                                <SocialButton href={socialLinks.twitter} icon={Twitter} color="text-white bg-[#1DA1F2] hover:bg-[#0c85d0]" />
                                <SocialButton href={socialLinks.facebook} icon={Facebook} color="text-white bg-[#1877F2] hover:bg-[#0c5dc7]" />
                                <SocialButton href={socialLinks.email} icon={Mail} color="text-white bg-gray-600 hover:bg-gray-700" />
                                <button 
                                    onClick={handleCopyLink} 
                                    className={clsx(
                                        "p-3 rounded-xl transition-all hover:scale-110 text-white",
                                        copied ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"
                                    )}
                                    title="Copiar enlace al portapapeles"
                                >
                                    {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialButton = ({ href, icon: Icon, color }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={clsx("p-3 rounded-xl transition-all hover:scale-110", color)}
    >
        <Icon size={20} />
    </a>
);

export default DetalleContenido;