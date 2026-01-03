/**
 * Connection Manager
 * 
 * Manages connections between widgets and coordinates with eventBus.
 * This is the main interface for automation operations.
 */

import { eventBus } from './eventBus';
import type {
    Connection,
    TriggerEvent,
    AutomationEvent,
    AutomationWidgetDefinition
} from './types';

// =============================================================================
// Automation Widget Registry
// =============================================================================

/**
 * Registry of available automation widgets.
 * New automation types are registered here.
 */
export const AUTOMATION_WIDGETS: AutomationWidgetDefinition[] = [
    {
        type: 'PDF_EXPORT',
        label: 'PDF Export',
        icon: 'FileOutput',
        description: 'Generates PDF from connected widget',
        accepts: ['onSave', 'onChange', 'manual'],
        emits: ['onGenerate'],
        acceptsFromWidgetTypes: ['CAD_2D', 'CAD_3D', 'NOTE', 'SPREADSHEET', 'PRESENTATION']
    },
    // Future automations can be added here:
    // {
    //     type: 'CHART_GENERATOR',
    //     label: 'Chart Generator',
    //     ...
    // }
];

// =============================================================================
// Widget Event Capabilities Registry
// =============================================================================

/**
 * Defines what events each widget type can emit.
 */
export const WIDGET_EMIT_CAPABILITIES: Record<string, TriggerEvent[]> = {
    'CAD_2D': ['onSave', 'onChange', 'onSelect'],
    'CAD_3D': ['onSave', 'onChange'],
    'NOTE': ['onSave', 'onChange'],
    'SPREADSHEET': ['onSave', 'onChange'],
    'CALCULATOR': ['onChange'],
    'TODO': ['onComplete', 'onChange'],
    'IMAGE': ['onChange'],
    'PDF': ['onChange'],
    'PRESENTATION': ['onSave', 'onChange'],
    'SETTINGS': ['onChange'],
    'PROJECT': ['onSave'],
    // Automation widgets
    'PDF_EXPORT': ['onGenerate'],
};

// =============================================================================
// Connection Manager Class
// =============================================================================

class ConnectionManager {
    /**
     * Get all automation widgets that can connect FROM a given widget type.
     */
    getAvailableAutomations(sourceWidgetType: string): AutomationWidgetDefinition[] {
        return AUTOMATION_WIDGETS.filter(
            auto => auto.acceptsFromWidgetTypes.includes(sourceWidgetType)
        );
    }

    /**
     * Get trigger events that a widget type can emit.
     */
    getEmittableEvents(widgetType: string): TriggerEvent[] {
        return WIDGET_EMIT_CAPABILITIES[widgetType] || [];
    }

    /**
     * Check if a connection is valid.
     */
    validateConnection(
        sourceWidgetType: string,
        targetWidgetType: string,
        triggerEvent: TriggerEvent
    ): { valid: boolean; reason?: string } {
        // Check if source can emit this event
        const emittable = this.getEmittableEvents(sourceWidgetType);
        if (!emittable.includes(triggerEvent)) {
            return {
                valid: false,
                reason: `${sourceWidgetType} cannot emit "${triggerEvent}" events`
            };
        }

        // Check if target automation accepts from this source type
        const automation = AUTOMATION_WIDGETS.find(a => a.type === targetWidgetType);
        if (automation) {
            if (!automation.acceptsFromWidgetTypes.includes(sourceWidgetType)) {
                return {
                    valid: false,
                    reason: `${targetWidgetType} does not accept connections from ${sourceWidgetType}`
                };
            }
            if (!automation.accepts.includes(triggerEvent)) {
                return {
                    valid: false,
                    reason: `${targetWidgetType} does not accept "${triggerEvent}" events`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Create a new connection object.
     */
    createConnection(
        sourceWidgetId: string,
        targetWidgetId: string,
        triggerEvent: TriggerEvent
    ): Connection {
        return {
            id: crypto.randomUUID(),
            sourceWidgetId,
            targetWidgetId,
            triggerEvent,
            isActive: true,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Emit an event and notify all connected widgets.
     * @param connections - All connections from store
     * @param sourceWidgetId - Widget emitting the event
     * @param sourceWidgetType - Type of the source widget
     * @param eventType - Type of event being emitted
     * @param payload - Data to pass to connected widgets
     */
    emitEvent<T = unknown>(
        connections: Connection[],
        sourceWidgetId: string,
        sourceWidgetType: string,
        eventType: TriggerEvent,
        payload: T
    ): void {
        // Find all active connections from this source with this event type
        const activeConnections = connections.filter(
            conn =>
                conn.sourceWidgetId === sourceWidgetId &&
                conn.triggerEvent === eventType &&
                conn.isActive
        );

        if (activeConnections.length === 0) {
            return; // No connections, nothing to do
        }

        // Get target widget IDs
        const targetWidgetIds = activeConnections.map(c => c.targetWidgetId);

        // Create and emit the event
        const event: AutomationEvent<T> = {
            type: eventType,
            sourceWidgetId,
            sourceWidgetType,
            timestamp: new Date().toISOString(),
            payload
        };

        eventBus.emit(event, targetWidgetIds);
    }

    /**
     * Get all connections where widget is the source.
     */
    getOutgoingConnections(connections: Connection[], widgetId: string): Connection[] {
        return connections.filter(c => c.sourceWidgetId === widgetId);
    }

    /**
     * Get all connections where widget is the target.
     */
    getIncomingConnections(connections: Connection[], widgetId: string): Connection[] {
        return connections.filter(c => c.targetWidgetId === widgetId);
    }

    /**
     * Check if two widgets are connected (in either direction).
     */
    areConnected(connections: Connection[], widgetId1: string, widgetId2: string): boolean {
        return connections.some(
            c => (c.sourceWidgetId === widgetId1 && c.targetWidgetId === widgetId2) ||
                (c.sourceWidgetId === widgetId2 && c.targetWidgetId === widgetId1)
        );
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
