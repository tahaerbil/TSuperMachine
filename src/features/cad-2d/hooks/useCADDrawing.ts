/**
 * useCADDrawing Hook
 * 
 * Handles drawing operations: LINE, CIRCLE, POLYLINE, RECTANGLE, ARC, POLYGON.
 * Pure drawing logic separated from editing and selection concerns.
 */

import { useCallback } from 'react';
import { cadEngine } from '../../../core/services/cad-engine/CADEngine';
import type { CommandState, PreviewState } from '../types';

interface UseCADDrawingProps {
    onEngineUpdate: () => void;
    onCommandCompleted?: (command: string) => void;
    setCommandState: React.Dispatch<React.SetStateAction<CommandState>>;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>;
    setCurrentPrompt: React.Dispatch<React.SetStateAction<string>>;
    setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
    clearPreviews: () => void;
}

import { calculateChamferedRectangle, calculateFilletedRectangle, calculateCircumcircle, calculateRectangleFromArea } from '../utils/GeometryHelpers';

export const useCADDrawing = ({
    onEngineUpdate,
    onCommandCompleted,
    setCommandState,
    setPreviewState,
    setCurrentPrompt,
    setCommandHistory,
    clearPreviews
}: UseCADDrawingProps) => {

    /**
     * Process point input for drawing commands
     * @returns true if the input was handled, false otherwise
     */
    // Helper to draw rectangle with options (Fillet/Chamfer)
    const drawRectangle = useCallback((p1: { x: number, y: number }, p2: { x: number, y: number }, options?: { fillet?: number, chamfer?: number }) => {
        if (options?.chamfer && options.chamfer > 0) {
            const points = calculateChamferedRectangle(p1, p2, options.chamfer);
            cadEngine.addPolyline(points, true);
        } else if (options?.fillet && options.fillet > 0) {
            const f = calculateFilletedRectangle(p1, p2, options.fillet);

            // Draw 4 lines and 4 arcs based on helper output
            cadEngine.addLine(f.topLine.x1, f.topLine.y1, f.topLine.x2, f.topLine.y2);
            cadEngine.addArc(f.topRightArc.cx, f.topRightArc.cy, f.topRightArc.r, f.topRightArc.start, f.topRightArc.end);

            cadEngine.addLine(f.rightLine.x1, f.rightLine.y1, f.rightLine.x2, f.rightLine.y2);
            cadEngine.addArc(f.bottomRightArc.cx, f.bottomRightArc.cy, f.bottomRightArc.r, f.bottomRightArc.start, f.bottomRightArc.end);

            cadEngine.addLine(f.bottomLine.x1, f.bottomLine.y1, f.bottomLine.x2, f.bottomLine.y2); // Fixed order if needed
            cadEngine.addArc(f.bottomLeftArc.cx, f.bottomLeftArc.cy, f.bottomLeftArc.r, f.bottomLeftArc.start, f.bottomLeftArc.end);

            cadEngine.addLine(f.leftLine.x1, f.leftLine.y1, f.leftLine.x2, f.leftLine.y2);
            cadEngine.addArc(f.topLeftArc.cx, f.topLeftArc.cy, f.topLeftArc.r, f.topLeftArc.start, f.topLeftArc.end);
        } else {
            cadEngine.addRectangle(p1.x, p1.y, p2.x, p2.y); // Use raw coords, engine handles order
        }
    }, []);

    const processDrawingInput = useCallback((x: number, y: number, state: CommandState): boolean => {

        // LINE Command
        if (state.type === 'LINE') {
            if (state.step === 'START') {
                // First point of the line sequence
                setCommandState({
                    type: 'LINE',
                    step: 'END',
                    p1: { x, y },
                    firstPoint: { x, y },  // Remember first point for Close
                    allPoints: [{ x, y }]  // Start tracking all points for Undo
                });
                setCurrentPrompt("Specify next point or [Close] [Undo]");
                setPreviewState(prev => ({ ...prev, line: { x1: x, y1: y, x2: x, y2: y } }));
                return true;
            } else if (state.step === 'END') {
                // Add line segment
                cadEngine.addLine(state.p1.x, state.p1.y, x, y);
                onEngineUpdate();
                // Update state with new current point, keep firstPoint, add to allPoints
                const newAllPoints = [...state.allPoints, { x, y }];
                setCommandState({
                    type: 'LINE',
                    step: 'END',
                    p1: { x, y },
                    firstPoint: state.firstPoint,
                    allPoints: newAllPoints
                });
                setPreviewState(prev => ({ ...prev, line: { x1: x, y1: y, x2: x, y2: y } }));
                setCurrentPrompt("Specify next point or [Close] [Undo]");
                return true;
            }
        }

        // CIRCLE Command - Multiple modes
        if (state.type === 'CIRCLE') {
            // Mode: Center + Radius (default)
            if (state.step === 'CENTER') {
                setCommandState({ type: 'CIRCLE', step: 'RADIUS', center: { x, y } });
                setCurrentPrompt("Specify radius or [Diameter]");
                setPreviewState(prev => ({ ...prev, circle: { cx: x, cy: y, r: 0 } }));
                return true;
            }

            // Mode: Center + Radius - Second point
            if (state.step === 'RADIUS') {
                const dx = x - state.center.x;
                const dy = y - state.center.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                cadEngine.addCircle(state.center.x, state.center.y, radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created (radius: ${radius.toFixed(2)})`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            }

            // Mode: Center + Diameter - Click defines diameter (center stays fixed)
            if (state.step === 'DIAMETER') {
                const dx = x - state.center.x;
                const dy = y - state.center.y;
                const diameter = Math.sqrt(dx * dx + dy * dy);
                const radius = diameter / 2;
                // Center stays at original position
                cadEngine.addCircle(state.center.x, state.center.y, radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created (diameter: ${diameter.toFixed(2)})`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            }

            // Mode: 2P - First point
            if (state.step === '2P_FIRST') {
                setCommandState({ type: 'CIRCLE', step: '2P_SECOND', p1: { x, y } });
                setCurrentPrompt("Specify second end point of circle's diameter:");
                return true;
            }

            // Mode: 2P - Second point (circle diameter defined by two points)
            if (state.step === '2P_SECOND') {
                const cx = (state.p1.x + x) / 2;
                const cy = (state.p1.y + y) / 2;
                const dx = x - state.p1.x;
                const dy = y - state.p1.y;
                const radius = Math.sqrt(dx * dx + dy * dy) / 2;
                cadEngine.addCircle(cx, cy, radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created (2P, diameter: ${(radius * 2).toFixed(2)})`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            }

            // Mode: 3P - First point
            if (state.step === '3P_FIRST') {
                setCommandState({ type: 'CIRCLE', step: '3P_SECOND', p1: { x, y } });
                setCurrentPrompt("Specify second point on circle:");
                return true;
            }

            // Mode: 3P - Second point
            if (state.step === '3P_SECOND') {
                setCommandState({ type: 'CIRCLE', step: '3P_THIRD', p1: state.p1, p2: { x, y } });
                setCurrentPrompt("Specify third point on circle:");
                return true;
            }

            // Mode: 3P - Third point (calculate circumcircle)
            if (state.step === '3P_THIRD') {
                const result = calculateCircumcircle(state.p1, state.p2, { x, y });

                if (!result) {
                    // Points are collinear, can't form a circle
                    setCommandHistory(prev => [...prev, "Error: Points are collinear, cannot form a circle."]);
                    setCommandState({ type: 'IDLE' });
                    clearPreviews();
                    setCurrentPrompt("Command:");
                    return true;
                }

                cadEngine.addCircle(result.center.x, result.center.y, result.radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created (3P, radius: ${result.radius.toFixed(2)})`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            }
        }

        // POLYLINE Command
        if (state.type === 'POLYLINE') {
            const newPoints = [...state.points, { x, y }];
            setCommandState({ type: 'POLYLINE', points: newPoints });
            setCurrentPrompt(`Specify next point or [Close] [Undo] (${newPoints.length} pts)`);
            setPreviewState(prev => ({ ...prev, polyline: newPoints }));
            return true;
        }

        // RECTANGLE Command
        if (state.type === 'RECTANGLE') {
            if (state.step === 'START') {
                setCommandState({ type: 'RECTANGLE', step: 'END', p1: { x, y }, options: state.options });
                setCurrentPrompt("Specify opposite corner or [Dimensions]");
                setPreviewState(prev => ({ ...prev, rectangle: { x1: x, y1: y, x2: x, y2: y } }));
                return true;
            } else if (state.step === 'END') {
                drawRectangle(state.p1, { x, y }, state.options);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Rectangle created."]);
                onCommandCompleted?.('RECTANGLE');
                return true;
            } else if (state.step === 'DIMENSIONS_CORNER') {
                const dx = x - state.p1.x;
                const dy = y - state.p1.y;
                const signX = dx >= 0 ? 1 : -1;
                const signY = dy >= 0 ? 1 : -1;
                const x2 = state.p1.x + signX * state.length;
                const y2 = state.p1.y + signY * state.width;

                drawRectangle(state.p1, { x: x2, y: y2 }, state.options);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Rectangle created (${state.length}x${state.width})`]);
                onCommandCompleted?.('RECTANGLE');
                return true;
            }
        }

        // ARC Command
        if (state.type === 'ARC') {
            if (state.step === 'CENTER') {
                setCommandState({ type: 'ARC', step: 'START', center: { x, y } });
                setCurrentPrompt("Specify start point of arc:");
                setPreviewState(prev => ({ ...prev, arc: { cx: x, cy: y, r: 0, start: 0, end: 2 * Math.PI } }));
                return true;
            } else if (state.step === 'START') {
                const dx = x - state.center.x;
                const dy = y - state.center.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                const startAngle = Math.atan2(dy, dx);
                setCommandState({ type: 'ARC', step: 'END', center: state.center, radius, startAngle });
                setCurrentPrompt("Specify end point of arc:");
                setPreviewState(prev => ({ ...prev, arc: { cx: state.center.x, cy: state.center.y, r: radius, start: startAngle, end: startAngle } }));
                return true;
            } else if (state.step === 'END') {
                const dx = x - state.center.x;
                const dy = y - state.center.y;
                const endAngle = Math.atan2(dy, dx);
                cadEngine.addArc(state.center.x, state.center.y, state.radius, state.startAngle, endAngle);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Arc created."]);
                onCommandCompleted?.('ARC');
                return true;
            }
        }

        // POLYGON Command
        if (state.type === 'POLYGON') {
            if (state.step === 'CENTER') {
                setCommandState({ type: 'POLYGON', step: 'RADIUS', sides: state.sides, center: { x, y } });
                setCurrentPrompt("Specify radius of polygon:");
                return true;
            } else if (state.step === 'RADIUS') {
                const dx = x - state.center.x;
                const dy = y - state.center.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                cadEngine.addRegularPolygon(state.center.x, state.center.y, state.sides, radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Polygon created."]);
                onCommandCompleted?.('POLYGON');
                return true;
            }
        }

        return false;
    }, [onEngineUpdate, onCommandCompleted, setCommandState, setPreviewState, setCurrentPrompt, setCommandHistory, clearPreviews, drawRectangle]);

    /**
     * Process value input for drawing commands
     * @returns true if the input was handled, false otherwise
     */
    const processDrawingValue = useCallback((val: string, state: CommandState): boolean => {

        // LINE - Empty input finishes the command
        if (state.type === 'LINE' && state.step === 'END') {
            if (val === '') {
                // User pressed Space/Enter with no input - finish LINE command
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                onCommandCompleted?.('LINE');
                return true;
            }
        }

        // POLYLINE - Empty input finishes the polyline
        if (state.type === 'POLYLINE') {
            if (val === '') {
                // User pressed Space/Enter with no input - finish POLYLINE
                if (state.points.length >= 2) {
                    cadEngine.addPolyline(state.points, false);
                    onEngineUpdate();
                    setCommandHistory(prev => [...prev, `Polyline created with ${state.points.length} points`]);
                    onCommandCompleted?.('POLYLINE');
                } else if (state.points.length === 1) {
                    setCommandHistory(prev => [...prev, "At least 2 points required for polyline."]);
                }
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                return true;
            }
        }

        // CIRCLE Radius
        if (state.type === 'CIRCLE' && state.step === 'RADIUS') {
            const r = parseFloat(val);
            if (!isNaN(r) && r > 0) {
                cadEngine.addCircle(state.center.x, state.center.y, r);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created with radius ${r}`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid radius."]);
                return true;
            }
        }

        // CIRCLE Diameter (value input)
        if (state.type === 'CIRCLE' && state.step === 'DIAMETER') {
            console.log('DIAMETER Value Input:', val); // Debug log
            const d = parseFloat(val);
            if (!isNaN(d) && d > 0) {
                const radius = d / 2;
                console.log('Creating Circle (Diameter Mode):', { cx: state.center.x, cy: state.center.y, r: radius });
                cadEngine.addCircle(state.center.x, state.center.y, radius);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Circle created with diameter ${d}`]);
                onCommandCompleted?.('CIRCLE');
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid diameter."]);
                return true;
            }
        }

        // RECTANGLE Dimensions (Length)
        if (state.type === 'RECTANGLE' && state.step === 'DIMENSIONS_LENGTH') {
            const length = parseFloat(val);
            if (!isNaN(length) && length > 0) {
                setCommandState({ type: 'RECTANGLE', step: 'DIMENSIONS_WIDTH', p1: state.p1, length });
                setCurrentPrompt("Specify width for rectangle:");
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid length."]);
                return true;
            }
        }

        // RECTANGLE Dimensions (Width)
        if (state.type === 'RECTANGLE' && state.step === 'DIMENSIONS_WIDTH') {
            const width = parseFloat(val);
            if (!isNaN(width) && width > 0) {
                setCommandState({ type: 'RECTANGLE', step: 'DIMENSIONS_CORNER', p1: state.p1, length: state.length, width });
                setCurrentPrompt("Specify other corner point (click to determine orientation):");
                return true;
            }
        }

        // RECTANGLE Area Steps
        if (state.type === 'RECTANGLE') {
            if (state.step === 'AREA_INPUT') {
                const area = parseFloat(val);
                if (!isNaN(area) && area > 0) {
                    setCommandState({
                        type: 'RECTANGLE',
                        step: 'AREA_DIMENSION_SELECT',
                        p1: state.p1,
                        area,
                        options: state.options
                    });
                    setCurrentPrompt("Calculate rectangle dimensions based on [Length/Width] <Length>:");
                    return true;
                } else {
                    setCommandHistory(prev => [...prev, "Invalid area."]);
                    return true;
                }
            }
            if (state.step === 'AREA_DIMENSION_SELECT') {
                const choice = val.toUpperCase().startsWith('W') ? 'width' : 'length'; // Default length
                setCommandState({
                    type: 'RECTANGLE',
                    step: 'AREA_LENGTH_INPUT',
                    p1: state.p1,
                    area: state.area,
                    calculateFor: choice,
                    options: state.options
                });
                setCurrentPrompt(`Enter rectangle ${choice}:`);
                return true;
            }
            if (state.step === 'AREA_LENGTH_INPUT') {
                const dim = parseFloat(val);
                if (!isNaN(dim) && dim > 0) {
                    const p2 = calculateRectangleFromArea(state.p1, state.area, dim, state.calculateFor || 'length');

                    drawRectangle(state.p1, p2, state.options);
                    onEngineUpdate();
                    setCommandState({ type: 'IDLE' });
                    clearPreviews();
                    setCurrentPrompt("Command:");
                    setCommandHistory(prev => [...prev, `Rectangle created (Area: ${state.area})`]);
                    onCommandCompleted?.('RECTANGLE');
                    return true;
                } else {
                    setCommandHistory(prev => [...prev, "Invalid dimension."]);
                    return true;
                }
            }
        }

        // RECTANGLE Fillet Value
        if (state.type === 'RECTANGLE' && state.step === 'SET_FILLET') {
            const r = parseFloat(val);
            if (!isNaN(r) && r >= 0) {
                // Return to previous step with fillet set (and chamfer cleared)
                if (state.previousStep === 'START') {
                    setCommandState({ type: 'RECTANGLE', step: 'START', options: { fillet: r } });
                    setCurrentPrompt("Specify first corner:");
                } else {
                    setCommandState({ type: 'RECTANGLE', step: 'END', p1: state.p1!, options: { fillet: r } });
                    setCurrentPrompt("Specify opposite corner or [Dimensions]:");
                }
                setCommandHistory(prev => [...prev, `Rectangle fillet radius set to ${r}`]);
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid radius."]);
                return true;
            }
        }

        // RECTANGLE Chamfer Value
        if (state.type === 'RECTANGLE' && state.step === 'SET_CHAMFER') {
            const d = parseFloat(val);
            if (!isNaN(d) && d >= 0) {
                // Return to previous step with chamfer set (and fillet cleared)
                if (state.previousStep === 'START') {
                    setCommandState({ type: 'RECTANGLE', step: 'START', options: { chamfer: d } });
                    setCurrentPrompt("Specify first corner:");
                } else {
                    setCommandState({ type: 'RECTANGLE', step: 'END', p1: state.p1!, options: { chamfer: d } });
                    setCurrentPrompt("Specify opposite corner or [Dimensions]:");
                }
                setCommandHistory(prev => [...prev, `Rectangle chamfer distance set to ${d}`]);
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid distance."]);
                return true;
            }
        }

        // POLYGON Sides
        if (state.type === 'POLYGON' && state.step === 'SIDES') {
            const sides = parseInt(val);
            if (!isNaN(sides) && sides >= 3) {
                setCommandState({ type: 'POLYGON', step: 'CENTER', sides });
                setCurrentPrompt("Specify center of polygon:");
                return true;
            } else if (val === '') {
                setCommandState({ type: 'POLYGON', step: 'CENTER', sides: 4 });
                setCurrentPrompt("Specify center of polygon:");
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid number of sides."]);
                return true;
            }
        }

        // POLYGON Radius
        if (state.type === 'POLYGON' && state.step === 'RADIUS') {
            const r = parseFloat(val);
            if (!isNaN(r) && r > 0) {
                cadEngine.addRegularPolygon(state.center.x, state.center.y, state.sides, r);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Polygon created."]);
                onCommandCompleted?.('POLYGON');
                return true;
            }
        }

        return false;
    }, [onEngineUpdate, onCommandCompleted, setCommandState, setCurrentPrompt, setCommandHistory, clearPreviews, drawRectangle]);

    /**
     * Process subcommands (Close, Undo, Diameter, Dimensions, 2P, 3P, Fillet, Chamfer) for drawing commands
     * @returns true if the subcommand was handled, false otherwise
     */
    const processSubCommand = useCallback((subCmd: 'CLOSE' | 'UNDO' | 'DIAMETER' | 'DIMENSIONS' | '2P' | '3P' | 'FILLET' | 'CHAMFER' | 'AREA', state: CommandState): boolean => {

        // ... existing LINE close ...

        // RECTANGLE Options (Fillet/Chamfer/Area)
        if (state.type === 'RECTANGLE' && (state.step === 'START' || state.step === 'END')) {
            if (subCmd === 'AREA' && state.step === 'END') {
                setCommandState({
                    type: 'RECTANGLE',
                    step: 'AREA_INPUT',
                    p1: state.p1,
                    options: state.options
                });
                setCurrentPrompt("Enter area of rectangle:");
                return true;
            }
            if (subCmd === 'FILLET') {
                setCommandState({
                    type: 'RECTANGLE',
                    step: 'SET_FILLET',
                    p1: state.step === 'END' ? state.p1 : undefined,
                    previousStep: state.step
                });
                setCurrentPrompt("Specify fillet radius for rectangles:");
                return true;
            }
            if (subCmd === 'CHAMFER') {
                setCommandState({
                    type: 'RECTANGLE',
                    step: 'SET_CHAMFER',
                    p1: state.step === 'END' ? state.p1 : undefined,
                    previousStep: state.step
                });
                setCurrentPrompt("Specify chamfer distance for rectangles:");
                return true;
            }
        }

        // =========================================================
        // LINE Close - Draw line to first point and close
        // =========================================================
        if (state.type === 'LINE' && state.step === 'END' && subCmd === 'CLOSE') {
            if (state.allPoints.length >= 2) {
                // Draw closing line from current point to first point
                cadEngine.addLine(state.p1.x, state.p1.y, state.firstPoint.x, state.firstPoint.y);
                onEngineUpdate();
                setCommandHistory(prev => [...prev, "Line closed."]);
                onCommandCompleted?.('LINE');
            } else {
                setCommandHistory(prev => [...prev, "At least 2 points required to close."]);
            }
            setCommandState({ type: 'IDLE' });
            clearPreviews();
            setCurrentPrompt("Command:");
            return true;
        }

        // =========================================================
        // LINE Undo - Remove last segment
        // =========================================================
        if (state.type === 'LINE' && state.step === 'END' && subCmd === 'UNDO') {
            if (state.allPoints.length > 1) {
                // Remove last point
                const newAllPoints = state.allPoints.slice(0, -1);
                const prevPoint = newAllPoints[newAllPoints.length - 1];

                // TODO: Remove last line from engine (requires cadEngine.undoLast() or entity deletion)
                // For now, just update the state
                setCommandHistory(prev => [...prev, "Last point undone."]);

                setCommandState({
                    type: 'LINE',
                    step: 'END',
                    p1: prevPoint,
                    firstPoint: state.firstPoint,
                    allPoints: newAllPoints
                });
                setPreviewState(prev => ({
                    ...prev,
                    line: { x1: prevPoint.x, y1: prevPoint.y, x2: prevPoint.x, y2: prevPoint.y }
                }));
                setCurrentPrompt("Specify next point or [Close/Undo]:");
            } else {
                // Only first point, go back to START
                setCommandState({ type: 'LINE', step: 'START' });
                clearPreviews();
                setCurrentPrompt("Specify first point:");
                setCommandHistory(prev => [...prev, "All points undone."]);
            }
            return true;
        }

        // =========================================================
        // POLYLINE Close - Close polyline to first point
        // =========================================================
        if (state.type === 'POLYLINE' && subCmd === 'CLOSE') {
            if (state.points.length >= 2) {
                // Add closing point and create closed polyline
                const closedPoints = [...state.points, state.points[0]];
                cadEngine.addPolyline(closedPoints, true); // closed = true
                onEngineUpdate();
                setCommandHistory(prev => [...prev, `Polyline closed with ${state.points.length} points.`]);
                onCommandCompleted?.('POLYLINE');
            } else {
                setCommandHistory(prev => [...prev, "At least 2 points required to close."]);
            }
            setCommandState({ type: 'IDLE' });
            clearPreviews();
            setCurrentPrompt("Command:");
            return true;
        }

        // =========================================================
        // POLYLINE Undo - Remove last point
        // =========================================================
        if (state.type === 'POLYLINE' && subCmd === 'UNDO') {
            if (state.points.length > 1) {
                const newPoints = state.points.slice(0, -1);
                setCommandState({ type: 'POLYLINE', points: newPoints });
                setPreviewState(prev => ({ ...prev, polyline: newPoints }));
                setCurrentPrompt(`Specify next point (${newPoints.length} points, press Enter to finish):`);
                setCommandHistory(prev => [...prev, "Last point undone."]);
            } else if (state.points.length === 1) {
                setCommandState({ type: 'POLYLINE', points: [] });
                clearPreviews();
                setCurrentPrompt("Specify first point:");
                setCommandHistory(prev => [...prev, "All points undone."]);
            }
            return true;
        }

        // =========================================================
        // CIRCLE Diameter Mode - Switch to diameter input
        // =========================================================
        if (state.type === 'CIRCLE' && state.step === 'RADIUS' && subCmd === 'DIAMETER') {
            setCommandState({ type: 'CIRCLE', step: 'DIAMETER', center: state.center });
            setCurrentPrompt("Specify diameter of circle:");
            return true;
        }

        // =========================================================
        // CIRCLE 2P Mode - Start 2-point circle
        // =========================================================
        if (state.type === 'CIRCLE' && state.step === 'CENTER' && subCmd === '2P') {
            setCommandState({ type: 'CIRCLE', step: '2P_FIRST' });
            setCurrentPrompt("Specify first end point of circle's diameter:");
            return true;
        }

        // =========================================================
        // CIRCLE 3P Mode - Start 3-point circle
        // =========================================================
        if (state.type === 'CIRCLE' && state.step === 'CENTER' && subCmd === '3P') {
            setCommandState({ type: 'CIRCLE', step: '3P_FIRST' });
            setCurrentPrompt("Specify first point on circle:");
            return true;
        }

        // =========================================================
        // RECTANGLE Dimensions Mode
        // =========================================================
        if (state.type === 'RECTANGLE' && state.step === 'END' && (subCmd === 'DIAMETER' || subCmd === 'DIMENSIONS')) {
            setCommandState({ type: 'RECTANGLE', step: 'DIMENSIONS_LENGTH', p1: state.p1 });
            setCurrentPrompt("Specify length for rectangle:");
            return true;
        }

        return false;
    }, [onEngineUpdate, onCommandCompleted, setCommandState, setPreviewState, setCurrentPrompt, setCommandHistory, clearPreviews]);

    return {
        processDrawingInput,
        processDrawingValue,
        processSubCommand
    };
};
