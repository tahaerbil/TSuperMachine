/**
 * useExternalWindow Hook
 * 
 * Handles widget pop-out to external browser window:
 * - Opens widget in a new browser window
 * - Copies styles and dark mode settings
 * - Handles window lifecycle (close, bring back)
 * - Renders content via React Portal
 */

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';

interface UseExternalWindowProps {
    widgetId: string;
    widgetTitle: string;
    widgetSize: { width: number; height: number };
    children: React.ReactNode;
}

interface UseExternalWindowReturn {
    /** The external window reference (null if not popped out) */
    externalWindow: Window | null;
    /** Whether widget is currently in external window */
    isInExternalWindow: boolean;
    /** Pop out the widget to external window */
    handlePopOut: (e: React.MouseEvent) => void;
    /** Bring the widget back from external window */
    handleBringBack: () => void;
    /** Render content - returns portal if in external window, otherwise children */
    renderContent: () => React.ReactNode;
}

export function useExternalWindow({
    widgetId,
    widgetTitle,
    widgetSize,
    children,
}: UseExternalWindowProps): UseExternalWindowReturn {
    const [externalWindow, setExternalWindow] = useState<Window | null>(null);

    // Close external window when component unmounts
    useEffect(() => {
        return () => {
            if (externalWindow) {
                externalWindow.close();
            }
        };
    }, [externalWindow]);

    /**
     * Pop out widget to external window
     */
    const handlePopOut = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        // Open new window centered on screen
        const width = widgetSize.width || 600;
        const height = widgetSize.height || 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const newWindow = window.open(
            '',
            `widget-${widgetId}`,
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );

        if (newWindow) {
            newWindow.document.title = widgetTitle;

            // Critical: Copy all styles so Tailwind/CSS vars work
            Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
                newWindow.document.head.appendChild(node.cloneNode(true));
            });

            // Set dark mode class if present in parent
            if (document.documentElement.classList.contains('dark')) {
                newWindow.document.documentElement.classList.add('dark');
            }

            // Copy root CSS variables
            const rootStyle = window.getComputedStyle(document.documentElement);
            newWindow.document.body.style.backgroundColor = rootStyle.getPropertyValue('--color-background');
            newWindow.document.body.style.color = rootStyle.getPropertyValue('--color-text');
            newWindow.document.body.className = document.body.className;

            // Handle window closing manually by user
            newWindow.addEventListener('beforeunload', () => {
                setExternalWindow(null);
            });

            setExternalWindow(newWindow);
        }
    }, [widgetId, widgetTitle, widgetSize]);

    /**
     * Bring widget back from external window
     */
    const handleBringBack = useCallback(() => {
        if (externalWindow) {
            externalWindow.close();
            setExternalWindow(null);
        }
    }, [externalWindow]);

    /**
     * Render content - uses portal when in external window
     */
    const renderContent = useCallback(() => {
        if (externalWindow) {
            // Force children to behave as maximized when in a dedicated window
            const enhancedChildren = React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return React.cloneElement(child, { isMaximized: true } as any);
                }
                return child;
            });

            return createPortal(
                <div
                    className="h-full w-full bg-[#111827] text-white p-0 overflow-hidden"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.stopPropagation()}
                >
                    <div className="h-full w-full flex flex-col">
                        {enhancedChildren}
                    </div>
                </div>,
                externalWindow.document.body
            );
        }
        return children;
    }, [externalWindow, children]);

    return {
        externalWindow,
        isInExternalWindow: externalWindow !== null,
        handlePopOut,
        handleBringBack,
        renderContent,
    };
}

export default useExternalWindow;
