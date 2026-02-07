import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, List, Eye, Edit3, Heading } from 'lucide-react';

const SimpleEditor = ({ value, onChange, placeholder }) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  // Función para insertar formato en la posición del cursor
  const insertFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    
    // Enviamos el cambio al padre
    onChange(newText);

    // Recuperar el foco (opcional, para UX)
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e] transition-all focus-within:ring-2 focus-within:ring-primary-500">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex items-center justify-between px-2 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        
        <div className="flex items-center gap-1">
          {/* Botones de formato */}
          <button type="button" onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Negrita">
            <Bold size={18} />
          </button>
          <button type="button" onClick={() => insertFormat('*', '*')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Cursiva">
            <Italic size={18} />
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button type="button" onClick={() => insertFormat('- ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Lista">
            <List size={18} />
          </button>
          <button type="button" onClick={() => insertFormat('### ')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Título">
            <Heading size={18} />
          </button>
        </div>

        {/* Toggle Vista Previa */}
        <button 
          type="button" 
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${isPreview ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
          {isPreview ? <><Edit3 size={14}/> Editar</> : <><Eye size={14}/> Vista Previa</>}
        </button>
      </div>

      {/* ÁREA DE EDICIÓN O VISTA PREVIA */}
      <div className="min-h-[150px] max-h-[400px] overflow-y-auto">
        {isPreview ? (
          // RENDERIZADO DE MARKDOWN
          <div className="prose dark:prose-invert max-w-none p-3 text-sm">
            <ReactMarkdown 
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />
                }}
            >
                {value || "*Nada para mostrar aún...*"}
            </ReactMarkdown>
          </div>
        ) : (
          // TEXTAREA NORMAL
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-3 bg-transparent outline-none text-gray-800 dark:text-gray-200 text-sm resize-y min-h-[150px]"
          />
        )}
      </div>
      
      {!isPreview && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-1 text-[10px] text-gray-400 text-right">
              Markdown compatible
          </div>
      )}
    </div>
  );
};

export default SimpleEditor;