import React, { useRef } from 'react';
import { Rnd } from 'react-rnd';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useStore } from '../store/store';
import type { Widget } from '../store/store';
import clsx from 'clsx';

interface WidgetContainerProps {
    widget: Widget;
    children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, children }) => {
    const { updateWidget, removeWidget, bringToFront, activeWidgetId, canvas, selectedWidgetIds, selectWidget, widgets } = useStore();
    const isActive = activeWidgetId === widget.id;
    const isSelected = selectedWidgetIds.includes(widget.id);

    const isMaximized = widget.isMaximized || false;

    // Track last position for smooth bulk move
    const lastPosRef = useRef({ x: widget.position.x, y: widget.position.y });

    return (
        <Rnd
            scale={isMaximized ? 1 : canvas.scale}
            size={isMaximized ? { width: '100%', height: '100%' } : { width: widget.size.width, height: widget.size.height }}
            position={isMaximized ? { x: 0, y: 0 } : { x: widget.position.x, y: widget.position.y }}
            disableDragging={isMaximized}
            enableResizing={!isMaximized}
            onDrag={(_e, d) => {
                if (isMaximized) return;
                // Real-time bulk move during drag
                if (isSelected && selectedWidgetIds.length > 1) {
                    const deltaX = d.x - lastPosRef.current.x;
                    const deltaY = d.y - lastPosRef.current.y;

                    if (deltaX !== 0 || deltaY !== 0) {
                        selectedWidgetIds.forEach(id => {
                            if (id !== widget.id) { // Don't update the dragged widget, react-rnd handles it
                                const w = widgets.find(w => w.id === id);
                                if (w) {
                                    updateWidget(id, {
                                        position: {
                                            x: w.position.x + deltaX,
                                            y: w.position.y + deltaY
                                        }
                                    });
                                }
                            }
                        });
                        lastPosRef.current = { x: d.x, y: d.y };
                    }
                }
            }}
            onDragStop={(_e, d) => {
                if (isMaximized) return;
                // Final position update
                updateWidget(widget.id, { position: { x: d.x, y: d.y } });
                lastPosRef.current = { x: d.x, y: d.y };
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
                if (isMaximized) return;
                updateWidget(widget.id, {
                    size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                    position: position,
                });
            }}
            onMouseDown={(e) => {
                // Handle selection
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd+Click: Toggle selection
                    selectWidget(widget.id, 'add');
                } else if (e.shiftKey) {
                    // Shift+Click: Range selection
                    selectWidget(widget.id, 'range');
                } else {
                    // Normal click: Single selection
                    selectWidget(widget.id, 'single');
                }
                bringToFront(widget.id);
            }}
            style={{
                zIndex: isMaximized ? 9999 : widget.zIndex,
                pointerEvents: 'auto', // Re-enable pointer events for widgets
                transition: 'border-color 0.2s, box-shadow 0.2s', // Only animate border and shadow, not position
                position: isMaximized ? 'fixed' : 'absolute',
            }}
            className={clsx(
                "flex flex-col rounded-lg shadow-xl border overflow-hidden",
                // Dynamic background based on widget type
                (widget.type === 'CAD_2D' || widget.type === 'CAD_3D') ? "bg-[#1e1e1e]" : "bg-white",
                isSelected
                    ? "border-blue-500 shadow-2xl ring-2 ring-blue-500/50"
                    : isActive
                        ? "border-blue-400 shadow-2xl ring-1 ring-blue-400/20"
                        : "border-gray-200"
            )}
            dragHandleClassName="widget-header"
        >
            {/* Header */}
            <div
                className="widget-header h-8 border-b flex items-center justify-between px-2 cursor-move select-none"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)'
                }}
            >
                <span className="text-xs font-medium">{widget.title}</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updateWidget(widget.id, { isMaximized: !isMaximized });
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        style={{ color: 'var(--color-text)' }}
                    >
                        {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeWidget(widget.id);
                        }}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                        style={{ color: 'var(--color-text)' }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="w-full overflow-hidden relative"
                style={{ height: 'calc(100% - 32px)' }} // Explicit height: Total - Header(32px)
            >
                {children}
            </div>
        </Rnd>
    );
};
