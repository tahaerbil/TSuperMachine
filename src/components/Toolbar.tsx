import React, { useCallback, useMemo } from 'react';
import { useStore, getWidgetSize } from '../store/store';
import type { WidgetType } from '../store/store';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

// =========================================================================
// TYPES
// =========================================================================

import { TOOL_CONFIG } from '../config/tools';

interface ToolButtonProps {
    type: WidgetType;
    Icon: LucideIcon;
    label: string;
    onClick: (type: WidgetType) => void;
}

// =========================================================================
// COMPONENTS
// =========================================================================

/**
 * Individual tool button with tooltip
 */
const ToolButton: React.FC<ToolButtonProps> = React.memo(({ type, Icon, label, onClick }) => (
    <button
        className="p-3 hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors flex flex-col items-center gap-1 group relative focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        style={{ color: 'var(--color-text)' }}
        onClick={() => onClick(type)}
        title={label}
        aria-label={label}
    >
        <Icon size={20} aria-hidden="true" />
        <span
            className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm"
            style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
            }}
        >
            {label}
        </span>
    </button>
));

ToolButton.displayName = 'ToolButton';

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export const Toolbar: React.FC = () => {
    const { addWidget } = useStore();
    const { t } = useTranslation();

    /**
     * Adds a new widget at the center of the visible canvas viewport.
     * Uses direct store access to get current canvas state (avoids stale closure).
     */
    const handleAddWidget = useCallback((type: WidgetType) => {
        const { canvas } = useStore.getState();

        // Get main canvas container dimensions
        const canvasContainer = document.querySelector('[data-main-canvas="true"]') as HTMLElement;
        const viewportWidth = canvasContainer?.clientWidth ?? window.innerWidth;
        const viewportHeight = canvasContainer?.clientHeight ?? window.innerHeight;

        // Transform viewport center to world coordinates
        const worldCenterX = (viewportWidth / 2 - canvas.offset.x) / canvas.scale;
        const worldCenterY = (viewportHeight / 2 - canvas.offset.y) / canvas.scale;

        // Position widget so its center aligns with world center
        const { width, height } = getWidgetSize(type);
        addWidget(type, {
            x: worldCenterX - width / 2,
            y: worldCenterY - height / 2
        });
    }, [addWidget]);

    // Memoize tools with translated labels
    const tools = useMemo(() =>
        TOOL_CONFIG.map(tool => ({
            ...tool,
            label: t(tool.labelKey)
        })),
        [t]
    );

    return (
        <div
            className="fixed left-4 top-1/2 -translate-y-1/2 shadow-lg rounded-xl p-2 flex flex-col gap-2 border z-50 pointer-events-auto"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
            }}
            onMouseDown={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onMouseUp={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
            onClick={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            {tools.map((tool) => (
                <ToolButton
                    key={tool.type}
                    type={tool.type}
                    Icon={tool.Icon}
                    label={tool.label}
                    onClick={handleAddWidget}
                />
            ))}
        </div>
    );
};
