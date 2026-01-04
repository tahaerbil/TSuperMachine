import { useEffect, useCallback, useRef } from 'react';
import { eventBus } from '../../../core/services/automation';
import type { AutomationEvent, TriggerEvent } from '../../../core/services/automation';
import type { PDFPayload } from '../types';

interface UseAutomationEventsOptions {
    widgetId: string;
    onPDFReceived: (url: string, filename?: string) => void;
}

/**
 * Hook for subscribing to automation events (e.g., from PDF Export widget)
 */
export function useAutomationEvents({ widgetId, onPDFReceived }: UseAutomationEventsOptions): void {
    const processedEvents = useRef<Set<string>>(new Set());

    const handleAutomationEvent = useCallback((event: AutomationEvent<PDFPayload>) => {
        const eventKey = `${event.sourceWidgetId}-${event.timestamp}`;
        if (processedEvents.current.has(eventKey)) return;
        processedEvents.current.add(eventKey);

        console.log('[PDFViewer] Received event:', event);

        if (event.payload?.pdfBlobUrl) {
            onPDFReceived(event.payload.pdfBlobUrl, event.payload.filename);
        }
    }, [onPDFReceived]);

    useEffect(() => {
        const events: TriggerEvent[] = ['onGenerate'];
        const unsubscribers = events.map(eventType =>
            eventBus.subscribe(widgetId, eventType, handleAutomationEvent)
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [widgetId, handleAutomationEvent]);
}
