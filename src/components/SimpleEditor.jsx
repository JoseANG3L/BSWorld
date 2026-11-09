import { useRef, useState } from 'react';
import { Edit3, Eye } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const MAX_CHARACTERS = 5000;
const countCharacters = (text) => Array.from(text).length;

const SimpleEditor = ({ value = '', onChange, placeholder = 'Escribe la descripción...', label }) => {
    const textareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(true);
    const characterCount = countCharacters(value);

    const insertFormat = (prefix, suffix = '', newLine = false, fallback = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end);
        const lineBreak = newLine && start > 0 && value[start - 1] !== '\n' ? '\n' : '';
        const textToInsert = selected || fallback;
        const formatted = `${lineBreak}${prefix}${textToInsert}${suffix}`;
        const nextValue = `${value.slice(0, start)}${formatted}${value.slice(end)}`;
        if (countCharacters(nextValue) > MAX_CHARACTERS) return;

        onChange(nextValue);
        requestAnimationFrame(() => {
            textarea.focus();
            const selectionStart = start + lineBreak.length + prefix.length;
            textarea.setSelectionRange(
                selectionStart,
                selectionStart + textToInsert.length
            );
        });
    };

    const handleKeyDown = (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;

        switch (event.key.toLowerCase()) {
            case 'b':
                event.preventDefault();
                insertFormat('**', '**');
                break;
            case 'i':
                event.preventDefault();
                insertFormat('*', '*');
                break;
            case 'e':
                event.preventDefault();
                insertFormat('***', '***');
                break;
            case 'h':
                event.preventDefault();
                insertFormat('## ', '', true);
                break;
            case 'l':
                event.preventDefault();
                insertFormat('[', '](https://ejemplo.com)', false, 'Enlace');
                break;
            case 'k':
                event.preventDefault();
                insertFormat('`', '`');
                break;
            case 'q':
                event.preventDefault();
                insertFormat('> ', '', true);
                break;
            case 'j':
                event.preventDefault();
                insertFormat('```\n', '\n```', true, '// Tu código aquí');
                break;
            default:
                break;
        }
    };

    const handlePaste = (event) => {
        const pastedText = event.clipboardData.getData('text/plain');
        if (!pastedText) return;
        event.preventDefault();

        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart, selectionEnd } = textarea;
        const selectedText = value.slice(selectionStart, selectionEnd);
        const trimmedText = pastedText.trim();
        let insertion = pastedText;

        if (/^https?:\/\/\S+$/i.test(trimmedText)) {
            const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmedText);
            const label = selectedText || (isImage ? 'Imagen' : 'Enlace');
            insertion = isImage ? `![${label}](${trimmedText})` : `[${label}](${trimmedText})`;
        }

        const available = MAX_CHARACTERS - characterCount + countCharacters(selectedText);
        insertion = Array.from(insertion).slice(0, Math.max(0, available)).join('');
        const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
        onChange(nextValue);

        requestAnimationFrame(() => {
            textarea.focus();
            const caret = selectionStart + insertion.length;
            textarea.setSelectionRange(caret, caret);
        });
    };

    const modeButton = (
        <button
            type="button"
            onClick={() => setIsEditing((editing) => !editing)}
            aria-label={isEditing ? 'Cambiar a modo vista' : 'Cambiar a modo edición'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
            {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
            {isEditing ? 'Vista' : 'Editar'}
        </button>
    );

    return (
        <div className="space-y-1.5">
            {label && (
                <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {label}
                    </label>
                    {modeButton}
                </div>
            )}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-transparent dark:bg-[#1D1F23]">
                {!label && (
                    <div className="flex justify-end border-b border-gray-100 px-2 py-1.5 dark:border-gray-700">
                        {modeButton}
                    </div>
                )}
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        maxLength={MAX_CHARACTERS}
                        onChange={(event) => onChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="min-h-[150px] w-full resize-y rounded-xl bg-transparent p-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                ) : (
                    <div className="min-h-[150px] p-3 text-sm font-normal leading-normal text-gray-900 dark:text-gray-100">
                        {value ? (
                            <MarkdownRenderer content={value} compact />
                        ) : (
                            <p className="py-1 text-sm text-gray-400 dark:text-gray-500">{placeholder}</p>
                        )}
                    </div>
                )}
                <div className="border-t border-gray-100 px-3 py-1.5 text-right text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500" aria-live="polite">
                    {characterCount} / {MAX_CHARACTERS} caracteres
                </div>
            </div>
        </div>
    );
};

export default SimpleEditor;
