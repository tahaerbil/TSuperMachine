import React, { useMemo } from 'react';
import { Document, Page } from 'react-pdf';

interface ThumbnailSidebarProps {
    pdfUrl: string;
    numPages: number;
    currentPage: number;
    onPageSelect: (page: number) => void;
}

/**
 * Thumbnail sidebar for page navigation
 */
export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
    pdfUrl,
    numPages,
    currentPage,
    onPageSelect,
}) => {
    const thumbnailPages = useMemo(() => {
        return Array.from({ length: numPages }, (_, i) => i + 1);
    }, [numPages]);

    return (
        <div className="w-32 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="p-2 space-y-2">
                <Document
                    file={pdfUrl}
                    loading={null}
                    error={null}
                >
                    {thumbnailPages.map(page => (
                        <button
                            key={page}
                            onClick={() => onPageSelect(page)}
                            className={`w-full p-1 rounded-lg transition-all duration-200 ${currentPage === page ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'hover:bg-white/5'}`}
                        >
                            <div className="aspect-[3/4] bg-white/5 rounded overflow-hidden relative">
                                <Page
                                    pageNumber={page}
                                    width={100}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </div>
                            <p className={`text-[10px] mt-1 text-center ${currentPage === page ? 'text-[var(--color-primary)]' : 'text-white/50'}`}>
                                {page}
                            </p>
                        </button>
                    ))}
                </Document>
            </div>
        </div>
    );
};
