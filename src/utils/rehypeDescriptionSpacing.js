// Markdown supplies block and inline positions but discards blank lines and prose indentation.
export default function rehypeDescriptionSpacing() {
    return (tree, file) => {
        const lines = String(file).split(/\r\n?|\n/);
        const indentAt = (line) => lines[line - 1]?.match(/^[ \t]*/)[0] || '';

        function restoreParagraph(node, topLevel) {
            const indent = (line) => topLevel ? indentAt(line) : '';
            function restoreInline(parent) {
                parent.children.forEach((child, index) => {
                    const previous = parent.children[index - 1];
                    if (child.type === 'text' && child.position) {
                        let line = child.position.start.line;
                        child.value = child.value.replace(/\r\n?|\n/g, () => '\n' + indent(++line));
                    } else if (child.type === 'text' && previous?.tagName === 'br') {
                        // A hard Markdown break already renders <br>. Its synthetic newline would double it.
                        child.value = indent(previous.position.end.line);
                    } else if (child.children && child.tagName !== 'code') {
                        restoreInline(child);
                    }
                });
            }
            restoreInline(node);
            const leading = indent(node.position.start.line);
            if (leading) node.children.unshift({ type: 'text', value: leading });
        }

        function visit(node, topLevel = false) {
            if (node.tagName === 'p' && node.position) restoreParagraph(node, topLevel);
            else node.children?.forEach((child) => visit(child));
        }

        const children = [];
        let nextLine = 1;
        function addBlankLines(until) {
            const count = lines.slice(nextLine - 1, until - 1).filter((line) => !line.trim()).length;
            if (count) children.push({
                type: 'element',
                tagName: 'div',
                properties: { ariaHidden: true, style: `height: ${count}lh` },
                children: [],
            });
        }
        for (const child of tree.children) {
            if (child.position) {
                addBlankLines(child.position.start.line);
                nextLine = child.position.end.line + 1;
                visit(child, true);
            }
            children.push(child);
        }
        addBlankLines(lines.length + 1);
        tree.children = children;
    };
}
