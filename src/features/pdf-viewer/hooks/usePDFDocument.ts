import { useState, useCallback, useRef } from 'react';
import { useStore } from '../../../store/store';
import type { UsePDFDocumentReturn } from '../types';

/**
 * Hook for managing PDF document state and file loading
 */
export function usePDFDocument(widgetId: string, initialPDF?: string): UsePDFDocumentReturn {
    const [pdfUrl, setPdfUrl] = useState<string | null>(initialPDF || null);
    const [numPages, setNumPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);

    // Refs for dimension tracking (avoid render loops)
    const dimensionsCapturedRef = useRef<boolean>(false);
    const pdfDimensionsRef = useRef<{ width: number; height: number } | null>(null);

    const { updateWidget } = useStore();

    // Load PDF from File object
    const loadFile = useCallback((file: File) => {
        if (file.type !== 'application/pdf') {
            setLoadError('Invalid file type. Please upload a PDF file.');
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        dimensionsCapturedRef.current = false; // Reset for new PDF

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setPdfUrl(url);
            setFilename(file.name);
            updateWidget(widgetId, { data: { pdf: url } });
            setIsLoading(false);
        };
        reader.onerror = () => {
            setLoadError('Failed to read file');
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    }, [widgetId, updateWidget]);

    // Load PDF from URL (e.g., from automation events)
    const loadFromUrl = useCallback((url: string, name?: string) => {
        dimensionsCapturedRef.current = false; // Reset for new PDF
        setPdfUrl(url);
        setFilename(name || 'generated.pdf');
        updateWidget(widgetId, { data: { pdf: url } });
    }, [widgetId, updateWidget]);

    // Clear error
    const clearError = useCallback(() => {
        setLoadError(null);
    }, []);

    // Document load success callback
    const onDocumentLoadSuccess = useCallback(({ numPages: pages }: { numPages: number }) => {
        setNumPages(pages);
        setIsLoading(false);
        setLoadError(null);
    }, []);

    // Document load error callback
    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('[PDFViewer] Load error:', error);
        setLoadError('Failed to load PDF');
        setIsLoading(false);
    }, []);

    // Capture PDF dimensions (called from onRenderSuccess)
    const captureDimensions = useCallback((width: number, height: number) => {
        if (!dimensionsCapturedRef.current) {
            pdfDimensionsRef.current = { width, height };
            dimensionsCapturedRef.current = true;
            return true; // Dimensions were captured
        }
        return false; // Already captured
    }, []);

    return {
        pdfUrl,
        numPages,
        isLoading,
        loadError,
        filename,
        loadFile,
        loadFromUrl,
        clearError,
        onDocumentLoadSuccess,
        onDocumentLoadError,
        captureDimensions,
        pdfDimensionsRef,
    };
}
