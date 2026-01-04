/**
 * useCanvasNavigation Hook
 * 
 * Handles canvas pan and zoom interactions:
 * - Mouse wheel zoom (zoom at cursor position)
 * - Middle-click panning
 * - Alt+Left-click panning
 * - Double middle-click fit-to-screen
 * - Linux X11 middle-click paste prevention
 */

import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../../store/store';
import {
    MIN_ZOOM_SCALE,
    MAX_ZOOM_SCALE,
    BASE_ZOOM_FACTOR,
    FIT_TO_SCREEN_MAX_SCALE,
    FIT_TO_SCREEN_PADDING,
    DOUBLE_CLICK_THRESHOLD_MS,
} from '../constants';

interface UseCanvasNavigationProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseCanvasNavigationReturn {
    /** Whether canvas is currently being dragged (panned) */
    isDragging: React.MutableRefObject<boolean>;
    /** Current mouse position for coordinate calculations */
    currentMousePos: React.MutableRefObject<{ x: number; y: number }>;
    /** Handle mouse down for pan initiation */
    handleMouseDown: (e: React.MouseEvent) => void;
    /** Handle mouse move for panning */
    handleMouseMove: (e: React.MouseEvent) => void;
    /** Handle mouse up to stop panning */
    handleMouseUp: () => void;
}

export function useCanvasNavigation({
    containerRef,
}: UseCanvasNavigationProps): UseCanvasNavigationReturn {
    const { setCanvasOffset, setCanvasScale } = useStore();

    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const currentMousePos = useRef({ x: 0, y: 0 });

    /**
     * Fits all non-maximized widgets into the visible viewport.
     * Calculates bounding box, determines optimal scale, and centers the view.
     */
    const fitToScreen = useCallback(() => {
        const allWidgets = useStore.getState().widgets;
        const currentWidgets = allWidgets.filter(w => !w.isMaximized);

        if (currentWidgets.length === 0) {
            setCanvasOffset({ x: 0, y: 0 });
            setCanvasScale(1);
            return;
        }

        // 1. Calculate bounding box world coordinates
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        currentWidgets.forEach(w => {
            minX = Math.min(minX, w.position.x);
            minY = Math.min(minY, w.position.y);
            maxX = Math.max(maxX, w.position.x + w.size.width);
            maxY = Math.max(maxY, w.position.y + w.size.height);
        });

        const container = containerRef.current;
        if (!container) return;

        const viewportW = container.clientWidth;
        const viewportH = container.clientHeight;

        const contentW = maxX - minX;
        const contentH = maxY - minY;

        // 2. Calculate Scale to fit content within viewport minus padding
        const scaleX = (viewportW - (FIT_TO_SCREEN_PADDING * 2)) / Math.max(contentW, 1);
        const scaleY = (viewportH - (FIT_TO_SCREEN_PADDING * 2)) / Math.max(contentH, 1);

        let newScale = Math.min(scaleX, scaleY);
        newScale = Math.min(Math.max(newScale, MIN_ZOOM_SCALE), FIT_TO_SCREEN_MAX_SCALE);

        // 3. Calculate Center
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 4. Calculate Offset
        const newOffsetX = (viewportW / 2) - (centerX * newScale);
        const newOffsetY = (viewportH / 2) - (centerY * newScale);

        setCanvasScale(newScale);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    }, [containerRef, setCanvasOffset, setCanvasScale]);

    /**
     * Handle mouse wheel zoom with "zoom at cursor" behavior
     */
    const handleWheel = useCallback((e: WheelEvent) => {
        // If any widget is maximized, do not zoom the canvas.
        const currentWidgets = useStore.getState().widgets;
        if (currentWidgets.some(w => w.isMaximized)) {
            return;
        }

        e.preventDefault();

        const { canvas: currentCanvas, zoomSensitivity } = useStore.getState();

        // Percentage-based zoom with user-configurable sensitivity
        const adjustedFactor = 1 + ((BASE_ZOOM_FACTOR - 1) * zoomSensitivity);
        const direction = e.deltaY < 0 ? adjustedFactor : 1 / adjustedFactor;
        const newScale = Math.max(MIN_ZOOM_SCALE, Math.min(MAX_ZOOM_SCALE, currentCanvas.scale * direction));

        // Get mouse position relative to canvas
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the point in canvas coordinates before zoom
        const pointX = (mouseX - currentCanvas.offset.x) / currentCanvas.scale;
        const pointY = (mouseY - currentCanvas.offset.y) / currentCanvas.scale;

        // Calculate new offset to keep the point under the mouse
        const newOffsetX = mouseX - pointX * newScale;
        const newOffsetY = mouseY - pointY * newScale;

        setCanvasScale(newScale);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    }, [containerRef, setCanvasOffset, setCanvasScale]);

    // Wheel event listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [containerRef, handleWheel]);

    // Linux X11 middle-click handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let lastClickTime = 0;

        const handleNativeMiddleDown = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();

                const now = Date.now();
                // Check if double click (within threshold) OR if browser reports detail=2
                if ((now - lastClickTime < DOUBLE_CLICK_THRESHOLD_MS) || e.detail === 2) {
                    fitToScreen();
                    return; // Do not start dragging
                }
                lastClickTime = now;

                // Check for maximized widgets
                const currentWidgets = useStore.getState().widgets;
                if (!currentWidgets.some(w => w.isMaximized)) {
                    isDragging.current = true;
                    lastMousePos.current = { x: e.clientX, y: e.clientY };
                }
            }
        };

        const blockMiddleClickEvents = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleNativeMiddleUp = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();
                isDragging.current = false;
            }
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (e.button === 1) {
                isDragging.current = false;
            }
        };

        // Capture phase listeners to preempt browser behavior
        container.addEventListener('mousedown', handleNativeMiddleDown, true);
        container.addEventListener('mouseup', handleNativeMiddleUp, true);
        container.addEventListener('click', blockMiddleClickEvents, true);
        container.addEventListener('auxclick', blockMiddleClickEvents, true);
        window.addEventListener('mouseup', handleGlobalMouseUp, true);

        return () => {
            container.removeEventListener('mousedown', handleNativeMiddleDown, true);
            container.removeEventListener('mouseup', handleNativeMiddleUp, true);
            container.removeEventListener('click', blockMiddleClickEvents, true);
            container.removeEventListener('auxclick', blockMiddleClickEvents, true);
            window.removeEventListener('mouseup', handleGlobalMouseUp, true);
        };
    }, [containerRef, fitToScreen]);

    /**
     * Handle mouse down for pan initiation (middle-click or Alt+Left-click)
     */
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // If any widget is maximized, do not allow canvas panning.
        const currentWidgets = useStore.getState().widgets;
        if (currentWidgets.some(w => w.isMaximized)) {
            return;
        }

        // Pan: Only on middle-click or Alt+Left-click
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    }, []);

    /**
     * Handle mouse move for panning and position tracking
     */
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // Always track mouse position for paste operations
        currentMousePos.current = { x: e.clientX, y: e.clientY };

        // Pan: Only if dragging (middle-click or Alt+Left)
        if (isDragging.current) {
            const { canvas: currentCanvas } = useStore.getState();

            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;

            // Offset is in SCREEN pixels. 1:1 mapping.
            setCanvasOffset({
                x: currentCanvas.offset.x + dx,
                y: currentCanvas.offset.y + dy
            });

            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    }, [setCanvasOffset]);

    /**
     * Handle mouse up to stop panning
     */
    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    return {
        isDragging,
        currentMousePos,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}

export default useCanvasNavigation;
