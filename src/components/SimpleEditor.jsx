import { useCallback, useEffect, useRef } from 'react';

const MAX_CHARACTERS = 5000;
const countCharacters = (text) => Array.from(text).length;

const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHref = (value) => /^(https?:|mailto:|\/|#)/i.test(value) ? value : '';

function renderInlineMarkdown(source) {
    let text = escapeHtml(source);
    const code = [];
    text = text.replace(/`([^`]+)`/g, (_, value) => {
        const index = code.push(`<code>${value}</code>`) - 1;
        return `CODETOKEN${index}END`;
    });
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
        const href = safeHref(src);
        return href ? `<img src="${href}" alt="${alt}">` : alt;
    });
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
        const href = safeHref(url);
        return href ? `<a href="${href}">${label}</a>` : label;
    });
    text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, '<strong>$1$2</strong>');
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/(^|[_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
    text = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
    return text.replace(/CODETOKEN(\d+)END/g, (_, index) => code[Number(index)]);
}

function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const output = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
            index += 1;
            continue;
        }

        const fence = line.match(/^\s*```([\w-]*)\s*$/);
        if (fence) {
            const code = [];
            index += 1;
            while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
                code.push(lines[index]);
                index += 1;
            }
            output.push(`<pre><code${fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
            index += 1;
            continue;
        }

        const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            const level = heading[1].length;
            output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
            index += 1;
            continue;
        }

        if (/^\s*>\s?/.test(line)) {
            const quote = [];
            while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
                quote.push(lines[index].replace(/^\s*>\s?/, ''));
                index += 1;
            }
            output.push(`<blockquote><p>${quote.map(renderInlineMarkdown).join('<br>')}</p></blockquote>`);
            continue;
        }

        const list = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
        if (list) {
            const ordered = /^\d/.test(list[1]);
            const tag = ordered ? 'ol' : 'ul';
            const items = [];
            while (index < lines.length) {
                const item = lines[index].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
                if (!item || /^\d/.test(item[1]) !== ordered) break;
                items.push(`<li>${renderInlineMarkdown(item[2])}</li>`);
                index += 1;
            }
            output.push(`<${tag}>${items.join('')}</${tag}>`);
            continue;
        }

        const paragraph = [];
        while (index < lines.length && lines[index].trim()
            && !/^\s*```/.test(lines[index])
            && !/^\s{0,3}#{1,6}\s/.test(lines[index])
            && !/^\s*>\s?/.test(lines[index])
            && !/^\s*([-*+]|\d+\.)\s+/.test(lines[index])) {
            paragraph.push(lines[index]);
            index += 1;
        }
        output.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
    }

    return output.join('');
}

function getRenderedCharacterCount(markdown) {
    const container = document.createElement('div');
    container.innerHTML = markdownToHtml(markdown);
    return countCharacters(container.innerText ?? container.textContent ?? '');
}

function containsMarkdownSyntax(text) {
    return /(?:^|\n)\s*(?:```|#{1,6}\s+\S|>\s+\S|[-*+]\s+\S|\d+\.\s+\S)|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|(^|[^*])\*[^*\n]+\*(?!\*)/m.test(text);
}

function nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\u00a0/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const children = Array.from(node.childNodes, nodeToMarkdown).join('');
    switch (node.tagName.toLowerCase()) {
        case 'br': return '\n';
        case 'strong':
        case 'b': return `**${children}**`;
        case 'em':
        case 'i': return `*${children}*`;
        case 'del':
        case 's':
        case 'strike': return `~~${children}~~`;
        case 'code':
            return node.parentElement?.tagName.toLowerCase() === 'pre' ? children : `\`${children}\``;
        case 'pre': return `\`\`\`\n${node.textContent.replace(/\n$/, '')}\n\`\`\``;
        case 'a': return `[${children}](${node.getAttribute('href') || ''})`;
        case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
        case 'blockquote':
            return children.trim().split('\n').map((line) => `> ${line}`).join('\n');
        case 'ul':
        case 'ol':
            return Array.from(node.children)
                .filter((child) => child.tagName.toLowerCase() === 'li')
                .map((item, index) => `${node.tagName.toLowerCase() === 'ol' ? `${index + 1}.` : '-'} ${Array.from(item.childNodes, nodeToMarkdown).join('').trim()}`)
                .join('\n');
        case 'li': return children;
        case 'h1': return `# ${children}`;
        case 'h2': return `## ${children}`;
        case 'h3': return `### ${children}`;
        case 'h4': return `#### ${children}`;
        case 'h5': return `##### ${children}`;
        case 'h6': return `###### ${children}`;
        case 'p':
        case 'div': return children ? `${children}\n` : '';
        default: return children;
    }
}

function getCaretOffset(element) {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !element.contains(selection.anchorNode)) return null;
    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(element);
    range.setEnd(selection.anchorNode, selection.anchorOffset);
    return range.toString().length;
}

function setCaretOffset(element, offset) {
    if (offset === null) return;
    const selection = window.getSelection();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let remaining = offset;
    while (node) {
        if (remaining <= node.nodeValue.length) {
            const range = document.createRange();
            range.setStart(node, remaining);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
        remaining -= node.nodeValue.length;
        node = walker.nextNode();
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

const SimpleEditor = ({ value = '', onChange, placeholder = 'Escribe la descripción...', withBorder = true }) => {
    const editorRef = useRef(null);
    const lastValueRef = useRef(null);
    const characterCount = getRenderedCharacterCount(value);

    useEffect(() => {
        if (value === lastValueRef.current || !editorRef.current) return;
        editorRef.current.innerHTML = markdownToHtml(value);
        lastValueRef.current = value;
    }, [value]);

    const handleInput = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const markdown = Array.from(editor.childNodes, nodeToMarkdown).join('');
        const visibleText = editor.innerText ?? editor.textContent;
        if (countCharacters(visibleText) > MAX_CHARACTERS) {
            editor.innerHTML = markdownToHtml(lastValueRef.current || '');
            setCaretOffset(editor, countCharacters(editor.innerText ?? editor.textContent ?? ''));
            return;
        }
        if (containsMarkdownSyntax(visibleText)) {
            const caret = getCaretOffset(editor);
            editor.innerHTML = markdownToHtml(markdown);
            setCaretOffset(editor, caret);
        }
        lastValueRef.current = markdown;
        onChange(markdown);
    }, [onChange]);

    const replaceSelection = useCallback((text) => {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor || !selection?.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;
        const currentCount = countCharacters(editor.innerText ?? editor.textContent ?? '');
        const selectedCount = countCharacters(selection.toString());
        const available = MAX_CHARACTERS - currentCount + selectedCount;
        if (getRenderedCharacterCount(text) > available) return;

        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
    }, []);

    const handleBeforeInput = (event) => {
        const editor = editorRef.current;
        const input = event.nativeEvent;
        const text = input?.data ?? event.data;
        if (!editor || !text || !input?.inputType?.startsWith('insert')) return;

        const currentCount = countCharacters(editor.innerText ?? editor.textContent ?? '');
        const selectedCount = countCharacters(window.getSelection()?.toString() ?? '');
        if (currentCount - selectedCount + countCharacters(text) > MAX_CHARACTERS) {
            event.preventDefault();
        }
    };

    const handleKeyDown = (event) => {
        if (!(event.ctrlKey || event.metaKey) || !editorRef.current?.contains(document.activeElement)) return;
        const shortcuts = {
            b: ['**', '**'],
            i: ['*', '*'],
            e: ['~~', '~~'],
            k: ['[', '](https://)'],
            q: ['> ', ''],
            j: ['```\n', '\n```'],
        };
        const shortcut = shortcuts[event.key.toLowerCase()];
        if (!shortcut) return;
        event.preventDefault();
        const selection = window.getSelection();
        const selected = selection?.toString() || '';
        replaceSelection(`${shortcut[0]}${selected || (event.key.toLowerCase() === 'k' ? 'Enlace' : '')}${shortcut[1]}`);
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        if (!text) return;

        const selected = window.getSelection()?.toString() || '';
        if (/^https?:\/\/\S+$/i.test(text.trim())) {
            const url = text.trim();
            replaceSelection(selected
                ? (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ? `![${selected}](${url})` : `[${selected}](${url})`)
                : (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ? `![Imagen](${url})` : `[Enlace](${url})`));
            return;
        }
        const editor = editorRef.current;
        const currentCount = countCharacters(editor?.innerText ?? editor?.textContent ?? '');
        const available = Math.max(0, MAX_CHARACTERS - currentCount + countCharacters(selected));
        replaceSelection(Array.from(text).slice(0, available).join(''));
    };

    return (
        <div className={`relative rounded-xl bg-white dark:bg-[#1D1F23] ${withBorder ? 'border border-gray-200 dark:border-gray-700' : ''}`}>
            {characterCount === 0 && (
                <span className="pointer-events-none absolute left-4 top-3 text-gray-400 dark:text-gray-500">
                    {placeholder}
                </span>
            )}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={placeholder}
                aria-multiline="true"
                onInput={handleInput}
                onBeforeInput={handleBeforeInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="h-[200px] w-full overflow-y-auto whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm text-gray-900 outline-none dark:text-gray-100 [&_a]:text-primary-600 [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:dark:bg-gray-800 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:dark:bg-gray-900 [&_ul]:list-disc"
            />
            <div className="border-t border-gray-100 px-3 py-1.5 text-right text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500" aria-live="polite">
                {characterCount} / {MAX_CHARACTERS} caracteres
            </div>
        </div>
    );
};

export default SimpleEditor;
