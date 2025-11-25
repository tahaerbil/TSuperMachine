declare module 'dxf-parser' {
    export default class DxfParser {
        parseSync(source: string): any;
    }
}

declare module 'dxf-writer' {
    export default class Drawing {
        constructor();
        addLayer(name: string, color: number, lineType: string): Drawing;
        drawLine(x1: number, y1: number, x2: number, y2: number): Drawing;
        drawCircle(x: number, y: number, radius: number): Drawing;
        drawRect(x1: number, y1: number, x2: number, y2: number): Drawing;
        drawText(x: number, y: number, height: number, rotation: number, value: string): Drawing;
        drawPolyline(points: number[][]): Drawing;
        setLayer(layerName: string): Drawing;
        toDxfString(): string;

        static ACI: {
            LAYER: number;
            RED: number;
            YELLOW: number;
            GREEN: number;
            CYAN: number;
            BLUE: number;
            MAGENTA: number;
            WHITE: number;
            BLACK: number;
        };
    }
}
