import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { Trash2, Maximize2, Minimize2, ExternalLink, LogIn, RotateCw } from 'lucide-react';
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
    const [externalWindow, setExternalWindow] = useState<Window | null>(null);

    // Local state for smooth dragging
    const [localPos, setLocalPos] = React.useState(widget.position);
    const isDragging = useRef(false);

    // Sync local state with store when not dragging
    React.useEffect(() => {
        if (!isDragging.current) {
            setLocalPos(widget.position);
        }
    }, [widget.position]);

    // Close external window when component unmounts
    useEffect(() => {
        return () => {
            if (externalWindow) {
                externalWindow.close();
            }
        };
    }, [externalWindow]);

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateWidget(widget.id, {
            size: {
                width: widget.size.height,
                height: widget.size.width
            }
        });
    };

    const handlePopOut = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Open new window
        const width = widget.size.width || 600;
        const height = widget.size.height || 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const newWindow = window.open(
            '',
            `widget-${widget.id}`,
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );

        if (newWindow) {
            newWindow.document.title = widget.title;

            // Critical: Copy all styles so Tailwind/CSS vars work
            Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
                newWindow.document.head.appendChild(node.cloneNode(true));
            });

            // Set dark mode class if present in parent
            if (document.documentElement.classList.contains('dark')) {
                newWindow.document.documentElement.classList.add('dark');
            }

            // Copy root CSS variables explicitly if they are inline on body or root
            const rootStyle = window.getComputedStyle(document.documentElement);
            newWindow.document.body.style.backgroundColor = rootStyle.getPropertyValue('--color-background');
            newWindow.document.body.style.color = rootStyle.getPropertyValue('--color-text');
            newWindow.document.body.className = document.body.className;

            // Handle window closing manually by user
            newWindow.addEventListener('beforeunload', () => {
                setExternalWindow(null);
            });

            setExternalWindow(newWindow);
        }
    };

    const handleBringBack = () => {
        if (externalWindow) {
            externalWindow.close();
            setExternalWindow(null);
        }
    };

    // Render content either in local div or portal
    const renderContent = () => {
        if (externalWindow) {
            // Force children to behave as maximized when in a dedicated window
            // This ensures components like CAD2DWidget show their full UI (e.g. CommandLine)
            // regardless of the widget's state in the main store.
            const enhancedChildren = React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return React.cloneElement(child, { isMaximized: true } as any);
                }
                return child;
            });

            return createPortal(
                <div
                    className="h-full w-full bg-[#111827] text-white p-0 overflow-hidden" // Removed padding p-4 -> p-0 for full edge-to-edge
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.stopPropagation()}
                >
                    <div className="h-full w-full flex flex-col">
                        {enhancedChildren}
                    </div>
                </div>,
                externalWindow.document.body
            );
        }
        return children;
    };

    return (
        <React.Fragment>
            {/* The Portal Target (renders nothing in DOM tree, but keeps React tree alive) */}
            {externalWindow && renderContent()}

            <Rnd
                scale={isMaximized ? 1 : canvas.scale}
                size={isMaximized ? { width: '100%', height: '100%' } : { width: widget.size.width, height: widget.size.height }}
                position={isMaximized ? { x: 0, y: 0 } : localPos}
                disableDragging={isMaximized || !!externalWindow}
                enableResizing={!isMaximized && !externalWindow}
                onDragStart={() => {
                    isDragging.current = true;
                }}
                onDrag={(_e, d) => {
                    if (isMaximized || externalWindow) return;

                    // Convert screen-space delta to world-space delta
                    // react-rnd's deltaX/Y are in screen pixels, we need world units
                    const scale = canvas.scale;
                    setLocalPos(prev => ({
                        x: prev.x + d.deltaX / scale,
                        y: prev.y + d.deltaY / scale
                    }));

                    if (isSelected && selectedWidgetIds.length > 1) {
                        const scaledDeltaX = d.deltaX / scale;
                        const scaledDeltaY = d.deltaY / scale;
                        if (scaledDeltaX !== 0 || scaledDeltaY !== 0) {
                            selectedWidgetIds.forEach(id => {
                                if (id !== widget.id) {
                                    const w = widgets.find(w => w.id === id);
                                    if (w) {
                                        updateWidget(id, { position: { x: w.position.x + scaledDeltaX, y: w.position.y + scaledDeltaY } });
                                    }
                                }
                            });
                        }
                    }
                }}
                onDragStop={() => {
                    isDragging.current = false;
                    if (isMaximized || externalWindow) return;
                    updateWidget(widget.id, { position: localPos });
                }}
                onResizeStop={(_e, _direction, ref, _delta, position) => {
                    if (isMaximized || externalWindow) return;
                    updateWidget(widget.id, {
                        size: { width: parseInt(ref.style.width), height: parseInt(ref.style.height) },
                        position: position,
                    });
                }}
                onMouseDown={(e) => {
                    if (e.ctrlKey || e.metaKey) selectWidget(widget.id, 'add');
                    else if (e.shiftKey) selectWidget(widget.id, 'range');
                    else selectWidget(widget.id, 'single');
                    bringToFront(widget.id);
                }}
                style={{
                    zIndex: isMaximized ? 9999 : widget.zIndex,
                    pointerEvents: 'auto',
                    transition: 'box-shadow 0.2s', // Removed transform transition
                    position: isMaximized ? 'fixed' : 'absolute',
                }}
                className={clsx(
                    "flex flex-col overflow-hidden group/widget",
                    "transition-[box-shadow,opacity] duration-300", // Replaced transition-all with specific props
                    !isMaximized && "rounded-xl", // More rounded corners
                    // Glassmorphism Base
                    (widget.type === 'CAD_2D' || widget.type === 'CAD_3D')
                        ? "bg-[#1e1e1e] border-0 ring-1 ring-white/10"
                        : "bg-white/95 backdrop-blur-sm border border-white/20",

                    // Shadow & Glow Logic
                    !isMaximized && (isSelected || isActive)
                        ? "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-2 ring-blue-500/50" // Removed scale transform
                        : !isMaximized && "shadow-xl hover:shadow-2xl hover:ring-1 hover:ring-white/20"
                )}
                dragHandleClassName={(!isMaximized && !externalWindow) ? "widget-header" : ""}
            >
                {/* Cinematic Floating Header */}
                {!isMaximized && (
                    <div
                        className="widget-header absolute top-0 left-0 right-0 z-10 h-10 flex items-center justify-between px-3 cursor-move select-none opacity-0 group-hover/widget:opacity-100 transition-opacity duration-300"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', // Gradient fade
                        }}
                    >
                        {/* Title Capsule */}
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-gray-500'}`} />
                            <span className="text-xs font-medium text-white/90 tracking-wide">{widget.title}</span>
                        </div>

                        {/* Control Capsule */}
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/10 shadow-lg">
                            <button
                                onClick={handleRotate}
                                className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all"
                                title="Rotate Orientation"
                            >
                                <RotateCw size={12} />
                            </button>
                            <div className="w-px h-3 bg-white/20 mx-0.5" /> {/* Divider */}
                            {!externalWindow && (
                                <button
                                    onClick={handlePopOut}
                                    className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all"
                                    title="Pop Out"
                                >
                                    <ExternalLink size={12} />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateWidget(widget.id, { isMaximized: !isMaximized });
                                }}
                                className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all"
                            >
                                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                            </button>
                            <div className="w-px h-3 bg-white/20 mx-0.5" /> {/* Divider */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeWidget(widget.id);
                                }}
                                className="p-1.5 hover:bg-red-500/80 text-white/70 hover:text-white rounded-full transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
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
                <div
                    className="w-full h-full overflow-hidden relative" // Removed height calc(), it's 100% now
                    style={{
                        borderRadius: !isMaximized ? '0.75rem' : '0', // Clip content to rounded corners
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
            </Rnd>
        </React.Fragment>
    );
};
