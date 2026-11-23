import { useLayoutEffect, useRef, useState } from 'react';
import { useVisitState } from '../hooks/useVisitState';
import MarkdownRenderer from './MarkdownRenderer';

const PREVIEW_HEIGHT = 80;

function measurePreview(content) {
    if (content.offsetHeight <= PREVIEW_HEIGHT) return null;

    const top = content.getBoundingClientRect().top;
    const range = document.createRange();
    const nodes = document.createTreeWalker(content, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let lastBottom = 0;
    for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
        let rects;
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            range.selectNodeContents(node);
            rects = range.getClientRects();
        } else if (node.nodeType === Node.ELEMENT_NODE && node.matches('img, hr, svg')) {
            rects = node.getClientRects();
        } else {
            continue;
        }
        for (const rect of rects) {
            const bottom = Math.ceil(rect.bottom - top);
            if (bottom > PREVIEW_HEIGHT) return lastBottom || PREVIEW_HEIGHT;
            if (rect.height && rect.width) lastBottom = Math.max(lastBottom, bottom);
        }
    }
    return lastBottom || PREVIEW_HEIGHT;
}

export default function ContentDescription({ description }) {
    const [expanded, setExpanded] = useVisitState('descriptionExpanded', false);
    const [previewHeight, setPreviewHeight] = useState(null);
    const contentRef = useRef(null);
    const hasDescription = Boolean(description?.trim());

    useLayoutEffect(() => {
        if (!hasDescription) return;
        const content = contentRef.current;
        const measure = () => setPreviewHeight(measurePreview(content));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(content);
        return () => observer.disconnect();
    }, [description, hasDescription]);

    return (
        <section className="min-w-0 lg:order-3">
            <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">Descripción</h3>
            <div id="content-description" className="overflow-hidden"
                style={{ maxHeight: hasDescription && !expanded ? previewHeight : undefined }}>
                <div ref={contentRef} className="flow-root break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&_.markdown-content>:first-child]:mt-0 [&_.markdown-content>:last-child]:mb-0">
                    <MarkdownRenderer content={hasDescription ? description : ''} />
                </div>
            </div>
            {hasDescription && previewHeight !== null && (
                <button type="button" aria-controls="content-description" aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 block text-sm font-medium text-primary-600 dark:text-primary-400">
                    {expanded ? 'Leer menos' : 'Leer más'}
                </button>
            )}
        </section>
    );
}
