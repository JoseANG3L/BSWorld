import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Eye } from 'lucide-react';
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

  // --- DETECCIÓN INTELIGENTE AL PEGAR ---
  const handlePaste = (e) => {
    const pasteText = e.clipboardData.getData('text/plain').trim();
    
    // Si es un enlace válido, aplicamos el formato inteligente de Markdown
    if (/^https?:\/\/[^\s]+$/i.test(pasteText)) {
      e.preventDefault();
      
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
      return;
    }

    // Detectar código basado en patrones comunes
    const codePatterns = [
      /^(function|const|let|var|class|import|export|if|for|while|return)/, // JavaScript
      /^(def |class |import |from |if |for |while |return)/, // Python
      /^(public|private|protected|class|interface|void|int|string)/, // Java/C#
      /^((\w+::)?\w+\s*\(|\w+\s*=>\s*\{)/, // Rust/JS functions
      /^\s*(\w+\.?){2,}\s*=/, // Dot notation assignments
    ];

    const isCode = codePatterns.some(pattern => pattern.test(pasteText.split('\n')[0]));
    
    if (isCode) {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      const textToWrap = selectedText || pasteText;
      insertMultiLine(['```', textToWrap, '```']);
      return;
    }

    // Detectar listas numeradas
    const numberedLines = pasteText.split('\n');
    const isNumberedList = numberedLines.length > 1 && numberedLines.every(line => 
      /^\d+\./.test(line.trim()) || line.trim() === ''
    );

    if (isNumberedList) {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);
      const lineBreak = before.endsWith('\n') || before === '' ? '' : '\n';
      
      onChange(`${before}${lineBreak}${pasteText}${after}`);
      return;
    }

    // Detectar listas con viñetas
    const bulletListPattern = /^[-*+]\s+/m;
    if (bulletListPattern.test(pasteText)) {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);
      const lineBreak = before.endsWith('\n') || before === '' ? '' : '\n';
      
      onChange(`${before}${lineBreak}${pasteText}${after}`);
      return;
    }

    // Detectar encabezados (texto que parece título)
    const lines = pasteText.split('\n');
    if (lines.length === 1 && lines[0].length < 60 && /^[A-Z][^a-z]/.test(lines[0])) {
      e.preventDefault();
      insertFormat(`# `, '', true);
      setTimeout(() => {
        const textarea = textareaRef.current;
        const currentText = textarea.value;
        const newPos = currentText.lastIndexOf('# ') + 2;
        onChange(currentText.substring(0, newPos) + pasteText + currentText.substring(newPos));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newPos + pasteText.length, newPos + pasteText.length);
        }, 10);
      }, 15);
      return;
    }
  };

  // Funciones de formato para atajos de teclado
  const formatBold = () => insertFormat('**', '**');
  const formatItalic = () => insertFormat('*', '*');
  const formatBoldItalic = () => insertFormat('***', '***');
  const formatHeading = (level) => {
    const prefix = '#'.repeat(level) + ' ';
    insertFormat(prefix, '', true);
  };
  const formatLink = () => insertFormat('[', `](https://ejemplo.com)`);
  const formatCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    if (selectedText) {
      insertMultiLine(['```', selectedText, '```']);
    } else {
      insertMultiLine(['```', '// Tu código aquí', '```']);
    }
  };
  const formatInlineCode = () => insertFormat('`', '`');
  const formatBlockquote = () => insertFormat('> ', '', true);

  // --- ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!textareaRef.current || e.target !== textareaRef.current) return;
      
      if (e.ctrlKey || e.metaKey) {
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

  return (
    <div className={clsx("border border-gray-300 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e] transition-all duration-300 focus-within:ring-1 focus-within:ring-primary-500", withBorder ? "dark:border-gray-700" : "dark:border-transparent")}>
      {/* Botón de vista previa */}
      <div className="flex justify-end px-2 py-1 bg-gray-50 dark:bg-[#1D1F23] border-b border-gray-200 dark:border-gray-700">
        <button type="button" onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
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
