import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Edit3, 
  Eye, 
  Heading, 
  Image as ImageIcon, 
  Link, 
  Quote, 
  Table, 
  Code, 
  Minus,
  ListOrdered,
  Type
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { clsx } from 'clsx';

const SimpleEditor = ({ value, onChange, placeholder, withBorder = true }) => {
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

  // --- CORRECCIÓN EN EL PEGADO INTELIGENTE ---
  const handlePaste = (e) => {
    const pasteText = e.clipboardData.getData('text/plain').trim();
    
    // Si es un enlace válido, aplicamos el formato inteligente de Markdown
    if (/^https?:\/\/[^\s]+$/i.test(pasteText)) {
      e.preventDefault(); // Detener el pegado plano del enlace
      
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);

      const isImageUrl = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(pasteText);

      if (isImageUrl) {
        const altText = selectedText || "Imagen";
        insertFormat(`![${altText}](`, `)`);
      } else {
        const linkText = selectedText || "Enlace";
        insertFormat(`[${linkText}](`, `)`);
      }

      setTimeout(() => {
        const currentText = textareaRef.current.value;
        const indexToReplace = isImageUrl 
          ? currentText.indexOf(`![${selectedText || "Imagen"}](`, start) 
          : currentText.indexOf(`[${selectedText || "Enlace"}](`, start);
        
        if (indexToReplace !== -1) {
          const insertPos = indexToReplace + (isImageUrl ? selectedText || "Imagen" : selectedText || "Enlace").length + (isImageUrl ? 4 : 3);
          const finalBefore = currentText.substring(0, insertPos);
          const finalAfter = currentText.substring(insertPos);
          onChange(`${finalBefore}${pasteText}${finalAfter}`);
          
          setTimeout(() => {
            textarea.focus();
            const endPos = insertPos + pasteText.length + 1;
            textarea.setSelectionRange(endPos, endPos);
          }, 10);
        }
      }, 15);
    }
    // SI NO ES UN ENLACE, NO HACEMOS NADA. El navegador continuará pegando el texto plano de forma nativa.
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
      insertFormat('[', `](https://ejemplo.com)`);
    } else {
      insertFormat('[Texto del enlace](https://ejemplo.com)', '', true);
    }
  };

  const formatImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    if (selectedText) {
      insertFormat('![', '](https://ejemplo.com/imagen.jpg)');
    } else {
      insertFormat('![Texto alternativo](https://ejemplo.com/imagen.jpg)', '', true);
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
      insertMultiLine(['```python', selectedText, '```']);
    } else {
      insertMultiLine(['```python', '// Tu código aquí', '```']);
    }
  };

  const formatInlineCode = () => insertFormat('`', '`');
  const formatHorizontalRule = () => insertMultiLine('\n---\n');
  const formatStrikethrough = () => insertFormat('~~', '~~');

  // --- CORRECCIÓN EN LOS ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!textareaRef.current || e.target !== textareaRef.current) return;
      
      if (e.ctrlKey || e.metaKey) {
        // CORRECCIÓN: El preventDefault() ahora se llama individualmente dentro de cada caso personalizado,
        // permitiendo que Ctrl+C, Ctrl+V, Ctrl+X y Ctrl+A funcionen de manera nativa sin interferencias.
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); formatBold(); break;
          case 'i': e.preventDefault(); formatItalic(); break;
          case 'e': e.preventDefault(); formatBoldItalic(); break;
          case 'h': e.preventDefault(); formatHeading(2); break;
          case 'l': e.preventDefault(); formatLink(); break;
          case 'k': e.preventDefault(); formatInlineCode(); break;
          case 'j': e.preventDefault(); formatCodeBlock(); break;
          case 'q': e.preventDefault(); formatBlockquote(); break;
          default: return;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showQuickGuide = () => {
    const guideContent = `# Guía rápida de Markdown

## Texto básico
**Negrita**: **texto**
*Cursiva*: *texto*
~~Tachado~~: ~~texto~~

## Enlaces e imágenes
[Enlace](https://ejemplo.com)
![Imagen](https://ejemplo.com/imagen.jpg)

*Tip*: ¡Puedes copiar un enlace de internet, seleccionar un texto en el editor y presionar pegar (Ctrl+V) para enlazarlo automáticamente!`;
    alert(guideContent);
  };

  return (
    <div className={clsx("border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e] transition-all duration-300 focus-within:ring-1 focus-within:ring-primary-500", withBorder ? "dark:border-gray-700" : "dark:border-transparent")}>
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="flex flex-wrap items-center justify-between px-2 bg-gray-50 dark:bg-[#1D1F23] border-b border-gray-200 dark:border-gray-700 gap-1">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <div className="flex items-center gap-1">
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
          
          <div className="flex gap-0.5">
            {[1, 2, 3].map(level => (
              <button key={level} type="button" onClick={() => formatHeading(level)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 text-xs font-bold" title={`Título H${level}`}>
                H{level}
              </button>
            ))}
          </div>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={formatUnorderedList} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Lista no ordenada">
              <List size={18} />
            </button>
            <button type="button" onClick={formatOrderedList} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Lista ordenada">
              <ListOrdered size={18} />
            </button>
          </div>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={formatLink} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Enlace (Ctrl+L)">
              <Link size={18} />
            </button>
            <button type="button" onClick={formatImage} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Imagen">
              <ImageIcon size={18} />
            </button>
          </div>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={formatBlockquote} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Cita (Ctrl+Q)">
              <Quote size={18} />
            </button>
            <button type="button" onClick={formatCodeBlock} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Bloque de código (Ctrl+J)">
              <Code size={18} />
            </button>
            <button type="button" onClick={formatInlineCode} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Código en línea (Ctrl+K)">
              <span className="text-xs font-bold">{"<>"}</span>
            </button>
          </div>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={formatTable} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Tabla">
              <Table size={18} />
            </button>
            <button type="button" onClick={formatHorizontalRule} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Línea horizontal">
              <Minus size={18} />
            </button>
          </div>
        </div>

        <button type="button" onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
          {isPreview ? <><Edit3 size={14}/> Editar</> : <><Eye size={14}/> Vista Previa</>}
        </button>
      </div>

      {/* ÁREA DE EDICIÓN O VISTA PREVIA */}
      <div className="min-h-[200px] max-h-[500px] overflow-y-auto">
        {isPreview ? (
          <div className="p-3 md:p-4">
            {value ? (
              <div className="text-gray-800 dark:text-gray-200 text-sm">
                <MarkdownRenderer content={value} className="preview-mode" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 italic p-8">
                <Eye size={32} className="mb-2" />
                <p>Nada para mostrar aún...</p>
              </div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder || "Describe tu mod aquí..."}
            className="w-full h-full p-3 md:p-4 dark:bg-[#1D1F23] outline-none text-gray-800 dark:text-gray-200 text-sm resize-y min-h-[200px] font-mono"
          />
        )}
      </div>
    </div>
  );
};

export default SimpleEditor;