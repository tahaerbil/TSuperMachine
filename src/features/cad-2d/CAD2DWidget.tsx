import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cadEngine, SnapType } from '../../core/services/cad-engine/CADEngine';
import { WasmCanvas } from './components/WasmCanvas';
import { CommandLine, type CommandLineRef } from './components/CommandLine';
import { useCADCommand } from './hooks/useCADCommand';

interface CAD2DWidgetProps {
    id?: string;
    isMaximized?: boolean;
}

export const CAD2DWidget: React.FC<CAD2DWidgetProps> = ({ isMaximized }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [engineVersion, setEngineVersion] = useState(0);
    const [isEngineReady, setIsEngineReady] = useState(false);

    // Command Logic Hook
    const forceUpdate = useCallback(() => setEngineVersion(v => v + 1), []);
    const commandLineRef = useRef<CommandLineRef>(null);

    const handleCommandCompleted = useCallback((cmd: string) => {
        commandLineRef.current?.setLastCommand(cmd);
    }, []);

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
                const worldX = (e.clientX - rect.left - offset.x) / scale;
                const worldY = (e.clientY - rect.top - offset.y) / scale;
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
            const worldX = (e.clientX - rect.left - offset.x) / scale;
            const worldY = (e.clientY - rect.top - offset.y) / scale;
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

    // Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
    }, [handleDeleteCommand, cancel, commandState.type, isEngineReady, forceUpdate, setCommandHistory]);


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
