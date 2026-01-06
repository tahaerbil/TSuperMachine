import { Editor } from '@tiptap/react';
import jsPDF from 'jspdf';

/**
 * Export options for PDF
 */
interface PDFExportOptions {
    title?: string;
    author?: string;
    fontSize?: number;
    margin?: number;
}

/**
 * Convert TipTap content to PDF and download
 */
export const exportToPDF = async (
    editor: Editor,
    filename: string = 'note.pdf',
    options: PDFExportOptions = {}
): Promise<void> => {
    const {
        title = 'Note',
        author = 'TSuperMachine',
        fontSize = 12,
        margin = 20
    } = options;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Set document properties
    pdf.setProperties({
        title,
        author,
        creator: 'TSuperMachine Note Editor'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    const json = editor.getJSON();

    /**
     * Add text with word wrap
     */
    const addText = (
        text: string,
        x: number,
        y: number,
        size: number = fontSize,
        style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'
    ): number => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);

        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = size * 0.4;

        for (const line of lines) {
            if (y > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, x, y);
            y += lineHeight;
        }

        return y;
    };

    /**
     * Get text style from marks
     */
    const getStyleFromMarks = (marks?: Array<{ type: string }>): 'normal' | 'bold' | 'italic' | 'bolditalic' => {
        if (!marks) return 'normal';
        const hasBold = marks.some(m => m.type === 'bold');
        const hasItalic = marks.some(m => m.type === 'italic');
        if (hasBold && hasItalic) return 'bolditalic';
        if (hasBold) return 'bold';
        if (hasItalic) return 'italic';
        return 'normal';
    };

    /**
     * Process content nodes recursively
     */
    const processNode = (node: any, indent: number = 0): void => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!node) return;

        const indentX = margin + indent * 5;

        switch (node.type) {
            case 'doc':
                (node.content || []).forEach((child: any) => processNode(child, indent)); // eslint-disable-line @typescript-eslint/no-explicit-any
                break;

            case 'heading': {
                const level = node.attrs?.level || 1;
                const sizes = { 1: 24, 2: 20, 3: 16 };
                const headingSize = sizes[level as keyof typeof sizes] || fontSize;
                yPosition += 3; // Extra space before heading
                const text = (node.content || []).map((n: any) => n.text || '').join(''); // eslint-disable-line @typescript-eslint/no-explicit-any
                yPosition = addText(text, indentX, yPosition, headingSize, 'bold');
                yPosition += 2; // Extra space after heading
                break;
            }

            case 'paragraph': {
                const textParts: Array<{ text: string; style: 'normal' | 'bold' | 'italic' | 'bolditalic' }> = [];
                (node.content || []).forEach((child: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    if (child.type === 'text') {
                        textParts.push({
                            text: child.text || '',
                            style: getStyleFromMarks(child.marks)
                        });
                    }
                });

                // Simple approach: concatenate and render
                const fullText = textParts.map(p => p.text).join('');
                if (fullText.trim()) {
                    yPosition = addText(fullText, indentX, yPosition);
                }
                yPosition += 2;
                break;
            }

            case 'bulletList':
            case 'orderedList': {
                const isOrdered = node.type === 'orderedList';
                (node.content || []).forEach((item: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const prefix = isOrdered ? `${index + 1}. ` : '• ';
                    const itemText = extractText(item);
                    yPosition = addText(`${prefix}${itemText}`, indentX, yPosition);
                });
                yPosition += 2;
                break;
            }

            case 'taskList': {
                (node.content || []).forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const checked = item.attrs?.checked ? '☑' : '☐';
                    const itemText = extractText(item);
                    yPosition = addText(`${checked} ${itemText}`, indentX, yPosition);
                });
                yPosition += 2;
                break;
            }

            case 'blockquote': {
                pdf.setDrawColor(100, 100, 100);
                pdf.setLineWidth(0.5);
                const startY = yPosition;
                const quoteText = extractText(node);
                pdf.setTextColor(100, 100, 100);
                yPosition = addText(quoteText, indentX + 5, yPosition, fontSize, 'italic');
                pdf.line(indentX, startY - 2, indentX, yPosition - 2);
                pdf.setTextColor(0, 0, 0);
                yPosition += 2;
                break;
            }

            case 'codeBlock': {
                const code = extractText(node);
                pdf.setFillColor(240, 240, 240);
                const codeLines = code.split('\n');
                const codeHeight = codeLines.length * (fontSize * 0.35) + 6;

                if (yPosition + codeHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.rect(indentX - 2, yPosition - 4, contentWidth + 4, codeHeight, 'F');
                pdf.setFont('courier', 'normal');
                pdf.setFontSize(10);

                for (const line of codeLines) {
                    pdf.text(line, indentX, yPosition);
                    yPosition += fontSize * 0.35;
                }

                pdf.setFont('helvetica', 'normal');
                yPosition += 4;
                break;
            }

            case 'horizontalRule': {
                yPosition += 3;
                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.3);
                pdf.line(indentX, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
                break;
            }

            case 'table': {
                const rows = node.content || [];
                if (rows.length === 0) break;

                const colCount = rows[0]?.content?.length || 3;
                const colWidth = contentWidth / colCount;
                const cellPadding = 2;

                rows.forEach((row: any, rowIndex: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const cells = row.content || [];
                    const rowHeight = fontSize * 0.5 + cellPadding * 2;

                    if (yPosition + rowHeight > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }

                    // Draw cell backgrounds for header
                    if (rowIndex === 0) {
                        pdf.setFillColor(230, 230, 230);
                        pdf.rect(indentX, yPosition - cellPadding, contentWidth, rowHeight, 'F');
                    }

                    cells.forEach((cell: any, cellIndex: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const cellText = extractText(cell);
                        const cellX = indentX + cellIndex * colWidth + cellPadding;
                        pdf.setFontSize(rowIndex === 0 ? fontSize : fontSize - 1);
                        pdf.setFont('helvetica', rowIndex === 0 ? 'bold' : 'normal');
                        pdf.text(cellText.substring(0, 30), cellX, yPosition + fontSize * 0.25);
                    });

                    // Draw borders
                    pdf.setDrawColor(180, 180, 180);
                    pdf.setLineWidth(0.2);
                    pdf.line(indentX, yPosition + rowHeight - cellPadding, pageWidth - margin, yPosition + rowHeight - cellPadding);

                    yPosition += rowHeight;
                });

                yPosition += 4;
                break;
            }

            case 'image': {
                // Note: Adding base64 images to PDF is complex, just add a placeholder
                const alt = node.attrs?.alt || 'Image';
                pdf.setFillColor(240, 240, 240);
                pdf.rect(indentX, yPosition, 60, 30, 'F');
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`[Image: ${alt}]`, indentX + 5, yPosition + 15);
                pdf.setTextColor(0, 0, 0);
                yPosition += 35;
                break;
            }

            default:
                // Try to extract and render text from unknown nodes
                if (node.content) {
                    (node.content as any[]).forEach((child: any) => processNode(child, indent)); // eslint-disable-line @typescript-eslint/no-explicit-any
                }
        }
    };

    /**
     * Extract plain text from a node
     */
    const extractText = (node: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!node) return '';
        if (node.type === 'text') return node.text || '';
        if (node.content) {
            return (node.content as any[]).map(extractText).join(''); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return '';
    };

    // Process the document
    processNode(json);

    // Save the PDF
    pdf.save(filename);
};

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
