import React from 'react';

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    onClick,
    isActive,
    disabled,
    title,
    children
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        aria-pressed={isActive}
        className={`p-1.5 rounded transition-colors ${isActive
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200 text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);
