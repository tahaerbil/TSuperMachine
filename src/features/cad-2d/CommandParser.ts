export type CommandType = 'LINE' | 'CIRCLE' | 'POLYLINE' | 'RECTANGLE' | 'ARC' | 'POLYGON' | 'MOVE' | 'COPY' | 'ROTATE' | 'OFFSET' | 'ERASE' | 'PAN' | 'ZOOM' | 'IDLE';

export type SubCommandType = 'CLOSE' | 'UNDO' | 'DIAMETER' | '2P' | '3P' | 'DIMENSIONS' | 'FILLET' | 'CHAMFER' | 'AREA';

export interface CommandAction {
    type: 'START_COMMAND' | 'ENTER_POINT' | 'ENTER_VALUE' | 'SUBCOMMAND' | 'CANCEL' | 'UNKNOWN';
    command?: CommandType;
    subCommand?: SubCommandType;
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
            case 'POL':
            case 'POLYGON':
                return { type: 'START_COMMAND', command: 'POLYGON', raw: input };
            case 'M':
            case 'MOVE':
                return { type: 'START_COMMAND', command: 'MOVE', raw: input };
            case 'CO':
            case 'COPY':
                return { type: 'START_COMMAND', command: 'COPY', raw: input };
            case 'RO':
            case 'ROTATE':
                return { type: 'START_COMMAND', command: 'ROTATE', raw: input };
            case 'O':
            case 'OFFSET':
                return { type: 'START_COMMAND', command: 'OFFSET', raw: input };
            case 'E':
            case 'ERASE':
            case 'DELETE':
                return { type: 'START_COMMAND', command: 'ERASE', raw: input };
            // Subcommands (used during active commands like LINE, POLYLINE)
            case 'CL':
            case 'CLOSE':
                return { type: 'SUBCOMMAND', subCommand: 'CLOSE', raw: input };
            case 'U':
            case 'UNDO':
                return { type: 'SUBCOMMAND', subCommand: 'UNDO', raw: input };
            // CIRCLE subcommands
            case 'D':
            case 'DIAMETER':
                return { type: 'SUBCOMMAND', subCommand: 'DIAMETER', raw: input };
            case 'DIMENSIONS':
                return { type: 'SUBCOMMAND', subCommand: 'DIMENSIONS', raw: input };
            case '2P':
                return { type: 'SUBCOMMAND', subCommand: '2P', raw: input };
            case '3P':
                return { type: 'SUBCOMMAND', subCommand: '3P', raw: input };
            case 'F':
            case 'FILLET':
                return { type: 'SUBCOMMAND', subCommand: 'FILLET', raw: input };
            case 'CHA':
            case 'CHAMFER':
                return { type: 'SUBCOMMAND', subCommand: 'CHAMFER', raw: input };
            case 'AREA':
                return { type: 'SUBCOMMAND', subCommand: 'AREA', raw: input };
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

        // 3. Check for Polar Coordinates (@length<angle)
        // Format: @100<45 means 100 units at 45 degrees
        if (trimmed.includes('<')) {
            const isRelative = trimmed.startsWith('@');
            const cleanInput = trimmed.replace('@', '');
            const parts = cleanInput.split('<');

            if (parts.length === 2) {
                const length = parseFloat(parts[0]);
                const angleDeg = parseFloat(parts[1]);

                if (!isNaN(length) && !isNaN(angleDeg)) {
                    // Convert polar to cartesian
                    const angleRad = angleDeg * (Math.PI / 180);
                    const x = length * Math.cos(angleRad);
                    const y = length * Math.sin(angleRad);

                    return {
                        type: 'ENTER_POINT',
                        point: { x, y, isRelative: isRelative || true }, // Polar is always relative
                        raw: input
                    };
                }
            }
        }

        // 4. Check for Single Value (Radius, Length, etc.)
        const val = parseFloat(trimmed);
        if (!isNaN(val)) {
            return { type: 'ENTER_VALUE', value: val, raw: input };
        }

        return { type: 'UNKNOWN', raw: input };
    }
}
