export type Tool = 'line' | 'rectangle' | 'circle' | 'text' | 'select';

export interface Shape {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'text';
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    fontSize?: number;
    stroke: string;
    strokeWidth: number;
    fill?: string;
    layerId?: string;
}

export interface LayerData {
    id: string;
    name: string;
    color: string;
    visible: boolean;
    locked: boolean;
}

export interface CAD2DWidgetProps {
    id: string;
    initialShapes?: Shape[];
    initialLayers?: LayerData[];
    isMaximized?: boolean;
}
