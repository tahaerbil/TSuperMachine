import { useState, useCallback, useRef } from 'react';
import type { UsePDFUIReturn } from '../types';

/**
 * Hook for managing PDF viewer UI state (sidebar, search, etc.)
 */
export function usePDFUI(): UsePDFUIReturn {
    const [showSidebar, setShowSidebar] = useState<boolean>(true);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [searchQuery, setSearchQueryState] = useState<string>('');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const toggleSidebar = useCallback(() => {
        setShowSidebar(prev => !prev);
    }, []);

    const toggleSearch = useCallback(() => {
        setShowSearch(prev => {
            const newState = !prev;
            if (newState) {
                // Focus search input when opening
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
            return newState;
        });
    }, []);

    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);
    }, []);

    const closeSearch = useCallback(() => {
        setShowSearch(false);
        setSearchQueryState('');
    }, []);

    return {
        showSidebar,
        showSearch,
        searchQuery,
        searchInputRef,
        toggleSidebar,
        toggleSearch,
        setSearchQuery,
        closeSearch,
    };
}
