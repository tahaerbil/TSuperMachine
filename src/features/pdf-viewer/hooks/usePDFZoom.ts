import { useState, useCallback, useRef, useEffect } from 'react';
import { MIN_ZOOM, MAX_ZOOM } from '../types';
import type { ZoomMode, UsePDFZoomReturn } from '../types';

interface UsePDFZoomOptions {
    pdfUrl: string | null;
    isMaximized?: boolean;
    pdfDimensionsRef: React.MutableRefObject<{ width: number; height: number } | null>;
}

/**
 * Hook for managing PDF zoom, scale, and rotation
 */
export function usePDFZoom(options: UsePDFZoomOptions): UsePDFZoomReturn {
    const { pdfUrl, isMaximized, pdfDimensionsRef } = options;

    const [scale, setScale] = useState<number>(1.0);
    const [compactScale, setCompactScale] = useState<number>(0.3); // Start small to prevent overflow
    const [zoomMode, setZoomMode] = useState<ZoomMode>('manual');
    const [rotation, setRotation] = useState<number>(0);

    const viewerRef = useRef<HTMLDivElement>(null);
    const compactViewerRef = useRef<HTMLDivElement>(null);

    // Calculate fit zoom based on container size
    const calculateFitZoom = useCallback((mode: ZoomMode) => {
        if (!viewerRef.current || !pdfUrl) return 1.0;

        const container = viewerRef.current;
        const containerWidth = container.clientWidth - 32;
        const containerHeight = container.clientHeight - 32;

        const pageWidth = pdfDimensionsRef.current?.width || 595;
        const pageHeight = pdfDimensionsRef.current?.height || 842;

        const isRotated = rotation === 90 || rotation === 270;
        const effectiveWidth = isRotated ? pageHeight : pageWidth;
        const effectiveHeight = isRotated ? pageWidth : pageHeight;

        if (mode === 'fitWidth') {
            return containerWidth / effectiveWidth;
        } else if (mode === 'fitPage') {
            const widthRatio = containerWidth / effectiveWidth;
            const heightRatio = containerHeight / effectiveHeight;
            return Math.min(widthRatio, heightRatio);
        }
        return 1.0;
    }, [pdfUrl, rotation, pdfDimensionsRef]);

    // Calculate compact scale to fit PDF in container
    const calculateCompactFitScale = useCallback(() => {
        if (!compactViewerRef.current || !pdfUrl) return 0.3;

        const container = compactViewerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Guard against zero/invalid dimensions
        if (containerWidth <= 0 || containerHeight <= 0) return 0.3;

        const pageWidth = pdfDimensionsRef.current?.width || 595;
        const pageHeight = pdfDimensionsRef.current?.height || 842;

        const isRotated = rotation === 90 || rotation === 270;
        const effectiveWidth = isRotated ? pageHeight : pageWidth;
        const effectiveHeight = isRotated ? pageWidth : pageHeight;

        const widthRatio = containerWidth / effectiveWidth;
        const heightRatio = containerHeight / effectiveHeight;

        // Don't exceed 1.0 to avoid pixelation
        return Math.min(widthRatio, heightRatio, 1.0);
    }, [pdfUrl, rotation, pdfDimensionsRef]);

    // Apply zoom when zoom mode changes (via handlers, not synchronous effect)
    const applyZoomMode = useCallback((mode: ZoomMode) => {
        if (mode !== 'manual') {
            const newScale = calculateFitZoom(mode);
            setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale)));
        }
        setZoomMode(mode);
    }, [calculateFitZoom]);

    // Recalculate on window resize (external event - valid use of effect)
    useEffect(() => {
        const handleResize = () => {
            if (zoomMode !== 'manual') {
                const newScale = calculateFitZoom(zoomMode);
                setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale)));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [zoomMode, calculateFitZoom]);

    // Compact mode: ResizeObserver for container size changes (external event)
    useEffect(() => {
        if (!isMaximized && compactViewerRef.current && pdfUrl) {
            const element = compactViewerRef.current;

            const updateScale = () => {
                const updatedScale = calculateCompactFitScale();
                // Only update if we got a valid scale (container has size)
                if (updatedScale > 0.1) {
                    setCompactScale(updatedScale);
                }
            };

            // Use requestAnimationFrame for more reliable timing after layout
            requestAnimationFrame(() => {
                requestAnimationFrame(updateScale);
            });

            const resizeObserver = new ResizeObserver(updateScale);
            resizeObserver.observe(element);
            return () => resizeObserver.disconnect();
        }
    }, [isMaximized, pdfUrl, calculateCompactFitScale]);

    // Handlers
    const handleZoomIn = useCallback(() => {
        setZoomMode('manual');
        setScale(prev => Math.min(prev + 0.25, MAX_ZOOM));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomMode('manual');
        setScale(prev => Math.max(prev - 0.25, MIN_ZOOM));
    }, []);

    const handleZoomPreset = useCallback((preset: number) => {
        setZoomMode('manual');
        setScale(preset);
    }, []);

    const handleFitWidth = useCallback(() => {
        applyZoomMode('fitWidth');
    }, [applyZoomMode]);

    const handleFitPage = useCallback(() => {
        applyZoomMode('fitPage');
    }, [applyZoomMode]);

    const handleRotate = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    const resetZoom = useCallback(() => {
        setScale(1.0);
        setZoomMode('manual');
        setRotation(0);
    }, []);

    return {
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
    };
}
