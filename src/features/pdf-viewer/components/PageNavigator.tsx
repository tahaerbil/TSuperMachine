import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PageNavigatorProps {
    pageNumber: number;
    numPages: number;
    pageInputValue: string;
    onPrevPage: () => void;
    onNextPage: () => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onInputBlur: () => void;
    onInputKeyDown: (e: React.KeyboardEvent) => void;
    compact?: boolean;
}

/**
 * Page navigation controls with input field
 */
export const PageNavigator: React.FC<PageNavigatorProps> = ({
    pageNumber,
    numPages,
    pageInputValue,
    onPrevPage,
    onNextPage,
    onInputChange,
    onInputBlur,
    onInputKeyDown,
    compact = false,
}) => {
    const baseButtonStyle = "p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed";
    const baseTextStyle = "text-white/70";

    if (compact) {
        return (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={onPrevPage}
                    disabled={pageNumber <= 1}
                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronUp size={14} />
                </button>
                <span className="text-[10px] text-white/80 min-w-[40px] text-center">
                    {pageNumber} / {numPages}
                </span>
                <button
                    onClick={onNextPage}
                    disabled={pageNumber >= numPages}
                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronDown size={14} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onPrevPage}
                disabled={pageNumber <= 1}
                className={`${baseButtonStyle} ${baseTextStyle}`}
                title="Previous page (←)"
            >
                <ChevronUp size={16} />
            </button>
            <div className="flex items-center gap-1 text-xs">
                <input
                    type="text"
                    value={pageInputValue}
                    onChange={onInputChange}
                    onBlur={onInputBlur}
                    onKeyDown={onInputKeyDown}
                    className="w-8 px-1 py-0.5 text-center bg-white/5 border border-white/10 rounded text-white/90 focus:outline-none focus:border-[var(--color-primary)]"
                />
                <span className="text-white/50">/</span>
                <span className="text-white/70">{numPages}</span>
            </div>
            <button
                onClick={onNextPage}
                disabled={pageNumber >= numPages}
                className={`${baseButtonStyle} ${baseTextStyle}`}
                title="Next page (→)"
            >
                <ChevronDown size={16} />
            </button>
        </div>
    );
};
