import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading state skeleton for widgets
 */
export const WidgetLoading: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 animate-pulse rounded-lg">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <span className="text-xs text-gray-400 font-medium">Loading Widget...</span>
        </div>
    );
};
