/**
 * Automation Event Bus
 * 
 * Pub/Sub system for widget-to-widget communication.
 * Widgets emit events, connected widgets receive them.
 */

import type { AutomationEvent, TriggerEvent } from './types';

type EventHandler<T = unknown> = (event: AutomationEvent<T>) => void;

interface Subscription {
    widgetId: string;
    eventType: TriggerEvent;
    handler: EventHandler;
}

class AutomationEventBus {
    private subscriptions: Subscription[] = [];
    private eventHistory: AutomationEvent[] = [];
    private readonly MAX_HISTORY = 100;

    /**
     * Subscribe a widget to receive events.
     * @param widgetId - The widget that will receive events
     * @param eventType - The event type to listen for
     * @param handler - Callback when event is received
     * @returns Unsubscribe function
     */
    subscribe<T = unknown>(
        widgetId: string,
        eventType: TriggerEvent,
        handler: EventHandler<T>
    ): () => void {
        const subscription: Subscription = {
            widgetId,
            eventType,
            handler: handler as EventHandler
        };

        this.subscriptions.push(subscription);

        // Return unsubscribe function
        return () => {
            const index = this.subscriptions.indexOf(subscription);
            if (index > -1) {
                this.subscriptions.splice(index, 1);
            }
        };
    }

    /**
     * Emit an event from a source widget.
     * Only connected widgets (via connectionManager) will receive it.
     * @param event - The event to emit
     * @param targetWidgetIds - Specific widget IDs to notify (from connections)
     */
    emit<T = unknown>(event: AutomationEvent<T>, targetWidgetIds: string[]): void {
        // Store in history
        this.eventHistory.push(event as AutomationEvent);
        if (this.eventHistory.length > this.MAX_HISTORY) {
            this.eventHistory.shift();
        }

        // Notify only connected widgets
        this.subscriptions
            .filter(sub =>
                targetWidgetIds.includes(sub.widgetId) &&
                sub.eventType === event.type
            )
            .forEach(sub => {
                try {
                    sub.handler(event as AutomationEvent);
                } catch (error) {
                    console.error(
                        `[EventBus] Error in handler for widget ${sub.widgetId}:`,
                        error
                    );
                }
            });

        // Debug log
        console.log(
            `[EventBus] Emitted "${event.type}" from ${event.sourceWidgetId} to`,
            targetWidgetIds
        );
    }

    /**
     * Remove all subscriptions for a widget (when widget is destroyed).
     */
    unsubscribeAll(widgetId: string): void {
        this.subscriptions = this.subscriptions.filter(
            sub => sub.widgetId !== widgetId
        );
    }

    /**
     * Get event history for debugging.
     */
    getHistory(): AutomationEvent[] {
        return [...this.eventHistory];
    }

    /**
     * Clear all subscriptions and history.
     */
    clear(): void {
        this.subscriptions = [];
        this.eventHistory = [];
    }
}

// Singleton instance
export const eventBus = new AutomationEventBus();
