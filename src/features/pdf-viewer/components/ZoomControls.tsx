import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { ZOOM_PRESETS, MIN_ZOOM, MAX_ZOOM } from '../types';
import type { ZoomMode } from '../types';

interface ZoomControlsProps {
    scale: number;
    zoomMode: ZoomMode;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomPreset: (preset: number) => void;
    onFitWidth: () => void;
    onFitPage: () => void;
}

/**
 * Zoom controls with dropdown for presets
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
    scale,
    zoomMode,
    onZoomIn,
    onZoomOut,
    onZoomPreset,
    onFitWidth,
    onFitPage,
}) => {
    const baseButtonStyle = "p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed";
    const baseTextStyle = "text-white/70";

    const getZoomLabel = () => {
        if (zoomMode === 'fitWidth') return 'Fit Width';
        if (zoomMode === 'fitPage') return 'Fit Page';
        return `${Math.round(scale * 100)}%`;
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onZoomOut}
                disabled={scale <= MIN_ZOOM}
                className={`${baseButtonStyle} ${baseTextStyle}`}
                title="Zoom out (Ctrl+-)"
            >
                <ZoomOut size={16} />
            </button>

            {/* Zoom Dropdown */}
            <div className="relative group">
                <button className="flex items-center gap-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/80 min-w-[70px] justify-center transition-colors">
                    {getZoomLabel()}
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 py-1 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 min-w-[120px]">
                    <button
                        onClick={onFitWidth}
                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 text-white/70 hover:text-white"
                    >
                        Fit Width
                    </button>
                    <button
                        onClick={onFitPage}
                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 text-white/70 hover:text-white"
                    >
                        Fit Page
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    {ZOOM_PRESETS.map(preset => (
                        <button
                            key={preset}
                            onClick={() => onZoomPreset(preset)}
                            className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 ${scale === preset ? 'text-[var(--color-primary)]' : 'text-white/70 hover:text-white'}`}
                        >
                            {Math.round(preset * 100)}%
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onZoomIn}
                disabled={scale >= MAX_ZOOM}
                className={`${baseButtonStyle} ${baseTextStyle}`}
                title="Zoom in (Ctrl++)"
            >
                <ZoomIn size={16} />
            </button>
        </div>
    );
};
