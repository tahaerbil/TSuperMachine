import React, { useRef } from 'react';
import { X, Check } from 'lucide-react';
import Draggable from 'react-draggable';

interface ToolDialogProps {
    title: string;
    onClose: () => void;
    onApply: () => void;
    children: React.ReactNode;
    isValid?: boolean;
}

/**
 * Floating, draggable dialog for tool parameters (NX Style)
 */
export const ToolDialog: React.FC<ToolDialogProps> = ({
    title, onClose, onApply, children, isValid = true
}) => {
    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <Draggable handle=".dialog-header" bounds="parent" nodeRef={nodeRef as React.RefObject<HTMLElement>}>
            <div
                ref={nodeRef}
                className="absolute top-10 right-10 w-80 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-[100] flex flex-col font-sans"
            >
                {/* Header */}
                <div className="dialog-header flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 rounded-t-lg cursor-move select-none">
                    <span className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {title}
                    </span>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer (Actions) */}
                <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-end gap-2 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onApply}
                        disabled={!isValid}
                        className={`
                            px-4 py-1.5 text-xs font-bold text-white rounded flex items-center gap-2
                            ${isValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed opacity-50'}
                        `}
                    >
                        <Check size={14} /> OK
                    </button>
                </div>
            </div>
        </Draggable>
    );
};
