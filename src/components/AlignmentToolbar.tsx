import React from 'react';
import { useStore } from '../store/store';
import {
    AlignLeft,
    AlignRight,
    AlignCenterHorizontal,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyEnd,
    AlignCenterVertical
} from 'lucide-react';

export const AlignmentToolbar: React.FC = () => {
    const { selectedWidgetIds, widgets, updateWidget } = useStore();

    if (selectedWidgetIds.length < 2) {
        return null;
    }

    const selectedWidgets = widgets.filter(w => selectedWidgetIds.includes(w.id));

    const alignLeft = () => {
        const minX = Math.min(...selectedWidgets.map(w => w.position.x));
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, x: minX } });
        });
    };

    const alignRight = () => {
        const maxX = Math.max(...selectedWidgets.map(w => w.position.x + w.size.width));
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, x: maxX - w.size.width } });
        });
    };

    const alignTop = () => {
        const minY = Math.min(...selectedWidgets.map(w => w.position.y));
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, y: minY } });
        });
    };

    const alignBottom = () => {
        const maxY = Math.max(...selectedWidgets.map(w => w.position.y + w.size.height));
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, y: maxY - w.size.height } });
        });
    };

    const alignCenterHorizontal = () => {
        const centerX = selectedWidgets.reduce((sum, w) => sum + w.position.x + w.size.width / 2, 0) / selectedWidgets.length;
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, x: centerX - w.size.width / 2 } });
        });
    };

    const alignCenterVertical = () => {
        const centerY = selectedWidgets.reduce((sum, w) => sum + w.position.y + w.size.height / 2, 0) / selectedWidgets.length;
        selectedWidgets.forEach(w => {
            updateWidget(w.id, { position: { ...w.position, y: centerY - w.size.height / 2 } });
        });
    };

    const buttonStyle = { color: 'var(--color-primary)' };
    const buttonHoverClass = "p-2 rounded transition-colors hover:opacity-80";

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

            <button
                onClick={alignLeft}
                className={buttonHoverClass}
                title="Align Left"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignLeft size={16} />
            </button>

            <button
                onClick={alignCenterHorizontal}
                className={buttonHoverClass}
                title="Align Center Horizontal"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignCenterHorizontal size={16} />
            </button>

            <button
                onClick={alignRight}
                className={buttonHoverClass}
                title="Align Right"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignRight size={16} />
            </button>

            <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border)' }}></div>

            <button
                onClick={alignTop}
                className={buttonHoverClass}
                title="Align Top"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignVerticalJustifyStart size={16} />
            </button>

            <button
                onClick={alignCenterVertical}
                className={buttonHoverClass}
                title="Align Center Vertical"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignCenterVertical size={16} />
            </button>

            <button
                onClick={alignBottom}
                className={buttonHoverClass}
                title="Align Bottom"
                style={{ ...buttonStyle, backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <AlignVerticalJustifyEnd size={16} />
            </button>
        </div>
    );
};
