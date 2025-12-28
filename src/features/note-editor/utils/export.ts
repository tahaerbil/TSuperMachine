import { Editor } from '@tiptap/react';

/**
 * Convert TipTap JSON content to Markdown
 */
export const exportToMarkdown = (editor: Editor): string => {
    const json = editor.getJSON();
    return jsonToMarkdown(json);
};

/**
 * Convert TipTap JSON node to Markdown
 */
const jsonToMarkdown = (node: any, depth: number = 0): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!node) return '';

    let result = '';

    if (node.type === 'doc') {
        result = (node.content || []).map((child: any) => jsonToMarkdown(child, depth)).join('\n\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'paragraph') {
        result = contentToMarkdown(node.content);
    } else if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        const prefix = '#'.repeat(level) + ' ';
        result = prefix + contentToMarkdown(node.content);
    } else if (node.type === 'bulletList') {
        result = (node.content || []).map((item: any) => '- ' + jsonToMarkdown(item, depth + 1)).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'orderedList') {
        result = (node.content || []).map((item: any, i: number) => `${i + 1}. ` + jsonToMarkdown(item, depth + 1)).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'listItem') {
        result = (node.content || []).map((child: any) => jsonToMarkdown(child, depth)).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'taskList') {
        result = (node.content || []).map((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const checked = item.attrs?.checked ? 'x' : ' ';
            return `- [${checked}] ` + jsonToMarkdown(item, depth + 1);
        }).join('\n');
    } else if (node.type === 'taskItem') {
        result = (node.content || []).map((child: any) => jsonToMarkdown(child, depth)).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'blockquote') {
        result = (node.content || []).map((child: any) => '> ' + jsonToMarkdown(child, depth)).join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (node.type === 'codeBlock') {
        const language = node.attrs?.language || '';
        const code = contentToMarkdown(node.content);
        result = '```' + language + '\n' + code + '\n```';
    } else if (node.type === 'horizontalRule') {
        result = '---';
    } else if (node.type === 'image') {
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || '';
        result = `![${alt}](${src})`;
    } else if (node.type === 'table') {
        result = tableToMarkdown(node);
    }

    return result;
};

/**
 * Convert inline content to Markdown
 */
const contentToMarkdown = (content: any[] | undefined): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!content) return '';

    return content.map(node => {
        if (node.type === 'text') {
            let text = node.text || '';

            // Apply marks
            if (node.marks) {
                for (const mark of node.marks) {
                    if (mark.type === 'bold') {
                        text = `**${text}**`;
                    } else if (mark.type === 'italic') {
                        text = `*${text}*`;
                    } else if (mark.type === 'strike') {
                        text = `~~${text}~~`;
                    } else if (mark.type === 'code') {
                        text = `\`${text}\``;
                    } else if (mark.type === 'link') {
                        const href = mark.attrs?.href || '';
                        text = `[${text}](${href})`;
                    }
                }
            }

            return text;
        } else if (node.type === 'hardBreak') {
            return '  \n';
        }
        return '';
    }).join('');
};

/**
 * Convert table to Markdown
 */
const tableToMarkdown = (node: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const rows = node.content || [];
    if (rows.length === 0) return '';

    const result: string[] = [];

    rows.forEach((row: any, rowIndex: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const cells = row.content || [];
        const cellTexts = cells.map((cell: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const cellContent = (cell.content || []).map((p: any) => contentToMarkdown(p.content)).join(' '); // eslint-disable-line @typescript-eslint/no-explicit-any
            return cellContent.trim() || ' ';
        });

        result.push('| ' + cellTexts.join(' | ') + ' |');

        // Add header separator after first row
        if (rowIndex === 0) {
            const separator = cells.map(() => '---').join(' | ');
            result.push('| ' + separator + ' |');
        }
    });

    return result.join('\n');
};

/**
 * Export content as plain text
 */
export const exportToText = (editor: Editor): string => {
    return editor.getText();
};

/**
 * Download content as a file
 */
export const downloadAsFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
