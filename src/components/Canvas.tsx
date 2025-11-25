import React, { useRef } from 'react';
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
import { CAD2DWidget } from './widgets/CAD2DWidget';
import { CAD3DWidget } from './widgets/CAD3DWidget';
import { ProjectMenuWidget } from './widgets/ProjectMenuWidget';



export const Canvas: React.FC = () => {
    const { widgets, canvas, setCanvasOffset, setCanvasScale } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newScale = Math.max(0.1, Math.min(5, canvas.scale - e.deltaY * zoomSensitivity));
            setCanvasScale(newScale);
        } else {
            // Pan with scroll if not zooming? Or just let native scroll happen if we had scrollbars (we don't)
            // Better to use wheel for panning if no modifier?
            // Standard CAD: Wheel = Zoom, Middle Click Drag = Pan.
            // Let's stick to Wheel = Zoom (without modifier for CAD feel) or Modifier + Wheel = Zoom.
            // Let's do: Wheel = Zoom (standard for maps/CAD often, or Ctrl+Wheel).
            // Let's do Ctrl+Wheel for Zoom to avoid accidental zooming while scrolling content.
            // Actually, for an infinite canvas without scrollbars, Wheel usually pans vertically, Shift+Wheel horizontally.
            // But let's implement Middle Click Drag for Pan.

            // For now, let's just support Zoom with Wheel (no modifier needed if we prevent default)
            const zoomSensitivity = 0.001;
            const newScale = Math.max(0.1, Math.min(5, canvas.scale - e.deltaY * zoomSensitivity));
            setCanvasScale(newScale);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setCanvasOffset({ x: canvas.offset.x + dx, y: canvas.offset.y + dy });
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // We apply transform to a content wrapper, not the background itself if we want background to pan/zoom correctly with CSS only.
    // But simpler: Apply transform to the div containing widgets.
    // Background position handles panning. Background size handles zooming.


    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative cursor-crosshair"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--color-background)',
                backgroundSize: `${50 * canvas.scale}px ${50 * canvas.scale}px`,
                backgroundImage: `linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)`,
                backgroundPosition: `${canvas.offset.x}px ${canvas.offset.y}px`,
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
                }}
            >
                {widgets.map(widget => (
                    <WidgetContainer key={widget.id} widget={widget}>
                        {widget.type === 'NOTE' && <NoteWidget id={widget.id} initialContent={widget.data?.content} />}
                        {widget.type === 'CALCULATOR' && <CalculatorWidget />}
                        {widget.type === 'CAD_3D' && <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />}
                        {widget.type === 'CAD_2D' && <CAD2DWidget id={widget.id} initialShapes={widget.data?.shapes} />}
                        {widget.type === 'SPREADSHEET' && <SpreadsheetWidget id={widget.id} initialData={widget.data?.spreadsheet} />}
                        {widget.type === 'TODO' && <TodoWidget id={widget.id} initialTodos={widget.data?.todos} />}
                        {widget.type === 'SETTINGS' && <SettingsWidget />}
                        {widget.type === 'IMAGE' && <ImageViewerWidget id={widget.id} initialImage={widget.data?.image} />}
                        {widget.type === 'PDF' && <PDFViewerWidget id={widget.id} initialPDF={widget.data?.pdf} />}
                        {widget.type === 'PRESENTATION' && <PresentationWidget id={widget.id} initialSlides={widget.data?.slides} />}
                        {widget.type === 'PROJECT' && <ProjectMenuWidget />}
                    </WidgetContainer>
                ))}
            </div>
        </div>
    );
};
