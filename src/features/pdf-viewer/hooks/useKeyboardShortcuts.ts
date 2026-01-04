import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
    numPages: number;
    showSearch: boolean;

    // Actions
    goToPrevPage: () => void;
    goToNextPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    resetZoom: () => void;
    handleRotate: () => void;
    toggleSearch: () => void;
    closeSearch: () => void;
}

/**
 * Hook for handling keyboard shortcuts in PDF viewer
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
    const {
        numPages,
        showSearch,
        goToPrevPage,
        goToNextPage,
        goToFirstPage,
        goToLastPage,
        handleZoomIn,
        handleZoomOut,
        resetZoom,
        handleRotate,
        toggleSearch,
        closeSearch,
    } = options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                // Allow Escape to close search
                if (e.key === 'Escape' && showSearch) {
                    closeSearch();
                }
                return;
            }

            // Escape to close search
            if (e.key === 'Escape' && showSearch) {
                closeSearch();
                return;
            }

            // Ctrl/Cmd + F for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                toggleSearch();
                return;
            }

            // Navigation
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPrevPage();
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToNextPage();
            }
            if (e.key === 'Home') {
                e.preventDefault();
                goToFirstPage();
            }
            if (e.key === 'End') {
                e.preventDefault();
                goToLastPage();
            }

            // Zoom
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    handleZoomIn();
                }
                if (e.key === '-') {
                    e.preventDefault();
                    handleZoomOut();
                }
                if (e.key === '0') {
                    e.preventDefault();
                    resetZoom();
                }
            }

            // Rotate
            if (e.key === 'r' || e.key === 'R') {
                if (!e.ctrlKey && !e.metaKey) {
                    handleRotate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        numPages,
        showSearch,
        goToPrevPage,
        goToNextPage,
        goToFirstPage,
        goToLastPage,
        handleZoomIn,
        handleZoomOut,
        resetZoom,
        handleRotate,
        toggleSearch,
        closeSearch,
    ]);
}
