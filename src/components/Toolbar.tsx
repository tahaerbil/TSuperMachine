import React from 'react';
import { useStore, getWidgetSize } from '../store/store';
import type { WidgetType } from '../store/store';
import { Calculator, StickyNote, FileSpreadsheet, Box, PenTool, CheckSquare, Settings, Image, FileText, Presentation, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Toolbar: React.FC = () => {
    const { addWidget } = useStore();
    const { t } = useTranslation();

    const tools: { type: WidgetType; icon: React.ReactNode; label: string }[] = [
        { type: 'NOTE', icon: <StickyNote size={20} />, label: t('app.toolbar.note') },
        { type: 'CALCULATOR', icon: <Calculator size={20} />, label: t('app.toolbar.calculator') },
        { type: 'CAD_2D', icon: <PenTool size={20} />, label: t('app.toolbar.cad2d') },
        { type: 'CAD_3D', icon: <Box size={20} />, label: t('app.toolbar.cad3d') },
        { type: 'SPREADSHEET', icon: <FileSpreadsheet size={20} />, label: t('app.toolbar.spreadsheet') },
        { type: 'TODO', icon: <CheckSquare size={20} />, label: t('app.toolbar.todo') },
        { type: 'IMAGE', icon: <Image size={20} />, label: t('app.toolbar.image') },
        { type: 'PDF', icon: <FileText size={20} />, label: t('app.toolbar.pdf') },
        { type: 'PRESENTATION', icon: <Presentation size={20} />, label: t('app.toolbar.presentation') },
        { type: 'PROJECT', icon: <FolderKanban size={20} />, label: t('app.toolbar.project') },
        { type: 'SETTINGS', icon: <Settings size={20} />, label: t('app.toolbar.settings') },
    ];

    /**
     * Adds a new widget at the center of the visible canvas viewport.
     * Uses direct store access to get current canvas state (avoids stale closure).
     */
    const handleAddWidget = (type: WidgetType) => {
        const { canvas } = useStore.getState();

        // Get main canvas container dimensions (unique selector prevents CAD internal canvas conflicts)
        const canvasContainer = document.querySelector('[data-main-canvas="true"]') as HTMLElement;
        const viewportWidth = canvasContainer?.clientWidth ?? window.innerWidth;
        const viewportHeight = canvasContainer?.clientHeight ?? window.innerHeight;

        // Transform viewport center to world coordinates
        // Formula: worldPos = (viewportCenter - offset) / scale
        const worldCenterX = (viewportWidth / 2 - canvas.offset.x) / canvas.scale;
        const worldCenterY = (viewportHeight / 2 - canvas.offset.y) / canvas.scale;

        // Position widget so its center aligns with world center
        const { width, height } = getWidgetSize(type);
        addWidget(type, {
            x: worldCenterX - width / 2,
            y: worldCenterY - height / 2
        });
    };

    return (
        <div
            className="fixed left-4 top-1/2 -translate-y-1/2 shadow-lg rounded-xl p-2 flex flex-col gap-2 border z-50"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
            }}
        >
            {tools.map((tool) => (
                <button
                    key={tool.type}
                    className="p-3 hover:bg-blue-50 rounded-lg transition-colors flex flex-col items-center gap-1 group relative"
                    style={{ color: 'var(--color-text)' }}
                    onClick={() => handleAddWidget(tool.type)}
                    title={tool.label}
                >
                    {tool.icon}
                    <span
                        className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                        style={{
                            backgroundColor: 'var(--color-text)',
                            color: 'var(--color-surface)'
                        }}
                    >
                        {tool.label}
                    </span>
                </button>
            ))}
        </div>
    );
};
