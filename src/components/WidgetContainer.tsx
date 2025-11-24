import React from 'react';
import { Rnd } from 'react-rnd';
import { X, Maximize2 } from 'lucide-react';
import { useStore } from '../store/store';
import type { Widget } from '../store/store';
import clsx from 'clsx';

interface WidgetContainerProps {
    widget: Widget;
    children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, children }) => {
    const { updateWidget, removeWidget, bringToFront, activeWidgetId, canvas } = useStore();
    const isActive = activeWidgetId === widget.id;

    return (
        <Rnd
            scale={canvas.scale}
            size={{ width: widget.size.width, height: widget.size.height }}
            position={{ x: widget.position.x, y: widget.position.y }}
            onDragStop={(_e, d) => {
                updateWidget(widget.id, { position: { x: d.x, y: d.y } });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
                updateWidget(widget.id, {
                    size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                    position: position,
                });
            }}
            onMouseDown={() => bringToFront(widget.id)}
            style={{ zIndex: widget.zIndex }}
            className={clsx(
                "flex flex-col bg-white rounded-lg shadow-xl border overflow-hidden transition-shadow",
                isActive ? "border-blue-500 shadow-2xl ring-1 ring-blue-500/20" : "border-gray-200"
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
                        className="p-1 hover:bg-gray-200 rounded hover:text-gray-700"
                        style={{ color: 'var(--color-text)' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement maximize
                        }}
                    >
                        <Maximize2 size={12} />
                    </button>
                    <button
                        className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeWidget(widget.id);
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-auto relative"
                style={{ backgroundColor: 'var(--color-surface)' }}
            >
                {children}
            </div>
        </Rnd>
    );
};
