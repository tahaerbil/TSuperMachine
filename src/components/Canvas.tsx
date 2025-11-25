import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { WidgetContainer } from './WidgetContainer';

import { NoteWidget } from './widgets/NoteWidget';
import { CalculatorWidget } from './widgets/CalculatorWidget';
import { SettingsWidget } from './widgets/SettingsWidget';
import { TodoWidget } from './widgets/TodoWidget';
import { SpreadsheetWidget } from './widgets/SpreadsheetWidget';
import { ImageViewerWidget } from './widgets/ImageViewerWidget';
import { PDFViewerWidget } from './widgets/PDFViewerWidget';
import { PresentationWidget } from './widgets/PresentationWidget';
import { CAD2DWidget } from './widgets/CAD2D/CAD2DWidget';
import { CAD3DWidget } from './widgets/CAD3DWidget';
import { ProjectMenuWidget } from './widgets/ProjectMenuWidget';
import { AlignmentToolbar } from './AlignmentToolbar';



export const Canvas: React.FC = () => {
    const { widgets, canvas, setCanvasOffset, setCanvasScale, selectedWidgetIds, selectAll, clearSelection, removeWidget, selectMultiple, zoomSensitivity } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Lasso selection state
    const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
    const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
    const [isLassoing, setIsLassoing] = useState(false);

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
    handleWheelRef.current = handleWheel;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            handleWheelRef.current(e);
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

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
        // Pan: Only if dragging (middle-click or Alt+Left)
        if (isDragging.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setCanvasOffset({ x: canvas.offset.x + dx, y: canvas.offset.y + dy });
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        // Handle lasso selection
        if (isLassoing && lassoStart && lassoEnd) {
            // Select widgets in lasso rectangle
            const rect = {
                x1: Math.min(lassoStart.x, lassoEnd.x),
                y1: Math.min(lassoStart.y, lassoEnd.y),
                x2: Math.max(lassoStart.x, lassoEnd.x),
                y2: Math.max(lassoStart.y, lassoEnd.y)
            };

            const selectedIds = widgets.filter(widget => {
                const widgetRect = {
                    x1: widget.position.x,
                    y1: widget.position.y,
                    x2: widget.position.x + widget.size.width,
                    y2: widget.position.y + widget.size.height
                };

                // Check if widget intersects with lasso rectangle
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
    }, [selectedWidgetIds, selectAll, clearSelection, removeWidget, selectMultiple]);

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


    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative cursor-crosshair"
            onMouseDown={(e) => {
                handleMouseDown(e);
                handleCanvasMouseDown(e);
            }}
            onMouseMove={(e) => {
                handleMouseMove(e);
                handleCanvasMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--color-background)',
                backgroundSize: `${50 * canvas.scale}px ${50 * canvas.scale}px`,
                backgroundImage: `linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)`,
                backgroundPosition: `${canvas.offset.x}px ${canvas.offset.y}px`,
                userSelect: isLassoing ? 'none' : 'auto', // Prevent text selection only during lasso drag
            }}
        >
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
                        {widget.type === 'NOTE' && <NoteWidget id={widget.id} initialContent={widget.data?.content} />}
                        {widget.type === 'CALCULATOR' && <CalculatorWidget />}
                        {widget.type === 'CAD_3D' && <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />}
                        {widget.type === 'CAD_3D' && <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />}
                        {widget.type === 'CAD_2D' && <CAD2DWidget id={widget.id} isMaximized={widget.isMaximized} />}
                        {widget.type === 'SPREADSHEET' && <SpreadsheetWidget id={widget.id} initialData={widget.data?.spreadsheet} isMaximized={widget.isMaximized} />}
                        {widget.type === 'TODO' && <TodoWidget id={widget.id} initialTodos={widget.data?.todos} />}
                        {widget.type === 'SETTINGS' && <SettingsWidget />}
                        {widget.type === 'IMAGE' && <ImageViewerWidget id={widget.id} initialImage={widget.data?.image} />}
                        {widget.type === 'PDF' && <PDFViewerWidget id={widget.id} initialPDF={widget.data?.pdf} />}
                        {widget.type === 'PRESENTATION' && <PresentationWidget id={widget.id} initialSlides={widget.data?.slides} />}
                        {widget.type === 'PROJECT' && <ProjectMenuWidget />}
                    </WidgetContainer>
                ))}
            </div>

            {/* Maximized Widgets (Rendered outside transformed container) */}
            {widgets.filter(w => w.isMaximized).map(widget => (
                <WidgetContainer key={widget.id} widget={widget}>
                    {widget.type === 'NOTE' && <NoteWidget id={widget.id} initialContent={widget.data?.content} />}
                    {widget.type === 'CALCULATOR' && <CalculatorWidget />}
                    {widget.type === 'CAD_3D' && <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />}
                    {widget.type === 'CAD_2D' && <CAD2DWidget id={widget.id} isMaximized={widget.isMaximized} />}
                    {widget.type === 'SPREADSHEET' && <SpreadsheetWidget id={widget.id} initialData={widget.data?.spreadsheet} isMaximized={widget.isMaximized} />}
                    {widget.type === 'TODO' && <TodoWidget id={widget.id} initialTodos={widget.data?.todos} />}
                    {widget.type === 'SETTINGS' && <SettingsWidget />}
                    {widget.type === 'IMAGE' && <ImageViewerWidget id={widget.id} initialImage={widget.data?.image} />}
                    {widget.type === 'PDF' && <PDFViewerWidget id={widget.id} initialPDF={widget.data?.pdf} />}
                    {widget.type === 'PRESENTATION' && <PresentationWidget id={widget.id} initialSlides={widget.data?.slides} />}
                    {widget.type === 'PROJECT' && <ProjectMenuWidget />}
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
        </div>
    );
};
