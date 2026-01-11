import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cadEngine, SnapType } from '../../core/services/cad-engine/CADEngine';
import { WasmCanvas } from './components/WasmCanvas';
import { CommandLine, type CommandLineRef } from './components/CommandLine';
import { useCADCommand } from './hooks/useCADCommand';
import { getOutgoingConnections, useStore } from '../../store/store';
import { eventBus } from '../../core/services/automation';
import type { AutomationEvent, TriggerEvent } from '../../core/services/automation';

interface CAD2DWidgetProps {
    id: string;
    isMaximized?: boolean;
}

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ id, isMaximized }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [engineVersion, setEngineVersion] = useState(0);
    const [isEngineReady, setIsEngineReady] = useState(false);

    // Get canvas scale for coordinate compensation (focus mode applies scale transform)
    const canvasScale = useStore(state => state.canvas.scale);
    const isFocused = useStore(state => state.focusedWidgetId !== null);

    // Command Logic Hook
    const forceUpdate = useCallback(() => setEngineVersion(v => v + 1), []);
    const commandLineRef = useRef<CommandLineRef>(null);

    // Emit automation event to connected widgets
    const emitAutomationEvent = useCallback((type: TriggerEvent, payload: unknown) => {
        if (!id) return;
        const connections = getOutgoingConnections(id);
        if (connections.length === 0) return;

        const event: AutomationEvent = {
            type,
            sourceWidgetId: id,
            sourceWidgetType: 'CAD_2D',
            timestamp: new Date().toISOString(),
            payload
        };

        // Send to all active connections
        const targetIds = connections
            .filter(c => c.isActive)
            .map(c => c.targetWidgetId);

        if (targetIds.length > 0) {
            console.log('[CAD2DWidget] Emitting event:', type, 'to', targetIds.length, 'targets');
            eventBus.emit(event, targetIds);
        }
    }, [id]);

    const handleCommandCompleted = useCallback((cmd: string) => {
        commandLineRef.current?.setLastCommand(cmd);

        // Emit onSave event with CAD command info when command completes
        emitAutomationEvent('onSave', {
            command: cmd,
            timestamp: new Date().toISOString(),
            source: 'CAD_2D'
        });
    }, [emitAutomationEvent]);

    const {
        commandState,
        commandHistory,
        currentPrompt,
        previewState,
        activeSnap,
        handleCommand,
        processPointInput,
        handleCanvasMove,
        cancel,
        setCommandHistory
    } = useCADCommand({ onEngineUpdate: forceUpdate, scale, onCommandCompleted: handleCommandCompleted });

    // Interaction State
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Initialize Engine
    useEffect(() => {
        const init = async () => {
            try {
                await cadEngine.init();
                setIsEngineReady(true);
                forceUpdate();
            } catch (e) {
                console.error("Failed to init CAD Engine:", e);
            }
        };
        init();
    }, [forceUpdate]);

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions(prev => {
                    if (prev.width === width && prev.height === height) return prev;
                    return { width, height };
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Pan/Zoom Handlers
    const handleWheel = useCallback((e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.command-line-container')) return;

        e.preventDefault();
        e.stopPropagation();

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;

        const zoomSensitivity = 0.1;
        const delta = -Math.sign(e.deltaY) * zoomSensitivity;
        const newScale = Math.max(0.1, Math.min(50, scale * (1 + delta)));

        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    }, [offset, scale]);

    // Attach Wheel Listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const handleMouseUp = (e: React.MouseEvent) => {
        isPanning.current = false;

        // Prevent middle-click paste on button release (Linux primary selection)
        if (e.button === 1) {
            const isConsoleClick = (e.target as HTMLElement).closest('.command-line-container');
            if (!isConsoleClick) {
                e.preventDefault();
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        // Pan Logic (Middle Mouse or Alt+Left)
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Skip preventDefault if clicking on console (allow paste there)
            const isConsoleClick = (e.target as HTMLElement).closest('.command-line-container');
            if (!isConsoleClick) {
                e.preventDefault();
            }
            isPanning.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // Left Click -> Command Logic
        if (e.button === 0) {
            if (activeSnap && activeSnap.type !== SnapType.NONE && activeSnap.p) {
                // Ensure snap point is valid
                processPointInput(activeSnap.p.x, activeSnap.p.y);
            } else {
                const rect = containerRef.current.getBoundingClientRect();
                // Compensate for canvas scale when in focus mode (not maximized)
                const effectiveScale = (!isMaximized && isFocused) ? canvasScale : 1;
                const localX = (e.clientX - rect.left) / effectiveScale;
                const localY = (e.clientY - rect.top) / effectiveScale;
                const worldX = (localX - offset.x) / scale;
                const worldY = (localY - offset.y) / scale;
                processPointInput(worldX, worldY);
            }
        }

        // Focus CLI
        if (isMaximized) {
            setTimeout(() => commandLineRef.current?.focus(), 10);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Compensate for canvas scale when in focus mode (not maximized)
            const effectiveScale = (!isMaximized && isFocused) ? canvasScale : 1;
            const localX = (e.clientX - rect.left) / effectiveScale;
            const localY = (e.clientY - rect.top) / effectiveScale;
            const worldX = (localX - offset.x) / scale;
            const worldY = (localY - offset.y) / scale;
            handleCanvasMove(worldX, worldY);
        }
    };

    // Centralized Delete Logic
    const handleDeleteCommand = useCallback(() => {
        if (!isEngineReady) return;
        cadEngine.deleteSelected();
        forceUpdate();
        setCommandHistory(prev => [...prev, "Deleted selected entities."]);
    }, [isEngineReady, forceUpdate, setCommandHistory]);

    // DXF Save Handler (Ctrl+S)
    const handleSaveDXF = useCallback(async () => {
        if (!isEngineReady) {
            setCommandHistory(prev => [...prev, "Engine not ready."]);
            return;
        }

        if (cadEngine.getEngineType() !== 'native') {
            setCommandHistory(prev => [...prev, "DXF export requires native engine."]);
            return;
        }

        try {
            const dxfContent = cadEngine.exportDXF();

            if (!dxfContent || dxfContent.length === 0) {
                setCommandHistory(prev => [...prev, "No entities to export."]);
                return;
            }

            if (window.electronAPI?.saveDXF) {
                const result = await window.electronAPI.saveDXF({
                    content: dxfContent,
                    suggestedName: 'drawing.dxf'
                });

                if (result.canceled) {
                    setCommandHistory(prev => [...prev, "Save cancelled."]);
                } else if (result.success) {
                    setCommandHistory(prev => [...prev, `DXF saved: ${result.filePath}`]);
                } else {
                    setCommandHistory(prev => [...prev, `Save failed: ${result.error}`]);
                }
            } else {
                // Fallback: Download in browser
                const blob = new Blob([dxfContent], { type: 'application/dxf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'drawing.dxf';
                a.click();
                URL.revokeObjectURL(url);
                setCommandHistory(prev => [...prev, "DXF downloaded."]);
            }
        } catch (error) {
            setCommandHistory(prev => [...prev, `Export error: ${(error as Error).message}`]);
        }
    }, [isEngineReady, setCommandHistory]);

    // Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S: Save DXF
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveDXF();
                return;
            }

            if (e.key === 'Delete') {
                const activeElement = document.activeElement;
                if (activeElement === commandLineRef.current?.getInputElement() && (activeElement as HTMLInputElement).value.length > 0) {
                    return;
                }
                handleDeleteCommand();
            } else if (e.key === 'Escape') {
                cancel();
            } else if (e.key === ' ' && commandState.type === 'ERASE') {
                e.preventDefault();
                cadEngine.deleteSelected();
                forceUpdate();
                setCommandHistory(prev => [...prev, "Erased selection."]);
                cancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDeleteCommand, handleSaveDXF, cancel, commandState.type, isEngineReady, forceUpdate, setCommandHistory]);


    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden cursor-crosshair"
            style={{ backgroundColor: '#1e1e1e' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { isPanning.current = false; }}
            onContextMenu={(e) => e.preventDefault()}
            onAuxClick={(e) => {
                // Only prevent middle-click paste on canvas, not on console
                const isConsoleClick = (e.target as HTMLElement).closest('.command-line-container');
                if (!isConsoleClick) {
                    e.preventDefault();
                }
            }}
        >
            <div className="absolute inset-0">
                {!isEngineReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Initializing C++ Engine...
                    </div>
                )}
                {isEngineReady && dimensions.width > 0 && (
                    <WasmCanvas
                        width={dimensions.width}
                        height={dimensions.height}
                        scale={scale}
                        offset={offset}
                        version={engineVersion}
                        previewLine={previewState.line}
                        previewCircle={previewState.circle}
                        previewPolyline={previewState.polyline}
                        previewRectangle={previewState.rectangle}
                        previewArc={previewState.arc}
                        movePreview={previewState.move}
                        copyPreview={previewState.copy}
                        rotatePreview={previewState.rotate}
                        selectionBox={previewState.selectionBox}
                        activeSnap={activeSnap}
                        gridStyle="lines"
                    />
                )}
            </div>

            {isMaximized && (
                <CommandLine
                    ref={commandLineRef}
                    onCommand={handleCommand}
                    history={commandHistory}
                    prompt={currentPrompt}
                    activeCommand={commandState.type !== 'IDLE'}
                    allowEmptyInput={commandState.type === 'OFFSET' && commandState.step === 'DISTANCE'}
                    onDelete={handleDeleteCommand}
                />
            )}
        </div>
    );
};
