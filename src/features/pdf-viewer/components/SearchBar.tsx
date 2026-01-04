import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    searchQuery: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onSearchChange: (query: string) => void;
    onClose: () => void;
}

/**
 * Search bar component for PDF text search
 */
export const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    searchInputRef,
    onSearchChange,
    onClose,
}) => {
    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0f0f14]/80 backdrop-blur-sm">
            <Search size={14} className="text-white/40" />
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search in document..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
            />
            {searchQuery && (
                <button
                    onClick={() => onSearchChange('')}
                    className="p-1 hover:bg-white/10 rounded text-white/50"
                >
                    <X size={14} />
                </button>
            )}
            <button
                onClick={onClose}
                className="text-xs text-white/50 hover:text-white/80"
            >
                ESC
            </button>
        </div>
    );
};
