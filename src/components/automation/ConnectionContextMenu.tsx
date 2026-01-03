/**
 * Connection Context Menu
 * 
 * Shows available automation options when user drops a wire on canvas.
 */

import React, { useEffect, useRef } from 'react';
import { FileOutput, BarChart3, FileText, Clock, X } from 'lucide-react';
import type { WidgetType } from '../../store/store';
import { connectionManager } from '../../core/services/automation';
import type { AutomationWidgetType, TriggerEvent } from '../../core/services/automation';

interface ConnectionContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    sourceWidgetId: string;
    sourceWidgetType: WidgetType;
    onSelect: (automationType: AutomationWidgetType, triggerEvent: TriggerEvent) => void;
    onClose: () => void;
}

// Icon mapping for automation types
const AUTOMATION_ICONS: Record<string, React.ReactNode> = {
    'PDF_EXPORT': <FileOutput size={18} />,
    'CHART_GENERATOR': <BarChart3 size={18} />,
    'DATA_LOGGER': <FileText size={18} />,
    'SCHEDULER': <Clock size={18} />
};

export const ConnectionContextMenu: React.FC<ConnectionContextMenuProps> = ({
    isOpen,
    position,
    sourceWidgetType,
    onSelect,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Get available automations for this source widget type
    const availableAutomations = connectionManager.getAvailableAutomations(sourceWidgetType);
    const emittableEvents = connectionManager.getEmittableEvents(sourceWidgetType);

    // Close menu on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || availableAutomations.length === 0) {
        return null;
    }

    // Adjust position to keep menu in viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 250),
        y: Math.min(position.y, window.innerHeight - 300)
    };

    return (
        <div
            ref={menuRef}
            className="connection-context-menu fixed z-50 shadow-xl rounded-lg overflow-hidden"
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                minWidth: '220px'
            }}
        >
            {/* Header */}
            <div
                className="px-3 py-2 flex items-center justify-between"
                style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderBottom: '1px solid var(--color-border)'
                }}
            >
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Add Automation
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <X size={14} style={{ color: 'var(--color-text)' }} />
                </button>
            </div>

            {/* Automation Options */}
            <div className="py-1">
                {availableAutomations.map(automation => {
                    // Find first matching trigger event
                    const triggerEvent = emittableEvents.find(e => automation.accepts.includes(e)) || 'manual';

                    return (
                        <button
                            key={automation.type}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            onClick={() => onSelect(automation.type, triggerEvent)}
                        >
                            <span
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                            >
                                {AUTOMATION_ICONS[automation.type] || <FileOutput size={18} />}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div
                                    className="text-sm font-medium truncate"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    {automation.label}
                                </div>
                                <div
                                    className="text-xs truncate"
                                    style={{ color: 'var(--color-text)', opacity: 0.6 }}
                                >
                                    {automation.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div
                className="px-3 py-2 text-xs"
                style={{
                    color: 'var(--color-text)',
                    opacity: 0.5,
                    borderTop: '1px solid var(--color-border)'
                }}
            >
                Triggered on: {emittableEvents.slice(0, 2).join(', ')}
                {emittableEvents.length > 2 && ` +${emittableEvents.length - 2} more`}
            </div>
        </div>
    );
};

export default ConnectionContextMenu;
