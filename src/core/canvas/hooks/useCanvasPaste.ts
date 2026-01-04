/**
 * useCanvasPaste Hook
 * 
 * Handles paste operations on the canvas:
 * - Ctrl+V to paste clipboard content
 * - Image paste creates IMAGE widget
 * - Text paste creates NOTE widget
 *   - Auto-detects HTML and extracts clean text (sanitized)
 *   - Falls back to plain text
 * - Proper world coordinate positioning at cursor
 */

import { useEffect, useCallback } from 'react';
import { useStore } from '../../../store/store';

interface UseCanvasPasteProps {
    /** Reference to canvas container for coordinate calculations */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Current mouse position in screen coordinates */
    currentMousePos: React.MutableRefObject<{ x: number; y: number }>;
}

/**
 * Sanitize HTML content to prevent XSS and extract clean text.
 * Uses DOMParser to safely parse and clean content.
 */
const getCleanTextFromHTML = (html: string): string => {
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Remove potentially dangerous elements script/object/embed/iframe
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base'];
        dangerousTags.forEach(tag => {
            const elements = doc.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });

        // Return clean text content
        return doc.body.textContent || "";
    } catch (e) {
        console.error('Failed to sanitize HTML paste:', e);
        return "";
    }
};

export function useCanvasPaste({
    containerRef,
    currentMousePos,
}: UseCanvasPasteProps): void {

    /**
     * Handle paste event from clipboard
     */
    const handlePaste = useCallback((e: ClipboardEvent) => {
        // Ignore if active element is an input or textarea
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target as HTMLElement).isContentEditable
        ) {
            return;
        }

        const items = e.clipboardData?.items;
        if (!items) return;

        const { canvas, addWidget } = useStore.getState();
        const container = containerRef.current;
        if (!container) return;

        // Get container bounds for coordinate conversion
        const rect = container.getBoundingClientRect();

        // Convert mouse screen position to world coordinates
        const mouseX = currentMousePos.current.x - rect.left;
        const mouseY = currentMousePos.current.y - rect.top;

        // Transform to world coordinates: worldPos = (screenPos - offset) / scale
        const worldX = (mouseX - canvas.offset.x) / canvas.scale;
        const worldY = (mouseY - canvas.offset.y) / canvas.scale;

        // Position widget so its top-left is at mouse position
        const position = { x: worldX, y: worldY };

        let handled = false;

        // 1. Check for Images first
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        if (base64) {
                            addWidget('IMAGE', position, { image: base64 });
                        }
                    };
                    reader.readAsDataURL(blob);
                    handled = true;
                    break;
                }
            }
        }

        if (handled) {
            e.preventDefault();
            return;
        }

        // 2. Check for HTML (rich text -> clean text)
        // Prefer HTML to get formatted structure if needed, but for Note widget 
        // we currently use plain text. Cleaning HTML avoids pasting raw HTML tags.
        const htmlItem = Array.from(items).find(item => item.type === 'text/html');
        if (htmlItem) {
            htmlItem.getAsString((html) => {
                const cleanText = getCleanTextFromHTML(html).trim();
                if (cleanText.length > 0) {
                    addWidget('NOTE', position, { content: cleanText });
                }
            });
            e.preventDefault();
            return;
        }

        // 3. Fallback to Plain Text
        const textItem = Array.from(items).find(item => item.type === 'text/plain');
        if (textItem) {
            textItem.getAsString((text) => {
                if (text && text.trim().length > 0) {
                    addWidget('NOTE', position, { content: text });
                }
            });
            e.preventDefault();
            return;
        }

    }, [containerRef, currentMousePos]);

    // Attach paste event listener
    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);
}

export default useCanvasPaste;
