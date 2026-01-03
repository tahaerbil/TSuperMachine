/**
 * Automation System Type Definitions
 * 
 * Core types for widget connections and automation events.
 */

// =============================================================================
// Connection Types
// =============================================================================

/**
 * Represents a connection (wire) between two widgets.
 * Source widget emits events, target widget reacts.
 */
export interface Connection {
    id: string;
    sourceWidgetId: string;      // Widget that emits the event
    targetWidgetId: string;      // Widget that receives the event
    triggerEvent: TriggerEvent;  // What triggers the connection
    isActive: boolean;           // Can be temporarily disabled
    createdAt: string;
    sourceHandle?: 'top' | 'right' | 'bottom' | 'left';
    targetHandle?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Events that can trigger a connection.
 * Extensible as new widget types are added.
 */
export type TriggerEvent =
    | 'onSave'           // Widget saved its state
    | 'onChange'         // Widget content changed
    | 'onGenerate'       // Widget generated output (e.g., PDF created)
    | 'onComplete'       // Task/process completed
    | 'onSelect'         // Selection changed
    | 'onExport'         // Data exported
    | 'manual';          // User manually triggers

/**
 * Event payload passed from source to target widget.
 */
export interface AutomationEvent<T = unknown> {
    type: TriggerEvent;
    sourceWidgetId: string;
    sourceWidgetType: string;
    timestamp: string;
    payload: T;
}

// =============================================================================
// Widget Automation Capabilities
// =============================================================================

/**
 * Defines what events a widget can emit (as source).
 */
export interface WidgetEmitCapability {
    widgetType: string;
    emittableEvents: TriggerEvent[];
}

/**
 * Defines what events a widget can receive (as target).
 */
export interface WidgetReceiveCapability {
    widgetType: string;
    receivableEvents: TriggerEvent[];
    // What widget types can connect TO this widget
    acceptsFrom: string[];
}

// =============================================================================
// Automation Widget Types
// =============================================================================

/**
 * Special widget type for automation processors.
 * Unlike regular widgets, these exist primarily to transform data.
 */
export type AutomationWidgetType =
    | 'PDF_EXPORT'
    | 'CHART_GENERATOR'
    | 'DATA_LOGGER'
    | 'SCHEDULER';

/**
 * Registry entry for automation widgets.
 */
export interface AutomationWidgetDefinition {
    type: AutomationWidgetType;
    label: string;
    icon: string;                    // Lucide icon name
    description: string;
    accepts: TriggerEvent[];         // What events it can receive
    emits: TriggerEvent[];           // What events it can emit
    acceptsFromWidgetTypes: string[]; // What widget types can connect to it
}

// =============================================================================
// Drag & Drop State
// =============================================================================

/**
 * State for wire dragging operation.
 */
export interface WireDragState {
    isDragging: boolean;
    sourceWidgetId: string | null;
    startPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
    sourceHandle?: 'top' | 'right' | 'bottom' | 'left';
}

// =============================================================================
// Context Menu State
// =============================================================================

/**
 * State for automation context menu.
 */
export interface AutomationMenuState {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    sourceWidgetId: string | null;
    sourceWidgetType: string | null;
}
