import React, { useRef, useState, useCallback } from 'react';
import { useStore } from '../store/store';
import type { WidgetType } from '../store/store';
import { WidgetContainer } from './WidgetContainer';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { AlignmentToolbar } from './AlignmentToolbar';
import { WireLayer, ConnectionContextMenu } from './automation';
import type { AutomationWidgetType, TriggerEvent } from '../core/services/automation';

// Canvas hooks
import {
    useCanvasNavigation,
    useLassoSelection,
    useCanvasPaste,
    useCanvasGrid,
    useCanvasKeyboard,
    GRID_SPACING,
    Z_INDEX,
} from '../core/canvas';

// Widget renderer (centralized widget component mapping)
import { WidgetContent } from '../core/widgets';

export const Canvas: React.FC = () => {
    const { widgets, canvas, selectedWidgetIds, clearSelection, gridStyle, removeWidget } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);

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

    // =========================================================================
    // CUSTOM HOOKS - Modular canvas functionality
    // =========================================================================

    // Navigation: pan, zoom, middle-click handling
    const {
        currentMousePos,
        handleMouseDown: handleNavigationMouseDown,
        handleMouseMove: handleNavigationMouseMove,
        handleMouseUp: handleNavigationMouseUp,
    } = useCanvasNavigation({ containerRef });

    // Lasso selection
    const {
        lassoStart,
        lassoEnd,
        isLassoing,
        handleLassoStart,
        handleLassoMove,
        handleLassoEnd,
    } = useLassoSelection();

    // Paste handling (Ctrl+V)
    useCanvasPaste({ containerRef, currentMousePos });

    // Grid rendering (dots mode)
    useCanvasGrid({ gridCanvasRef, containerRef });

    // Keyboard shortcuts (Ctrl+A, Delete, Escape)
    useCanvasKeyboard();

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Combined mouse up handler
     */
    const handleMouseUp = useCallback(() => {
        handleNavigationMouseUp();
        handleLassoEnd();
    }, [handleNavigationMouseUp, handleLassoEnd]);

    /**
     * Handle wire drop - when user releases mouse while dragging a wire
     */
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

    /**
     * Handle automation widget creation from context menu
     */
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

    /**
     * Handle context menu close
     */
    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div
            ref={containerRef}
            data-main-canvas="true"
            className="w-full h-full overflow-hidden relative cursor-crosshair"
            onMouseDown={(e) => {
                handleNavigationMouseDown(e);
                handleLassoStart(e);
            }}
            onMouseMove={(e) => {
                handleNavigationMouseMove(e);
                handleLassoMove(e);
            }}
            onDragOver={(e) => {
                e.preventDefault(); // allow drop
            }}
            onDrop={async (e) => {
                e.preventDefault();

                // 1. Internal project file drag (from ProjectFileTree)
                const internalData = e.dataTransfer.getData('application/tsm-project-file');
                if (internalData) {
                    try {
                        const fileNode = JSON.parse(internalData);
                        console.log('Dropped internal file:', fileNode);

                        // Calculate world position
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;

                        const clientX = e.clientX;
                        const clientY = e.clientY;

                        const worldX = (clientX - rect.left - canvas.offset.x) / canvas.scale;
                        const worldY = (clientY - rect.top - canvas.offset.y) / canvas.scale;

                        // Logic to determine widget type based on file extension
                        if (fileNode.name.endsWith('.dxf')) {
                            addWidget('CAD_2D', { x: worldX, y: worldY }, { file: fileNode.name });
                        } else if (fileNode.name.endsWith('.pdf')) {
                            addWidget('PDF', { x: worldX, y: worldY }, { file: fileNode.name });
                        } else if (fileNode.name.endsWith('.json')) {
                            addWidget('NOTE', { x: worldX, y: worldY }, { content: 'Content of ' + fileNode.name });
                        }
                    } catch (err) {
                        console.error('Failed to handle dropped file', err);
                    }
                    return;
                }

                // 2. External file drop (from desktop/file manager)
                const files = e.dataTransfer.files;
                if (files.length > 0 && window.electronAPI) {
                    const { getCurrentFilePath } = await import('../core/services/filesystem/fileSystemAdapter').then(m => ({ getCurrentFilePath: m.fileSystemAdapter.getCurrentFilePath.bind(m.fileSystemAdapter) }));
                    const projectPath = getCurrentFilePath();

                    if (!projectPath) {
                        console.warn('No active project folder. Save project first.');
                        return;
                    }

                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;

                    const clientX = e.clientX;
                    const clientY = e.clientY;

                    const worldX = (clientX - rect.left - canvas.offset.x) / canvas.scale;
                    const worldY = (clientY - rect.top - canvas.offset.y) / canvas.scale;

                    // Process each dropped file
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const filePath = (file as unknown as { path?: string }).path;

                        if (!filePath) {
                            console.warn('File path not available (web mode?)');
                            continue;
                        }

                        // Copy to project folder
                        const result = await window.electronAPI.copyFileToProject({
                            filePath,
                            projectPath
                        });

                        if (result.success && result.targetPath) {
                            console.log(`✅ Copied ${file.name} to ${result.relativePath}`);

                            // Create appropriate widget
                            const ext = file.name.split('.').pop()?.toLowerCase() || '';
                            const offsetX = i * 30; // Stagger multiple files
                            const offsetY = i * 30;

                            if (['pdf'].includes(ext)) {
                                addWidget('PDF', { x: worldX + offsetX, y: worldY + offsetY }, {
                                    file: result.targetPath,
                                    title: file.name
                                });
                            } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
                                addWidget('IMAGE', { x: worldX + offsetX, y: worldY + offsetY }, {
                                    file: result.targetPath,
                                    title: file.name
                                });
                            } else if (['dxf', 'dwg'].includes(ext)) {
                                addWidget('CAD_2D', { x: worldX + offsetX, y: worldY + offsetY }, {
                                    file: result.targetPath,
                                    title: file.name
                                });
                            } else {
                                // Default: create a note widget with file reference
                                addWidget('NOTE', { x: worldX + offsetX, y: worldY + offsetY }, {
                                    content: `📎 ${file.name}\n\nPath: ${result.relativePath}`,
                                    title: file.name
                                });
                            }
                        } else {
                            console.error(`❌ Failed to copy ${file.name}:`, result.error);
                        }
                    }

                    // Notify ProjectWidget to refresh file list
                    window.dispatchEvent(new CustomEvent('project-file-added'));
                }
            }}
            onMouseUp={(e) => {
                handleMouseUp();
                handleWireDrop(e);
            }}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--color-background)',
                backgroundSize: gridStyle === 'lines' ? `${GRID_SPACING * canvas.scale}px ${GRID_SPACING * canvas.scale}px` : undefined,
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
                        zIndex: Z_INDEX.GRID,
                    }}
                />
            )}

            {/* Wire Layer - renders connections BEHIND widgets */}
            <WireLayer />

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
                        <WidgetErrorBoundary
                            widgetId={widget.id}
                            widgetTitle={widget.title}
                            onRemove={() => removeWidget(widget.id)}
                        >
                            <WidgetContent widget={widget} />
                        </WidgetErrorBoundary>
                    </WidgetContainer>
                ))}
            </div>

            {/* Maximized Widgets (Rendered outside transformed container) */}
            {widgets.filter(w => w.isMaximized).map(widget => (
                <WidgetContainer key={widget.id} widget={widget}>
                    <WidgetErrorBoundary
                        widgetId={widget.id}
                        widgetTitle={widget.title}
                        onRemove={() => removeWidget(widget.id)}
                    >
                        <WidgetContent widget={widget} />
                    </WidgetErrorBoundary>
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
                        zIndex: Z_INDEX.SELECTION_COUNTER
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
                        zIndex: Z_INDEX.LASSO
                    }}
                />
            )}

            {/* Alignment Toolbar */}
            {!widgets.some(w => w.isMaximized) && <AlignmentToolbar />}

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
