import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cadEngine, SnapType, type SnapPoint } from './CADEngine';
import { WasmCanvas } from './WasmCanvas';
import { CommandLine, type CommandLineRef } from './CommandLine';
import { CommandParser } from './CommandParser';

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
    // CAD 2D widget has its own grid - always 'lines' style, independent of main canvas

    // Command State Definition
    type CommandState =
        | { type: 'IDLE' }
        | { type: 'LINE', step: 'START' }
        | { type: 'LINE', step: 'END', p1: { x: number, y: number } }
        | { type: 'CIRCLE', step: 'CENTER' }
        | { type: 'CIRCLE', step: 'RADIUS', center: { x: number, y: number } }
        | { type: 'POLYLINE', points: { x: number, y: number }[] }
        | { type: 'RECTANGLE', step: 'START' }
        | { type: 'RECTANGLE', step: 'START' }
        | { type: 'RECTANGLE', step: 'END', p1: { x: number, y: number } }
        | { type: 'ARC', step: 'CENTER' }
        | { type: 'ARC', step: 'START', center: { x: number, y: number } }
        | { type: 'ARC', step: 'END', center: { x: number, y: number }, radius: number, startAngle: number }
        | { type: 'POLYGON', step: 'SIDES', sides: number }
        | { type: 'POLYGON', step: 'CENTER', sides: number }
        | { type: 'POLYGON', step: 'RADIUS', sides: number, center: { x: number, y: number } }
        | { type: 'MOVE', step: 'BASE' }
        | { type: 'MOVE', step: 'DESTINATION', basePoint: { x: number, y: number } }
        | { type: 'COPY', step: 'BASE' }
        | { type: 'COPY', step: 'DESTINATION', basePoint: { x: number, y: number } }
        | { type: 'ROTATE', step: 'BASE' }
        | { type: 'ROTATE', step: 'ANGLE', basePoint: { x: number, y: number } }
        | { type: 'OFFSET', step: 'DISTANCE' }
        | { type: 'OFFSET', step: 'SELECT', distance: number }
        | { type: 'OFFSET', step: 'SIDE', distance: number, entityId: number }
        | { type: 'ERASE' }; // Selection mode for erasing entities

    const [commandState, setCommandState] = useState<CommandState>({ type: 'IDLE' });
    const commandStateRef = useRef<CommandState>({ type: 'IDLE' });

    useEffect(() => {
        commandStateRef.current = commandState;
    }, [commandState]);
    const [previewLine, setPreviewLine] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [previewCircle, setPreviewCircle] = useState<{ cx: number, cy: number, r: number } | null>(null);
    const [previewPolyline, setPreviewPolyline] = useState<{ x: number, y: number }[] | null>(null);
    const [previewRectangle, setPreviewRectangle] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [previewArc, setPreviewArc] = useState<{ cx: number, cy: number, r: number, start: number, end: number } | null>(null);
    const [movePreview, setMovePreview] = useState<{ dx: number, dy: number } | null>(null);
    const [copyPreview, setCopyPreview] = useState<{ dx: number, dy: number } | null>(null);
    const [rotatePreview, setRotatePreview] = useState<{ cx: number, cy: number, angle: number } | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: { x: number, y: number }, end: { x: number, y: number }, type: 'window' | 'crossing' } | null>(null);
    const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);
    const [commandHistory, setCommandHistory] = useState<string[]>([
        "Welcome to TSuperMachine CAD",
        "Type 'LINE' or 'CIRCLE' to start drawing.",
        "Type 'HELP' for commands."
    ]);
    const [currentPrompt, setCurrentPrompt] = useState("Command:");

    const commandLineRef = useRef<CommandLineRef>(null);

    // Interaction State
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastOffsetDistance = useRef<number | null>(null);

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
        // Check if the wheel event is happening over the terminal
        const target = e.target as HTMLElement;
        const isOverTerminal = target.closest('.command-line-container');

        if (isOverTerminal) {
            // Let the terminal handle its own scrolling
            return;
        }

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

    useEffect(() => {
        handleWheelRef.current = handleWheel;
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            handleWheelRef.current(e);
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

    const handleMouseUp = () => {
        // Handle panning
        isPanning.current = false;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        // Pan Logic (Middle Mouse or Alt+Left)
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
            return;
        }

        // Left Click -> Command Logic or Selection
        if (e.button === 0) {
            const rect = containerRef.current.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            let worldX = (screenX - offset.x) / scale;
            let worldY = (screenY - offset.y) / scale;

            // Use Snap Point if active (but not during OFFSET side selection)
            if (activeSnap && activeSnap.type !== SnapType.NONE && !(commandState.type === 'OFFSET' && commandState.step === 'SIDE')) {
                worldX = activeSnap.p.x;
                worldY = activeSnap.p.y;
            }

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
            } else if (commandState.type === 'POLYLINE') {
                // Add point to polyline
                const newPoints = [...commandState.points, { x: worldX, y: worldY }];
                setCommandState({ type: 'POLYLINE', points: newPoints });
                setCurrentPrompt(`Specify next point (${newPoints.length} points, press Enter to finish):`);
                setPreviewPolyline(newPoints);
            } else if (commandState.type === 'RECTANGLE') {
                console.log('RECTANGLE Click Debug:', commandState);
                if (commandState.step === 'START') {
                    console.log('Setting step to END');
                    setCommandState({ type: 'RECTANGLE', step: 'END', p1: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify opposite corner:");
                    setPreviewRectangle({ x1: worldX, y1: worldY, x2: worldX, y2: worldY });
                } else if (commandState.step === 'END') {
                    console.log('Finishing RECTANGLE');
                    cadEngine.addRectangle(commandState.p1.x, commandState.p1.y, worldX, worldY);
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setPreviewRectangle(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Rectangle created."]);
                }
            } else if (commandState.type === 'ARC') {
                if (commandState.step === 'CENTER') {
                    setCommandState({ type: 'ARC', step: 'START', center: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify start point of arc:");
                    // Preview 0-radius circle
                    setPreviewArc({ cx: worldX, cy: worldY, r: 0, start: 0, end: 2 * Math.PI });
                } else if (commandState.step === 'START') {
                    const dx = worldX - commandState.center.x;
                    const dy = worldY - commandState.center.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    const startAngle = Math.atan2(dy, dx);

                    setCommandState({
                        type: 'ARC',
                        step: 'END',
                        center: commandState.center,
                        radius,
                        startAngle
                    });
                    setCurrentPrompt("Specify end point of arc:");
                    // Preview arc from start to current mouse (full circle initially)
                    setPreviewArc({
                        cx: commandState.center.x,
                        cy: commandState.center.y,
                        r: radius,
                        start: startAngle,
                        end: startAngle // Will update in move
                    });
                } else if (commandState.step === 'END') {
                    const dx = worldX - commandState.center.x;
                    const dy = worldY - commandState.center.y;
                    const endAngle = Math.atan2(dy, dx);

                    cadEngine.addArc(commandState.center.x, commandState.center.y, commandState.radius, commandState.startAngle, endAngle);
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setPreviewArc(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Arc created."]);
                }
            } else if (commandState.type === 'POLYGON') {
                if (commandState.step === 'CENTER') {
                    setCommandState({ type: 'POLYGON', step: 'RADIUS', sides: commandState.sides, center: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify radius of polygon:");
                } else if (commandState.step === 'RADIUS') {
                    const dx = worldX - commandState.center.x;
                    const dy = worldY - commandState.center.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);

                    cadEngine.addRegularPolygon(commandState.center.x, commandState.center.y, commandState.sides, radius);
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setPreviewPolyline(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Polygon created."]);
                }
            } else if (commandState.type === 'MOVE') {
                if (commandState.step === 'BASE') {
                    setCommandState({ type: 'MOVE', step: 'DESTINATION', basePoint: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify destination point:");
                } else if (commandState.step === 'DESTINATION') {
                    const dx = worldX - commandState.basePoint.x;
                    const dy = worldY - commandState.basePoint.y;

                    cadEngine.moveSelected(dx, dy);
                    cadEngine.deselectAll();
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setMovePreview(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Entities moved."]);
                }
            } else if (commandState.type === 'COPY') {
                if (commandState.step === 'BASE') {
                    setCommandState({ type: 'COPY', step: 'DESTINATION', basePoint: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify destination point:");
                } else if (commandState.step === 'DESTINATION') {
                    const dx = worldX - commandState.basePoint.x;
                    const dy = worldY - commandState.basePoint.y;

                    cadEngine.copySelected(dx, dy);
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setCopyPreview(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Entities copied."]);
                }
            } else if (commandState.type === 'ROTATE') {
                if (commandState.step === 'BASE') {
                    setCommandState({ type: 'ROTATE', step: 'ANGLE', basePoint: { x: worldX, y: worldY } });
                    setCurrentPrompt("Specify rotation angle (or pick point):");
                } else if (commandState.step === 'ANGLE') {
                    // Calculate angle from base point to current point
                    const dx = worldX - commandState.basePoint.x;
                    const dy = worldY - commandState.basePoint.y;
                    const angle = Math.atan2(dy, dx);

                    cadEngine.rotateSelected(commandState.basePoint.x, commandState.basePoint.y, angle);
                    setEngineVersion(v => v + 1);
                    setCommandState({ type: 'IDLE' });
                    setRotatePreview(null);
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, "Entities rotated."]);
                }
            } else if (commandState.type === 'OFFSET') {
                if (commandState.step === 'SELECT') {
                    // First click: Select entity
                    const selectionTolerance = 10 / scale;
                    const hitId = cadEngine.hitTest(worldX, worldY, selectionTolerance);
                    if (hitId !== -1) {
                        // Highlight the selected entity
                        cadEngine.deselectAll();
                        cadEngine.selectEntity(hitId);
                        setEngineVersion(v => v + 1);

                        setCommandState({ type: 'OFFSET', step: 'SIDE', distance: commandState.distance, entityId: hitId });
                        setCurrentPrompt("Click on side to offset:");
                    } else {
                        setCommandHistory(prev => [...prev, "No entity found. Try again."]);
                    }
                } else if (commandState.step === 'SIDE') {
                    // Second click: Determine side and apply offset
                    const newId = cadEngine.offsetEntity(commandState.entityId, commandState.distance, worldX, worldY);
                    if (newId > 0) {
                        cadEngine.deselectAll(); // Clear selection after offset
                        setEngineVersion(v => v + 1);
                        // Loop back to SELECT step to allow multiple offsets
                        setCommandState({ type: 'OFFSET', step: 'SELECT', distance: commandState.distance });
                        setCurrentPrompt("Select entity to offset (click on desired side):");
                        setCommandHistory(prev => [...prev, "Offset created."]);
                    } else {
                        setCommandHistory(prev => [...prev, "Offset failed. Invalid distance or entity type."]);
                        cadEngine.deselectAll(); // Clear selection on failure too
                        // Loop back to SELECT step even on failure
                        setCommandState({ type: 'OFFSET', step: 'SELECT', distance: commandState.distance });
                        setCurrentPrompt("Select entity to offset (click on desired side):");
                    }
                }
            } else if (commandState.type === 'ERASE') {
                // ERASE State - Select entities to delete
                const selectionTolerance = 10 / scale;
                const hitId = cadEngine.hitTest(worldX, worldY, selectionTolerance);

                if (hitId !== -1) {
                    cadEngine.selectEntity(hitId);
                    setEngineVersion(v => v + 1); // Trigger re-render
                }
            } else if (commandState.type === 'IDLE') {
                // Click-based selection box
                if (selectionBox) {
                    // Second click - complete selection
                    if (selectionBox.type === 'window') {
                        cadEngine.selectByWindow(
                            selectionBox.start.x, selectionBox.start.y,
                            worldX, worldY
                        );
                    } else {
                        cadEngine.selectByCrossing(
                            selectionBox.start.x, selectionBox.start.y,
                            worldX, worldY
                        );
                    }
                    setEngineVersion(v => v + 1);
                    setSelectionBox(null);
                } else {
                    // First click - start selection box OR single entity selection
                    const selectionTolerance = 10 / scale;
                    const hitId = cadEngine.hitTest(worldX, worldY, selectionTolerance);

                    if (hitId !== -1) {
                        // Clicked on an entity - select it
                        cadEngine.selectEntity(hitId);
                        setEngineVersion(v => v + 1);
                    } else {
                        // Clicked on empty space - start selection box
                        setSelectionBox({ start: { x: worldX, y: worldY }, end: { x: worldX, y: worldY }, type: 'window' });
                    }
                }
            }
        }

        // Ensure focus returns to CLI after interaction
        if (isMaximized) {
            setTimeout(() => commandLineRef.current?.focus(), 10);
        }
    };

    // Centralized Delete Logic
    const handleDeleteCommand = useCallback(() => {
        if (!isEngineReady) return;

        // Check if any entities are selected
        // Check if any entities are selected
        const buffer = cadEngine.getRenderBuffer();
        let hasSelection = false;

        let i = 0;
        while (i < buffer.length) {
            const type = buffer[i];
            let stride = 7; // Default for LINE, CIRCLE, RECTANGLE

            if (type === 3) { // POLYLINE
                const numPoints = buffer[i + 1];
                // Stride: type(1) + numPoints(1) + closed(1) + points(numPoints*2) + color(1) + selected(1)
                stride = 3 + numPoints * 2 + 2;

                // Check selected flag (last element)
                if (buffer[i + stride - 1] > 0.5) {
                    hasSelection = true;
                    break;
                }
            } else if (type === 2) { // ARC
                // Stride: type(1) + center(2) + radius(1) + start(1) + end(1) + color(1) + selected(1) = 8
                stride = 8;
                if (buffer[i + 7] > 0.5) {
                    hasSelection = true;
                    break;
                }
            } else if (type === 5) { // RECTANGLE
                // Stride: type(1) + p1(2) + p2(2) + color(1) + selected(1) = 7
                stride = 7;
                if (buffer[i + 6] > 0.5) {
                    hasSelection = true;
                    break;
                }
            } else {
                // LINE, CIRCLE (Stride 7)
                if (buffer[i + 6] > 0.5) {
                    hasSelection = true;
                    break;
                }
            }

            i += stride;
        }

        if (hasSelection) {
            // Delete selected entities immediately
            cadEngine.deleteSelected();
            setEngineVersion(v => v + 1);
            setCommandState({ type: 'IDLE' }); // Ensure we return to IDLE
            setCommandHistory(prev => [...prev, "Selected entities deleted."]);
        } else {
            // No selection: Start ERASE command
            setCommandState({ type: 'ERASE' });
            setCurrentPrompt("Select objects to erase:");
            setCommandHistory(prev => [...prev, "ERASE command started. Select objects and press Space to delete."]);
            // Update last command so Space key can repeat ERASE
            commandLineRef.current?.setLastCommand('ERASE');
        }
    }, [isEngineReady]);

    // Handle Keyboard Events (Delete & Escape)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete') {
                // Check if we are typing in the CLI
                const activeElement = document.activeElement;
                const isTyping = activeElement === commandLineRef.current?.getInputElement();
                const inputElement = commandLineRef.current?.getInputElement();
                const hasInput = inputElement && inputElement.value.length > 0;

                // If typing in CLI with content, let default behavior happen
                if (isTyping && hasInput) {
                    return;
                }

                // Otherwise, trigger delete command
                handleDeleteCommand();
            } else if (e.key === 'Escape') {

                // Allow deletion if:
                // 1. Not in an input/textarea, OR
                // 2. In CLI input but it's empty

                // Note: The logic above handles the CLI case. 
                // The window listener is a fallback for when focus is NOT in the CLI.

                // Cancel current command or Deselect All
                if (commandState.type !== 'IDLE') {
                    setCommandState({ type: 'IDLE' });
                    setCurrentPrompt("Command:");
                    setPreviewLine(null);
                    setPreviewCircle(null);
                } else {
                    // If no command is active, clear selection
                    if (isEngineReady) {
                        cadEngine.deselectAll();
                        setEngineVersion(v => v + 1);
                    }
                }
            } else if (e.key === ' ') {
                // Space key during ERASE command completes the deletion
                if (commandState.type === 'ERASE') {
                    console.log('Space key in ERASE mode - deleting selected entities');
                    e.preventDefault();
                    e.stopPropagation(); // Prevent CommandLine from repeating command
                    if (isEngineReady) {
                        cadEngine.deleteSelected();
                        setEngineVersion(v => v + 1);
                        setCommandState({ type: 'IDLE' });
                        setCurrentPrompt("Command:");
                        setCommandHistory(prev => [...prev, "Selected entities erased."]);
                        // Update last command for Space key repeat
                        commandLineRef.current?.setLastCommand('ERASE');
                    }
                } else if (commandState.type === 'POLYLINE' && commandState.points.length >= 2) {
                    // Space key also finishes POLYLINE command (AutoCAD style)
                    e.preventDefault();
                    e.stopPropagation(); // Prevent CommandLine from repeating command
                    if (isEngineReady) {
                        cadEngine.addPolyline(commandState.points, false); // false = open polyline
                        setEngineVersion(v => v + 1);
                        setCommandState({ type: 'IDLE' });
                        setPreviewPolyline(null);
                        setCurrentPrompt("Command:");
                        setCommandHistory(prev => [...prev, `Polyline created with ${commandState.points.length} points.`]);
                        // Update last command for Space key repeat
                        commandLineRef.current?.setLastCommand('POLYLINE');
                    }
                }
            } else if (e.key === 'Enter') {
                // Enter key finishes POLYLINE command
                if (commandState.type === 'POLYLINE' && commandState.points.length >= 2) {
                    e.preventDefault();
                    if (isEngineReady) {
                        cadEngine.addPolyline(commandState.points, false); // false = open polyline
                        setEngineVersion(v => v + 1);
                        setCommandState({ type: 'IDLE' });
                        setPreviewPolyline(null);
                        setCurrentPrompt("Command:");
                        setCommandHistory(prev => [...prev, `Polyline created with ${commandState.points.length} points.`]);
                        // Update last command for Space key repeat
                        commandLineRef.current?.setLastCommand('POLYLINE');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEngineReady, commandState, handleDeleteCommand]);

    // Handle Command Line Input
    const handleCommand = (input: string) => {
        const action = CommandParser.parse(input);
        const commandState = commandStateRef.current; // Use ref to avoid stale closures

        setCommandHistory(prev => [...prev, `> ${input}`]);

        switch (action.type) {
            case 'START_COMMAND':
                // Cancel selection box when starting a new command
                setSelectionBox(null);

                if (action.command === 'LINE') {
                    setCommandState({ type: 'LINE', step: 'START' });
                    setCurrentPrompt("Specify first point:");
                    setCommandHistory(prev => [...prev, "LINE command started."]);
                } else if (action.command === 'CIRCLE') {
                    setCommandState({ type: 'CIRCLE', step: 'CENTER' });
                    setCurrentPrompt("Specify center point for circle:");
                    setCommandHistory(prev => [...prev, "CIRCLE command started."]);
                } else if (action.command === 'POLYLINE') {
                    setCommandState({ type: 'POLYLINE', points: [] });
                    setCurrentPrompt("Specify first point (or press Enter to finish):");
                    setCommandHistory(prev => [...prev, "POLYLINE command started."]);
                } else if (action.command === 'RECTANGLE') {
                    setCommandState({ type: 'RECTANGLE', step: 'START' });
                    setCurrentPrompt("Specify first corner point:");
                    setCommandHistory(prev => [...prev, "RECTANGLE command started."]);
                } else if (action.command === 'ARC') {
                    setCommandState({ type: 'ARC', step: 'CENTER' });
                    setCurrentPrompt("Specify center point of arc:");
                    setCommandHistory(prev => [...prev, "ARC command started."]);
                } else if (action.command === 'POLYGON') {
                    setCommandState({ type: 'POLYGON', step: 'SIDES', sides: 4 });
                    setCurrentPrompt("Enter number of sides <4>:");
                    setCommandHistory(prev => [...prev, "POLYGON command started."]);
                } else if (action.command === 'MOVE') {
                    // Check if any entities are selected
                    const buffer = cadEngine.getRenderBuffer();
                    let hasSelection = false;
                    let i = 0;
                    while (i < buffer.length) {
                        const type = buffer[i];
                        let stride = 7;
                        if (type === 3) { // POLYLINE
                            const numPoints = buffer[i + 1];
                            stride = 3 + numPoints * 2 + 2;
                            if (buffer[i + 3 + numPoints * 2 + 1] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 2) { // ARC
                            stride = 8;
                            if (buffer[i + 7] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 5) { // RECTANGLE
                            stride = 7;
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else {
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        }
                        i += stride;
                    }

                    if (hasSelection) {
                        setCommandState({ type: 'MOVE', step: 'BASE' });
                        setCurrentPrompt("Specify base point:");
                        setCommandHistory(prev => [...prev, "MOVE command started. Specify base point."]);
                    } else {
                        setCommandHistory(prev => [...prev, "No entities selected. Select entities first."]);
                    }
                } else if (action.command === 'COPY') {
                    // Check if any entities are selected
                    const buffer = cadEngine.getRenderBuffer();
                    let hasSelection = false;
                    let i = 0;
                    while (i < buffer.length) {
                        const type = buffer[i];
                        let stride = 7;
                        if (type === 3) { // POLYLINE
                            const numPoints = buffer[i + 1];
                            stride = 3 + numPoints * 2 + 2;
                            if (buffer[i + 3 + numPoints * 2 + 1] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 2) { // ARC
                            stride = 8;
                            if (buffer[i + 7] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 5) { // RECTANGLE
                            stride = 7;
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else {
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        }
                        i += stride;
                    }

                    if (hasSelection) {
                        setCommandState({ type: 'COPY', step: 'BASE' });
                        setCurrentPrompt("Specify base point:");
                        setCommandHistory(prev => [...prev, "COPY command started. Specify base point."]);
                    } else {
                        setCommandHistory(prev => [...prev, "No entities selected. Select entities first."]);
                    }
                } else if (action.command === 'ROTATE') {
                    // Check if any entities are selected (same logic as MOVE/COPY)
                    const buffer = cadEngine.getRenderBuffer();
                    let hasSelection = false;
                    let i = 0;
                    while (i < buffer.length) {
                        const type = buffer[i];
                        let stride = 7;
                        if (type === 3) { // POLYLINE
                            const numPoints = buffer[i + 1];
                            stride = 3 + numPoints * 2 + 2;
                            if (buffer[i + 3 + numPoints * 2 + 1] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 2) { // ARC
                            stride = 8;
                            if (buffer[i + 7] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else if (type === 5) { // RECTANGLE
                            stride = 7;
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        } else {
                            if (buffer[i + 6] > 0.5) {
                                hasSelection = true;
                                break;
                            }
                        }
                        i += stride;
                    }

                    if (hasSelection) {
                        setCommandState({ type: 'ROTATE', step: 'BASE' });
                        setCurrentPrompt("Specify base point (rotation center):");
                        setCommandHistory(prev => [...prev, "ROTATE command started. Specify base point."]);
                    } else {
                        setCommandHistory(prev => [...prev, "No entities selected. Select entities first."]);
                    }
                } else if (action.command === 'OFFSET') {
                    setCommandState({ type: 'OFFSET', step: 'DISTANCE' });
                    const defaultDist = lastOffsetDistance.current !== null ? ` <${lastOffsetDistance.current}>` : "";
                    setCurrentPrompt(`Specify offset distance${defaultDist}:`);
                    setCommandHistory(prev => [...prev, "OFFSET command started."]);
                } else if (action.command === 'ERASE') {
                    // Start ERASE command (selection mode)
                    setCommandState({ type: 'ERASE' });
                    setCurrentPrompt("Select entities to erase (Press Space to finish):");
                    setCommandHistory(prev => [...prev, "ERASE command started."]);
                }
                break;

            case 'ENTER_POINT':
                if (action.point) {
                    const p = action.point;

                    // Handle Relative Coordinates
                    if (p.isRelative && lastMousePos.current) {
                        // Note: Ideally we should track the 'last entered point' for relative coords
                        // For now, let's use the last known mouse position or 0,0 if not available
                        // A better approach is to store 'lastPoint' in state
                    }

                    // Inject point into current command logic
                    // We can reuse a logic similar to handleMouseDown but with explicit coords
                    processPointInput(p.x, p.y);
                }
                break;

            case 'ENTER_VALUE':
                if (action.value !== undefined) {
                    processValueInput(action.value.toString());
                }
                break;

            case 'CANCEL':
                // Cancel everything
                setCommandState({ type: 'IDLE' });
                setCurrentPrompt("Command:");
                setPreviewLine(null);
                setPreviewCircle(null);
                setPreviewRectangle(null);
                setPreviewPolyline(null);
                setPreviewArc(null);
                setMovePreview(null);
                setCopyPreview(null);
                setRotatePreview(null);
                setSelectionBox(null); // Cancel selection box
                if (isEngineReady) cadEngine.deselectAll();
                setCommandHistory(prev => [...prev, "*Cancel*"]);
                break;

            case 'UNKNOWN':
                // Try to parse as value if a command is active expecting a value
                if (commandState.type !== 'IDLE') {
                    processValueInput(input);
                } else if (input.trim() === "") {
                    // Ignore empty input in IDLE mode
                } else {
                    setCommandHistory(prev => [...prev, `Unknown command: ${input}`]);
                }
                break;
        }
    };

    // Helper to process point input (shared between Mouse and CLI)
    const processPointInput = (x: number, y: number) => {
        if (!isEngineReady) return;

        if (commandState.type === 'LINE') {
            if (commandState.step === 'START') {
                setCommandState({ type: 'LINE', step: 'END', p1: { x, y } });
                setCurrentPrompt("Specify next point:");
                setPreviewLine({ x1: x, y1: y, x2: x, y2: y });
            } else if (commandState.step === 'END') {
                cadEngine.addLine(commandState.p1.x, commandState.p1.y, x, y);
                setEngineVersion(v => v + 1);
                setCommandState({ type: 'LINE', step: 'END', p1: { x, y } });
                setPreviewLine({ x1: x, y1: y, x2: x, y2: y });
                setCurrentPrompt("Specify next point:");
            }
        } else if (commandState.type === 'CIRCLE') {
            if (commandState.step === 'CENTER') {
                setCommandState({ type: 'CIRCLE', step: 'RADIUS', center: { x, y } });
                setCurrentPrompt("Specify radius of circle:");
                setPreviewCircle({ cx: x, cy: y, r: 0 });
            }
        } else if (commandState.type === 'POLYLINE') {
            const newPoints = [...commandState.points, { x, y }];
            setCommandState({ type: 'POLYLINE', points: newPoints });
            setCurrentPrompt(`Specify next point (${newPoints.length} points, press Enter to finish):`);
            setPreviewPolyline(newPoints);
        } else if (commandState.type === 'RECTANGLE') {
            if (commandState.step === 'START') {
                setCommandState({ type: 'RECTANGLE', step: 'END', p1: { x, y } });
                setCurrentPrompt("Specify opposite corner:");
                setPreviewRectangle({ x1: x, y1: y, x2: x, y2: y });
            } else if (commandState.step === 'END') {
                cadEngine.addRectangle(commandState.p1.x, commandState.p1.y, x, y);
                setEngineVersion(v => v + 1);
                setCommandState({ type: 'IDLE' });
                setPreviewRectangle(null);
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Rectangle created."]);
            }
        } else if (commandState.type === 'POLYGON') {
            if (commandState.step === 'CENTER') {
                setCommandState({ type: 'POLYGON', step: 'RADIUS', sides: commandState.sides, center: { x, y } });
                setCurrentPrompt("Specify radius of polygon:");
            }
        }
    };

    // Helper to process value input (Radius, Length, Sides)
    const processValueInput = (val: string) => { // Changed val type to string to match CLI input
        if (!isEngineReady) return;
        const commandState = commandStateRef.current; // Use ref to avoid stale closures

        if (commandState.type === 'CIRCLE' && commandState.step === 'RADIUS') {
            const r = parseFloat(val);
            if (!isNaN(r) && r > 0) {
                cadEngine.addCircle(commandState.center.x, commandState.center.y, r);
                setEngineVersion(v => v + 1);
                setCommandState({ type: 'IDLE' });
                setPreviewCircle(null);
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created with radius ${r}`]);
                setTimeout(() => commandLineRef.current?.setLastCommand('CIRCLE'), 0);
            } else {
                setCommandHistory(prev => [...prev, "Invalid radius."]);
            }
        } else if (commandState.type === 'POLYGON' && commandState.step === 'SIDES') {
            const sides = parseInt(val);
            if (!isNaN(sides) && sides >= 3) {
                setCommandState({ type: 'POLYGON', step: 'CENTER', sides });
                setCurrentPrompt("Specify center of polygon:");
            } else {
                // If empty input, use default 4? Or keep waiting?
                // Let's assume user might just press Enter for default 4 if we implemented that logic,
                // but here we just check valid input.
                if (val === '') {
                    setCommandState({ type: 'POLYGON', step: 'CENTER', sides: 4 });
                    setCurrentPrompt("Specify center of polygon:");
                    setTimeout(() => commandLineRef.current?.setLastCommand('POLYGON'), 0);
                } else {
                    setCommandHistory(prev => [...prev, "Invalid number of sides. Must be >= 3."]);
                }
            }
        } else if (commandState.type === 'POLYGON' && commandState.step === 'RADIUS') {
            const r = parseFloat(val);
            if (!isNaN(r) && r > 0) {
                cadEngine.addRegularPolygon(commandState.center.x, commandState.center.y, commandState.sides, r);
                setEngineVersion(v => v + 1);
                setCommandState({ type: 'IDLE' });
                setPreviewPolyline(null);
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Polygon created."]);
                setTimeout(() => commandLineRef.current?.setLastCommand('POLYGON'), 0);
            } else {
                setCommandHistory(prev => [...prev, "Invalid radius."]);
            }
        } else if (commandState.type === 'ROTATE' && commandState.step === 'ANGLE') {
            // User entered angle as a number (in degrees)
            const angleDegrees = parseFloat(val);
            if (!isNaN(angleDegrees)) {
                // Convert degrees to radians
                const angleRadians = angleDegrees * (Math.PI / 180);

                cadEngine.rotateSelected(commandState.basePoint.x, commandState.basePoint.y, angleRadians);
                setEngineVersion(v => v + 1);
                setCommandState({ type: 'IDLE' });
                setRotatePreview(null);
                setRotatePreview(null);
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Entities rotated ${angleDegrees}°.`]);
                setTimeout(() => commandLineRef.current?.setLastCommand('ROTATE'), 0);
            } else {
                setCommandHistory(prev => [...prev, "Invalid angle."]);
            }
        } else if (commandState.type === 'OFFSET' && commandState.step === 'DISTANCE') {
            // User entered offset distance
            let distance = parseFloat(val);

            // If input is empty and we have a last distance, use it
            if (val.trim() === '' && lastOffsetDistance.current !== null) {
                distance = lastOffsetDistance.current;
            }

            if (!isNaN(distance) && distance > 0) {
                lastOffsetDistance.current = distance; // Update last distance
                setCommandState({ type: 'OFFSET', step: 'SELECT', distance });
                setCurrentPrompt("Select entity to offset (click on desired side):");
                setTimeout(() => commandLineRef.current?.setLastCommand('OFFSET'), 0);
            } else {
                setCommandHistory(prev => [...prev, "Invalid distance. Must be > 0."]);
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
        let worldX = (screenX - offset.x) / scale;
        let worldY = (screenY - offset.y) / scale;

        // Calculate Snapping (only when a command is active)
        // Threshold in pixels (e.g., 15px) converted to world units
        const snapThreshold = 15 / scale;
        let snap: SnapPoint | null = null;

        if (isEngineReady && commandState.type !== 'IDLE') {
            try {
                snap = cadEngine.findClosestSnapPoint(worldX, worldY, snapThreshold);
            } catch {
                // Ignore if engine not ready or error
            }
        }

        if (snap && snap.type !== SnapType.NONE && commandState.type !== 'IDLE') {
            setActiveSnap(snap);
            worldX = snap.p.x;
            worldY = snap.p.y;
        } else {
            setActiveSnap(null);
        }

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
        } else if (commandState.type === 'POLYLINE' && commandState.points.length > 0) {
            // Show preview from last point to cursor
            // Only update if the cursor moved significantly (optimization)
            const newPreview = [...commandState.points, { x: worldX, y: worldY }];

            // Check if preview needs update (avoid unnecessary re-renders)
            const shouldUpdate = !previewPolyline ||
                previewPolyline.length !== newPreview.length ||
                Math.abs(previewPolyline[previewPolyline.length - 1].x - worldX) > 0.1 ||
                Math.abs(previewPolyline[previewPolyline.length - 1].y - worldY) > 0.1;

            if (shouldUpdate) {
                setPreviewPolyline(newPreview);
            }
        } else if (commandState.type === 'RECTANGLE' && commandState.step === 'END') {
            setPreviewRectangle({
                x1: commandState.p1.x,
                y1: commandState.p1.y,
                x2: worldX,
                y2: worldY
            });
        } else if (commandState.type === 'ARC') {
            if (commandState.step === 'START') {
                const dx = worldX - commandState.center.x;
                const dy = worldY - commandState.center.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                // Show full circle as preview for radius
                setPreviewArc({ cx: commandState.center.x, cy: commandState.center.y, r: radius, start: 0, end: 2 * Math.PI });
            } else if (commandState.step === 'END') {
                const dx = worldX - commandState.center.x;
                const dy = worldY - commandState.center.y;
                const endAngle = Math.atan2(dy, dx);
                setPreviewArc({
                    cx: commandState.center.x,
                    cy: commandState.center.y,
                    r: commandState.radius,
                    start: commandState.startAngle,
                    end: endAngle
                });
            }
        } else if (commandState.type === 'POLYGON') {
            if (commandState.step === 'RADIUS') {
                const dx = worldX - commandState.center.x;
                const dy = worldY - commandState.center.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                const sides = commandState.sides;

                // Calculate polygon points for preview
                const points: { x: number, y: number }[] = [];
                const angleStep = 2 * Math.PI / sides;
                for (let i = 0; i < sides; i++) {
                    const angle = i * angleStep;
                    points.push({
                        x: commandState.center.x + radius * Math.cos(angle),
                        y: commandState.center.y + radius * Math.sin(angle)
                    });
                }
                // Close the loop for preview
                points.push(points[0]);

                setPreviewPolyline(points);
            }
        } else if (commandState.type === 'MOVE') {
            if (commandState.step === 'DESTINATION') {
                const dx = worldX - commandState.basePoint.x;
                const dy = worldY - commandState.basePoint.y;
                setMovePreview({ dx, dy });
            }
        } else if (commandState.type === 'COPY') {
            if (commandState.step === 'DESTINATION') {
                const dx = worldX - commandState.basePoint.x;
                const dy = worldY - commandState.basePoint.y;
                setCopyPreview({ dx, dy }); // Use COPY preview
            }
        } else if (commandState.type === 'ROTATE') {
            if (commandState.step === 'ANGLE') {
                const dx = worldX - commandState.basePoint.x;
                const dy = worldY - commandState.basePoint.y;
                const angle = Math.atan2(dy, dx);
                setRotatePreview({ cx: commandState.basePoint.x, cy: commandState.basePoint.y, angle });
            }
        }

        // Update selection box during drag
        if (selectionBox && commandState.type === 'IDLE') {
            const dragDx = worldX - selectionBox.start.x;
            const type: 'window' | 'crossing' = dragDx >= 0 ? 'window' : 'crossing';
            setSelectionBox({ ...selectionBox, end: { x: worldX, y: worldY }, type });
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
                        previewPolyline={previewPolyline}
                        previewRectangle={previewRectangle}
                        previewArc={previewArc}
                        movePreview={movePreview}
                        copyPreview={copyPreview}
                        rotatePreview={rotatePreview}
                        selectionBox={selectionBox}
                        activeSnap={activeSnap}
                        gridStyle="lines"
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
                    activeCommand={commandState.type !== 'IDLE' && !(commandState.type === 'OFFSET' && commandState.step === 'DISTANCE')}
                    allowEmptyInput={commandState.type === 'OFFSET' && commandState.step === 'DISTANCE'}
                    onDelete={handleDeleteCommand}
                />
            )}
        </div>
    );
};
