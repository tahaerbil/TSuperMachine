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
        drawArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): Drawing;
        drawEllipse(x: number, y: number, majorAxisX: number, majorAxisY: number, ratio: number, startAngle: number, endAngle: number): Drawing;
        drawSpline(points: number[][]): Drawing;
        drawPoint(x: number, y: number): Drawing;
        drawRect(x1: number, y1: number, x2: number, y2: number): Drawing;
        drawText(x: number, y: number, height: number, rotation: number, value: string): Drawing;
        drawPolyline(points: number[][]): Drawing;
        addBlock(name: string): Drawing;
        insertBlock(name: string, x: number, y: number, scaleX?: number, scaleY?: number, rotation?: number): Drawing;
        addLType(name: string, description: string, pattern: number[]): Drawing;
        addStyle(name: string, fontFile: string, flags?: number): Drawing;
        addDimStyle(name: string, properties?: any): Drawing;
        addVPort(name: string, properties?: any): Drawing;
        addAppId(name: string): Drawing;
        addUcs(name: string, origin: number[], xAxis: number[], yAxis: number[]): Drawing;
        addView(name: string, properties?: any): Drawing;
        addViewport(name: string, properties?: any): Drawing;
        addMlineStyle(name: string, properties?: any): Drawing;
        addDictionary(name: string): Drawing;
        addGroup(name: string, description: string, entities: any[]): Drawing;
        addLayout(name: string, properties?: any): Drawing;
        addPlotSettings(name: string, properties?: any): Drawing;
        addMaterial(name: string, properties?: any): Drawing;
        addMLeaderStyle(name: string, properties?: any): Drawing;
        addTableStyle(name: string, properties?: any): Drawing;
        addVisualStyle(name: string, properties?: any): Drawing;
        addRegApp(name: string): Drawing;
        addScaleList(name: string, properties?: any): Drawing;
        addSectionStyle(name: string, properties?: any): Drawing;
        addLeaderStyle(name: string, properties?: any): Drawing;
        addToleranceStyle(name: string, properties?: any): Drawing;
        addMLine(points: number[][], styleName?: string): Drawing;
        addMText(x: number, y: number, height: number, rotation: number, value: string, attachmentPoint?: number, width?: number): Drawing;
        addHatch(points: number[][], patternName?: string, patternAngle?: number, patternScale?: number): Drawing;
        addDimension(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, dimensionType: number, rotation?: number, text?: string): Drawing;
        addLeader(points: number[][], text?: string): Drawing;
        addTolerance(x: number, y: number, toleranceText: string, symbol?: number, height?: number, width?: number): Drawing;
        addMLeader(points: number[][], text?: string): Drawing;
        addTable(x: number, y: number, numRows: number, numCols: number, rowHeights: number[], colWidths: number[], cells: string[][]): Drawing;
        addWipeout(points: number[][]): Drawing;
        addRasterImage(filePath: string, x: number, y: number, width: number, height: number, rotation?: number): Drawing;
        addOleFrame(x: number, y: number, width: number, height: number, oleData: string): Drawing;
        addOle2Frame(x: number, y: number, width: number, height: number, oleData: string): Drawing;
        addLight(name: string, properties?: any): Drawing;
        addSun(name: string, properties?: any): Drawing;
        addCamera(name: string, properties?: any): Drawing;
        addSection(name: string, properties?: any): Drawing;
        addBlockRecord(name: string): Drawing;
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
