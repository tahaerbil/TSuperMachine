import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/store';
import type { Widget, WidgetType } from '../store/store';
import { WidgetContainer } from './WidgetContainer';
import { AlignmentToolbar } from './AlignmentToolbar';
import { WireLayer, ConnectionContextMenu } from './automation';
import type { AutomationWidgetType, TriggerEvent } from '../core/services/automation';

// Feature imports (all widgets now in features/)
import { NoteWidget } from '../features/note-editor';
import { EngineeringCalculator } from '../features/engineering-calculator';
import { CAD2DWidget } from '../features/cad-2d';
import { CAD3DWidget } from '../features/cad-3d';
import { SpreadsheetWidget } from '../features/spreadsheet';
import { TodoWidget } from '../features/todo';
import { SettingsWidget } from '../features/settings';
import { ImageViewerWidget } from '../features/image-viewer';
import { PDFViewerWidget } from '../features/pdf-viewer';
import { PresentationWidget } from '../features/presentation';
import { ProjectMenuWidget } from '../features/project-menu';

// Automation widget imports
import { PDFExportWidget } from '../features/automations';

// Widget Component Renderer - centralized to avoid duplication and missing widgets
const renderWidgetContent = (widget: Widget): React.ReactNode => {
    switch (widget.type) {
        case 'NOTE':
            return <NoteWidget id={widget.id} initialContent={widget.data?.content} isMaximized={widget.isMaximized} />;
        case 'CALCULATOR':
            return <EngineeringCalculator id={widget.id} isMaximized={widget.isMaximized} />;
        case 'CAD_2D':
            return <CAD2DWidget id={widget.id} isMaximized={widget.isMaximized} />;
        case 'CAD_3D':
            return <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />;
        case 'SPREADSHEET':
            return <SpreadsheetWidget id={widget.id} initialData={widget.data?.spreadsheet} isMaximized={widget.isMaximized} />;
        case 'TODO':
            return <TodoWidget id={widget.id} initialTodos={widget.data?.todos} />;
        case 'SETTINGS':
            return <SettingsWidget />;
        case 'IMAGE':
            return <ImageViewerWidget id={widget.id} initialImage={widget.data?.image} />;
        case 'PDF':
            return <PDFViewerWidget id={widget.id} initialPDF={widget.data?.pdf} />;
        case 'PRESENTATION':
            return <PresentationWidget id={widget.id} initialSlides={widget.data?.slides} />;
        case 'PROJECT':
            return <ProjectMenuWidget />;
        // Automation widgets
        case 'PDF_EXPORT':
            return <PDFExportWidget id={widget.id} isMaximized={widget.isMaximized} />;
        default:
            return null;
    }
};


export const Canvas: React.FC = () => {
    const { widgets, canvas, setCanvasOffset, setCanvasScale, selectedWidgetIds, selectAll, clearSelection, removeWidget, selectMultiple, zoomSensitivity, gridStyle } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    // Track current mouse position for paste operations
    const currentMousePos = useRef({ x: 0, y: 0 });

    // Lasso selection state
    const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
    const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
    const [isLassoing, setIsLassoing] = useState(false);

    // Automation context menu state
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        sourceWidgetId: string;
        sourceWidgetType: WidgetType;
    } | null>(null);

    // Get automation-related store actions
    const wireDragState = useStore(state => state.wireDragState);
    const clearWireDragState = useStore(state => state.clearWireDragState);
    const addWidget = useStore(state => state.addWidget);
    const addConnection = useStore(state => state.addConnection);

    const handleWheel = (e: WheelEvent) => {
        // If any widget is maximized, do not zoom the canvas.
        if (widgets.some(w => w.isMaximized)) {
            return;
        }

        e.preventDefault();

        // Percentage-based zoom with user-configurable sensitivity
        const baseFactor = 1.05; // Base 5% change per scroll
        const adjustedFactor = 1 + ((baseFactor - 1) * zoomSensitivity);
        const direction = e.deltaY < 0 ? adjustedFactor : 1 / adjustedFactor;
        const newScale = Math.max(0.1, Math.min(5, canvas.scale * direction));

        // Get mouse position relative to canvas
        const rect = (containerRef.current as HTMLElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the point in canvas coordinates before zoom
        const pointX = (mouseX - canvas.offset.x) / canvas.scale;
        const pointY = (mouseY - canvas.offset.y) / canvas.scale;

        // Calculate new offset to keep the point under the mouse
        const newOffsetX = mouseX - pointX * newScale;
        const newOffsetY = mouseY - pointY * newScale;

        setCanvasScale(newScale);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    };

    // Use ref to access latest handleWheel without re-attaching listener
    const handleWheelRef = useRef(handleWheel);

    useEffect(() => {
        handleWheelRef.current = handleWheel;
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            handleWheelRef.current(e);
        };

        // LINUX FIX: Block middle-click paste behavior natively
        // React's onMouseDown is sometimes too late or doesn't catch the specific "paste" intent of X11

        /**
         * Fits all non-maximized widgets into the visible viewport.
         * Calculates bounding box, determines optimal scale, and centers the view.
         */
        const fitToScreen = () => {
            const allWidgets = useStore.getState().widgets;
            // Filter out maximized widgets - they are rendered outside the canvas transform
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
            const padding = 50; // Fixed screen pixels padding

            const contentW = maxX - minX;
            const contentH = maxY - minY;

            // 2. Calculate Scale to fit content within viewport minus padding
            const scaleX = (viewportW - (padding * 2)) / Math.max(contentW, 1);
            const scaleY = (viewportH - (padding * 2)) / Math.max(contentH, 1);

            let newScale = Math.min(scaleX, scaleY);
            newScale = Math.min(Math.max(newScale, 0.1), 2.0); // Clamp scale

            // 3. Calculate Center
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            // 4. Calculate Offset
            // ScreenCenter = Offset + (WorldCenter * Scale) (Standard translate(offset) scale(s) with origin 0 0)
            const newOffsetX = (viewportW / 2) - (centerX * newScale);
            const newOffsetY = (viewportH / 2) - (centerY * newScale);

            setCanvasScale(newScale);
            setCanvasOffset({ x: newOffsetX, y: newOffsetY });
        };

        // LINUX FIX: Robust middle-click handling
        // 1. We block ALL default behavior (especially Paste)
        // 2. We trigger Pan manually here because we stop propagation
        // Manual double-click detection variable
        let lastClickTime = 0;

        const handleNativeMiddleDown = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();

                const now = Date.now();
                // Check if double click (within 300ms) OR if browser reports detail=2
                if ((now - lastClickTime < 300) || e.detail === 2) {
                    fitToScreen();
                    return; // Do not start dragging
                }
                lastClickTime = now;

                // Check for maximized widgets via store to avoid stale closure in useEffect([])
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
                // Critical: This must happen INSIDE the blocked event handler
                // because we stop propagation, so window listeners might not see it.
                isDragging.current = false;
            }
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (e.button === 1) {
                isDragging.current = false;
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        // Capture phase listeners to preempt browser behavior
        container.addEventListener('mousedown', handleNativeMiddleDown, true);
        container.addEventListener('mouseup', handleNativeMiddleUp, true); // Use specfic handler
        container.addEventListener('click', blockMiddleClickEvents, true);
        container.addEventListener('auxclick', blockMiddleClickEvents, true);

        // Global mouse up to reliably stop dragging (Capture phase to catch it before it disappears)
        window.addEventListener('mouseup', handleGlobalMouseUp, true);

        return () => {
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('mousedown', handleNativeMiddleDown, true);
            container.removeEventListener('mouseup', handleNativeMiddleUp, true);
            container.removeEventListener('click', blockMiddleClickEvents, true);
            container.removeEventListener('auxclick', blockMiddleClickEvents, true);
            window.removeEventListener('mouseup', handleGlobalMouseUp, true);
        };
    }, [setCanvasScale, setCanvasOffset]); // Listeners establish only on mount/unmount usually, but deps added for correctness

    // deleted useDrop block

    const handleMouseDown = (e: React.MouseEvent) => {
        // If any widget is maximized, do not allow canvas panning.
        if (widgets.some(w => w.isMaximized)) {
            return;
        }

        // Pan: Only on middle-click or Alt+Left-click
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Always track mouse position for paste operations
        currentMousePos.current = { x: e.clientX, y: e.clientY };

        // Pan: Only if dragging (middle-click or Alt+Left)
        if (isDragging.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;

            // Correct logic: Offset is in SCREEN pixels. 1:1 mapping.
            setCanvasOffset({
                x: canvas.offset.x + dx,
                y: canvas.offset.y + dy
            });

            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        // Handle lasso selection
        if (isLassoing && lassoStart && lassoEnd) {
            // Convert screen coordinates to world (canvas) coordinates
            // This fixes the bug where lasso selection fails at zoom != 1
            const worldLassoStart = {
                x: (lassoStart.x - canvas.offset.x) / canvas.scale,
                y: (lassoStart.y - canvas.offset.y) / canvas.scale
            };
            const worldLassoEnd = {
                x: (lassoEnd.x - canvas.offset.x) / canvas.scale,
                y: (lassoEnd.y - canvas.offset.y) / canvas.scale
            };

            // Create selection rectangle in world coordinates
            const rect = {
                x1: Math.min(worldLassoStart.x, worldLassoEnd.x),
                y1: Math.min(worldLassoStart.y, worldLassoEnd.y),
                x2: Math.max(worldLassoStart.x, worldLassoEnd.x),
                y2: Math.max(worldLassoStart.y, worldLassoEnd.y)
            };

            const selectedIds = widgets.filter(widget => {
                const widgetRect = {
                    x1: widget.position.x,
                    y1: widget.position.y,
                    x2: widget.position.x + widget.size.width,
                    y2: widget.position.y + widget.size.height
                };

                // Check if widget intersects with lasso rectangle (both in world coords now)
                return !(
                    widgetRect.x2 < rect.x1 ||
                    widgetRect.x1 > rect.x2 ||
                    widgetRect.y2 < rect.y1 ||
                    widgetRect.y1 > rect.y2
                );
            }).map(w => w.id);

            if (selectedIds.length > 0) {
                selectMultiple(selectedIds);
            }

            setIsLassoing(false);
            setLassoStart(null);
            setLassoEnd(null);
        }

        // Stop pan dragging
        isDragging.current = false;
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // If any widget is maximized, disable global canvas shortcuts.
            // This prevents accidental deletion or selection of the maximized widget (or others)
            // while trying to interact with the widget's internal content.
            if (widgets.some(w => w.isMaximized)) {
                return;
            }

            // Ctrl/Cmd + A: Select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAll();
            }

            // Escape: Clear selection
            if (e.key === 'Escape') {
                e.preventDefault();
                clearSelection();
            }

            // Delete/Backspace: Delete selected widgets
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWidgetIds.length > 0) {
                e.preventDefault();
                selectedWidgetIds.forEach(id => removeWidget(id));
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedWidgetIds, selectAll, clearSelection, removeWidget, selectMultiple, widgets]);

    // Handle canvas click for lasso start
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only start lasso if:
        // - Left click (button 0)
        // - Clicking on canvas background (not on a widget)
        // - No modifier keys (Ctrl, Alt, Shift)
        if (e.button === 0 && e.target === e.currentTarget && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            setLassoStart({ x: e.clientX, y: e.clientY });
            setLassoEnd({ x: e.clientX, y: e.clientY });
            setIsLassoing(true);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        // Update lasso if active
        if (isLassoing && lassoStart) {
            setLassoEnd({ x: e.clientX, y: e.clientY });
        }
    };

    // We apply transform to a content wrapper, not the background itself if we want background to pan/zoom correctly with CSS only.
    // But simpler: Apply transform to the div containing widgets.
    // Background position handles panning. Background size handles zooming.

    // Draw dot grid on canvas (for pixel-perfect control)
    useEffect(() => {
        if (gridStyle !== 'dots' || !gridCanvasRef.current || !containerRef.current) return;

        const gridCanvas = gridCanvasRef.current;
        const container = containerRef.current;
        const ctx = gridCanvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match container
        const rect = container.getBoundingClientRect();
        gridCanvas.width = rect.width;
        gridCanvas.height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        // Calculate grid parameters
        const gridSpacing = 50; // World units
        const dotRadius = 1; // Fixed screen pixels - NEVER changes with zoom

        // Calculate visible area in world coordinates
        const startWorldX = -canvas.offset.x / canvas.scale;
        const startWorldY = -canvas.offset.y / canvas.scale;
        const endWorldX = (gridCanvas.width - canvas.offset.x) / canvas.scale;
        const endWorldY = (gridCanvas.height - canvas.offset.y) / canvas.scale;

        // Snap to grid
        const startGridX = Math.floor(startWorldX / gridSpacing) * gridSpacing;
        const startGridY = Math.floor(startWorldY / gridSpacing) * gridSpacing;

        // Draw dots
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)'; // Dot color

        for (let worldX = startGridX; worldX <= endWorldX; worldX += gridSpacing) {
            for (let worldY = startGridY; worldY <= endWorldY; worldY += gridSpacing) {
                // Convert world coordinates to screen coordinates
                const screenX = worldX * canvas.scale + canvas.offset.x;
                const screenY = worldY * canvas.scale + canvas.offset.y;

                // Draw dot at fixed screen size
                ctx.beginPath();
                ctx.arc(screenX, screenY, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }, [gridStyle, canvas.scale, canvas.offset.x, canvas.offset.y]);


    /**
     * Handle Paste (Ctrl+V) - creates widget at current mouse position
     */
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
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
            // mouseX/Y are relative to viewport, need to subtract container offset
            const mouseX = currentMousePos.current.x - rect.left;
            const mouseY = currentMousePos.current.y - rect.top;

            // Transform to world coordinates: worldPos = (screenPos - offset) / scale
            const worldX = (mouseX - canvas.offset.x) / canvas.scale;
            const worldY = (mouseY - canvas.offset.y) / canvas.scale;

            // Position widget so its top-left is at mouse position
            const position = { x: worldX, y: worldY };

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
                        // Stop after handling one main item to avoid spamming widgets
                        e.preventDefault();
                        return;
                    }
                } else if (item.type.indexOf('text/plain') !== -1) {
                    item.getAsString((text) => {
                        if (text && text.trim().length > 0) {
                            addWidget('NOTE', position, { content: text });
                        }
                    });
                    e.preventDefault();
                    return;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // Handle wire drop - when user releases mouse while dragging a wire
    const handleWireDrop = useCallback((e: React.MouseEvent) => {
        if (!wireDragState.isDragging || !wireDragState.sourceWidgetId) {
            return;
        }

        // Check if dropped on a widget (would be handled by WidgetContainer)
        // If dropped on empty canvas, show context menu
        const sourceWidget = widgets.find(w => w.id === wireDragState.sourceWidgetId);
        if (sourceWidget) {
            setContextMenu({
                isOpen: true,
                position: { x: e.clientX, y: e.clientY },
                sourceWidgetId: wireDragState.sourceWidgetId,
                sourceWidgetType: sourceWidget.type
            });
        }

        clearWireDragState();
    }, [wireDragState, widgets, clearWireDragState]);

    // Handle automation widget creation from context menu
    const handleCreateAutomation = useCallback((
        automationType: AutomationWidgetType,
        triggerEvent: TriggerEvent
    ) => {
        if (!contextMenu) return;

        // Convert screen position to world coordinates
        const worldX = (contextMenu.position.x - canvas.offset.x) / canvas.scale;
        const worldY = (contextMenu.position.y - canvas.offset.y) / canvas.scale;

        // Create the automation widget
        addWidget(automationType as WidgetType, { x: worldX, y: worldY }, {
            _isAutomation: true,
            _automationType: automationType
        });

        // Get the newly created widget ID (it's the last one added)
        const { widgets: updatedWidgets } = useStore.getState();
        const newWidget = updatedWidgets[updatedWidgets.length - 1];

        // Create connection between source and new automation widget
        if (newWidget) {
            addConnection(contextMenu.sourceWidgetId, newWidget.id, triggerEvent);
        }

        // Close menu
        setContextMenu(null);
    }, [contextMenu, canvas, addWidget, addConnection]);

    // Handle context menu close
    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    return (
        <div
            ref={containerRef}
            data-main-canvas="true"
            className="w-full h-full overflow-hidden relative cursor-crosshair"
            onMouseDown={(e) => {
                handleMouseDown(e);
                handleCanvasMouseDown(e);
            }}
            onMouseMove={(e) => {
                handleMouseMove(e);
                handleCanvasMouseMove(e);
            }}
            onMouseUp={(e) => {
                handleMouseUp();
                handleWireDrop(e);
            }}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--color-background)',
                backgroundSize: gridStyle === 'lines' ? `${50 * canvas.scale}px ${50 * canvas.scale}px` : undefined,
                backgroundImage: gridStyle === 'lines'
                    ? `linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)`
                    : 'none',
                backgroundPosition: gridStyle === 'lines' ? `${canvas.offset.x}px ${canvas.offset.y}px` : undefined,
                userSelect: isLassoing ? 'none' : 'auto',
            }}
        >
            {/* Dot Grid Canvas Overlay */}
            {gridStyle === 'dots' && (
                <canvas
                    ref={gridCanvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />
            )}
            <div
                style={{
                    transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none', // Allow clicks to pass through to canvas
                }}
            >
                {widgets.filter(w => !w.isMaximized).map(widget => (
                    <WidgetContainer key={widget.id} widget={widget}>
                        {renderWidgetContent(widget)}
                    </WidgetContainer>
                ))}
            </div>

            {/* Maximized Widgets (Rendered outside transformed container) */}
            {widgets.filter(w => w.isMaximized).map(widget => (
                <WidgetContainer key={widget.id} widget={widget}>
                    {renderWidgetContent(widget)}
                </WidgetContainer>
            ))}

            {/* Selection Counter */}
            {selectedWidgetIds.length > 1 && !widgets.some(w => w.isMaximized) && (
                <div
                    className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg border flex items-center gap-2"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: '#3b82f6',
                        color: 'var(--color-text)',
                        zIndex: 10000
                    }}
                >
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">
                        {selectedWidgetIds.length} widgets selected
                    </span>
                    <button
                        onClick={clearSelection}
                        className="ml-2 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        style={{ color: '#3b82f6' }}
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Lasso Selection Rectangle */}
            {isLassoing && lassoStart && lassoEnd && !widgets.some(w => w.isMaximized) && (
                <div
                    className="fixed pointer-events-none"
                    style={{
                        left: Math.min(lassoStart.x, lassoEnd.x),
                        top: Math.min(lassoStart.y, lassoEnd.y),
                        width: Math.abs(lassoEnd.x - lassoStart.x),
                        height: Math.abs(lassoEnd.y - lassoStart.y),
                        border: '2px dashed #3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        zIndex: 9999
                    }}
                />
            )}

            {/* Alignment Toolbar */}
            {!widgets.some(w => w.isMaximized) && <AlignmentToolbar />}

            {/* Wire Layer - renders connections between widgets */}
            <WireLayer />

            {/* Connection Context Menu - shows when wire is dropped on canvas */}
            {contextMenu && (
                <ConnectionContextMenu
                    isOpen={contextMenu.isOpen}
                    position={contextMenu.position}
                    sourceWidgetId={contextMenu.sourceWidgetId}
                    sourceWidgetType={contextMenu.sourceWidgetType}
                    onSelect={handleCreateAutomation}
                    onClose={handleCloseContextMenu}
                />
            )}
        </div>
    );
};
