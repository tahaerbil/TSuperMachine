import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Trash2, Maximize2, Minimize2, ExternalLink, LogIn, RotateCw } from 'lucide-react';
import { useStore } from '../store/store';
import type { Widget } from '../store/store';
import clsx from 'clsx';
import { ConnectorHandle } from './automation';

// Hooks
import {
    useWidgetDrag,
    useExternalWindow,
    useWireDropTarget
} from '../core/widgets/hooks';

interface WidgetContainerProps {
    widget: Widget;
    children: React.ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, children }) => {
    const {
        updateWidget,
        removeWidget,
        bringToFront,
        activeWidgetId,
        selectedWidgetIds,
        selectWidget,
        canvas,
        removeConnectionsForWidget,
        focusedWidgetId,
        enterFocusMode,
        exitFocusMode,
        updateFocusView
    } = useStore();

    const isActive = activeWidgetId === widget.id;
    const isSelected = selectedWidgetIds.includes(widget.id);
    const isMaximized = widget.isMaximized || false;
    const isFocused = focusedWidgetId === widget.id;

    // Hover state for connector handle visibility
    const [isHovered, setIsHovered] = useState(false);

    // Custom Hooks
    const { localPos, onDragStart, onDrag, onDragStop } = useWidgetDrag({ widget });
    const { externalWindow, handlePopOut, handleBringBack, renderContent } = useExternalWindow({
        widgetId: widget.id,
        widgetTitle: widget.title || 'Widget',
        widgetSize: widget.size,
        children
    });
    const { handleWireDrop } = useWireDropTarget({
        widgetId: widget.id,
        widgetPosition: widget.position,
        widgetSize: widget.size
    });

    // Automation Widgets Check
    const AUTOMATION_TYPES = ['PDF_EXPORT', 'CHART_GENERATOR', 'DATA_LOGGER', 'SCHEDULER'];
    const isAutomationWidget = widget.isAutomation || AUTOMATION_TYPES.includes(widget.type);

    // Local Handlers
    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateWidget(widget.id, {
            size: {
                width: widget.size.height,
                height: widget.size.width
            }
        });
        // Update focus view after rotation
        if (isFocused) {
            setTimeout(() => updateFocusView(), 0);
        }
    };

    // Rnd Adapters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRndDragStart = (e: any) => {
        onDragStart(e);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRndDrag = (e: any) => {
        onDrag(e);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRndMouseUp = (e: any) => {
        // Trigger wire drop logic
        handleWireDrop(e);
    };

    // Double-click handler for focus mode
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isFocused && !isMaximized) {
            enterFocusMode(widget.id);
        }
    };

    // ESC key handler for exiting focus mode
    React.useEffect(() => {
        if (!isFocused) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitFocusMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocused, exitFocusMode]);

    return (
        <React.Fragment>
            {/* The Portal Target (renders nothing in DOM tree unless external window is active) */}
            {externalWindow && renderContent()}

            <Rnd
                scale={isMaximized ? 1 : canvas.scale}
                size={isMaximized ? { width: '100%', height: '100%' } : { width: widget.size.width, height: widget.size.height }}
                position={isMaximized ? { x: 0, y: 0 } : localPos}
                disableDragging={isMaximized || !!externalWindow || isFocused}
                enableResizing={!isMaximized && !externalWindow && !isAutomationWidget}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onDragStart={handleRndDragStart}
                onDrag={handleRndDrag}
                onDragStop={onDragStop}
                onResizeStop={(_e, _direction, ref, _delta, position) => {
                    if (isMaximized || externalWindow) return;
                    updateWidget(widget.id, {
                        size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                        position: position,
                    });
                    // Update focus view after resize
                    if (isFocused) {
                        setTimeout(() => updateFocusView(), 0);
                    }
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseDown={(e: any) => {
                    if (e.ctrlKey || e.metaKey) selectWidget(widget.id, 'add');
                    else if (e.shiftKey) selectWidget(widget.id, 'range');
                    else selectWidget(widget.id, 'single');
                    bringToFront(widget.id);
                }}
                onMouseUp={handleRndMouseUp}
                onDoubleClick={handleDoubleClick}
                style={{
                    zIndex: isMaximized ? 9999 : widget.zIndex,
                    pointerEvents: 'auto',
                    transition: 'box-shadow 0.2s',
                    position: isMaximized ? 'fixed' : 'absolute',
                }}
                className={clsx(
                    "flex flex-col overflow-visible group/widget",
                    "transition-[box-shadow,opacity,width,height] duration-300 ease-in-out",
                    !isMaximized && "rounded-xl",
                    // Cursor: grab when draggable, default when focused
                    !isFocused && !isMaximized && "cursor-grab active:cursor-grabbing",
                    // Glassmorphism Base
                    (widget.type === 'CAD_2D' || widget.type === 'CAD_3D')
                        ? "bg-[#1e1e1e] border-0 ring-1 ring-white/10"
                        : "bg-white/95 backdrop-blur-sm border border-white/20",

                    // Focus Mode - strong visual feedback
                    isFocused && "ring-2 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]",

                    // Shadow & Glow Logic (only when not focused)
                    !isFocused && !isMaximized && (isSelected || isActive)
                        ? "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-2 ring-blue-500/50"
                        : !isFocused && !isMaximized && "shadow-xl hover:shadow-2xl hover:ring-1 hover:ring-white/20"
                )}
            // No dragHandleClassName = entire widget is draggable
            >
                {/* Floating Toolbar - Only visible in focus mode */}
                {!isMaximized && (
                    <div
                        className={`absolute left-0 right-0 z-20 flex items-center justify-center transition-all duration-200 ${isFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        style={{
                            bottom: '-42px'
                        }}
                    >
                        <div className="flex items-center justify-between w-full mx-1 gap-3 bg-[#0f1115]/90 backdrop-blur-xl px-3 py-1.5 rounded-2xl border border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.3)] ring-1 ring-white/5">

                            {/* Title Section */}
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${(isActive || isSelected) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-white/20'}`} />
                                <span className="text-xs font-semibold text-white/90 tracking-wide select-none whitespace-nowrap truncate">
                                    {widget.title}
                                </span>
                            </div>

                            {/* Actions Section */}
                            <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                                <div className="w-px h-4 bg-white/10 mr-2" />

                                <button
                                    onClick={handleRotate}
                                    className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors group/btn relative"
                                    title="Rotate"
                                >
                                    <RotateCw size={13} />
                                </button>

                                {!externalWindow && (
                                    <button
                                        onClick={handlePopOut}
                                        className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Pop Out"
                                    >
                                        <ExternalLink size={13} />
                                    </button>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateWidget(widget.id, { isMaximized: !isMaximized });
                                    }}
                                    className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Maximize"
                                >
                                    <Maximize2 size={13} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeConnectionsForWidget(widget.id);
                                        removeWidget(widget.id);
                                    }}
                                    className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                                    title="Delete"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Immersive Floating Controls (Maximized Mode) */}
                {isMaximized && !externalWindow && (
                    <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-2xl">
                            <button onClick={handlePopOut} className="p-2 hover:bg-white/20 text-white rounded-full transition-all" title="Pop Out"><ExternalLink size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); updateWidget(widget.id, { isMaximized: false }); }} className="p-2 hover:bg-white/20 text-white rounded-full transition-all" title="Minimize"><Minimize2 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }} className="p-2 hover:bg-red-500 text-white rounded-full transition-all" title="Close"><Trash2 size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Content Area - Full Height & Width */}
                {/* pointer-events controlled by focus state */}
                <div
                    className="w-full h-full overflow-hidden relative"
                    style={{
                        borderRadius: !isMaximized ? '0.75rem' : '0',
                        pointerEvents: (isFocused || isMaximized) ? 'auto' : 'none',
                        userSelect: (isFocused || isMaximized) ? 'auto' : 'none'
                    }}
                >
                    {externalWindow ? (
                        <div className="flex flex-col items-center justify-center h-full gap-5 bg-gray-900 text-gray-400">
                            <div className="p-6 rounded-full bg-white/5 ring-1 ring-white/10 animate-pulse">
                                <ExternalLink size={48} className="text-blue-400 opacity-80" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium text-lg text-white">Active in External Window</p>
                                <p className="text-sm opacity-50">This widget is running in a separate popup.</p>
                            </div>
                            <button
                                onClick={handleBringBack}
                                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] text-sm font-medium"
                            >
                                <LogIn size={16} />
                                Retrieve Widget
                            </button>
                        </div>
                    ) : (
                        children
                    )}
                </div>

                {/* Connector Handles for Automation - All 4 Sides */}
                {!isMaximized && !externalWindow && (
                    <>
                        <ConnectorHandle
                            widgetId={widget.id}
                            widgetType={widget.type}
                            widgetPosition={widget.position}
                            widgetSize={widget.size}
                            isVisible={isHovered}
                            placement="top"
                        />
                        <ConnectorHandle
                            widgetId={widget.id}
                            widgetType={widget.type}
                            widgetPosition={widget.position}
                            widgetSize={widget.size}
                            isVisible={isHovered}
                            placement="right"
                        />
                        <ConnectorHandle
                            widgetId={widget.id}
                            widgetType={widget.type}
                            widgetPosition={widget.position}
                            widgetSize={widget.size}
                            isVisible={isHovered}
                            placement="bottom"
                        />
                        <ConnectorHandle
                            widgetId={widget.id}
                            widgetType={widget.type}
                            widgetPosition={widget.position}
                            widgetSize={widget.size}
                            isVisible={isHovered}
                            placement="left"
                        />
                    </>
                )}
            </Rnd>
        </React.Fragment >
    );
};
