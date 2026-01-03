import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useStore, getIncomingConnections } from '../../store/store';
import { Upload, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventBus } from '../../core/services/automation';
import type { AutomationEvent, TriggerEvent } from '../../core/services/automation';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerWidgetProps {
    id: string;
    initialPDF?: string;
}

interface PDFPayload {
    filename?: string;
    pdfBlobUrl?: string;
    success?: boolean;
}

export const PDFViewerWidget: React.FC<PDFViewerWidgetProps> = ({ id, initialPDF }) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(initialPDF || null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [lastReceivedFilename, setLastReceivedFilename] = useState<string | null>(null);
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    const processedEvents = useRef<Set<string>>(new Set());

    // Check for incoming connections (for debugging)
    useEffect(() => {
        const connections = getIncomingConnections(id);
        if (connections.length > 0) {
            console.log('[PDFViewer] Has', connections.length, 'incoming connections');
        }
    }, [id]);

    // Handle incoming automation events (from PDF Export)
    const handleAutomationEvent = useCallback((event: AutomationEvent<PDFPayload>) => {
        // Deduplicate events
        const eventKey = `${event.sourceWidgetId}-${event.timestamp}`;
        if (processedEvents.current.has(eventKey)) {
            return;
        }
        processedEvents.current.add(eventKey);

        console.log('[PDFViewer] Received event:', event);

        // Check if payload has a PDF blob URL
        if (event.payload?.pdfBlobUrl) {
            setPdfUrl(event.payload.pdfBlobUrl);
            setPageNumber(1);
            setLastReceivedFilename(event.payload.filename || 'generated.pdf');
            updateWidget(id, { data: { pdf: event.payload.pdfBlobUrl } });
        }
    }, [id, updateWidget]);

    // Subscribe to events from PDF Export widgets
    useEffect(() => {
        const events: TriggerEvent[] = ['onGenerate'];
        const unsubscribers = events.map(eventType =>
            eventBus.subscribe(id, eventType, handleAutomationEvent)
        );

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [id, handleAutomationEvent]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setPdfUrl(url);
            setPageNumber(1);
            setLastReceivedFilename(null);
            updateWidget(id, { data: { pdf: url } });
        };
        reader.readAsDataURL(file);
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = lastReceivedFilename || 'document.pdf';
        link.click();
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-100">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                        <div className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            <span>{t('app.widgets.pdf.upload') || 'Upload PDF'}</span>
                        </div>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>

                    {pdfUrl && (
                        <>
                            <button
                                onClick={goToPrevPage}
                                disabled={pageNumber <= 1}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-gray-600">
                                {pageNumber} / {numPages}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={pageNumber >= numPages}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>

                            <div className="h-4 w-px bg-gray-300 mx-1" />

                            <button
                                onClick={zoomOut}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <span className="text-xs text-gray-600 min-w-12 text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={zoomIn}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </>
                    )}
                </div>

                {pdfUrl && (
                    <button
                        onClick={handleDownload}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                )}
            </div>

            {/* PDF Display */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                {pdfUrl ? (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="text-gray-500">Loading PDF...</div>}
                        error={<div className="text-red-500">Failed to load PDF</div>}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        <Upload size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">{t('app.widgets.pdf.empty') || 'Click Upload to add a PDF'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
