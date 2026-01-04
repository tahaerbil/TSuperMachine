import React, { useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTranslation } from 'react-i18next';
import { getIncomingConnections } from '../../store/store';

// Types
import type { PDFViewerWidgetProps } from './types';

// Hooks
import {
    usePDFDocument,
    usePDFNavigation,
    usePDFZoom,
    useDragAndDrop,
    usePDFUI,
    useAutomationEvents,
    useKeyboardShortcuts,
} from './hooks';

// Components
import {
    EmptyState,
    LoadingErrorState,
    PageNavigator,
    SearchBar,
    StatusBar,
    ThumbnailSidebar,
    PDFToolbar,
} from './components';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * PDF Viewer Widget - Modular Implementation
 * 
 * Supports:
 * - PDF viewing with zoom, rotation, navigation
 * - Thumbnail sidebar (maximized mode)
 * - Drag & drop file upload
 * - Keyboard shortcuts
 * - Automation events integration
 * - Compact/Maximized modes
 */
export const PDFViewerWidget: React.FC<PDFViewerWidgetProps> = ({
    id,
    initialPDF,
    isMaximized = false
}) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);

    // =========================================================================
    // HOOKS - Destructured to avoid lint false positives
    // =========================================================================

    // Document management
    const {
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
    } = usePDFDocument(id, initialPDF);

    // Navigation
    const {
        pageNumber,
        pageInputValue,
        goToPrevPage,
        goToNextPage,
        goToPage,
        goToFirstPage,
        goToLastPage,
        handlePageInputChange,
        handlePageInputBlur,
        handlePageInputKeyDown,
    } = usePDFNavigation(numPages);

    // Zoom & rotation
    const {
        scale,
        compactScale,
        zoomMode,
        rotation,
        handleZoomIn,
        handleZoomOut,
        handleZoomPreset,
        handleFitWidth,
        handleFitPage,
        handleRotate,
        resetZoom,
        setCompactScale,
        viewerRef,
        compactViewerRef,
    } = usePDFZoom({
        pdfUrl,
        isMaximized,
        pdfDimensionsRef,
    });

    // Drag & drop
    const {
        isDragOver,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    } = useDragAndDrop(loadFile);

    // UI state
    const {
        showSidebar,
        showSearch,
        searchQuery,
        searchInputRef,
        toggleSidebar,
        toggleSearch,
        setSearchQuery,
        closeSearch,
    } = usePDFUI();

    // Automation events
    useAutomationEvents({
        widgetId: id,
        onPDFReceived: loadFromUrl,
    });

    // Keyboard shortcuts
    useKeyboardShortcuts({
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
    });

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    }, [loadFile]);

    const handleDownload = useCallback(() => {
        if (!pdfUrl) return;
        const link = window.document.createElement('a');
        link.href = pdfUrl;
        link.download = filename || 'document.pdf';
        link.click();
    }, [pdfUrl, filename]);

    // Track if initial scale has been applied for current PDF
    const initialScaleAppliedRef = useRef(false);

    // Reset initial scale flag when PDF changes
    React.useEffect(() => {
        initialScaleAppliedRef.current = false;
    }, [pdfUrl]);

    // Handle compact mode dimension capture and scale calculation
    const handleCompactRenderSuccess = useCallback((page: {
        width: number;
        height: number;
        originalWidth?: number;
        originalHeight?: number;
    }) => {
        // Use original dimensions if available, otherwise use rendered dimensions
        const pageWidth = page.originalWidth || page.width;
        const pageHeight = page.originalHeight || page.height;

        // Capture original dimensions
        captureDimensions(pageWidth, pageHeight);

        // Only calculate scale once per PDF load to prevent render loops
        if (!initialScaleAppliedRef.current && compactViewerRef.current) {
            initialScaleAppliedRef.current = true;

            // Use setTimeout to ensure layout is fully complete
            setTimeout(() => {
                if (!compactViewerRef.current) return;

                const container = compactViewerRef.current;
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;

                // Guard against zero dimensions
                if (containerWidth <= 0 || containerHeight <= 0) {
                    initialScaleAppliedRef.current = false; // Retry next time
                    return;
                }

                const isRotated = rotation === 90 || rotation === 270;
                const effectiveWidth = isRotated ? pageHeight : pageWidth;
                const effectiveHeight = isRotated ? pageWidth : pageHeight;
                const widthRatio = containerWidth / effectiveWidth;
                const heightRatio = containerHeight / effectiveHeight;

                // Calculate scale to fit, never exceed 1.0
                const newScale = Math.min(widthRatio, heightRatio, 1.0);
                console.log('[PDF Compact] Container:', containerWidth, 'x', containerHeight,
                    'Original Page:', effectiveWidth, 'x', effectiveHeight,
                    'Scale:', newScale);
                setCompactScale(newScale);
            }, 100);
        }
    }, [captureDimensions, compactViewerRef, rotation, setCompactScale]);

    // Log incoming connections on mount
    React.useEffect(() => {
        const connections = getIncomingConnections(id);
        if (connections.length > 0) {
            console.log('[PDFViewer] Has', connections.length, 'incoming connections');
        }
    }, [id]);

    // =========================================================================
    // RENDER - COMPACT MODE
    // =========================================================================

    if (!isMaximized) {
        return (
            <div
                ref={containerRef}
                className="w-full h-full flex flex-col bg-[#0a0a0f] text-white overflow-hidden relative group"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                tabIndex={0}
            >
                {/* PDF Display Area */}
                <div
                    ref={compactViewerRef}
                    className={`flex-1 overflow-hidden flex items-center justify-center transition-colors duration-200 ${isDragOver
                        ? 'bg-[var(--color-primary)]/10 ring-2 ring-inset ring-[var(--color-primary)]/50'
                        : 'bg-[#0d0d12]'
                        }`}
                >
                    {(isLoading || loadError) && (
                        <LoadingErrorState
                            isLoading={isLoading}
                            loadError={loadError}
                            compact
                        />
                    )}

                    {pdfUrl && !isLoading && !loadError && (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex items-center justify-center p-4">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
                                </div>
                            }
                            error={null}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    transform: 'scale(0.5)',
                                    transformOrigin: 'center center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={compactScale * 2}
                                        rotate={rotation}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="shadow-lg"
                                        onRenderSuccess={handleCompactRenderSuccess}
                                    />
                                </div>
                            </div>
                        </Document>
                    )}

                    {!pdfUrl && !isLoading && (
                        <EmptyState
                            isDragOver={isDragOver}
                            onFileUpload={handleFileUpload}
                            compact
                        />
                    )}
                </div>

                {/* Compact Page Navigator */}
                {pdfUrl && numPages > 1 && (
                    <PageNavigator
                        pageNumber={pageNumber}
                        numPages={numPages}
                        pageInputValue={pageInputValue}
                        onPrevPage={goToPrevPage}
                        onNextPage={goToNextPage}
                        onInputChange={handlePageInputChange}
                        onInputBlur={handlePageInputBlur}
                        onInputKeyDown={handlePageInputKeyDown}
                        compact
                    />
                )}
            </div>
        );
    }

    // =========================================================================
    // RENDER - MAXIMIZED MODE
    // =========================================================================

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col bg-[#0a0a0f] text-white overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            tabIndex={0}
        >
            {/* Toolbar */}
            <PDFToolbar
                pdfUrl={pdfUrl}
                numPages={numPages}
                pageNumber={pageNumber}
                pageInputValue={pageInputValue}
                onPrevPage={goToPrevPage}
                onNextPage={goToNextPage}
                onInputChange={handlePageInputChange}
                onInputBlur={handlePageInputBlur}
                onInputKeyDown={handlePageInputKeyDown}
                scale={scale}
                zoomMode={zoomMode}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomPreset={handleZoomPreset}
                onFitWidth={handleFitWidth}
                onFitPage={handleFitPage}
                showSidebar={showSidebar}
                showSearch={showSearch}
                onToggleSidebar={toggleSidebar}
                onToggleSearch={toggleSearch}
                onRotate={handleRotate}
                onDownload={handleDownload}
                onFileUpload={handleFileUpload}
                uploadLabel={t('app.widgets.pdf.upload')}
            />

            {/* Search Bar */}
            {showSearch && pdfUrl && (
                <SearchBar
                    searchQuery={searchQuery}
                    searchInputRef={searchInputRef}
                    onSearchChange={setSearchQuery}
                    onClose={closeSearch}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Thumbnail Sidebar */}
                {pdfUrl && showSidebar && numPages > 1 && (
                    <ThumbnailSidebar
                        pdfUrl={pdfUrl}
                        numPages={numPages}
                        currentPage={pageNumber}
                        onPageSelect={goToPage}
                    />
                )}

                {/* PDF Display Area */}
                <div
                    ref={viewerRef}
                    className={`flex-1 overflow-auto flex items-start justify-center p-4 transition-colors duration-200 ${isDragOver
                        ? 'bg-[var(--color-primary)]/10 ring-2 ring-inset ring-[var(--color-primary)]/50'
                        : 'bg-[#0d0d12]'
                        }`}
                >
                    {(isLoading || loadError) && (
                        <LoadingErrorState
                            isLoading={isLoading}
                            loadError={loadError}
                            onRetry={clearError}
                        />
                    )}

                    {pdfUrl && !isLoading && !loadError && (
                        <div className="relative">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={
                                    <div className="flex items-center justify-center p-8">
                                        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
                                    </div>
                                }
                                error={
                                    <div className="text-red-400 p-4 text-center">
                                        <p>Failed to load PDF</p>
                                    </div>
                                }
                            >
                                <div style={{
                                    transform: 'scale(0.5)',
                                    transformOrigin: 'top center'
                                }}>
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale * 2}
                                        rotate={rotation}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className="shadow-2xl rounded-sm"
                                    />
                                </div>
                            </Document>
                        </div>
                    )}

                    {!pdfUrl && !isLoading && (
                        <EmptyState
                            isDragOver={isDragOver}
                            onFileUpload={handleFileUpload}
                            uploadLabel={t('app.widgets.pdf.upload')}
                            emptyMessage={t('app.widgets.pdf.empty')}
                        />
                    )}
                </div>
            </div>

            {/* Status Bar */}
            {pdfUrl && (
                <StatusBar
                    filename={filename}
                    numPages={numPages}
                    scale={scale}
                    rotation={rotation}
                />
            )}
        </div>
    );
};
