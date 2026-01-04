/**
 * useCanvasKeyboard Hook
 * 
 * Handles keyboard shortcuts on the canvas:
 * - Ctrl/Cmd + A: Select all widgets
 * - Escape: Clear selection
 * - Delete/Backspace: Delete selected widgets
 */

import { useEffect } from 'react';
import { useStore } from '../../../store/store';
import type { Widget } from '../../../store/store';

export function useCanvasKeyboard(): void {
    const { selectAll, clearSelection, removeWidget } = useStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // If any widget is maximized, disable global canvas shortcuts.
            const currentWidgets = useStore.getState().widgets;
            if (currentWidgets.some(w => w.isMaximized)) {
                return;
            }

            // Ctrl/Cmd + A: Select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAll();
            }

            // Escape: Clear selection
            if (e.key === 'Escape') {
                e.preventDefault();
                clearSelection();
            }

            // Delete/Backspace: Delete selected widgets
            const currentSelectedIds = useStore.getState().selectedWidgetIds;
            if ((e.key === 'Delete' || e.key === 'Backspace') && currentSelectedIds.length > 0) {
                e.preventDefault();
                currentSelectedIds.forEach(id => removeWidget(id));
                clearSelection();
            }

            // Arrow keys: Move selected widgets (Nudging)
            // Shift + Arrow: Move by 10px (Large nudge)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && currentSelectedIds.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                const { widgets, updateWidgets } = useStore.getState();

                const updates = currentSelectedIds.map(id => {
                    const widget = widgets.find(w => w.id === id);
                    if (!widget) return null;

                    let newX = widget.position.x;
                    let newY = widget.position.y;

                    switch (e.key) {
                        case 'ArrowLeft': newX -= step; break;
                        case 'ArrowRight': newX += step; break;
                        case 'ArrowUp': newY -= step; break;
                        case 'ArrowDown': newY += step; break;
                    }

                    return {
                        id,
                        updates: { position: { ...widget.position, x: newX, y: newY } }
                    };
                }).filter(Boolean) as Array<{ id: string; updates: Partial<Widget> }>;

                if (updates.length > 0) {
                    updateWidgets(updates);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectAll, clearSelection, removeWidget]);
}

export default useCanvasKeyboard;
