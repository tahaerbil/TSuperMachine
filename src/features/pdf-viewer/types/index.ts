/**
 * PDF Viewer Widget Types
 */

// ============================================================================
// Props
// ============================================================================

export interface PDFViewerWidgetProps {
    id: string;
    initialPDF?: string;
    isMaximized?: boolean;
}

// ============================================================================
// State Types
// ============================================================================

export interface PDFDocumentState {
    pdfUrl: string | null;
    numPages: number;
    isLoading: boolean;
    loadError: string | null;
    filename: string | null;
}

export interface PDFNavigationState {
    pageNumber: number;
    pageInputValue: string;
}

export interface PDFZoomState {
    scale: number;
    compactScale: number;
    zoomMode: ZoomMode;
    rotation: number;
}

export interface PDFUIState {
    showSidebar: boolean;
    showSearch: boolean;
    searchQuery: string;
    isDragOver: boolean;
}

// ============================================================================
// Zoom Types
// ============================================================================

export type ZoomMode = 'manual' | 'fitWidth' | 'fitPage';

export const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0] as const;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;

// ============================================================================
// Automation Types
// ============================================================================

export interface PDFPayload {
    filename?: string;
    pdfBlobUrl?: string;
    success?: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UsePDFDocumentReturn {
    // State
    pdfUrl: string | null;
    numPages: number;
    isLoading: boolean;
    loadError: string | null;
    filename: string | null;

    // Actions
    loadFile: (file: File) => void;
    loadFromUrl: (url: string, filename?: string) => void;
    clearError: () => void;
    captureDimensions: (width: number, height: number) => boolean;

    // Callbacks for react-pdf
    onDocumentLoadSuccess: (data: { numPages: number }) => void;
    onDocumentLoadError: (error: Error) => void;

    // Refs (read-only access)
    pdfDimensionsRef: React.MutableRefObject<{ width: number; height: number } | null>;
}

export interface UsePDFNavigationReturn {
    pageNumber: number;
    pageInputValue: string;

    goToPrevPage: () => void;
    goToNextPage: () => void;
    goToPage: (page: number) => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;

    handlePageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePageInputBlur: () => void;
    handlePageInputKeyDown: (e: React.KeyboardEvent) => void;
}

export interface UsePDFZoomReturn {
    scale: number;
    compactScale: number;
    zoomMode: ZoomMode;
    rotation: number;

    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomPreset: (preset: number) => void;
    handleFitWidth: () => void;
    handleFitPage: () => void;
    handleRotate: () => void;
    resetZoom: () => void;
    setCompactScale: React.Dispatch<React.SetStateAction<number>>;

    // Refs
    viewerRef: React.RefObject<HTMLDivElement | null>;
    compactViewerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseDragAndDropReturn {
    isDragOver: boolean;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

export interface UsePDFUIReturn {
    showSidebar: boolean;
    showSearch: boolean;
    searchQuery: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;

    toggleSidebar: () => void;
    toggleSearch: () => void;
    setSearchQuery: (query: string) => void;
    closeSearch: () => void;
}

