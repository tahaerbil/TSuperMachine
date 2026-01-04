import { useEffect } from 'react';
import { useProjectSystem } from './hooks/useProjectSystem';
import { useAutoSave } from './hooks/useAutoSave';

/**
 * Headless controller component that manages global project events and lifecycle.
 * Should be mounted once at the root of the application (in App.tsx).
 */
export const ProjectController = () => {
    const { save, createNew, load, refreshPath } = useProjectSystem();

    // Enable Auto-Save (every 5 mins if file path exists)
    useAutoSave(true);

    // Initial Path Sync
    useEffect(() => {
        refreshPath();
    }, [refreshPath]);

    // Electron Menu Event Listeners
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).electronAPI) return;

        const handleMenuAction = (action: string) => {
            console.log('[ProjectController] Menu Action:', action);
            if (action === 'new') createNew();
            if (action === 'save') save({ forceSaveAs: false });
            if (action === 'save-as') save({ forceSaveAs: true });
            if (action === 'open') load();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electronAPI.onMenuAction(handleMenuAction);

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).electronAPI?.removeListeners();
        };
    }, [createNew, save, load]);

    return null; // Headless
};
