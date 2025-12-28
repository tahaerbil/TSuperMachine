/**
 * Fluid Mechanics Calculations
 * Akışkanlar Mekaniği Hesapları
 */

import { PI, GRAVITY } from '../data/constants';
import type { FormulaResult } from './strength';

// ================================================
// TEMEL AKIŞKAN HESAPLARI
// ================================================

/**
 * Reynolds Number (Reynolds Sayısı)
 * Re = ρ × v × D / μ = v × D / ν
 * @param velocity - Akış hızı (m/s)
 * @param diameter - Karakteristik uzunluk/çap (m)
 * @param density - Yoğunluk (kg/m³)
 * @param dynamicViscosity - Dinamik viskozite (Pa·s)
 * @returns Reynolds sayısı (boyutsuz)
 */
export function reynoldsNumber(
    velocity: number,
    diameter: number,
    density: number,
    dynamicViscosity: number
): FormulaResult {
    const value = (density * velocity * diameter) / dynamicViscosity;
    return {
        value,
        unit: '-',
        name: 'Reynolds Sayısı (Re)',
        formula: 'Re = ρ × v × D / μ',
    };
}

/**
 * Determine Flow Regime
 */
export function flowRegime(reynoldsNumber: number): string {
    if (reynoldsNumber < 2300) return 'Laminer';
    if (reynoldsNumber < 4000) return 'Geçiş';
    return 'Türbülanslı';
}

/**
 * Volume Flow Rate (Hacimsel Debi)
 * Q = A × v
 * @param area - Kesit alanı (m²)
 * @param velocity - Ortalama hız (m/s)
 * @returns Debi (m³/s)
 */
export function volumeFlowRate(area: number, velocity: number): FormulaResult {
    const value = area * velocity;
    return {
        value,
        unit: 'm³/s',
        name: 'Hacimsel Debi (Q)',
        formula: 'Q = A × v',
    };
}

/**
 * Mass Flow Rate (Kütlesel Debi)
 * ṁ = ρ × Q = ρ × A × v
 * @param density - Yoğunluk (kg/m³)
 * @param volumeFlowRate - Hacimsel debi (m³/s)
 * @returns Kütlesel debi (kg/s)
 */
export function massFlowRate(
    density: number,
    volumeFlowRateValue: number
): FormulaResult {
    const value = density * volumeFlowRateValue;
    return {
        value,
        unit: 'kg/s',
        name: 'Kütlesel Debi (ṁ)',
        formula: 'ṁ = ρ × Q',
    };
}

// ================================================
// BERNOULLI VE BASINÇ HESAPLARI
// ================================================

/**
 * Dynamic Pressure (Dinamik Basınç)
 * q = ½ × ρ × v²
 * @param density - Yoğunluk (kg/m³)
 * @param velocity - Hız (m/s)
 * @returns Dinamik basınç (Pa)
 */
export function dynamicPressure(density: number, velocity: number): FormulaResult {
    const value = 0.5 * density * velocity * velocity;
    return {
        value,
        unit: 'Pa',
        name: 'Dinamik Basınç (q)',
        formula: 'q = ½ × ρ × v²',
    };
}

/**
 * Hydrostatic Pressure (Hidrostatik Basınç)
 * P = ρ × g × h
 * @param density - Yoğunluk (kg/m³)
 * @param height - Derinlik (m)
 * @returns Basınç (Pa)
 */
export function hydrostaticPressure(density: number, height: number): FormulaResult {
    const value = density * GRAVITY * height;
    return {
        value,
        unit: 'Pa',
        name: 'Hidrostatik Basınç (P)',
        formula: 'P = ρ × g × h',
    };
}

/**
 * Bernoulli Equation - Velocity from pressure difference
 * v = √(2 × ΔP / ρ)
 */
export function velocityFromPressure(
    pressureDifference: number,
    density: number
): FormulaResult {
    const value = Math.sqrt((2 * pressureDifference) / density);
    return {
        value,
        unit: 'm/s',
        name: 'Hız (v)',
        formula: 'v = √(2 × ΔP / ρ)',
    };
}

// ================================================
// BORU AKIŞI HESAPLARI
// ================================================

/**
 * Pipe Flow Velocity (Boru İçi Akış Hızı)
 * v = Q / A = 4Q / (π × D²)
 */
export function pipeVelocity(
    volumeFlowRateValue: number,
    diameter: number
): FormulaResult {
    const area = (PI * diameter * diameter) / 4;
    const value = volumeFlowRateValue / area;
    return {
        value,
        unit: 'm/s',
        name: 'Boru İçi Hız (v)',
        formula: 'v = 4Q / (π × D²)',
    };
}

/**
 * Darcy-Weisbach Head Loss (Sürtünme Kayıpları)
 * hf = f × (L/D) × (v²/2g)
 * @param frictionFactor - Sürtünme faktörü (f)
 * @param length - Boru uzunluğu (m)
 * @param diameter - Boru çapı (m)
 * @param velocity - Akış hızı (m/s)
 * @returns Yük kaybı (m)
 */
export function darcyWeisbachHeadLoss(
    frictionFactor: number,
    length: number,
    diameter: number,
    velocity: number
): FormulaResult {
    const value = frictionFactor * (length / diameter) * (velocity * velocity / (2 * GRAVITY));
    return {
        value,
        unit: 'm',
        name: 'Sürtünme Yük Kaybı (hf)',
        formula: 'hf = f × (L/D) × (v²/2g)',
    };
}

/**
 * Pressure Drop from Head Loss
 * ΔP = ρ × g × hf
 */
export function pressureDropFromHeadLoss(
    density: number,
    headLoss: number
): FormulaResult {
    const value = density * GRAVITY * headLoss;
    return {
        value,
        unit: 'Pa',
        name: 'Basınç Düşümü (ΔP)',
        formula: 'ΔP = ρ × g × hf',
    };
}

/**
 * Laminar Flow Friction Factor
 * f = 64 / Re
 */
export function laminarFrictionFactor(reynoldsNum: number): FormulaResult {
    const value = 64 / reynoldsNum;
    return {
        value,
        unit: '-',
        name: 'Laminer Sürtünme Faktörü (f)',
        formula: 'f = 64 / Re',
    };
}

/**
 * Turbulent Flow Friction Factor (Blasius approximation)
 * f = 0.316 × Re^(-0.25) for smooth pipes, 4000 < Re < 100000
 */
export function turbulentFrictionFactor(reynoldsNum: number): FormulaResult {
    const value = 0.316 * Math.pow(reynoldsNum, -0.25);
    return {
        value,
        unit: '-',
        name: 'Türbülanslı Sürtünme Faktörü (f)',
        formula: 'f = 0.316 × Re^(-0.25)',
    };
}

// ================================================
// POMPA HESAPLARI
// ================================================

/**
 * Pump Power (Pompa Gücü)
 * P = ρ × g × Q × H / η
 * @param density - Yoğunluk (kg/m³)
 * @param volumeFlowRateValue - Debi (m³/s)
 * @param totalHead - Toplam yük (m)
 * @param efficiency - Verim (0-1)
 * @returns Güç (W)
 */
export function pumpPower(
    density: number,
    volumeFlowRateValue: number,
    totalHead: number,
    efficiency: number
): FormulaResult {
    const value = (density * GRAVITY * volumeFlowRateValue * totalHead) / efficiency;
    return {
        value,
        unit: 'W',
        name: 'Pompa Gücü (P)',
        formula: 'P = ρ × g × Q × H / η',
    };
}

/**
 * NPSH Required (simple approximation)
 * NPSHr depends on pump, typically 2-10 m for centrifugal pumps
 */
export function npshAvailable(
    atmosphericPressure: number,
    density: number,
    staticSuctionHead: number,
    frictionLosses: number,
    vaporPressure: number
): FormulaResult {
    const value = (atmosphericPressure - vaporPressure) / (density * GRAVITY) +
        staticSuctionHead - frictionLosses;
    return {
        value,
        unit: 'm',
        name: 'Mevcut NPSH (NPSHa)',
        formula: 'NPSHa = (Patm - Pv)/(ρg) + hs - hf',
    };
}
