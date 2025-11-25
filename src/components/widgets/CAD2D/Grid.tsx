import React, { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

interface GridProps {
    width: number;
    height: number;
    scale: number;
    x: number;
    y: number;
}

export const Grid: React.FC<GridProps> = ({ width, height, scale, x, y }) => {
    const gridSize = 50;
    const lines = useMemo(() => {
        const startX = Math.floor((-x / scale) / gridSize) * gridSize;
        const endX = Math.floor((-x / scale + width / scale) / gridSize) * gridSize;
        const startY = Math.floor((-y / scale) / gridSize) * gridSize;
        const endY = Math.floor((-y / scale + height / scale) / gridSize) * gridSize;

        const verticalLines = [];
        for (let i = startX; i <= endX; i += gridSize) {
            verticalLines.push(i);
        }

        const horizontalLines = [];
        for (let i = startY; i <= endY; i += gridSize) {
            horizontalLines.push(i);
        }

        return { verticalLines, horizontalLines };
    }, [width, height, scale, x, y]);

    return (
        <Layer>
            {lines.verticalLines.map((lineX, i) => (
                <Line
                    key={`v-${i}`}
                    points={[lineX, -y / scale, lineX, (-y + height) / scale]}
                    stroke="#ddd"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            ))}
            {lines.horizontalLines.map((lineY, i) => (
                <Line
                    key={`h-${i}`}
                    points={[-x / scale, lineY, (-x + width) / scale, lineY]}
                    stroke="#ddd"
                    strokeWidth={1 / scale}
                    listening={false}
                />
            ))}
            {/* Origin Lines */}
            <Line points={[0, -10000, 0, 10000]} stroke="#bbb" strokeWidth={2 / scale} listening={false} />
            <Line points={[-10000, 0, 10000, 0]} stroke="#bbb" strokeWidth={2 / scale} listening={false} />
        </Layer>
    );
};
