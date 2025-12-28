import React, { useState, useCallback, useEffect } from 'react';
import { Send, Calculator, Ruler, Database, Trash2, BookOpen, Activity, Cpu, Code, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCalculator } from './hooks/useCalculator';
import { UnitConverter } from './components/UnitConverter';
import { MaterialSelector } from './components/MaterialSelector';
import { FormulaPanel } from './components/FormulaPanel';
import { quickFormulas } from './formulas';
import { isNativeAvailable } from './native/calcEngine';
import { isThermodynamicsAvailable } from './api/thermodynamics';
import { exportEngineeringReport } from './utils/exportPdf';
import {
    StressStrainDiagram,
    MohrCircle,
    BeamDeflectionDiagram,
    SNDiagram,
    PHDiagram
} from './components/EngineeringCharts';

// Import styles (make sure this file handles the new classes or use inline tailwind)
import './styles/calculator.css';

type TabType = 'calculator' | 'units' | 'materials' | 'formulas' | 'charts';
type ChartType = 'stress-strain' | 'mohr' | 'beam' | 'sn' | 'ph';

interface EngineeringCalculatorProps {
    id?: string;
    isMaximized?: boolean;
}

// Status Indicator Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatusIndicator = ({ active, label, icon: Icon }: { active: boolean, label: string, icon: any }) => (
    <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${active
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20 opacity-50'
            }`}
        title={`${label} ${active ? 'Active' : 'Inactive'}`}
    >
        <Icon size={10} />
        <span>{label}</span>
    </div>
);

export const EngineeringCalculator: React.FC<EngineeringCalculatorProps> = ({
    isMaximized = false
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('calculator');
    const [status, setStatus] = useState({ native: false, python: false });
    const [chartType, setChartType] = useState<ChartType>('stress-strain');

    // Check backends on load
    useEffect(() => {
        const checkBackends = async () => {
            const native = isNativeAvailable();
            const python = await isThermodynamicsAvailable();
            setStatus({ native, python });
        };
        checkBackends();

        // Re-check every 5 seconds
        const interval = setInterval(checkBackends, 5000);
        return () => clearInterval(interval);
    }, []);

    const {
        input,
        setInput,
        history,
        calculate,
        clearHistory,
        insertFormula
    } = useCalculator();

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        calculate(input);
    }, [calculate, input]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const handleExportPdf = useCallback(async () => {
        await exportEngineeringReport(history, activeTab, (activeTab === 'charts' ? chartType : ''));
    }, [history, activeTab, chartType]);

    return (
        <div className="calculator-container" onMouseDown={handleMouseDown}>
            {/* Action Bar (Top Right Overlay) */}
            <div className="absolute top-2 right-2 flex gap-2 z-10 items-center transition-opacity opacity-70 hover:opacity-100">
                <button
                    onClick={handleExportPdf}
                    className="h-5 w-5 flex items-center justify-center rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 transition-colors"
                    title="PDF Rapor İndir"
                >
                    <Download size={12} />
                </button>

                <div className="flex gap-1 pl-2 border-l border-gray-700">
                    <StatusIndicator active={status.native} label="CPP" icon={Cpu} />
                    <StatusIndicator active={status.python} label="PY" icon={Code} />
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="calculator-tabs pr-20">
                <button
                    className={`calculator-tab ${activeTab === 'calculator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calculator')}
                >
                    <Calculator size={16} />
                    <span>Hesap</span>
                </button>
                <button
                    className={`calculator-tab ${activeTab === 'formulas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('formulas')}
                >
                    <BookOpen size={16} />
                    <span>Formüller</span>
                </button>
                <button
                    className={`calculator-tab ${activeTab === 'charts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('charts')}
                >
                    <Activity size={16} />
                    <span>Grafikler</span>
                </button>
                <button
                    className={`calculator-tab ${activeTab === 'units' ? 'active' : ''}`}
                    onClick={() => setActiveTab('units')}
                >
                    <Ruler size={16} />
                    <span>Birimler</span>
                </button>
                <button
                    className={`calculator-tab ${activeTab === 'materials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('materials')}
                >
                    <Database size={16} />
                    <span>Malzemeler</span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'calculator' && (
                <>
                    {/* History */}
                    <div className="calculator-history">
                        {history.length === 0 ? (
                            <div className="history-empty">
                                {t('app.widgets.calculator.empty') || 'Hesaplama yapmak için bir ifade girin'}
                                <div className="mt-4 text-xs">
                                    <p className="mb-2 font-medium">Örnekler:</p>
                                    <code className="block mb-1">2 + 2 * 3</code>
                                    <code className="block mb-1">sin(45 deg)</code>
                                    <code className="block mb-1">sqrt(144)</code>
                                    <code className="block mb-1">5 m to cm</code>
                                    <code className="block">stress(1000, 0.01)</code>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={clearHistory}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                                    >
                                        <Trash2 size={12} />
                                        Temizle
                                    </button>
                                </div>
                                {history.map((item) => (
                                    <div key={item.id} className="history-item">
                                        <div className="history-expression">{item.expression}</div>
                                        <div className={`history-result ${item.isError ? 'history-error' : ''}`}>
                                            = {item.result}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Quick formulas */}
                    {isMaximized && (
                        <div className="px-2 py-1 flex gap-1 overflow-x-auto border-t" style={{ borderColor: 'var(--color-border)' }}>
                            {quickFormulas.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => insertFormula(f.name.split('=')[0].trim() + '(')}
                                    className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 whitespace-nowrap"
                                    title={f.desc}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="calculator-input-area">
                        <div className="calculator-input-wrapper">
                            <input
                                type="text"
                                className="calculator-input"
                                placeholder={t('app.widgets.calculator.placeholder') || 'İfade girin...'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                            <button type="submit" className="calculator-submit">
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </>
            )}

            {activeTab === 'formulas' && (
                <div className="flex-1 overflow-y-auto">
                    <FormulaPanel onInsertFormula={insertFormula} />
                </div>
            )}

            {activeTab === 'charts' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-[var(--color-border)] flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setChartType('stress-strain')}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${chartType === 'stress-strain' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 hover:bg-white/5'}`}
                        >
                            Gerilme-Uzama
                        </button>
                        <button
                            onClick={() => setChartType('mohr')}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${chartType === 'mohr' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 hover:bg-white/5'}`}
                        >
                            Mohr Dairesi
                        </button>
                        <button
                            onClick={() => setChartType('beam')}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${chartType === 'beam' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 hover:bg-white/5'}`}
                        >
                            Kiriş Sehim
                        </button>
                        <button
                            onClick={() => setChartType('sn')}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${chartType === 'sn' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 hover:bg-white/5'}`}
                        >
                            S-N Eğrisi
                        </button>
                        <button
                            onClick={() => setChartType('ph')}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${chartType === 'ph' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-gray-700 hover:bg-white/5'}`}
                        >
                            P-h Diyagramı
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                        {chartType === 'stress-strain' && (
                            <div className="w-full">
                                <StressStrainDiagram />
                                <p className="text-xs opacity-50 mt-2 text-center">Örnek: Yapı çeliği (St37) gerilme-uzama eğrisi</p>
                            </div>
                        )}
                        {chartType === 'mohr' && (
                            <div className="w-full">
                                <MohrCircle sigmaX={50e6} sigmaY={10e6} tauXY={20e6} />
                                <p className="text-xs opacity-50 mt-2 text-center">Örnek: σx=50MPa, σy=10MPa, τxy=20MPa</p>
                            </div>
                        )}
                        {chartType === 'beam' && (
                            <div className="w-full">
                                <BeamDeflectionDiagram
                                    length={2}
                                    force={1000}
                                    loadType="center"
                                    supportType="simply"
                                    E={200e9}
                                    I={1e-5}
                                />
                                <p className="text-xs opacity-50 mt-2 text-center">Örnek: L=2m, F=1kN Basit mesnetli kiriş</p>
                            </div>
                        )}
                        {chartType === 'sn' && (
                            <div className="w-full">
                                <SNDiagram Sut={600e6} Se={300e6} appliedStress={400e6} />
                                <p className="text-xs opacity-50 mt-2 text-center">Örnek: Sut=600MPa, Se=300MPa, σa=400MPa</p>
                            </div>
                        )}
                        {chartType === 'ph' && (
                            <div className="w-full">
                                <div className="text-center p-4 border border-dashed border-gray-700 rounded mb-4">
                                    <p className="text-sm">R134a Akışkanı</p>
                                    <p className="text-xs opacity-60">Gerçek zamanlı veriler için Python modülü gereklidir.</p>
                                </div>
                                <PHDiagram
                                    fluidName="R134a"
                                    // Placeholder saturation data
                                    saturationData={{
                                        pressure: [0.1e6, 0.2e6, 0.4e6, 0.6e6, 0.8e6, 1.0e6],
                                        liquidEnthalpy: [200000, 220000, 240000, 260000, 280000, 300000],
                                        vaporEnthalpy: [400000, 410000, 415000, 418000, 420000, 421000],
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'units' && (
                <div className="flex-1 overflow-y-auto">
                    <UnitConverter />
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="flex-1 overflow-y-auto">
                    <MaterialSelector />
                </div>
            )}
        </div>
    );
};
