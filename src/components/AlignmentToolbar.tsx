import React, { useCallback, useMemo } from 'react';
import { useStore } from '../store/store';
import {
    AlignLeft,
    AlignRight,
    AlignCenterHorizontal,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyEnd,
    AlignCenterVertical,
    type LucideIcon
} from 'lucide-react';

// =========================================================================
// TYPES
// =========================================================================

interface AlignButtonProps {
    onClick: () => void;
    title: string;
    Icon: LucideIcon;
}

// =========================================================================
// COMPONENTS
// =========================================================================

/**
 * Reusable alignment button with hover effects
 */
const AlignButton: React.FC<AlignButtonProps> = React.memo(({ onClick, title, Icon }) => (
    <button
        onClick={onClick}
        className="p-2 rounded transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={title}
        aria-label={title}
        style={{ color: 'var(--color-primary)', backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
        <Icon size={16} aria-hidden="true" />
    </button>
));

AlignButton.displayName = 'AlignButton';

/**
 * Divider between button groups
 */
const Divider: React.FC = () => (
    <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
);

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export const AlignmentToolbar: React.FC = () => {
    const { selectedWidgetIds, widgets, updateWidgets } = useStore();

    // Memoize selected widgets - must be before any conditional return
    const selectedWidgets = useMemo(() =>
        widgets.filter(w => selectedWidgetIds.includes(w.id)),
        [widgets, selectedWidgetIds]
    );

    // All hooks must be called before any conditional return
    const alignLeft = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const minX = Math.min(...selectedWidgets.map(w => w.position.x));
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, x: minX } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    const alignRight = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const maxX = Math.max(...selectedWidgets.map(w => w.position.x + w.size.width));
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, x: maxX - w.size.width } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    const alignTop = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const minY = Math.min(...selectedWidgets.map(w => w.position.y));
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, y: minY } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    const alignBottom = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const maxY = Math.max(...selectedWidgets.map(w => w.position.y + w.size.height));
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, y: maxY - w.size.height } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    const alignCenterHorizontal = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const centerX = selectedWidgets.reduce(
            (sum, w) => sum + w.position.x + w.size.width / 2, 0
        ) / selectedWidgets.length;
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, x: centerX - w.size.width / 2 } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    const alignCenterVertical = useCallback(() => {
        if (selectedWidgets.length < 2) return;
        const centerY = selectedWidgets.reduce(
            (sum, w) => sum + w.position.y + w.size.height / 2, 0
        ) / selectedWidgets.length;
        const updates = selectedWidgets.map(w => ({
            id: w.id,
            updates: { position: { ...w.position, y: centerY - w.size.height / 2 } }
        }));
        updateWidgets(updates);
    }, [selectedWidgets, updateWidgets]);

    // Early return after all hooks are called
    if (selectedWidgetIds.length < 2) {
        return null;
    }

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg shadow-lg border flex items-center gap-1"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-primary)',
                zIndex: 10000
            }}
        >
            <span className="text-xs font-medium mr-2" style={{ color: 'var(--color-text)' }}>
                Align:
            </span>

            {/* Horizontal Alignment */}
            <AlignButton onClick={alignLeft} title="Align Left" Icon={AlignLeft} />
            <AlignButton onClick={alignCenterHorizontal} title="Align Center Horizontal" Icon={AlignCenterHorizontal} />
            <AlignButton onClick={alignRight} title="Align Right" Icon={AlignRight} />

            <Divider />

            {/* Vertical Alignment */}
            <AlignButton onClick={alignTop} title="Align Top" Icon={AlignVerticalJustifyStart} />
            <AlignButton onClick={alignCenterVertical} title="Align Center Vertical" Icon={AlignCenterVertical} />
            <AlignButton onClick={alignBottom} title="Align Bottom" Icon={AlignVerticalJustifyEnd} />
        </div>
    );
};
