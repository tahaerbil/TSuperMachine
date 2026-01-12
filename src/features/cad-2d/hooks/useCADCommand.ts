/**
 * useCADCommand Hook (Refactored)
 * 
 * Main orchestrator hook that composes modular CAD hooks:
 * - useCADPreview: Preview state and snap point management
 * - useCADDrawing: Line, Circle, Polyline, Rectangle, Arc, Polygon
 * - useCADEditing: Move, Copy, Rotate, Offset, Erase  
 * - useCADSelection: Click, Window, and Crossing selection
 * 
 * This hook follows the Facade pattern, providing a unified API
 * while delegating to specialized hooks internally.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { cadEngine, SnapType, type SnapPoint } from '../../../core/services/cad-engine/CADEngine';
import { CommandParser } from '../CommandParser';
import type { CommandState } from '../types';
import { INITIAL_COMMAND_HISTORY, type UseCADCommandProps } from './types';
import { useCADPreview } from './useCADPreview';
import { useCADDrawing } from './useCADDrawing';
import { useCADEditing } from './useCADEditing';
import { useCADSelection } from './useCADSelection';

export const useCADCommand = ({ onEngineUpdate, scale, onCommandCompleted }: UseCADCommandProps) => {
    // =========================================================================
    // Core State
    // =========================================================================
    const [commandState, setCommandState] = useState<CommandState>({ type: 'IDLE' });
    const commandStateRef = useRef<CommandState>({ type: 'IDLE' });
    const [commandHistory, setCommandHistory] = useState<string[]>(INITIAL_COMMAND_HISTORY);
    const [currentPrompt, setCurrentPrompt] = useState("Command:");

    // =========================================================================
    // Composed Hooks
    // =========================================================================
    const {
        previewState,
        activeSnap,
        setPreviewState,
        setActiveSnap,
        clearPreviews
    } = useCADPreview();

    const { processDrawingInput, processDrawingValue, processSubCommand } = useCADDrawing({
        onEngineUpdate,
        onCommandCompleted,
        setCommandState,
        setPreviewState,
        setCurrentPrompt,
        setCommandHistory,
        clearPreviews
    });

    const { processEditingInput, processEditingValue, getLastOffsetDistance } = useCADEditing({
        onEngineUpdate,
        onCommandCompleted,
        setCommandState,
        setPreviewState,
        setCurrentPrompt,
        setCommandHistory,
        clearPreviews,
        scale
    });

    const { processSelectionInput, handleSelectionBoxMove } = useCADSelection({
        onEngineUpdate,
        setPreviewState,
        scale
    });

    // =========================================================================
    // Sync State Ref
    // =========================================================================
    useEffect(() => {
        commandStateRef.current = commandState;
    }, [commandState]);

    // =========================================================================
    // Cancel Handler
    // =========================================================================
    const cancel = useCallback(() => {
        setCommandState({ type: 'IDLE' });
        setCurrentPrompt("Command:");
        clearPreviews();
        cadEngine.deselectAll();
        onEngineUpdate();
        setCommandHistory(prev => [...prev, "*Cancel*"]);
    }, [onEngineUpdate, clearPreviews]);

    // =========================================================================
    // Point Input Orchestrator
    // =========================================================================
    const processPointInput = useCallback((x: number, y: number) => {
        const state = commandStateRef.current;

        // Try drawing commands first
        if (processDrawingInput(x, y, state)) return;

        // Try editing commands
        if (processEditingInput(x, y, state)) return;

        // Try selection (IDLE state)
        if (processSelectionInput(x, y, state, previewState)) return;

    }, [processDrawingInput, processEditingInput, processSelectionInput, previewState]);

    // =========================================================================
    // Value Input Orchestrator
    // =========================================================================
    const processValueInput = useCallback((val: string) => {
        const state = commandStateRef.current;

        // Try drawing value handlers
        if (processDrawingValue(val, state)) return;

        // Try editing value handlers
        if (processEditingValue(val, state)) return;

    }, [processDrawingValue, processEditingValue]);

    // =========================================================================
    // Command Parser Handler
    // =========================================================================
    const handleCommand = useCallback((input: string) => {
        // Handle "Unknown command" messages from CommandLine
        if (input.startsWith('UNKNOWN:')) {
            const parts = input.split(':');
            const unknownCmd = parts[1];
            const suggestion = parts[2];
            setCommandHistory(prev => [...prev,
            `> ${unknownCmd}`,
            `Unknown command "${unknownCmd}". Did you mean "${suggestion}"?`
            ]);
            return;
        }

        const action = CommandParser.parse(input);
        setCommandHistory(prev => [...prev, `> ${input}`]);

        if (action.type === 'START_COMMAND') {
            if (commandStateRef.current.type === 'RECTANGLE' && action.command === 'CIRCLE') {
                if (processSubCommand('CHAMFER', commandStateRef.current)) {
                    return;
                }
            }

            // Intercept 'A' (Arc) when in RECTANGLE command -> treat as Area
            if (commandStateRef.current.type === 'RECTANGLE' && action.command === 'ARC') {
                if (processSubCommand('AREA', commandStateRef.current)) {
                    return;
                }
            }

            clearPreviews();

            switch (action.command) {
                case 'LINE':
                    setCommandState({ type: 'LINE', step: 'START' });
                    setCurrentPrompt("Specify first point");
                    break;
                case 'CIRCLE':
                    setCommandState({ type: 'CIRCLE', step: 'CENTER' });
                    setCurrentPrompt("Specify center point or [2P] [3P]");
                    break;
                case 'POLYLINE':
                    setCommandState({ type: 'POLYLINE', points: [] });
                    setCurrentPrompt("Specify first point");
                    break;
                case 'RECTANGLE':
                    setCommandState({ type: 'RECTANGLE', step: 'START' });
                    setCurrentPrompt("Specify first corner or [Chamfer] [Fillet]");
                    break;
                case 'ARC':
                    setCommandState({ type: 'ARC', step: 'CENTER' });
                    setCurrentPrompt("Specify center point");
                    break;
                case 'POLYGON':
                    setCommandState({ type: 'POLYGON', step: 'SIDES', sides: 4 });
                    setCurrentPrompt("Enter number of sides <4>");
                    break;
                case 'MOVE':
                    setCommandState({ type: 'MOVE', step: 'BASE' });
                    setCurrentPrompt("Specify base point");
                    break;
                case 'COPY':
                    setCommandState({ type: 'COPY', step: 'BASE' });
                    setCurrentPrompt("Specify base point");
                    break;
                case 'ROTATE':
                    setCommandState({ type: 'ROTATE', step: 'BASE' });
                    setCurrentPrompt("Specify base point");
                    break;
                case 'OFFSET': {
                    setCommandState({ type: 'OFFSET', step: 'DISTANCE' });
                    const lastDist = getLastOffsetDistance();
                    setCurrentPrompt(`Specify offset distance${lastDist ? ` <${lastDist}>` : ''}`);
                    break;
                }
                case 'ERASE':
                    setCommandState({ type: 'ERASE' });
                    setCurrentPrompt("Select objects to erase, then press Enter");
                    break;
                case 'TRIM':
                    setCommandState({ type: 'TRIM' });
                    setCurrentPrompt("Select object to trim (click on segment to remove):");
                    break;
                case 'EXTEND':
                    setCommandState({ type: 'EXTEND' });
                    setCurrentPrompt("Select object to extend (click on end to extend):");
                    break;
                case 'SCALE':
                    setCommandState({ type: 'SCALE', step: 'BASE' });
                    setCurrentPrompt("Specify base point:");
                    break;
                case 'MIRROR':
                    setCommandState({ type: 'MIRROR', step: 'P1' });
                    setCurrentPrompt("Specify first point of mirror line:");
                    break;
            }
        } else if (action.type === 'ENTER_POINT' && action.point) {
            // Handle relative coordinates
            if (action.point.isRelative && commandStateRef.current.type !== 'IDLE') {
                // Get base point from current command state
                const state = commandStateRef.current;
                let baseX = 0, baseY = 0;

                if (state.type === 'LINE' && state.step === 'END') {
                    baseX = state.p1.x;
                    baseY = state.p1.y;
                } else if (state.type === 'POLYLINE' && state.points.length > 0) {
                    const lastPt = state.points[state.points.length - 1];
                    baseX = lastPt.x;
                    baseY = lastPt.y;
                }

                processPointInput(baseX + action.point.x, baseY + action.point.y);
            } else {
                processPointInput(action.point.x, action.point.y);
            }
        } else if (action.type === 'ENTER_VALUE' && action.value !== undefined) {
            processValueInput(action.value.toString());
        } else if (action.type === 'SUBCOMMAND' && action.subCommand) {
            // Handle subcommands like Close (C/CL) and Undo (U)
            processSubCommand(action.subCommand, commandStateRef.current);
        } else if (action.type === 'CANCEL') {
            cancel();
        } else {
            // Handle unknown command
            if (commandStateRef.current.type !== 'IDLE') {
                // Active command - treat as value input
                processValueInput(input);
            } else if (input.trim()) {
                // IDLE - unknown command message
                setCommandHistory(prev => [...prev, `Unknown command: "${input}"`]);
            }
        }
    }, [cancel, clearPreviews, processPointInput, processValueInput, processSubCommand, getLastOffsetDistance]);

    // =========================================================================
    // Mouse Move Handler (with inline preview updates)
    // =========================================================================
    const handleCanvasMove = useCallback((worldX: number, worldY: number) => {
        const state = commandStateRef.current;

        // Snapping
        let snap: SnapPoint | null = null;
        if (state.type !== 'IDLE') {
            try {
                snap = cadEngine.findClosestSnapPoint(worldX, worldY, 15 / scale);
            } catch {
                // ignore
            }
        }
        setActiveSnap(snap && snap.type !== SnapType.NONE ? snap : null);

        // Effective Point (Snap or Mouse)
        const effX = snap && snap.type !== SnapType.NONE ? snap.p.x : worldX;
        const effY = snap && snap.type !== SnapType.NONE ? snap.p.y : worldY;

        // =====================================================================
        // Preview State Updates (inline for proper hook ordering)
        // =====================================================================

        // LINE Preview
        if (state.type === 'LINE' && state.step === 'END') {
            setPreviewState(prev => ({
                ...prev,
                line: { x1: state.p1.x, y1: state.p1.y, x2: effX, y2: effY }
            }));
        }
        // CIRCLE Preview (RADIUS mode)
        else if (state.type === 'CIRCLE' && state.step === 'RADIUS') {
            const r = Math.hypot(effX - state.center.x, effY - state.center.y);
            setPreviewState(prev => ({
                ...prev,
                circle: { cx: state.center.x, cy: state.center.y, r }
            }));
        }
        // CIRCLE Preview (DIAMETER mode) - center stays fixed, diameter = distance from center to mouse
        else if (state.type === 'CIRCLE' && state.step === 'DIAMETER') {
            const diameter = Math.hypot(effX - state.center.x, effY - state.center.y);
            const r = diameter / 2;
            // Center MUST stay at original position
            const fixedCx = state.center.x;
            const fixedCy = state.center.y;

            console.log('DIAMETER Preview:', { r, cx: fixedCx, cy: fixedCy }); // Debug log

            setPreviewState(prev => ({
                ...prev,
                circle: { cx: fixedCx, cy: fixedCy, r },
                // Visual guide: Line from center to mouse (represents diameter radius, but mouse is at diameter distance)
                // Actually, let's draw line from center to mouse so user sees the "diameter length" connecting to center
                line: { x1: fixedCx, y1: fixedCy, x2: effX, y2: effY }
            }));
        }
        // CIRCLE Preview (2P mode) - diameter defined by two points
        else if (state.type === 'CIRCLE' && state.step === '2P_SECOND') {
            const cx = (state.p1.x + effX) / 2;
            const cy = (state.p1.y + effY) / 2;
            const r = Math.hypot(effX - state.p1.x, effY - state.p1.y) / 2;
            setPreviewState(prev => ({
                ...prev,
                circle: { cx, cy, r }
            }));
        }
        // CIRCLE Preview (3P mode - second point) - show partial arc hint
        else if (state.type === 'CIRCLE' && state.step === '3P_SECOND') {
            // Just show a line from p1 to mouse as hint
            setPreviewState(prev => ({
                ...prev,
                line: { x1: state.p1.x, y1: state.p1.y, x2: effX, y2: effY }
            }));
        }
        // CIRCLE Preview (3P mode - third point) - calculate and show circle
        else if (state.type === 'CIRCLE' && state.step === '3P_THIRD') {
            const ax = state.p1.x, ay = state.p1.y;
            const bx = state.p2.x, by = state.p2.y;
            const cx = effX, cy = effY;

            const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

            if (Math.abs(d) > 0.0001) {
                const ax2ay2 = ax * ax + ay * ay;
                const bx2by2 = bx * bx + by * by;
                const cx2cy2 = cx * cx + cy * cy;

                const centerX = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
                const centerY = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
                const radius = Math.sqrt((ax - centerX) ** 2 + (ay - centerY) ** 2);

                setPreviewState(prev => ({
                    ...prev,
                    circle: { cx: centerX, cy: centerY, r: radius }
                }));
            }
        }
        // POLYLINE Preview
        else if (state.type === 'POLYLINE' && state.points.length > 0) {
            setPreviewState(prev => ({
                ...prev,
                polyline: [...state.points, { x: effX, y: effY }]
            }));
        }
        // RECTANGLE Preview
        else if (state.type === 'RECTANGLE' && state.step === 'END') {
            setPreviewState(prev => ({
                ...prev,
                rectangle: { x1: state.p1.x, y1: state.p1.y, x2: effX, y2: effY }
            }));
        }
        else if (state.type === 'RECTANGLE' && state.step === 'DIMENSIONS_CORNER') {
            const dx = effX - state.p1.x;
            const dy = effY - state.p1.y;
            const signX = dx >= 0 ? 1 : -1;
            const signY = dy >= 0 ? 1 : -1;
            const x2 = state.p1.x + signX * state.length;
            const y2 = state.p1.y + signY * state.width;
            setPreviewState(prev => ({
                ...prev,
                rectangle: { x1: state.p1.x, y1: state.p1.y, x2, y2 }
            }));
        }
        // ARC Preview
        else if (state.type === 'ARC') {
            if (state.step === 'START') {
                const r = Math.hypot(effX - state.center.x, effY - state.center.y);
                setPreviewState(prev => ({
                    ...prev,
                    arc: { cx: state.center.x, cy: state.center.y, r, start: 0, end: 2 * Math.PI }
                }));
            } else if (state.step === 'END') {
                const endAngle = Math.atan2(effY - state.center.y, effX - state.center.x);
                setPreviewState(prev => ({
                    ...prev,
                    arc: { cx: state.center.x, cy: state.center.y, r: state.radius, start: state.startAngle, end: endAngle }
                }));
            }
        }
        // POLYGON Preview
        else if (state.type === 'POLYGON' && state.step === 'RADIUS') {
            const r = Math.hypot(effX - state.center.x, effY - state.center.y);
            const points: { x: number; y: number }[] = [];
            const stepAngle = (2 * Math.PI) / state.sides;
            for (let i = 0; i < state.sides; i++) {
                points.push({
                    x: state.center.x + r * Math.cos(i * stepAngle),
                    y: state.center.y + r * Math.sin(i * stepAngle)
                });
            }
            points.push(points[0]);
            setPreviewState(prev => ({ ...prev, polyline: points }));
        }
        // MOVE Preview
        else if (state.type === 'MOVE' && state.step === 'DESTINATION') {
            setPreviewState(prev => ({
                ...prev,
                move: { dx: effX - state.basePoint.x, dy: effY - state.basePoint.y }
            }));
        }
        // COPY Preview
        else if (state.type === 'COPY' && state.step === 'DESTINATION') {
            setPreviewState(prev => ({
                ...prev,
                copy: { dx: effX - state.basePoint.x, dy: effY - state.basePoint.y }
            }));
        }
        // ROTATE Preview
        else if (state.type === 'ROTATE' && state.step === 'ANGLE') {
            const angle = Math.atan2(effY - state.basePoint.y, effX - state.basePoint.x);
            setPreviewState(prev => ({
                ...prev,
                rotate: { cx: state.basePoint.x, cy: state.basePoint.y, angle }
            }));
        }
        // MIRROR Preview (axis line)
        else if (state.type === 'MIRROR' && state.step === 'P2') {
            setPreviewState(prev => ({
                ...prev,
                mirrorAxis: { x1: state.p1.x, y1: state.p1.y, x2: effX, y2: effY }
            }));
        }
        // SELECTION BOX Preview
        else if (state.type === 'IDLE') {
            handleSelectionBoxMove(worldX, worldY, previewState);
        }

    }, [scale, setActiveSnap, setPreviewState, handleSelectionBoxMove, previewState]);

    // =========================================================================
    // Public API
    // =========================================================================
    return {
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
    };
};

// Re-export types for external consumers
export type { UseCADCommandProps } from './types';
