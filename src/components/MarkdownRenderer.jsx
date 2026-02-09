import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkUnwrapImages from 'remark-unwrap-images';
import { AlertCircle, Code, Check, Copy } from 'lucide-react';

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
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            title="Copiar código"
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span className="text-xs">{copied ? '¡Copiado!' : 'Copiar'}</span>
        </button>
    );
};

const MarkdownRenderer = ({ content, className = '' }) => {
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
                            <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                                <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 text-xs font-mono">
                                    <span className="flex items-center gap-2">
                                        {element.language}
                                    </span>
                                    <CopyCodeButton text={element.content} />
                                </div>
                                <pre className="bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto m-0 text-sm">
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
                            p: ({node, children, ...props}) => {
                                // Verificar si los children contienen código inline
                                const hasInlineCode = React.Children.toArray(children).some(child => {
                                    if (React.isValidElement(child)) {
                                        // Si el child es un elemento <code> con la prop inline
                                        return child.props.node?.tagName === 'code' || 
                                            child.type === 'code' || 
                                            (child.props && 'inline' in child.props);
                                    }
                                    return false;
                                });

                                // Si tiene código inline, no aplicar la clase del párrafo
                                if (hasInlineCode) {
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
                            
                            // CÓDIGO INLINE - DETECCIÓN MANUAL
                            code: ({node, className, children, ...props}) => {
                                const childrenStr = String(children);
                                const isBlockCode = className && 
                                    (className.includes('language-') || 
                                    className.includes('code-block') ||
                                    childrenStr.includes('\n'));
                                const isInline = !isBlockCode;
                                if (isInline) {
                                    return (
                                        <code
                                            className="bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700"
                                            data-inline="true"
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

export default MarkdownRenderer;