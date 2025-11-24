import React from 'react';
import { useStore } from '../store/store';
import type { WidgetType } from '../store/store';
import { Calculator, StickyNote, FileSpreadsheet, Box, PenTool, CheckSquare, Settings, Image, FileText, Presentation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Toolbar: React.FC = () => {
    const { addWidget } = useStore();
    const { t } = useTranslation();

    const tools: { type: WidgetType; icon: React.ReactNode; label: string }[] = [
        { type: 'NOTE', icon: <StickyNote size={20} />, label: t('app.toolbar.note') },
        { type: 'CALCULATOR', icon: <Calculator size={20} />, label: t('app.toolbar.calculator') },
        { type: 'CAD_3D', icon: <Box size={20} />, label: t('app.toolbar.cad3d') },
        { type: 'CAD_2D', icon: <PenTool size={20} />, label: t('app.toolbar.cad2d') },
        { type: 'SPREADSHEET', icon: <FileSpreadsheet size={20} />, label: t('app.toolbar.spreadsheet') },
        { type: 'TODO', icon: <CheckSquare size={20} />, label: t('app.toolbar.todo') },
        { type: 'IMAGE', icon: <Image size={20} />, label: t('app.toolbar.image') },
        { type: 'PDF', icon: <FileText size={20} />, label: t('app.toolbar.pdf') },
        { type: 'PRESENTATION', icon: <Presentation size={20} />, label: t('app.toolbar.presentation') },
        { type: 'SETTINGS', icon: <Settings size={20} />, label: t('app.toolbar.settings') },
    ];

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
                    onClick={() => addWidget(tool.type)}
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
