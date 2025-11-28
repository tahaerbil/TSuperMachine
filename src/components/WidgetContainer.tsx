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

    // Local state for smooth dragging
    const [localPos, setLocalPos] = React.useState(widget.position);
    const isDragging = useRef(false);

    // Sync local state with store when not dragging
    React.useEffect(() => {
        if (!isDragging.current) {
            setLocalPos(widget.position);
        }
    }, [widget.position]);

    return (
        <Rnd
            scale={1} // We handle scaling manually in onDrag
            size={isMaximized ? { width: '100%', height: '100%' } : { width: widget.size.width, height: widget.size.height }}
            position={isMaximized ? { x: 0, y: 0 } : localPos}
            disableDragging={isMaximized}
            enableResizing={!isMaximized}
            onDragStart={() => {
                isDragging.current = true;
            }}
            onDrag={(_e, d) => {
                if (isMaximized) return;

                const scale = canvas.scale;

                // Manually apply scale to deltas
                setLocalPos(prev => ({
                    x: prev.x + d.deltaX / scale,
                    y: prev.y + d.deltaY / scale
                }));

                // Real-time bulk move during drag
                if (isSelected && selectedWidgetIds.length > 1) {
                    // Calculate scaled deltas
                    const scaledDeltaX = d.deltaX / scale;
                    const scaledDeltaY = d.deltaY / scale;

                    if (scaledDeltaX !== 0 || scaledDeltaY !== 0) {
                        selectedWidgetIds.forEach(id => {
                            if (id !== widget.id) {
                                const w = widgets.find(w => w.id === id);
                                if (w) {
                                    updateWidget(id, {
                                        position: {
                                            x: w.position.x + scaledDeltaX,
                                            y: w.position.y + scaledDeltaY
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }}
            onDragStop={() => {
                isDragging.current = false;
                if (isMaximized) return;

                // For onDragStop, d.x and d.y might be unscaled absolute positions from the library's internal state
                // which might be wrong if we've been feeding it manually scaled positions.
                // Safer to use our localPos which we know is correct.
                updateWidget(widget.id, { position: localPos });
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
