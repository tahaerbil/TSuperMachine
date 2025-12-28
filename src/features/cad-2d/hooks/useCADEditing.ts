/**
 * useCADEditing Hook
 * 
 * Handles editing operations: MOVE, COPY, ROTATE, OFFSET, ERASE.
 * Pure editing logic separated from drawing and selection concerns.
 */

import { useCallback, useRef } from 'react';
import { cadEngine } from '../../../core/services/cad-engine/CADEngine';
import type { CommandState, PreviewState } from '../types';

interface UseCADEditingProps {
    onEngineUpdate: () => void;
    onCommandCompleted?: (command: string) => void;
    setCommandState: React.Dispatch<React.SetStateAction<CommandState>>;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>;
    setCurrentPrompt: React.Dispatch<React.SetStateAction<string>>;
    setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
    clearPreviews: () => void;
    scale: number;
}

export const useCADEditing = ({
    onEngineUpdate,
    onCommandCompleted,
    setCommandState,
    setCurrentPrompt,
    setCommandHistory,
    clearPreviews,
    scale
}: UseCADEditingProps) => {

    const lastOffsetDistance = useRef<number | null>(null);

    /**
     * Process point input for editing commands
     * @returns true if the input was handled, false otherwise
     */
    const processEditingInput = useCallback((x: number, y: number, state: CommandState): boolean => {

        // MOVE Command
        if (state.type === 'MOVE') {
            if (state.step === 'BASE') {
                setCommandState({ type: 'MOVE', step: 'DESTINATION', basePoint: { x, y } });
                setCurrentPrompt("Specify destination point:");
                return true;
            } else if (state.step === 'DESTINATION') {
                const dx = x - state.basePoint.x;
                const dy = y - state.basePoint.y;
                cadEngine.moveSelected(dx, dy);
                cadEngine.deselectAll();
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Entities moved."]);
                onCommandCompleted?.('MOVE');
                return true;
            }
        }

        // COPY Command
        if (state.type === 'COPY') {
            if (state.step === 'BASE') {
                setCommandState({ type: 'COPY', step: 'DESTINATION', basePoint: { x, y } });
                setCurrentPrompt("Specify destination point:");
                return true;
            } else if (state.step === 'DESTINATION') {
                const dx = x - state.basePoint.x;
                const dy = y - state.basePoint.y;
                cadEngine.copySelected(dx, dy);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Entities copied."]);
                onCommandCompleted?.('COPY');
                return true;
            }
        }

        // ROTATE Command
        if (state.type === 'ROTATE') {
            if (state.step === 'BASE') {
                setCommandState({ type: 'ROTATE', step: 'ANGLE', basePoint: { x, y } });
                setCurrentPrompt("Specify rotation angle (or pick point):");
                return true;
            } else if (state.step === 'ANGLE') {
                const dx = x - state.basePoint.x;
                const dy = y - state.basePoint.y;
                const angle = Math.atan2(dy, dx);
                cadEngine.rotateSelected(state.basePoint.x, state.basePoint.y, angle);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, "Entities rotated."]);
                onCommandCompleted?.('ROTATE');
                return true;
            }
        }

        // OFFSET Command
        if (state.type === 'OFFSET') {
            if (state.step === 'SELECT') {
                const hitId = cadEngine.hitTest(x, y, 10 / scale);
                if (hitId !== -1) {
                    cadEngine.deselectAll();
                    cadEngine.selectEntity(hitId);
                    onEngineUpdate();
                    setCommandState({ type: 'OFFSET', step: 'SIDE', distance: state.distance, entityId: hitId });
                    setCurrentPrompt("Click on side to offset:");
                    return true;
                } else {
                    setCommandHistory(prev => [...prev, "No entity found. Try again."]);
                    return true;
                }
            } else if (state.step === 'SIDE') {
                const newId = cadEngine.offsetEntity(state.entityId, state.distance, x, y);
                if (newId > 0) {
                    cadEngine.deselectAll();
                    onEngineUpdate();
                    setCommandState({ type: 'OFFSET', step: 'SELECT', distance: state.distance });
                    setCurrentPrompt("Select entity to offset (click on desired side):");
                    setCommandHistory(prev => [...prev, "Offset created."]);
                    onCommandCompleted?.('OFFSET');
                    return true;
                } else {
                    setCommandHistory(prev => [...prev, "Offset failed."]);
                    cadEngine.deselectAll();
                    setCommandState({ type: 'OFFSET', step: 'SELECT', distance: state.distance });
                    setCurrentPrompt("Select entity to offset:");
                    return true;
                }
            }
        }

        // ERASE Command
        if (state.type === 'ERASE') {
            const hitId = cadEngine.hitTest(x, y, 10 / scale);
            if (hitId !== -1) {
                cadEngine.selectEntity(hitId);
                onEngineUpdate();
                return true;
            }
        }

        return false;
    }, [onEngineUpdate, onCommandCompleted, setCommandState, setCurrentPrompt, setCommandHistory, clearPreviews, scale]);

    /**
     * Process value input for editing commands
     * @returns true if the input was handled, false otherwise
     */
    const processEditingValue = useCallback((val: string, state: CommandState): boolean => {

        // ROTATE Angle
        if (state.type === 'ROTATE' && state.step === 'ANGLE') {
            const deg = parseFloat(val);
            if (!isNaN(deg)) {
                const rad = deg * (Math.PI / 180);
                cadEngine.rotateSelected(state.basePoint.x, state.basePoint.y, rad);
                onEngineUpdate();
                setCommandState({ type: 'IDLE' });
                clearPreviews();
                setCurrentPrompt("Command:");
                setCommandHistory(prev => [...prev, `Rotated ${deg}°`]);
                onCommandCompleted?.('ROTATE');
                return true;
            }
        }

        // OFFSET Distance
        if (state.type === 'OFFSET' && state.step === 'DISTANCE') {
            let d = parseFloat(val);
            if (val.trim() === '' && lastOffsetDistance.current !== null) {
                d = lastOffsetDistance.current;
            }

            if (!isNaN(d) && d > 0) {
                lastOffsetDistance.current = d;
                setCommandState({ type: 'OFFSET', step: 'SELECT', distance: d });
                setCurrentPrompt("Select entity to offset (click on desired side):");
                return true;
            } else {
                setCommandHistory(prev => [...prev, "Invalid distance."]);
                return true;
            }
        }

        return false;
    }, [onEngineUpdate, onCommandCompleted, setCommandState, setCurrentPrompt, setCommandHistory, clearPreviews]);

    /**
     * Get the last offset distance for command prompt
     */
    const getLastOffsetDistance = useCallback(() => lastOffsetDistance.current, []);

    return {
        processEditingInput,
        processEditingValue,
        getLastOffsetDistance
    };
};
