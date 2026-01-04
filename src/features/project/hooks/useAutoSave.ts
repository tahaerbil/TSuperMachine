import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../../store/store';
import { useProjectSystem } from './useProjectSystem';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useAutoSave = (enabled: boolean = true) => {
    const { save, currentFilePath } = useProjectSystem();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastHashRef = useRef<string>('');
    const { widgets, canvas } = useStore();

    // Calculate a simple hash of the state to detect changes
    const getCurrentHash = useCallback(() => {
        return JSON.stringify({
            w: widgets.length, // quick check
            p: widgets.map(w => ({ i: w.id, p: w.position, s: w.size })), // positions/sizes
            c: canvas
        });
    }, [widgets, canvas]);

    useEffect(() => {
        if (!enabled || !currentFilePath) return;

        timerRef.current = setInterval(async () => {
            const currentHash = getCurrentHash();
            if (currentHash !== lastHashRef.current) {
                console.log('[AutoSave] Changes detected, saving...');
                try {
                    // Auto save triggers a normal save logic. 
                    const success = await save({ forceSaveAs: false });
                    if (success) {
                        lastHashRef.current = currentHash;
                        console.log('[AutoSave] Complete');
                    }
                } catch (e) {
                    console.error('[AutoSave] Failed', e);
                }
            }
        }, AUTO_SAVE_INTERVAL);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [enabled, currentFilePath, save, getCurrentHash]);
};
