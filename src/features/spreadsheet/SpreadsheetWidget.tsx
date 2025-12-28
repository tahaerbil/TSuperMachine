import React, { useRef, useCallback } from 'react';
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { useStore } from '../../store/store';

interface SpreadsheetWidgetProps {
    id: string;
    initialData?: any;
    isMaximized?: boolean;
}

export const SpreadsheetWidget: React.FC<SpreadsheetWidgetProps> = ({ id, initialData, isMaximized = false }) => {
    // Use selector to prevent unnecessary re-renders
    const updateWidget = useStore(state => state.updateWidget);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use ref to ensure data is strictly static after mount
    // This prevents the "Maximum update depth exceeded" error
    const dataRef = useRef(initialData || [{
        name: "Sheet1",
        status: 1, // Active
        row: 20,
        column: 10
    }]);

    // Force resize on mount and when maximized state changes
    React.useEffect(() => {
        // Initial trigger
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

        // Use ResizeObserver to detect container size changes
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            window.dispatchEvent(new Event('resize'));
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isMaximized]);

    // Memoize handler to prevent infinite loops
    const handleChange = useCallback((data: any) => {
        // Debounce save to store
        setTimeout(() => {
            updateWidget(id, { data: { spreadsheet: data } });
        }, 1000);
    }, [id, updateWidget]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                position: 'relative',
                background: 'white',
                color: 'black'
            }}
        >
            <div className="flex-1 w-full h-full relative">
                <Workbook
                    key={id}
                    data={dataRef.current}
                    onChange={handleChange}
                    showToolbar={isMaximized}
                    showSheetTabs={isMaximized}
                    showFormulaBar={isMaximized}
                />
            </div>
        </div>
    );
};
