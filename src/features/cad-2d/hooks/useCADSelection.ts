/**
 * useCADSelection Hook
 * 
 * Handles selection operations: click selection, window selection, crossing selection.
 * Pure selection logic separated from drawing and editing concerns.
 */

import { useCallback } from 'react';
import { cadEngine } from '../../../core/services/cad-engine/CADEngine';
import type { CommandState, PreviewState } from '../types';

interface UseCADSelectionProps {
    onEngineUpdate: () => void;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>;
    scale: number;
}

export const useCADSelection = ({
    onEngineUpdate,
    setPreviewState,
    scale
}: UseCADSelectionProps) => {

    /**
     * Process selection input in IDLE state
     * @returns true if selection was handled
     */
    const processSelectionInput = useCallback((
        x: number,
        y: number,
        state: CommandState,
        previewState: PreviewState
    ): boolean => {
        if (state.type !== 'IDLE') return false;

        // Finish selection box if active
        if (previewState.selectionBox) {
            if (previewState.selectionBox.type === 'window') {
                cadEngine.selectByWindow(
                    previewState.selectionBox.start.x,
                    previewState.selectionBox.start.y,
                    x,
                    y
                );
            } else {
                cadEngine.selectByCrossing(
                    previewState.selectionBox.start.x,
                    previewState.selectionBox.start.y,
                    x,
                    y
                );
            }
            onEngineUpdate();
            setPreviewState(prev => ({ ...prev, selectionBox: null }));
            return true;
        }

        // Try hit test for single entity selection
        const hitId = cadEngine.hitTest(x, y, 10 / scale);
        if (hitId !== -1) {
            cadEngine.selectEntity(hitId);
            onEngineUpdate();
            return true;
        }

        // Start selection box
        setPreviewState(prev => ({
            ...prev,
            selectionBox: {
                start: { x, y },
                end: { x, y },
                type: 'window'
            }
        }));
        return true;
    }, [onEngineUpdate, setPreviewState, scale]);

    /**
     * Update selection box during mouse move
     */
    const handleSelectionBoxMove = useCallback((
        worldX: number,
        worldY: number,
        previewState: PreviewState
    ): void => {
        if (!previewState.selectionBox) return;

        const dragDx = worldX - previewState.selectionBox.start.x;
        setPreviewState(prev => {
            if (!prev.selectionBox) return prev;
            return {
                ...prev,
                selectionBox: {
                    ...prev.selectionBox,
                    end: { x: worldX, y: worldY },
                    type: dragDx >= 0 ? 'window' : 'crossing'
                }
            };
        });
    }, [setPreviewState]);

    return {
        processSelectionInput,
        handleSelectionBoxMove
    };
};
