/**
 * Widget Constants
 * 
 * Constants and utility functions for widget system.
 */

/**
 * List of automation widget types.
 * These widgets have special behavior (no resizing, special styling).
 */
export const AUTOMATION_WIDGET_TYPES = [
    'PDF_EXPORT',
    'CHART_GENERATOR',
    'DATA_LOGGER',
    'SCHEDULER'
] as const;

/**
 * Check if a widget type is an automation widget.
 */
export function isAutomationWidgetType(type: string): boolean {
    return AUTOMATION_WIDGET_TYPES.includes(type as typeof AUTOMATION_WIDGET_TYPES[number]);
}
