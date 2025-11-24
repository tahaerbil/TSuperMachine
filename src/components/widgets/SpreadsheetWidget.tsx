import React, { useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { useStore } from '../../store/store';

interface SpreadsheetWidgetProps {
    id: string;
    initialData?: any;
}

export const SpreadsheetWidget: React.FC<SpreadsheetWidgetProps> = ({ id, initialData }) => {
    const { updateWidget } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const defaultData = initialData || [
        {
            name: 'Sheet1',
            celldata: [
                { r: 0, c: 0, v: { v: 'Name', m: 'Name', ct: { fa: 't', t: 's' } } },
                { r: 0, c: 1, v: { v: 'Value', m: 'Value', ct: { fa: 't', t: 's' } } },
                { r: 1, c: 0, v: { v: 'Item 1', m: 'Item 1', ct: { fa: 't', t: 's' } } },
                { r: 1, c: 1, v: { v: 100, m: '100', ct: { fa: 'General', t: 'n' } } },
            ],
            row: 20,
            column: 10,
        },
    ];

    const handleChange = (data: any) => {
        // Debounce save to store
        setTimeout(() => {
            updateWidget(id, { data: { spreadsheet: data } });
        }, 1000);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Workbook
                data={defaultData}
                onChange={handleChange}
            />
        </div>
    );
};
