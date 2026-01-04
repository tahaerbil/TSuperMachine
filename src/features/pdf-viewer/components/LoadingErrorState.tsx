import React from 'react';
import { X } from 'lucide-react';

interface LoadingErrorStateProps {
    isLoading: boolean;
    loadError: string | null;
    onRetry?: () => void;
    compact?: boolean;
}

/**
 * Loading spinner and error state display
 */
export const LoadingErrorState: React.FC<LoadingErrorStateProps> = ({
    isLoading,
    loadError,
    onRetry,
    compact = false,
}) => {
    if (isLoading) {
        return (
            <div className={`flex flex-col items-center justify-center h-full gap-${compact ? '3' : '4'}`}>
                <div className={`w-${compact ? '8' : '10'} h-${compact ? '8' : '10'} border-2 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin`} />
                <p className={`text-${compact ? 'xs' : 'sm'} text-white/50`}>
                    {compact ? 'Loading...' : 'Loading PDF...'}
                </p>
            </div>
        );
    }

    if (loadError) {
        if (compact) {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
                    <X size={20} className="text-red-400" />
                    <p className="text-xs text-red-400">{loadError}</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <X size={24} className="text-red-400" />
                </div>
                <p className="text-sm text-red-400">{loadError}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs text-white/50 hover:text-white/80 underline"
                    >
                        Try again
                    </button>
                )}
            </div>
        );
    }

    return null;
};
