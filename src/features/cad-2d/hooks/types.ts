/**
 * CAD Command Hooks - Shared Types
 * Internal types used by the modular CAD hooks
 */

import type { SnapPoint } from '../../../core/services/cad-engine/CADEngine';
import type { CommandState, PreviewState } from '../types';

// ============================================================================
// Hook Props & Return Types
// ============================================================================

export interface UseCADCommandProps {
    onEngineUpdate: () => void;
    scale: number;
    onCommandCompleted?: (command: string) => void;
}

export interface UseCADPreviewReturn {
    previewState: PreviewState;
    activeSnap: SnapPoint | null;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState>>;
    setActiveSnap: React.Dispatch<React.SetStateAction<SnapPoint | null>>;
    clearPreviews: () => void;
}

export interface UseCADDrawingReturn {
    processDrawingInput: (x: number, y: number, state: CommandState) => boolean;
    processDrawingValue: (val: string, state: CommandState) => boolean;
}

export interface UseCADEditingReturn {
    processEditingInput: (x: number, y: number, state: CommandState) => boolean;
    processEditingValue: (val: string, state: CommandState) => boolean;
}

export interface UseCADSelectionReturn {
    processSelectionInput: (x: number, y: number, state: CommandState) => boolean;
    handleSelectionBox: (worldX: number, worldY: number) => void;
}

// ============================================================================
// Initial States
// ============================================================================

export const INITIAL_PREVIEW_STATE: PreviewState = {
    line: null,
    circle: null,
    polyline: null,
    rectangle: null,
    arc: null,
    move: null,
    copy: null,
    rotate: null,
    selectionBox: null
};

export const INITIAL_COMMAND_HISTORY = [
    "Welcome to TSuperMachine CAD",
    "Type 'HELP' for commands."
];
