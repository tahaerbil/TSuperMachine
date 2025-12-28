/**
 * useCADPreview Hook
 * 
 * Manages preview state and snap point visualization for CAD operations.
 * Handles real-time visual feedback during drawing and editing.
 */

import { useState, useCallback } from 'react';
import type { SnapPoint } from '../../../core/services/cad-engine/CADEngine';
import type { PreviewState } from '../types';
import { INITIAL_PREVIEW_STATE, type UseCADPreviewReturn } from './types';

export const useCADPreview = (): UseCADPreviewReturn => {
    const [previewState, setPreviewState] = useState<PreviewState>(INITIAL_PREVIEW_STATE);
    const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);

    const clearPreviews = useCallback(() => {
        setPreviewState(INITIAL_PREVIEW_STATE);
    }, []);

    return {
        previewState,
        activeSnap,
        setPreviewState,
        setActiveSnap,
        clearPreviews
    };
};
