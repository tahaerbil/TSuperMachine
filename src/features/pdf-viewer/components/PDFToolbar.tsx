import React from 'react';
import {
    Upload,
    Search,
    RotateCw,
    Download,
    PanelLeft,
    PanelLeftClose
} from 'lucide-react';
import { PageNavigator } from './PageNavigator';
import { ZoomControls } from './ZoomControls';
import type { ZoomMode } from '../types';

interface PDFToolbarProps {
    // PDF State
    pdfUrl: string | null;
    numPages: number;

    // Navigation
    pageNumber: number;
    pageInputValue: string;
    onPrevPage: () => void;
    onNextPage: () => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onInputBlur: () => void;
    onInputKeyDown: (e: React.KeyboardEvent) => void;

    // Zoom
    scale: number;
    zoomMode: ZoomMode;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomPreset: (preset: number) => void;
    onFitWidth: () => void;
    onFitPage: () => void;

    // UI
    showSidebar: boolean;
    showSearch: boolean;
    onToggleSidebar: () => void;
    onToggleSearch: () => void;

    // Actions
    onRotate: () => void;
    onDownload: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Labels
    uploadLabel?: string;
}

/**
 * Main toolbar for PDF viewer (maximized mode)
 */
export const PDFToolbar: React.FC<PDFToolbarProps> = ({
    pdfUrl,
    numPages,
    pageNumber,
    pageInputValue,
    onPrevPage,
    onNextPage,
    onInputChange,
    onInputBlur,
    onInputKeyDown,
    scale,
    zoomMode,
    onZoomIn,
    onZoomOut,
    onZoomPreset,
    onFitWidth,
    onFitPage,
    showSidebar,
    showSearch,
    onToggleSidebar,
    onToggleSearch,
    onRotate,
    onDownload,
    onFileUpload,
    uploadLabel = 'Upload PDF',
}) => {
    const baseButtonStyle = "p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed";
    const baseTextStyle = "text-white/70";
    const activeButtonStyle = "bg-white/10 text-white";

    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0f0f14]/90 backdrop-blur-sm z-10">
            {/* Left Section */}
            <div className="flex items-center gap-1">
                {/* Sidebar Toggle */}
                {pdfUrl && numPages > 1 && (
                    <button
                        onClick={onToggleSidebar}
                        className={`${baseButtonStyle} ${showSidebar ? activeButtonStyle : baseTextStyle}`}
                        title={showSidebar ? 'Hide thumbnails' : 'Show thumbnails'}
                    >
                        {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                    </button>
                )}

                {/* Upload Button */}
                <label className="cursor-pointer">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${pdfUrl ? 'bg-white/5 hover:bg-white/10 text-white/70' : 'bg-[var(--color-primary)] hover:opacity-90 text-white'}`}>
                        <Upload size={14} />
                        <span>{uploadLabel}</span>
                    </div>
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onFileUpload}
                    />
                </label>

                {/* Divider */}
                {pdfUrl && <div className="w-px h-5 bg-white/10 mx-1" />}

                {/* Page Navigation */}
                {pdfUrl && (
                    <PageNavigator
                        pageNumber={pageNumber}
                        numPages={numPages}
                        pageInputValue={pageInputValue}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                        onInputChange={onInputChange}
                        onInputBlur={onInputBlur}
                        onInputKeyDown={onInputKeyDown}
                    />
                )}
            </div>

            {/* Center Section - Zoom Controls */}
            {pdfUrl && (
                <ZoomControls
                    scale={scale}
                    zoomMode={zoomMode}
                    onZoomIn={onZoomIn}
                    onZoomOut={onZoomOut}
                    onZoomPreset={onZoomPreset}
                    onFitWidth={onFitWidth}
                    onFitPage={onFitPage}
                />
            )}

            {/* Right Section */}
            {pdfUrl && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleSearch}
                        className={`${baseButtonStyle} ${showSearch ? activeButtonStyle : baseTextStyle}`}
                        title="Search (Ctrl+F)"
                    >
                        <Search size={16} />
                    </button>
                    <button
                        onClick={onRotate}
                        className={`${baseButtonStyle} ${baseTextStyle}`}
                        title="Rotate (R)"
                    >
                        <RotateCw size={16} />
                    </button>
                    <button
                        onClick={onDownload}
                        className={`${baseButtonStyle} ${baseTextStyle}`}
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
