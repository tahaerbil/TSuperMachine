/**
 * Engineering Charts Component
 * Provides various engineering visualization charts using Plotly
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout, Config } from 'plotly.js';

// Common chart configuration
const commonConfig: Partial<Config> = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    responsive: true,
};

const darkLayout: Partial<Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#e5e7eb' },
    xaxis: {
        gridcolor: 'rgba(255,255,255,0.1)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
    },
    yaxis: {
        gridcolor: 'rgba(255,255,255,0.1)',
        zerolinecolor: 'rgba(255,255,255,0.2)',
    },
    margin: { l: 50, r: 30, t: 40, b: 50 },
};

// ============================================
// STRESS-STRAIN DIAGRAM
// ============================================

interface StressStrainProps {
    data?: { strain: number[]; stress: number[] };
    yieldStrength?: number;
    ultimateStrength?: number;
    title?: string;
    height?: number;
}

export const StressStrainDiagram: React.FC<StressStrainProps> = ({
    data,
    yieldStrength = 250e6,
    ultimateStrength = 400e6,
    title = 'Gerilme-Birim Uzama Diyagramı',
    height = 300,
}) => {
    const chartData = useMemo(() => {
        // Generate typical steel stress-strain curve if no data provided
        if (!data) {
            const E = 200e9; // Young's modulus
            const strainYield = yieldStrength / E;
            const strainUltimate = 0.15;
            const strainFracture = 0.25;

            const strain: number[] = [];
            const stress: number[] = [];

            // Elastic region
            for (let e = 0; e <= strainYield; e += strainYield / 20) {
                strain.push(e * 100); // Convert to %
                stress.push((e * E) / 1e6); // Convert to MPa
            }

            // Yield plateau
            for (let e = strainYield; e <= strainYield * 3; e += strainYield / 10) {
                strain.push(e * 100);
                stress.push(yieldStrength / 1e6);
            }

            // Strain hardening
            for (let e = strainYield * 3; e <= strainUltimate; e += strainUltimate / 20) {
                const s = yieldStrength + (ultimateStrength - yieldStrength) *
                    Math.pow((e - strainYield * 3) / (strainUltimate - strainYield * 3), 0.5);
                strain.push(e * 100);
                stress.push(s / 1e6);
            }

            // Necking
            for (let e = strainUltimate; e <= strainFracture; e += strainFracture / 20) {
                const s = ultimateStrength - (ultimateStrength - yieldStrength * 0.8) *
                    Math.pow((e - strainUltimate) / (strainFracture - strainUltimate), 2);
                strain.push(e * 100);
                stress.push(s / 1e6);
            }

            return [{
                x: strain,
                y: stress,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'σ-ε',
                line: { color: '#3b82f6', width: 2 },
            }];
        }

        return [{
            x: data.strain.map(s => s * 100),
            y: data.stress.map(s => s / 1e6),
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: 'σ-ε',
            line: { color: '#3b82f6', width: 2 },
        }];
    }, [data, yieldStrength, ultimateStrength]);

    const layout: Partial<Layout> = {
        ...darkLayout,
        title: { text: title, font: { size: 14 } },
        xaxis: { ...darkLayout.xaxis, title: { text: 'Birim Uzama ε (%)', standoff: 10 } },
        yaxis: { ...darkLayout.yaxis, title: { text: 'Gerilme σ (MPa)', standoff: 10 } },
        height,
        showlegend: false,
    };

    return <Plot data={chartData as Data[]} layout={layout} config={commonConfig} style={{ width: '100%' }} />;
};

// ============================================
// MOHR'S CIRCLE
// ============================================

interface MohrCircleProps {
    sigmaX: number;  // Pa
    sigmaY: number;  // Pa
    tauXY: number;   // Pa
    title?: string;
    height?: number;
}

export const MohrCircle: React.FC<MohrCircleProps> = ({
    sigmaX,
    sigmaY,
    tauXY,
    title = 'Mohr Gerilme Dairesi',
    height = 300,
}) => {
    const chartData = useMemo(() => {
        // Calculate center and radius
        const center = (sigmaX + sigmaY) / 2 / 1e6;
        const radius = Math.sqrt(Math.pow((sigmaX - sigmaY) / 2, 2) + tauXY * tauXY) / 1e6;

        // Principal stresses
        const sigma1 = center + radius;
        const sigma2 = center - radius;
        const tauMax = radius;

        // Generate circle points
        const theta = Array.from({ length: 100 }, (_, i) => (i / 99) * 2 * Math.PI);
        const circleX = theta.map(t => center + radius * Math.cos(t));
        const circleY = theta.map(t => radius * Math.sin(t));

        // Current state point
        const pointX = sigmaX / 1e6;
        const pointY = tauXY / 1e6;

        return [
            // Circle
            {
                x: circleX,
                y: circleY,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'Mohr Dairesi',
                line: { color: '#3b82f6', width: 2 },
            },
            // Current state
            {
                x: [pointX, sigmaY / 1e6],
                y: [pointY, -tauXY / 1e6],
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Gerilme Durumu',
                marker: { size: 10, color: '#ef4444' },
                line: { color: '#ef4444', dash: 'dash' as const },
            },
            // Principal stresses
            {
                x: [sigma1, sigma2],
                y: [0, 0],
                type: 'scatter' as const,
                mode: 'markers' as const,
                name: 'Asal Gerilmeler',
                marker: { size: 12, color: '#10b981', symbol: 'diamond' },
            },
            // Max shear stress
            {
                x: [center, center],
                y: [tauMax, -tauMax],
                type: 'scatter' as const,
                mode: 'markers' as const,
                name: 'Max Kayma',
                marker: { size: 10, color: '#f97316', symbol: 'triangle-up' },
            },
        ];
    }, [sigmaX, sigmaY, tauXY]);

    const layout: Partial<Layout> = {
        ...darkLayout,
        title: { text: title, font: { size: 14 } },
        xaxis: {
            ...darkLayout.xaxis,
            title: { text: 'Normal Gerilme σ (MPa)', standoff: 10 },
            scaleanchor: 'y',
            scaleratio: 1,
        },
        yaxis: { ...darkLayout.yaxis, title: { text: 'Kayma Gerilmesi τ (MPa)', standoff: 10 } },
        height,
        showlegend: true,
        legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0)' },
    };

    return <Plot data={chartData as Data[]} layout={layout} config={commonConfig} style={{ width: '100%' }} />;
};

// ============================================
// BEAM DEFLECTION DIAGRAM
// ============================================

interface BeamDeflectionProps {
    length: number;  // m
    force: number;   // N
    loadType: 'center' | 'uniform' | 'end';
    supportType: 'simply' | 'cantilever' | 'fixed';
    E: number;       // Pa
    I: number;       // m^4
    title?: string;
    height?: number;
}

export const BeamDeflectionDiagram: React.FC<BeamDeflectionProps> = ({
    length,
    force,
    loadType,
    supportType,
    E,
    I,
    title = 'Kiriş Sehim Diyagramı',
    height = 250,
}) => {
    const chartData = useMemo(() => {
        const points = 50;
        const x: number[] = [];
        const deflection: number[] = [];

        for (let i = 0; i <= points; i++) {
            const pos = (i / points) * length;
            x.push(pos * 1000); // Convert to mm

            let y = 0;

            if (supportType === 'simply' && loadType === 'center') {
                // Simply supported, center load: δ = Fx(3L² - 4x²) / (48EI) for x < L/2
                if (pos <= length / 2) {
                    y = (force * pos * (3 * length * length - 4 * pos * pos)) / (48 * E * I);
                } else {
                    const posFromEnd = length - pos;
                    y = (force * posFromEnd * (3 * length * length - 4 * posFromEnd * posFromEnd)) / (48 * E * I);
                }
            } else if (supportType === 'simply' && loadType === 'uniform') {
                // Simply supported, uniform load: δ = wx(L³ - 2Lx² + x³) / (24EI)
                const w = force / length;
                y = (w * pos * (Math.pow(length, 3) - 2 * length * pos * pos + Math.pow(pos, 3))) / (24 * E * I);
            } else if (supportType === 'cantilever' && loadType === 'end') {
                // Cantilever, end load: δ = Fx²(3L - x) / (6EI)
                y = (force * pos * pos * (3 * length - pos)) / (6 * E * I);
            } else if (supportType === 'cantilever' && loadType === 'uniform') {
                // Cantilever, uniform load: δ = wx²(6L² - 4Lx + x²) / (24EI)
                const w = force / length;
                y = (w * pos * pos * (6 * length * length - 4 * length * pos + pos * pos)) / (24 * E * I);
            }

            deflection.push(-y * 1000); // Convert to mm, negative for downward
        }

        // Find max deflection
        const maxDeflection = Math.min(...deflection);
        const maxIndex = deflection.indexOf(maxDeflection);

        return [
            // Beam line (undeformed)
            {
                x: [0, length * 1000],
                y: [0, 0],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'Deforme olmamış',
                line: { color: 'rgba(255,255,255,0.3)', dash: 'dash' as const, width: 1 },
            },
            // Deflection curve
            {
                x: x,
                y: deflection,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'Sehim (δ)',
                line: { color: '#3b82f6', width: 2 },
                fill: 'tozeroy' as const,
                fillcolor: 'rgba(59, 130, 246, 0.1)',
            },
            // Max deflection point
            {
                x: [x[maxIndex]],
                y: [maxDeflection],
                type: 'scatter' as const,
                mode: 'text+markers' as const,
                name: 'Max Sehim',
                marker: { size: 10, color: '#ef4444' },
                text: [`δmax = ${Math.abs(maxDeflection).toFixed(3)} mm`],
                textposition: 'bottom center' as const,
                textfont: { color: '#ef4444', size: 10 },
            },
        ];
    }, [length, force, loadType, supportType, E, I]);

    const layout: Partial<Layout> = {
        ...darkLayout,
        title: { text: title, font: { size: 14 } },
        xaxis: { ...darkLayout.xaxis, title: { text: 'Konum (mm)', standoff: 10 } },
        yaxis: { ...darkLayout.yaxis, title: { text: 'Sehim δ (mm)', standoff: 10 } },
        height,
        showlegend: true,
        legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0)' },
    };

    return <Plot data={chartData as Data[]} layout={layout} config={commonConfig} style={{ width: '100%' }} />;
};

// ============================================
// S-N FATIGUE CURVE
// ============================================

interface SNDiagramProps {
    Sut: number;  // Ultimate tensile strength (Pa)
    Se: number;   // Endurance limit (Pa)
    appliedStress?: number;  // Applied stress to show on diagram
    title?: string;
    height?: number;
}

export const SNDiagram: React.FC<SNDiagramProps> = ({
    Sut,
    Se,
    appliedStress,
    title = 'S-N Yorulma Eğrisi',
    height = 250,
}) => {
    const chartData = useMemo(() => {
        // S-N curve points (log scale)
        const N = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
        const S = N.map(n => {
            if (n <= 1e3) return Sut * 0.9;
            if (n >= 1e6) return Se;
            // Linear interpolation in log space
            const logN = Math.log10(n);
            const S_at_1e3 = Sut * 0.9;
            const slope = (Math.log10(Se) - Math.log10(S_at_1e3)) / (6 - 3);
            return Math.pow(10, Math.log10(S_at_1e3) + slope * (logN - 3));
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const traces: any[] = [
            {
                x: N,
                y: S.map(s => s / 1e6),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'S-N Eğrisi',
                line: { color: '#3b82f6', width: 2 },
                marker: { size: 6 },
            },
            // Endurance limit line
            {
                x: [1e6, 1e9],
                y: [Se / 1e6, Se / 1e6],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `Se = ${(Se / 1e6).toFixed(0)} MPa`,
                line: { color: '#10b981', dash: 'dash', width: 1 },
            },
        ];

        // Add applied stress line if provided
        if (appliedStress) {
            traces.push({
                x: [1e3, 1e9],
                y: [appliedStress / 1e6, appliedStress / 1e6],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `σa = ${(appliedStress / 1e6).toFixed(0)} MPa`,
                line: { color: '#ef4444', dash: 'dot', width: 2 },
            });
        }

        return traces;
    }, [Sut, Se, appliedStress]);

    const layout: Partial<Layout> = {
        ...darkLayout,
        title: { text: title, font: { size: 14 } },
        xaxis: {
            ...darkLayout.xaxis,
            title: { text: 'Çevrim Sayısı N', standoff: 10 },
            type: 'log',
        },
        yaxis: {
            ...darkLayout.yaxis,
            title: { text: 'Gerilme Genliği Sa (MPa)', standoff: 10 },
            type: 'log',
        },
        height,
        showlegend: true,
        legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0)' },
    };

    return <Plot data={chartData as Data[]} layout={layout} config={commonConfig} style={{ width: '100%' }} />;
};

// ============================================
// PRESSURE-ENTHALPY (P-h) DIAGRAM
// ============================================

interface PHDiagramProps {
    fluidName: string;
    saturationData?: {
        pressure: number[];
        liquidEnthalpy: number[];
        vaporEnthalpy: number[];
    };
    processPoints?: {
        pressure: number;
        enthalpy: number;
        label: string;
    }[];
    title?: string;
    height?: number;
}

export const PHDiagram: React.FC<PHDiagramProps> = ({
    fluidName,
    saturationData,
    processPoints,
    title,
    height = 300,
}) => {
    const chartData = useMemo(() => {
        const traces: Partial<Data>[] = [];

        // Saturation dome
        if (saturationData) {
            // Liquid line
            traces.push({
                x: saturationData.liquidEnthalpy.map(h => h / 1000), // kJ/kg
                y: saturationData.pressure.map(p => p / 1e6), // MPa
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'Doymuş Sıvı',
                line: { color: '#3b82f6', width: 2 },
            });

            // Vapor line
            traces.push({
                x: saturationData.vaporEnthalpy.map(h => h / 1000),
                y: saturationData.pressure.map(p => p / 1e6),
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'Doymuş Buhar',
                line: { color: '#ef4444', width: 2 },
            });
        }

        // Process points
        if (processPoints && processPoints.length > 0) {
            traces.push({
                x: processPoints.map(p => p.enthalpy / 1000),
                y: processPoints.map(p => p.pressure / 1e6),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: 'Proses',
                marker: { size: 10, color: '#10b981' },
                line: { color: '#10b981', width: 2 },
                text: processPoints.map(p => p.label),
                textposition: 'top center' as const,
                textfont: { color: '#10b981', size: 10 },
            });
        }

        return traces;
    }, [saturationData, processPoints]);

    const layout: Partial<Layout> = {
        ...darkLayout,
        title: { text: title || `P-h Diyagramı (${fluidName})`, font: { size: 14 } },
        xaxis: { ...darkLayout.xaxis, title: { text: 'Entalpi h (kJ/kg)', standoff: 10 } },
        yaxis: {
            ...darkLayout.yaxis,
            title: { text: 'Basınç P (MPa)', standoff: 10 },
            type: 'log',
        },
        height,
        showlegend: true,
        legend: { x: 0, y: 1, bgcolor: 'rgba(0,0,0,0)' },
    };

    return <Plot data={chartData as Data[]} layout={layout} config={commonConfig} style={{ width: '100%' }} />;
};
