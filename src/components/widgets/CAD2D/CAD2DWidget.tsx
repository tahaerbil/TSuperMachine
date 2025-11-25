import React, { useEffect, useRef, useState } from 'react';
import { cadEngine } from './CADEngine';
import { WasmCanvas } from './WasmCanvas';
import { CommandLine, type CommandLineRef } from './CommandLine';

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

    // Command State Definition
    type CommandState =
        | { type: 'IDLE' }
        | { type: 'LINE', step: 'START' }
        | { type: 'LINE', step: 'END', p1: { x: number, y: number } }
        | { type: 'CIRCLE', step: 'CENTER' }
        | { type: 'CIRCLE', step: 'RADIUS', center: { x: number, y: number } };

    const [commandState, setCommandState] = useState<CommandState>({ type: 'IDLE' });
    const [previewLine, setPreviewLine] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [previewCircle, setPreviewCircle] = useState<{ cx: number, cy: number, r: number } | null>(null);

    const commandLineRef = useRef<CommandLineRef>(null);

    // Interaction State
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Initialize Engine
    useEffect(() => {
        const init = async () => {
            try {
                await cadEngine.init();
                setIsEngineReady(true);

                // Add some test data
                cadEngine.clear();
                // Draw a simple box and circle
                cadEngine.addLine(100, 100, 500, 100);
                cadEngine.addLine(500, 100, 500, 400);
                cadEngine.addLine(500, 400, 100, 400);
                cadEngine.addLine(100, 400, 100, 100);
                cadEngine.addCircle(300, 250, 100);

                setEngineVersion(v => v + 1);

            } catch (e) {
                console.error("Failed to init CAD Engine:", e);
            }
        };
        init();
    }, []);

    // Handle Resize with ResizeObserver
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

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Pan/Zoom Handlers
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent parent canvas zoom

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate world point under mouse before zoom
        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;

        const zoomSensitivity = 0.1;
        const delta = -Math.sign(e.deltaY) * zoomSensitivity;
        const newScale = Math.max(0.1, Math.min(50, scale * (1 + delta)));

        // Calculate new offset to keep world point under mouse
        // mouseX = newOffset.x + worldX * newScale
        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
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
        if (!containerRef.current) return;

        // Pan Logic (Middle Mouse or Alt+Left)
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
            return;
        }

        // Left Click -> Command Logic
        if (e.button === 0) {
            const rect = containerRef.current.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldX = (screenX - offset.x) / scale;
            const worldY = (screenY - offset.y) / scale;

            if (commandState.type === 'LINE') {
                if (commandState.step === 'START') {
                    // Start Line
                    setCommandState({ type: 'LINE', step: 'END', p1: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify next point");
                    // Start preview immediately from this point to current mouse (will be updated in move)
                    setPreviewLine({ x1: worldX, y1: worldY, x2: worldX, y2: worldY });
                } else if (commandState.step === 'END') {
                    // End Line
                    cadEngine.addLine(commandState.p1.x, commandState.p1.y, worldX, worldY);
                    setEngineVersion(v => v + 1);

                    // Continue Line (Polyline behavior)
                    setCommandState({ type: 'LINE', step: 'END', p1: { x: worldX, y: worldY } });
                    setPreviewLine({ x1: worldX, y1: worldY, x2: worldX, y2: worldY });
                    setCurrentPrompt("Specify next point");
                }
            } else if (commandState.type === 'CIRCLE') {
                if (commandState.step === 'CENTER') {
                    setCommandState({ type: 'CIRCLE', step: 'RADIUS', center: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify radius of circle");
                    // Start preview with 0 radius
                    setPreviewCircle({ cx: worldX, cy: worldY, r: 0 });
                } else if (commandState.step === 'RADIUS') {
                    const dx = worldX - commandState.center.x;
                    const dy = worldY - commandState.center.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    cadEngine.addCircle(commandState.center.x, commandState.center.y, radius);
                    setEngineVersion(v => v + 1);

                    // Reset to IDLE after drawing circle
                    setCommandState({ type: 'IDLE' });
                    setPreviewCircle(null);
                    setCurrentPrompt("Command");
                    setCommandHistory(prev => [...prev, "Circle created."]);
                }
            } else {
                // IDLE: Just add a test point for now
                // cadEngine.addCircle(worldX, worldY, 5 / scale);
                // setEngineVersion(v => v + 1);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Pan Logic
        if (isPanning.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldX = (screenX - offset.x) / scale;
        const worldY = (screenY - offset.y) / scale;

        // Preview Logic
        if (commandState.type === 'LINE' && commandState.step === 'END') {
            setPreviewLine({
                x1: commandState.p1.x,
                y1: commandState.p1.y,
                x2: worldX,
                y2: worldY
            });
        } else if (commandState.type === 'CIRCLE' && commandState.step === 'RADIUS') {
            const dx = worldX - commandState.center.x;
            const dy = worldY - commandState.center.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            setPreviewCircle({
                cx: commandState.center.x,
                cy: commandState.center.y,
                r: radius
            });
        }
    };

    const handleMouseUp = () => {
        isPanning.current = false;
    };

    // Command Line State
    const [commandHistory, setCommandHistory] = useState<string[]>([
        "Welcome to TSuperMachine CAD",
        "Type 'LINE' or 'CIRCLE' to start drawing.",
        "Type 'HELP' for commands."
    ]);
    const [currentPrompt, setCurrentPrompt] = useState("Command");

    const handleCommand = (cmd: string) => {
        const command = cmd.trim().toUpperCase();
        setCommandHistory(prev => [...prev, `Command: ${cmd}`]);

        if (command === 'LINE') {
            setCommandState({ type: 'LINE', step: 'START' });
            setCurrentPrompt("Specify first point");
            setCommandHistory(prev => [...prev, "LINE"]);
            setPreviewCircle(null);
        } else if (command === 'CIRCLE') {
            setCommandState({ type: 'CIRCLE', step: 'CENTER' });
            setCurrentPrompt("Specify center point for circle");
            setCommandHistory(prev => [...prev, "CIRCLE"]);
            setPreviewLine(null);
        } else if (command === 'CANCEL') {
            setCommandState({ type: 'IDLE' });
            setPreviewLine(null);
            setPreviewCircle(null);
            setCurrentPrompt("Command");
            setCommandHistory(prev => [...prev, "*Cancel*"]);
        } else {
            setCommandHistory(prev => [...prev, "Unknown command."]);
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden cursor-crosshair flex flex-col"
            style={{ backgroundColor: '#1e1e1e' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Canvas Container (Flex Grow) */}
            <div className="flex-1 relative overflow-hidden w-full">
                {!isEngineReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        Initializing C++ Engine...
                    </div>
                )}

                {isEngineReady && dimensions.width > 0 && (
                    <WasmCanvas
                        width={dimensions.width}
                        // If maximized, subtract CLI height (128px). If not, use full height.
                        height={isMaximized ? dimensions.height - 128 : dimensions.height}
                        scale={scale}
                        offset={offset}
                        version={engineVersion}
                        previewLine={previewLine}
                        previewCircle={previewCircle}
                    />
                )}
            </div>

            {/* Command Line Interface - Only visible when maximized */}
            {isMaximized && (
                <CommandLine
                    ref={commandLineRef}
                    onCommand={handleCommand}
                    history={commandHistory}
                    prompt={currentPrompt}
                />
            )}
        </div>
    );
};
