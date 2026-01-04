import React from 'react';
import { FileText, Upload } from 'lucide-react';

interface EmptyStateProps {
    isDragOver: boolean;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    compact?: boolean;
    uploadLabel?: string;
    emptyMessage?: string;
}

/**
 * Empty state displayed when no PDF is loaded
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    isDragOver,
    onFileUpload,
    compact = false,
    uploadLabel = 'Upload',
    emptyMessage = 'No PDF loaded',
}) => {
    if (compact) {
        return (
            <div className={`flex flex-col items-center justify-center h-full gap-3 p-4 transition-all duration-200 ${isDragOver ? 'scale-105' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${isDragOver ? 'bg-[var(--color-primary)]/20' : 'bg-white/5'}`}>
                    <FileText size={24} className={`transition-colors ${isDragOver ? 'text-[var(--color-primary)]' : 'text-white/30'}`} />
                </div>
                <p className="text-xs text-white/40 text-center">
                    {isDragOver ? 'Drop PDF' : emptyMessage}
                </p>
                <label className="cursor-pointer">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] hover:opacity-90 rounded-lg text-xs font-medium transition-all">
                        <Upload size={12} />
                        <span>{uploadLabel}</span>
                    </div>
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={onFileUpload}
                    />
                </label>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center h-full gap-4 transition-all duration-200 ${isDragOver ? 'scale-105' : ''}`}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 ${isDragOver ? 'bg-[var(--color-primary)]/20' : 'bg-white/5'}`}>
                <FileText size={36} className={`transition-colors ${isDragOver ? 'text-[var(--color-primary)]' : 'text-white/30'}`} />
            </div>
            <div className="text-center">
                <p className="text-sm text-white/60 mb-1">
                    {isDragOver ? 'Drop PDF here' : emptyMessage}
                </p>
                <p className="text-xs text-white/30">
                    or drag and drop a file
                </p>
            </div>
            <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 rounded-lg text-sm font-medium transition-all">
                    <Upload size={16} />
                    <span>{uploadLabel}</span>
                </div>
                <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={onFileUpload}
                />
            </label>
        </div>
    );
};
