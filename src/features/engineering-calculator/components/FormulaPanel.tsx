import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calculator, Droplet, Thermometer, Cog, Shield, Circle } from 'lucide-react';

// Formula definitions with input fields
export interface FormulaDefinition {
    id: string;
    name: string;
    nameEN: string;
    formula: string;
    description: string;
    inputs: {
        name: string;
        symbol: string;
        unit: string;
        placeholder?: string;
    }[];
    output: {
        name: string;
        symbol: string;
        unit: string;
    };
    calculate: (inputs: Record<string, number>) => number;
}

// Formula categories
const formulaCategories = [
    {
        id: 'strength',
        name: 'Mukavemet',
        icon: Shield,
        color: '#ef4444',
        formulas: [
            {
                id: 'normal_stress',
                name: 'Normal Gerilme',
                nameEN: 'Normal Stress',
                formula: 'σ = F / A',
                description: 'Eksenel yük altında gerilme',
                inputs: [
                    { name: 'Kuvvet', symbol: 'F', unit: 'N', placeholder: '1000' },
                    { name: 'Alan', symbol: 'A', unit: 'm²', placeholder: '0.001' },
                ],
                output: { name: 'Gerilme', symbol: 'σ', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => inputs.F / inputs.A,
            },
            {
                id: 'shear_stress',
                name: 'Kayma Gerilmesi',
                nameEN: 'Shear Stress',
                formula: 'τ = V / A',
                description: 'Kayma kuvveti altında gerilme',
                inputs: [
                    { name: 'Kayma Kuvveti', symbol: 'V', unit: 'N', placeholder: '500' },
                    { name: 'Alan', symbol: 'A', unit: 'm²', placeholder: '0.001' },
                ],
                output: { name: 'Kayma Gerilmesi', symbol: 'τ', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => inputs.V / inputs.A,
            },
            {
                id: 'bending_stress',
                name: 'Eğilme Gerilmesi',
                nameEN: 'Bending Stress',
                formula: 'σ = M × y / I',
                description: 'Eğilme momenti altında gerilme',
                inputs: [
                    { name: 'Moment', symbol: 'M', unit: 'N·m', placeholder: '100' },
                    { name: 'Merkez Uzaklık', symbol: 'y', unit: 'm', placeholder: '0.05' },
                    { name: 'Atalet Momenti', symbol: 'I', unit: 'm⁴', placeholder: '1e-6' },
                ],
                output: { name: 'Gerilme', symbol: 'σ', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => (inputs.M * inputs.y) / inputs.I,
            },
            {
                id: 'von_mises',
                name: 'Von Mises Gerilmesi',
                nameEN: 'Von Mises Stress',
                formula: 'σvm = √(σx² - σx×σy + σy² + 3τxy²)',
                description: '2D gerilme durumu için eşdeğer gerilme',
                inputs: [
                    { name: 'σx', symbol: 'σx', unit: 'Pa', placeholder: '100e6' },
                    { name: 'σy', symbol: 'σy', unit: 'Pa', placeholder: '50e6' },
                    { name: 'τxy', symbol: 'τxy', unit: 'Pa', placeholder: '30e6' },
                ],
                output: { name: 'Von Mises', symbol: 'σvm', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => {
                    const { σx, σy, τxy } = inputs;
                    return Math.sqrt(σx * σx - σx * σy + σy * σy + 3 * τxy * τxy);
                },
            },
            {
                id: 'safety_factor',
                name: 'Güvenlik Faktörü',
                nameEN: 'Safety Factor',
                formula: 'n = σy / σ',
                description: 'Malzeme akma dayanımına göre güvenlik',
                inputs: [
                    { name: 'Akma Dayanımı', symbol: 'σy', unit: 'Pa', placeholder: '250e6' },
                    { name: 'Uygulanan Gerilme', symbol: 'σ', unit: 'Pa', placeholder: '100e6' },
                ],
                output: { name: 'Güvenlik Faktörü', symbol: 'n', unit: '-' },
                calculate: (inputs: Record<string, number>) => inputs.σy / inputs.σ,
            },
        ],
    },
    {
        id: 'fluids',
        name: 'Akışkanlar',
        icon: Droplet,
        color: '#3b82f6',
        formulas: [
            {
                id: 'reynolds',
                name: 'Reynolds Sayısı',
                nameEN: 'Reynolds Number',
                formula: 'Re = ρ × v × D / μ',
                description: 'Akış rejimini belirler (laminer/türbülanslı)',
                inputs: [
                    { name: 'Yoğunluk', symbol: 'ρ', unit: 'kg/m³', placeholder: '1000' },
                    { name: 'Hız', symbol: 'v', unit: 'm/s', placeholder: '2' },
                    { name: 'Çap', symbol: 'D', unit: 'm', placeholder: '0.05' },
                    { name: 'Dinamik Viskozite', symbol: 'μ', unit: 'Pa·s', placeholder: '0.001' },
                ],
                output: { name: 'Reynolds', symbol: 'Re', unit: '-' },
                calculate: (inputs: Record<string, number>) => (inputs.ρ * inputs.v * inputs.D) / inputs.μ,
            },
            {
                id: 'dynamic_pressure',
                name: 'Dinamik Basınç',
                nameEN: 'Dynamic Pressure',
                formula: 'q = ½ × ρ × v²',
                description: 'Hız basıncı',
                inputs: [
                    { name: 'Yoğunluk', symbol: 'ρ', unit: 'kg/m³', placeholder: '1.225' },
                    { name: 'Hız', symbol: 'v', unit: 'm/s', placeholder: '10' },
                ],
                output: { name: 'Dinamik Basınç', symbol: 'q', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => 0.5 * inputs.ρ * inputs.v * inputs.v,
            },
            {
                id: 'hydrostatic_pressure',
                name: 'Hidrostatik Basınç',
                nameEN: 'Hydrostatic Pressure',
                formula: 'P = ρ × g × h',
                description: 'Derinliğe bağlı basınç',
                inputs: [
                    { name: 'Yoğunluk', symbol: 'ρ', unit: 'kg/m³', placeholder: '1000' },
                    { name: 'Derinlik', symbol: 'h', unit: 'm', placeholder: '10' },
                ],
                output: { name: 'Basınç', symbol: 'P', unit: 'Pa' },
                calculate: (inputs: Record<string, number>) => inputs.ρ * 9.80665 * inputs.h,
            },
            {
                id: 'flow_rate',
                name: 'Hacimsel Debi',
                nameEN: 'Volumetric Flow Rate',
                formula: 'Q = A × v',
                description: 'Birim zamanda akan hacim',
                inputs: [
                    { name: 'Kesit Alanı', symbol: 'A', unit: 'm²', placeholder: '0.00196' },
                    { name: 'Hız', symbol: 'v', unit: 'm/s', placeholder: '2' },
                ],
                output: { name: 'Debi', symbol: 'Q', unit: 'm³/s' },
                calculate: (inputs: Record<string, number>) => inputs.A * inputs.v,
            },
        ],
    },
    {
        id: 'thermal',
        name: 'Isı Transferi',
        icon: Thermometer,
        color: '#f97316',
        formulas: [
            {
                id: 'conduction',
                name: 'Isı İletimi (Fourier)',
                nameEN: 'Heat Conduction',
                formula: 'Q = k × A × ΔT / L',
                description: 'Düz duvar için ısı iletimi',
                inputs: [
                    { name: 'Isıl İletkenlik', symbol: 'k', unit: 'W/(m·K)', placeholder: '50' },
                    { name: 'Alan', symbol: 'A', unit: 'm²', placeholder: '1' },
                    { name: 'Sıcaklık Farkı', symbol: 'ΔT', unit: 'K', placeholder: '50' },
                    { name: 'Kalınlık', symbol: 'L', unit: 'm', placeholder: '0.1' },
                ],
                output: { name: 'Isı Akısı', symbol: 'Q', unit: 'W' },
                calculate: (inputs: Record<string, number>) => (inputs.k * inputs.A * inputs.ΔT) / inputs.L,
            },
            {
                id: 'convection',
                name: 'Isı Taşınımı (Newton)',
                nameEN: 'Heat Convection',
                formula: 'Q = h × A × ΔT',
                description: 'Yüzeyden akışkana ısı transferi',
                inputs: [
                    { name: 'Taşınım Katsayısı', symbol: 'h', unit: 'W/(m²·K)', placeholder: '25' },
                    { name: 'Alan', symbol: 'A', unit: 'm²', placeholder: '1' },
                    { name: 'Sıcaklık Farkı', symbol: 'ΔT', unit: 'K', placeholder: '30' },
                ],
                output: { name: 'Isı Akısı', symbol: 'Q', unit: 'W' },
                calculate: (inputs: Record<string, number>) => inputs.h * inputs.A * inputs.ΔT,
            },
            {
                id: 'nusselt',
                name: 'Nusselt Sayısı',
                nameEN: 'Nusselt Number',
                formula: 'Nu = h × L / k',
                description: 'Taşınım/iletim oranı',
                inputs: [
                    { name: 'Taşınım Katsayısı', symbol: 'h', unit: 'W/(m²·K)', placeholder: '100' },
                    { name: 'Karakteristik Uzunluk', symbol: 'L', unit: 'm', placeholder: '0.1' },
                    { name: 'Isıl İletkenlik', symbol: 'k', unit: 'W/(m·K)', placeholder: '0.6' },
                ],
                output: { name: 'Nusselt', symbol: 'Nu', unit: '-' },
                calculate: (inputs: Record<string, number>) => (inputs.h * inputs.L) / inputs.k,
            },
        ],
    },
    {
        id: 'machine',
        name: 'Makine Elemanları',
        icon: Cog,
        color: '#8b5cf6',
        formulas: [
            {
                id: 'shaft_power',
                name: 'Şaft Gücü',
                nameEN: 'Shaft Power',
                formula: 'P = T × 2πn/60',
                description: 'Dönen mil tarafından iletilen güç',
                inputs: [
                    { name: 'Tork', symbol: 'T', unit: 'N·m', placeholder: '100' },
                    { name: 'Devir', symbol: 'n', unit: 'rpm', placeholder: '1500' },
                ],
                output: { name: 'Güç', symbol: 'P', unit: 'W' },
                calculate: (inputs: Record<string, number>) => inputs.T * 2 * Math.PI * inputs.n / 60,
            },
            {
                id: 'shaft_torque',
                name: 'Mil Torku',
                nameEN: 'Shaft Torque',
                formula: 'T = P × 60 / (2πn)',
                description: 'Güçten tork hesabı',
                inputs: [
                    { name: 'Güç', symbol: 'P', unit: 'W', placeholder: '15000' },
                    { name: 'Devir', symbol: 'n', unit: 'rpm', placeholder: '1500' },
                ],
                output: { name: 'Tork', symbol: 'T', unit: 'N·m' },
                calculate: (inputs: Record<string, number>) => (inputs.P * 60) / (2 * Math.PI * inputs.n),
            },
            {
                id: 'shaft_diameter',
                name: 'Mil Çapı (Burulma)',
                nameEN: 'Shaft Diameter',
                formula: 'd = ∛(16T / (π×τ))',
                description: 'Saf burulma için gereken çap',
                inputs: [
                    { name: 'Tork', symbol: 'T', unit: 'N·m', placeholder: '100' },
                    { name: 'İzin Verilen Kayma', symbol: 'τ', unit: 'Pa', placeholder: '40e6' },
                ],
                output: { name: 'Çap', symbol: 'd', unit: 'm' },
                calculate: (inputs: Record<string, number>) => Math.pow((16 * inputs.T) / (Math.PI * inputs.τ), 1 / 3),
            },
            {
                id: 'bolt_preload',
                name: 'Cıvata Ön Yükü',
                nameEN: 'Bolt Preload',
                formula: 'Fi = T / (K × d)',
                description: 'Sıkma torkundan ön yük',
                inputs: [
                    { name: 'Sıkma Torku', symbol: 'T', unit: 'N·m', placeholder: '50' },
                    { name: 'Tork Katsayısı', symbol: 'K', unit: '-', placeholder: '0.2' },
                    { name: 'Nominal Çap', symbol: 'd', unit: 'm', placeholder: '0.012' },
                ],
                output: { name: 'Ön Yük', symbol: 'Fi', unit: 'N' },
                calculate: (inputs: Record<string, number>) => inputs.T / (inputs.K * inputs.d),
            },
            {
                id: 'bearing_life',
                name: 'Rulman Ömrü L10',
                nameEN: 'Bearing L10 Life',
                formula: 'L10 = (C/P)³',
                description: 'Milyon devir cinsinden ömür',
                inputs: [
                    { name: 'Dinamik Yük Kapasitesi', symbol: 'C', unit: 'N', placeholder: '50000' },
                    { name: 'Eşdeğer Yük', symbol: 'P', unit: 'N', placeholder: '10000' },
                ],
                output: { name: 'L10 Ömrü', symbol: 'L10', unit: 'Mrev' },
                calculate: (inputs: Record<string, number>) => Math.pow(inputs.C / inputs.P, 3),
            },
            {
                id: 'spring_rate',
                name: 'Yay Sabiti',
                nameEN: 'Spring Rate',
                formula: 'k = Gd⁴ / (8D³Na)',
                description: 'Helisel yay yay sabiti',
                inputs: [
                    { name: 'Kayma Modülü', symbol: 'G', unit: 'Pa', placeholder: '79.3e9' },
                    { name: 'Tel Çapı', symbol: 'd', unit: 'm', placeholder: '0.003' },
                    { name: 'Ortalama Çap', symbol: 'D', unit: 'm', placeholder: '0.025' },
                    { name: 'Aktif Sarım', symbol: 'Na', unit: '-', placeholder: '10' },
                ],
                output: { name: 'Yay Sabiti', symbol: 'k', unit: 'N/m' },
                calculate: (inputs: Record<string, number>) =>
                    (inputs.G * Math.pow(inputs.d, 4)) / (8 * Math.pow(inputs.D, 3) * inputs.Na),
            },
        ],
    },
    {
        id: 'section',
        name: 'Kesit Özellikleri',
        icon: Circle,
        color: '#10b981',
        formulas: [
            {
                id: 'circle_area',
                name: 'Daire Alanı',
                nameEN: 'Circle Area',
                formula: 'A = π × r²',
                description: 'Dairesel kesit alanı',
                inputs: [
                    { name: 'Yarıçap', symbol: 'r', unit: 'm', placeholder: '0.05' },
                ],
                output: { name: 'Alan', symbol: 'A', unit: 'm²' },
                calculate: (inputs: Record<string, number>) => Math.PI * inputs.r * inputs.r,
            },
            {
                id: 'circle_inertia',
                name: 'Daire Atalet Momenti',
                nameEN: 'Circle Moment of Inertia',
                formula: 'I = π × r⁴ / 4',
                description: 'Dairesel kesit atalet momenti',
                inputs: [
                    { name: 'Yarıçap', symbol: 'r', unit: 'm', placeholder: '0.05' },
                ],
                output: { name: 'Atalet Momenti', symbol: 'I', unit: 'm⁴' },
                calculate: (inputs: Record<string, number>) => (Math.PI * Math.pow(inputs.r, 4)) / 4,
            },
            {
                id: 'pipe_area',
                name: 'Boru Kesit Alanı',
                nameEN: 'Pipe Cross Section',
                formula: 'A = π × (ro² - ri²)',
                description: 'İçi boş dairesel kesit',
                inputs: [
                    { name: 'Dış Yarıçap', symbol: 'ro', unit: 'm', placeholder: '0.05' },
                    { name: 'İç Yarıçap', symbol: 'ri', unit: 'm', placeholder: '0.04' },
                ],
                output: { name: 'Alan', symbol: 'A', unit: 'm²' },
                calculate: (inputs: Record<string, number>) => Math.PI * (inputs.ro * inputs.ro - inputs.ri * inputs.ri),
            },
            {
                id: 'rectangle_inertia',
                name: 'Dikdörtgen Atalet Momenti',
                nameEN: 'Rectangle Moment of Inertia',
                formula: 'I = b × h³ / 12',
                description: 'Dikdörtgen kesit atalet momenti',
                inputs: [
                    { name: 'Genişlik', symbol: 'b', unit: 'm', placeholder: '0.1' },
                    { name: 'Yükseklik', symbol: 'h', unit: 'm', placeholder: '0.2' },
                ],
                output: { name: 'Atalet Momenti', symbol: 'I', unit: 'm⁴' },
                calculate: (inputs: Record<string, number>) => (inputs.b * Math.pow(inputs.h, 3)) / 12,
            },
        ],
    },
];

interface FormulaPanelProps {
    onInsertFormula?: (formula: string) => void;
}

export const FormulaPanel: React.FC<FormulaPanelProps> = ({ onInsertFormula }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>('strength');
    const [selectedFormula, setSelectedFormula] = useState<FormulaDefinition | null>(null);
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [result, setResult] = useState<{ value: number; unit: string } | null>(null);

    const handleCategoryClick = (categoryId: string) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
        setSelectedFormula(null);
        setResult(null);
    };

    const handleFormulaSelect = (formula: FormulaDefinition) => {
        setSelectedFormula(formula);
        setInputValues({});
        setResult(null);
    };

    const handleInputChange = (symbol: string, value: string) => {
        setInputValues(prev => ({ ...prev, [symbol]: value }));
    };

    const handleCalculate = () => {
        if (!selectedFormula) return;

        const numericInputs: Record<string, number> = {};
        for (const input of selectedFormula.inputs) {
            const value = parseFloat(inputValues[input.symbol] || '0');
            if (isNaN(value)) {
                setResult(null);
                return;
            }
            numericInputs[input.symbol] = value;
        }

        try {
            const calcResult = selectedFormula.calculate(numericInputs);
            setResult({ value: calcResult, unit: selectedFormula.output.unit });
        } catch {
            setResult(null);
        }
    };

    const formatResult = (value: number): string => {
        if (Math.abs(value) < 0.001 || Math.abs(value) >= 1e6) {
            return value.toExponential(4);
        }
        return value.toPrecision(6);
    };

    return (
        <div className="formula-panel" style={{ height: '100%', overflowY: 'auto' }}>
            {/* Category list */}
            {formulaCategories.map(category => {
                const Icon = category.icon;
                const isExpanded = expandedCategory === category.id;

                return (
                    <div key={category.id} className="mb-2">
                        {/* Category header */}
                        <button
                            onClick={() => handleCategoryClick(category.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: 'var(--color-text)' }}
                        >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <Icon size={18} style={{ color: category.color }} />
                            <span className="font-medium text-sm">{category.name}</span>
                            <span className="text-xs opacity-50 ml-auto">{category.formulas.length}</span>
                        </button>

                        {/* Formulas list */}
                        {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1">
                                {category.formulas.map(formula => (
                                    <button
                                        key={formula.id}
                                        onClick={() => handleFormulaSelect(formula as FormulaDefinition)}
                                        className={`w-full text-left p-2 rounded text-sm transition-colors ${selectedFormula?.id === formula.id
                                            ? 'bg-blue-100 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        <div className="font-mono text-xs" style={{ color: category.color }}>
                                            {formula.formula}
                                        </div>
                                        <div className="text-xs opacity-70 mt-0.5">{formula.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Selected formula calculator */}
            {selectedFormula && (
                <div
                    className="mt-4 p-4 rounded-lg border"
                    style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-background)'
                    }}
                >
                    <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                        {selectedFormula.name}
                    </h3>
                    <div className="font-mono text-blue-600 mb-2">{selectedFormula.formula}</div>
                    <p className="text-xs opacity-70 mb-3" style={{ color: 'var(--color-text)' }}>
                        {selectedFormula.description}
                    </p>

                    {/* Input fields */}
                    <div className="space-y-2 mb-3">
                        {selectedFormula.inputs.map(input => (
                            <div key={input.symbol} className="flex items-center gap-2">
                                <label className="text-xs w-24 truncate" style={{ color: 'var(--color-text)' }}>
                                    {input.name} ({input.symbol})
                                </label>
                                <input
                                    type="number"
                                    className="flex-1 px-2 py-1 text-sm rounded border"
                                    style={{
                                        borderColor: 'var(--color-border)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)'
                                    }}
                                    placeholder={input.placeholder}
                                    value={inputValues[input.symbol] || ''}
                                    onChange={(e) => handleInputChange(input.symbol, e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs opacity-50 w-16">{input.unit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calculate button */}
                    <button
                        onClick={handleCalculate}
                        className="w-full py-2 px-4 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Calculator size={16} />
                        Hesapla
                    </button>

                    {/* Result */}
                    {result && (
                        <div
                            className="mt-3 p-3 rounded-lg text-center"
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        >
                            <div className="text-xs opacity-70" style={{ color: 'var(--color-text)' }}>
                                {selectedFormula.output.name} ({selectedFormula.output.symbol})
                            </div>
                            <div className="font-mono text-xl font-bold text-blue-600">
                                {formatResult(result.value)} <span className="text-sm">{result.unit}</span>
                            </div>
                        </div>
                    )}

                    {/* Insert to calculator */}
                    {onInsertFormula && (
                        <button
                            onClick={() => onInsertFormula(selectedFormula.formula.split('=')[1].trim())}
                            className="w-full mt-2 py-1.5 text-xs rounded border hover:bg-gray-50 transition-colors"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)'
                            }}
                        >
                            Formülü hesap makinesine ekle
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
