/**
 * PDF Export Widget
 * 
 * An automation widget that receives data from connected widgets
 * and exports it as a PDF document.
 * 
 * Features:
 * - Compact mode: Minimal view showing only title and connection count
 * - Expanded mode: Full controls with settings and export button
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FileOutput, Check, Loader2, AlertCircle, Download, Settings, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useStore, getIncomingConnections } from '../../../store/store';
import { eventBus } from '../../../core/services/automation';
import type { AutomationEvent, TriggerEvent } from '../../../core/services/automation';

interface PDFExportWidgetProps {
    id: string;
    isMaximized?: boolean;
}

interface ExportStatus {
    state: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    lastExportTime?: string;
}

interface ExportSettings {
    paperSize: 'a4' | 'letter' | 'a3';
    orientation: 'portrait' | 'landscape';
    autoExport: boolean;
    outputPath: string;
}

const DEFAULT_SETTINGS: ExportSettings = {
    paperSize: 'a4',
    orientation: 'portrait',
    autoExport: true,
    outputPath: 'exports/'
};

// Widget sizes for compact and expanded modes
const COMPACT_SIZE = { width: 180, height: 56 };
const EXPANDED_SIZE = { width: 320, height: 400 };

export const PDFExportWidget: React.FC<PDFExportWidgetProps> = ({ id }) => {
    const { updateWidget } = useStore();
    const [status, setStatus] = useState<ExportStatus>({ state: 'idle' });
    const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [connectionCount, setConnectionCount] = useState(0);
    const [lastPayload, setLastPayload] = useState<unknown>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const processedEvents = useRef<Set<string>>(new Set());
    const hasMounted = useRef(false);

    // Toggle expanded mode and update widget size
    const toggleExpanded = useCallback(() => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        // Update widget size in store
        const newSize = newExpanded ? EXPANDED_SIZE : COMPACT_SIZE;
        updateWidget(id, { size: newSize });
    }, [id, isExpanded, updateWidget]);

    // Set initial compact size on mount
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            if (!isExpanded) {
                updateWidget(id, { size: COMPACT_SIZE });
            }
        }
    }, [id, isExpanded, updateWidget]);

    // Update connection count
    useEffect(() => {
        const checkConnections = () => {
            const connections = getIncomingConnections(id);
            setConnectionCount(connections.length);
        };

        checkConnections();
        const interval = setInterval(checkConnections, 1000);
        return () => clearInterval(interval);
    }, [id]);

    // Generate PDF from payload
    const generatePDF = useCallback(async (payload: unknown, sourceName: string) => {
        setStatus({ state: 'processing', message: 'Generating PDF...' });

        try {
            const doc = new jsPDF({
                orientation: settings.orientation,
                unit: 'mm',
                format: settings.paperSize
            });

            // Add header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('TSuperMachine Export', 20, 20);

            // Add source info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Source: ${sourceName}`, 20, 30);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 36);

            // Add separator line
            doc.setDrawColor(200);
            doc.line(20, 42, 190, 42);

            // Add content based on payload type
            doc.setTextColor(0);
            doc.setFontSize(12);

            if (typeof payload === 'string') {
                const lines = doc.splitTextToSize(payload, 170);
                doc.text(lines, 20, 52);
            } else if (payload && typeof payload === 'object') {
                const jsonStr = JSON.stringify(payload, null, 2);
                const lines = doc.splitTextToSize(jsonStr, 170);
                doc.setFontSize(9);
                doc.setFont('courier', 'normal');
                doc.text(lines, 20, 52);
            } else {
                doc.text('No content to export', 20, 52);
            }

            const filename = `export_${Date.now()}.pdf`;
            const pdfBlob = doc.output('blob');
            const pdfBlobUrl = URL.createObjectURL(pdfBlob);
            doc.save(filename);

            setStatus({
                state: 'success',
                message: `Exported: ${filename}`,
                lastExportTime: new Date().toISOString()
            });

            // Emit onGenerate event for downstream widgets
            const { connections } = useStore.getState();
            const outgoingConnections = connections.filter(c => c.sourceWidgetId === id && c.isActive);

            if (outgoingConnections.length > 0) {
                const event: AutomationEvent = {
                    type: 'onGenerate',
                    sourceWidgetId: id,
                    sourceWidgetType: 'PDF_EXPORT',
                    timestamp: new Date().toISOString(),
                    payload: { filename, success: true, pdfBlobUrl }
                };
                eventBus.emit(event, outgoingConnections.map(c => c.targetWidgetId));
            }

            setTimeout(() => {
                setStatus(prev => prev.state === 'success' ? { state: 'idle' } : prev);
            }, 3000);

        } catch (error) {
            console.error('[PDFExport] Error generating PDF:', error);
            setStatus({
                state: 'error',
                message: error instanceof Error ? error.message : 'Export failed'
            });
        }
    }, [id, settings]);

    // Handle incoming automation events
    const handleAutomationEvent = useCallback((event: AutomationEvent) => {
        const eventKey = `${event.sourceWidgetId}-${event.timestamp}`;
        if (processedEvents.current.has(eventKey)) return;
        processedEvents.current.add(eventKey);

        console.log('[PDFExport] Received event:', event);
        setLastPayload(event.payload);

        if (settings.autoExport) {
            generatePDF(event.payload, event.sourceWidgetType);
        }
    }, [settings.autoExport, generatePDF]);

    // Subscribe to events
    useEffect(() => {
        const events: TriggerEvent[] = ['onSave', 'onChange', 'manual'];
        const unsubscribers = events.map(eventType =>
            eventBus.subscribe(id, eventType, handleAutomationEvent)
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, [id, handleAutomationEvent]);

    // Manual export trigger
    const handleManualExport = () => {
        if (lastPayload) {
            generatePDF(lastPayload, 'Manual Trigger');
        } else {
            setStatus({ state: 'error', message: 'No data received yet' });
        }
    };

    // =========================================================================
    // COMPACT MODE RENDER
    // =========================================================================
    if (!isExpanded) {
        return (
            <div
                className="h-full w-full flex items-center gap-3 px-3 bg-[#1e1e1e] border border-white/10 text-white cursor-pointer select-none"
                onDoubleClick={toggleExpanded}
            >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <FileOutput size={16} className="text-indigo-400" />
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">PDF Export</h3>
                </div>

                {/* Connection badge */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${connectionCount > 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/50'}`}>
                    <Zap size={10} />
                    <span>{connectionCount}</span>
                </div>

                {/* Expand button */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <ChevronDown size={14} className="text-white/50" />
                </button>
            </div>
        );
    }

    // =========================================================================
    // EXPANDED MODE RENDER
    // =========================================================================
    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] border border-white/10 text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <FileOutput size={16} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">PDF Export</h3>
                        <p className="text-[10px] text-white/50">Automation Widget</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-indigo-500/30' : 'hover:bg-white/10'}`}
                    >
                        <Settings size={14} />
                    </button>
                    <button
                        onClick={toggleExpanded}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronUp size={14} className="text-white/50" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 space-y-3 overflow-auto">
                {/* Connection Status */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                    <Zap size={14} className={connectionCount > 0 ? 'text-indigo-400' : 'text-gray-500'} />
                    <span className="text-xs">
                        {connectionCount > 0
                            ? `${connectionCount} connection${connectionCount > 1 ? 's' : ''} active`
                            : 'No connections'
                        }
                    </span>
                </div>

                {/* Status Display */}
                <div className={`
                    flex items-center gap-2 p-3 rounded-lg border transition-all
                    ${status.state === 'idle' ? 'bg-white/5 border-white/10' : ''}
                    ${status.state === 'processing' ? 'bg-blue-500/20 border-blue-500/30' : ''}
                    ${status.state === 'success' ? 'bg-green-500/20 border-green-500/30' : ''}
                    ${status.state === 'error' ? 'bg-red-500/20 border-red-500/30' : ''}
                `}>
                    {status.state === 'idle' && <FileOutput size={16} className="text-gray-400" />}
                    {status.state === 'processing' && <Loader2 size={16} className="text-blue-400 animate-spin" />}
                    {status.state === 'success' && <Check size={16} className="text-green-400" />}
                    {status.state === 'error' && <AlertCircle size={16} className="text-red-400" />}

                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">
                            {status.state === 'idle' && 'Waiting for input...'}
                            {status.state === 'processing' && 'Generating PDF...'}
                            {status.state === 'success' && 'Export Complete'}
                            {status.state === 'error' && 'Export Failed'}
                        </p>
                        {status.message && (
                            <p className="text-[10px] text-white/50 truncate">{status.message}</p>
                        )}
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="text-xs font-medium text-white/80">Settings</h4>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-white/50 block mb-0.5">Paper Size</label>
                                <select
                                    value={settings.paperSize}
                                    onChange={(e) => setSettings(s => ({ ...s, paperSize: e.target.value as ExportSettings['paperSize'] }))}
                                    className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="a4">A4</option>
                                    <option value="a3">A3</option>
                                    <option value="letter">Letter</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 block mb-0.5">Orientation</label>
                                <select
                                    value={settings.orientation}
                                    onChange={(e) => setSettings(s => ({ ...s, orientation: e.target.value as ExportSettings['orientation'] }))}
                                    className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.autoExport}
                                onChange={(e) => setSettings(s => ({ ...s, autoExport: e.target.checked }))}
                                className="w-3 h-3 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-white/80">Auto-export on trigger</span>
                        </label>
                    </div>
                )}

                {/* Manual Export Button */}
                <button
                    onClick={handleManualExport}
                    disabled={status.state === 'processing'}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    <Download size={14} />
                    Export PDF Now
                </button>

                {/* Last Export Info */}
                {status.lastExportTime && (
                    <p className="text-[10px] text-center text-white/30">
                        Last export: {new Date(status.lastExportTime).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PDFExportWidget;
