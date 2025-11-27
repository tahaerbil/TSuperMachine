export type CommandType = 'LINE' | 'CIRCLE' | 'POLYLINE' | 'RECTANGLE' | 'ARC' | 'ERASE' | 'PAN' | 'ZOOM' | 'IDLE';

export interface CommandAction {
    type: 'START_COMMAND' | 'ENTER_POINT' | 'ENTER_VALUE' | 'CANCEL' | 'UNKNOWN';
    command?: CommandType;
    point?: { x: number, y: number, isRelative: boolean };
    value?: number;
    raw?: string;
}

export class CommandParser {
    static parse(input: string): CommandAction {
        const trimmed = input.trim().toUpperCase();

        if (!trimmed) {
            return { type: 'UNKNOWN', raw: input };
        }

        // 1. Check for Commands & Aliases
        switch (trimmed) {
            case 'L':
            case 'LINE':
                return { type: 'START_COMMAND', command: 'LINE', raw: input };
            case 'C':
            case 'CIRCLE':
                return { type: 'START_COMMAND', command: 'CIRCLE', raw: input };
            case 'PL':
            case 'PLINE':
            case 'POLYLINE':
                return { type: 'START_COMMAND', command: 'POLYLINE', raw: input };
            case 'REC':
            case 'RECTANGLE':
                return { type: 'START_COMMAND', command: 'RECTANGLE', raw: input };
            case 'A':
            case 'ARC':
                return { type: 'START_COMMAND', command: 'ARC', raw: input };
            case 'E':
            case 'ERASE':
            case 'DELETE':
                return { type: 'START_COMMAND', command: 'ERASE', raw: input };
            case 'ESC':
            case 'CANCEL':
                return { type: 'CANCEL', raw: input };
        }

        // 2. Check for Coordinates (x,y or @dx,dy)
        if (trimmed.includes(',')) {
            const isRelative = trimmed.startsWith('@');
            const parts = trimmed.replace('@', '').split(',');

            if (parts.length === 2) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);

                if (!isNaN(x) && !isNaN(y)) {
                    return {
                        type: 'ENTER_POINT',
                        point: { x, y, isRelative },
                        raw: input
                    };
                }
            }
        }

        // 3. Check for Single Value (Radius, Length, etc.)
        const val = parseFloat(trimmed);
        if (!isNaN(val)) {
            return { type: 'ENTER_VALUE', value: val, raw: input };
        }

        return { type: 'UNKNOWN', raw: input };
    }
}
