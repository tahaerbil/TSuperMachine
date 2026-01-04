import React from 'react';

interface StatusBarProps {
    filename: string | null;
    numPages: number;
    scale: number;
    rotation: number;
}

/**
 * Bottom status bar showing PDF info
 */
export const StatusBar: React.FC<StatusBarProps> = ({
    filename,
    numPages,
    scale,
    rotation,
}) => {
    return (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/10 bg-[#0a0a0f]/90 text-xs text-white/40">
            <div className="flex items-center gap-3">
                {filename && (
                    <span className="truncate max-w-[200px]" title={filename}>
                        {filename}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <span>{numPages} pages</span>
                <span>•</span>
                <span>{Math.round(scale * 100)}% zoom</span>
                {rotation !== 0 && (
                    <>
                        <span>•</span>
                        <span>{rotation}° rotated</span>
                    </>
                )}
            </div>
        </div>
    );
};
