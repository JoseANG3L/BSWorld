import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Eye, 
  Edit3, 
  Heading, 
  Image as ImageIcon, 
  Link, 
  Quote, 
  Table, 
  Code, 
  Minus,
  HelpCircle,
  ListOrdered,
  Type
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const SimpleEditor = ({ value, onChange, placeholder }) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  // Función para insertar formato en la posición del cursor
  const insertFormat = (prefix, suffix = '', newLine = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const lineBreak = newLine ? (before.endsWith('\n') || before === '' ? '' : '\n') : '';
    const newText = `${before}${lineBreak}${prefix}${selected}${suffix}${after}`;
    
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + lineBreak.length + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos + selected.length);
    }, 10);
  };

  // Función para insertar múltiples líneas
  const insertMultiLine = (lines) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const lineBreak = before.endsWith('\n') || before === '' ? '' : '\n';
    const content = Array.isArray(lines) ? lines.join('\n') : lines;
    const newText = `${before}${lineBreak}${content}\n${after}`;
    
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + lineBreak.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Funciones específicas para cada formato
  const formatBold = () => insertFormat('**', '**');
  const formatItalic = () => insertFormat('*', '*');
  const formatBoldItalic = () => insertFormat('***', '***');
  
  const formatHeading = (level) => {
    const prefix = '#'.repeat(level) + ' ';
    insertFormat(prefix, '', true);
  };

  const formatUnorderedList = () => insertFormat('- ', '', true);
  const formatOrderedList = () => insertFormat('1. ', '', true);

  const formatLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Si hay texto seleccionado, lo usamos como texto del enlace
      insertFormat('[', `](https://ejemplo.com "Texto descriptivo")`);
    } else {
      // Si no hay texto seleccionado, insertamos el formato completo
      insertFormat('[Texto del enlace](https://ejemplo.com "Texto descriptivo")', '', true);
    }
  };

  const formatImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Si hay texto seleccionado, lo usamos como texto alternativo
      insertFormat('![', '](https://ejemplo.com/imagen.jpg "Título de la imagen")');
    } else {
      // Si no hay texto seleccionado, insertamos el formato completo
      insertFormat('![Texto alternativo](https://ejemplo.com/imagen.jpg "Título de la imagen")', '', true);
    }
  };

  const formatBlockquote = () => insertFormat('> ', '', true);

  const formatTable = () => {
    const tableContent = `| Encabezado 1 | Encabezado 2 | Encabezado 3 |
|--------------|--------------|--------------|
| Celda 1      | Celda 2      | Celda 3      |
| Celda 4      | Celda 5      | Celda 6      |`;
    insertMultiLine(tableContent);
  };

  const formatCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Si hay texto seleccionado, lo convertimos en bloque de código
      insertMultiLine(['```python', selectedText, '```']);
    } else {
      // Si no hay texto seleccionado, insertamos un bloque vacío
      insertMultiLine(['```python', '// Tu código aquí', '```']);
    }
  };

  const formatInlineCode = () => insertFormat('`', '`');

  const formatHorizontalRule = () => insertMultiLine('\n---\n');

  const formatStrikethrough = () => insertFormat('~~', '~~');

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!textareaRef.current) return;
      if (e.target !== textareaRef.current) return;

      // Solo activar atajos si el textarea está enfocado
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        switch (e.key.toLowerCase()) {
          case 'b':
            formatBold();
            break;
          case 'i':
            formatItalic();
            break;
          case 'e':
            formatBoldItalic();
            break;
          case 'h':
            formatHeading(2);
            break;
          case 'l':
            formatLink();
            break;
          case 'k':
            formatInlineCode();
            break;
          case 'j':
            formatCodeBlock();
            break;
          case 'q':
            formatBlockquote();
            break;
          default:
            return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Función para mostrar guía rápida
  const showQuickGuide = () => {
    const guideContent = `# Guía rápida de Markdown

## Texto básico
**Negrita**: **texto** o __texto__
*Cursiva*: *texto* o _texto_
***Negrita y cursiva***: ***texto***
~~Tachado~~: ~~texto~~

## Encabezados
# Título 1
## Título 2
### Título 3

## Listas
- Lista no ordenada
* También con asterisco
+ O con signo más

1. Lista ordenada
2. Segundo elemento

## Enlaces e imágenes
[Enlace](https://ejemplo.com)
![Imagen](https://ejemplo.com/imagen.jpg)

## Código
\`código en línea\`

\`\`\`
bloque de código
\`\`\`

## Citas
> Esto es una cita

## Tablas
| Columna 1 | Columna 2 |
|-----------|-----------|
| Dato 1    | Dato 2    |

## Línea horizontal
---

Usa los botones de la barra de herramientas o atajos de teclado:
Ctrl+B: Negrita | Ctrl+I: Cursiva | Ctrl+E: Negrita+Cursiva
Ctrl+H: Título | Ctrl+L: Enlace | Ctrl+Q: Cita`;
    
    alert(guideContent);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e] transition-all focus-within:ring-2 focus-within:ring-primary-500">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex flex-wrap items-center justify-between px-2 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-1">
        
        {/* Primera fila: Texto básico */}
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Texto:</span>
            <button type="button" onClick={formatBold} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Negrita (Ctrl+B)">
              <Bold size={18} />
            </button>
            <button type="button" onClick={formatItalic} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Cursiva (Ctrl+I)">
              <Italic size={18} />
            </button>
            <button type="button" onClick={formatBoldItalic} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Negrita y Cursiva (Ctrl+E)">
              <Type size={18} />
            </button>
            <button type="button" onClick={formatStrikethrough} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Texto tachado">
              <span className="text-sm font-bold">S</span>
            </button>
          </div>

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          
          {/* Encabezados */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Títulos:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(level => (
                <button 
                  key={level} 
                  type="button" 
                  onClick={() => formatHeading(level)}
                  className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 text-xs font-bold"
                  title={`Título H${level}`}
                >
                  H{level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Segunda fila: Elementos estructurales */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Listas:</span>
            <button type="button" onClick={formatUnorderedList} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Lista no ordenada">
              <List size={18} />
            </button>
            <button type="button" onClick={formatOrderedList} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Lista ordenada">
              <ListOrdered size={18} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Medios:</span>
            <button type="button" onClick={formatLink} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Enlace (Ctrl+L)">
              <Link size={18} />
            </button>
            <button type="button" onClick={formatImage} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Imagen">
              <ImageIcon size={18} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Bloques:</span>
            <button type="button" onClick={formatBlockquote} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Cita (Ctrl+Q)">
              <Quote size={18} />
            </button>
            <button type="button" onClick={formatCodeBlock} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bloque de código (Ctrl+J)">
              <Code size={18} />
            </button>
            <button type="button" onClick={formatInlineCode} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Código en línea (Ctrl+K)">
              <span className="text-xs font-bold">{"<>"}</span>
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Otros:</span>
            <button type="button" onClick={formatTable} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Tabla">
              <Table size={18} />
            </button>
            <button type="button" onClick={formatHorizontalRule} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Línea horizontal">
              <Minus size={18} />
            </button>
            <button type="button" onClick={showQuickGuide} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Guía rápida">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        {/* Toggle Vista Previa */}
        <button 
          type="button" 
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600`}
        >
          {isPreview ? <><Edit3 size={14}/> Editar</> : <><Eye size={14}/> Vista Previa</>}
        </button>
      </div>

      {/* ÁREA DE EDICIÓN O VISTA PREVIA */}
      <div className="min-h-[200px] max-h-[500px] overflow-y-auto">
        {isPreview ? (
          // VISTA PREVIA MEJORADA CON SafeMarkdownRenderer
          <div className="p-3 md:p-4">
            {value ? (
              <div className="text-gray-800 dark:text-gray-200 text-sm">
                <MarkdownRenderer 
                  content={value} 
                  className="preview-mode" 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 italic p-8">
                <Eye size={32} className="mb-2" />
                <p>Nada para mostrar aún...</p>
                <p className="text-xs mt-2">Escribe algo en el editor para ver la vista previa</p>
              </div>
            )}
          </div>
        ) : (
          // TEXTAREA NORMAL
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Escribe tu contenido Markdown aquí... Usa los botones de arriba para formato o Ctrl+? para atajos."}
            className="w-full h-full p-3 md:p-4 bg-transparent outline-none text-gray-800 dark:text-gray-200 text-sm resize-y min-h-[200px] font-mono"
          />
        )}
      </div>
      
      {!isPreview && (
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="button"
            onClick={showQuickGuide}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            📖 Ver guía rápida de Markdown
          </button>
          <div className="text-xs text-gray-400">
            <span className="mr-4">Ctrl+B: Negrita</span>
            <span className="mr-4">Ctrl+I: Cursiva</span>
            <span>Ctrl+L: Enlace</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleEditor;