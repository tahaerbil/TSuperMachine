import { useState, useCallback, useEffect } from 'react';
import type { UsePDFNavigationReturn } from '../types';

/**
 * Hook for managing PDF page navigation
 */
export function usePDFNavigation(numPages: number): UsePDFNavigationReturn {
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageInputValue, setPageInputValue] = useState<string>('1');

    // Sync input value with page number
    useEffect(() => {
        setPageInputValue(pageNumber.toString());
    }, [pageNumber]);

    // Reset to page 1 when numPages changes (new document)
    useEffect(() => {
        if (numPages > 0) {
            setPageNumber(1);
        }
    }, [numPages]);

    const goToPrevPage = useCallback(() => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    }, []);

    const goToNextPage = useCallback(() => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    }, [numPages]);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= numPages) {
            setPageNumber(page);
        }
    }, [numPages]);

    const goToFirstPage = useCallback(() => {
        setPageNumber(1);
    }, []);

    const goToLastPage = useCallback(() => {
        setPageNumber(numPages);
    }, [numPages]);

    const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInputValue(e.target.value);
    }, []);

    const handlePageInputBlur = useCallback(() => {
        const num = parseInt(pageInputValue);
        if (!isNaN(num) && num >= 1 && num <= numPages) {
            setPageNumber(num);
        } else {
            setPageInputValue(pageNumber.toString());
        }
    }, [pageInputValue, numPages, pageNumber]);

    const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handlePageInputBlur();
        }
    }, [handlePageInputBlur]);

    return {
        pageNumber,
        pageInputValue,
        goToPrevPage,
        goToNextPage,
        goToPage,
        goToFirstPage,
        goToLastPage,
        handlePageInputChange,
        handlePageInputBlur,
        handlePageInputKeyDown,
    };
}
