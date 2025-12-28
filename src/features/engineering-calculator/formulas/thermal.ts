/**
 * Heat Transfer Calculations
 * Isı Transferi Hesapları
 */

import { PI, STEFAN_BOLTZMANN } from '../data/constants';
import type { FormulaResult } from './strength';

// ================================================
// İLETİM (Conduction)
// ================================================

/**
 * Fourier's Law - Heat Conduction Rate
 * Q = -k × A × (dT/dx)
 * For a plane wall: Q = k × A × ΔT / L
 * @param thermalConductivity - Isıl iletkenlik (W/(m·K))
 * @param area - Kesit alanı (m²)
 * @param temperatureDifference - Sıcaklık farkı (K or °C)
 * @param thickness - Kalınlık (m)
 * @returns Isı transfer hızı (W)
 */
export function conductionHeatTransfer(
    thermalConductivity: number,
    area: number,
    temperatureDifference: number,
    thickness: number
): FormulaResult {
    const value = (thermalConductivity * area * temperatureDifference) / thickness;
    return {
        value,
        unit: 'W',
        name: 'İletim Isı Transferi (Q)',
        formula: 'Q = k × A × ΔT / L',
    };
}

/**
 * Thermal Resistance - Plane Wall
 * R = L / (k × A)
 */
export function thermalResistanceWall(
    thickness: number,
    thermalConductivity: number,
    area: number
): FormulaResult {
    const value = thickness / (thermalConductivity * area);
    return {
        value,
        unit: 'K/W',
        name: 'Isıl Direnç (R)',
        formula: 'R = L / (k × A)',
    };
}

/**
 * Cylindrical Wall Heat Transfer
 * Q = 2πkL(T1-T2) / ln(r2/r1)
 */
export function cylindricalConductionHeatTransfer(
    thermalConductivity: number,
    length: number,
    innerRadius: number,
    outerRadius: number,
    temperatureDifference: number
): FormulaResult {
    const value = (2 * PI * thermalConductivity * length * temperatureDifference) /
        Math.log(outerRadius / innerRadius);
    return {
        value,
        unit: 'W',
        name: 'Silindirik İletim (Q)',
        formula: 'Q = 2πkL(T₁-T₂) / ln(r₂/r₁)',
    };
}

// ================================================
// TAŞINIM (Convection)
// ================================================

/**
 * Newton's Law of Cooling
 * Q = h × A × (Ts - T∞)
 * @param convectionCoefficient - Taşınım katsayısı (W/(m²·K))
 * @param area - Yüzey alanı (m²)
 * @param surfaceTemp - Yüzey sıcaklığı (K or °C)
 * @param ambientTemp - Ortam sıcaklığı (K or °C)
 * @returns Isı transfer hızı (W)
 */
export function convectionHeatTransfer(
    convectionCoefficient: number,
    area: number,
    surfaceTemp: number,
    ambientTemp: number
): FormulaResult {
    const value = convectionCoefficient * area * (surfaceTemp - ambientTemp);
    return {
        value,
        unit: 'W',
        name: 'Taşınım Isı Transferi (Q)',
        formula: 'Q = h × A × (Ts - T∞)',
    };
}

/**
 * Thermal Resistance - Convection
 * R = 1 / (h × A)
 */
export function thermalResistanceConvection(
    convectionCoefficient: number,
    area: number
): FormulaResult {
    const value = 1 / (convectionCoefficient * area);
    return {
        value,
        unit: 'K/W',
        name: 'Taşınım Isıl Direnci (R)',
        formula: 'R = 1 / (h × A)',
    };
}

// ================================================
// IŞINIM (Radiation)
// ================================================

/**
 * Stefan-Boltzmann Law - Radiation Heat Transfer
 * Q = ε × σ × A × (T₁⁴ - T₂⁴)
 * @param emissivity - Yayma katsayısı (0-1)
 * @param area - Yüzey alanı (m²)
 * @param temp1 - Yüzey sıcaklığı (K)
 * @param temp2 - Çevre sıcaklığı (K)
 * @returns Isı transfer hızı (W)
 */
export function radiationHeatTransfer(
    emissivity: number,
    area: number,
    temp1: number,
    temp2: number
): FormulaResult {
    const value = emissivity * STEFAN_BOLTZMANN * area *
        (Math.pow(temp1, 4) - Math.pow(temp2, 4));
    return {
        value,
        unit: 'W',
        name: 'Işınım Isı Transferi (Q)',
        formula: 'Q = ε × σ × A × (T₁⁴ - T₂⁴)',
    };
}

// ================================================
// BOYUTSUZ SAYILAR
// ================================================

/**
 * Nusselt Number
 * Nu = h × L / k
 */
export function nusseltNumber(
    convectionCoefficient: number,
    characteristicLength: number,
    thermalConductivity: number
): FormulaResult {
    const value = (convectionCoefficient * characteristicLength) / thermalConductivity;
    return {
        value,
        unit: '-',
        name: 'Nusselt Sayısı (Nu)',
        formula: 'Nu = h × L / k',
    };
}

/**
 * Prandtl Number
 * Pr = μ × cp / k = ν / α
 */
export function prandtlNumber(
    dynamicViscosity: number,
    specificHeat: number,
    thermalConductivity: number
): FormulaResult {
    const value = (dynamicViscosity * specificHeat) / thermalConductivity;
    return {
        value,
        unit: '-',
        name: 'Prandtl Sayısı (Pr)',
        formula: 'Pr = μ × cp / k',
    };
}

/**
 * Grashof Number (Natural Convection)
 * Gr = g × β × ΔT × L³ / ν²
 */
export function grashofNumber(
    thermalExpansionCoeff: number,
    temperatureDifference: number,
    characteristicLength: number,
    kinematicViscosity: number
): FormulaResult {
    const value = (9.81 * thermalExpansionCoeff * temperatureDifference *
        Math.pow(characteristicLength, 3)) / Math.pow(kinematicViscosity, 2);
    return {
        value,
        unit: '-',
        name: 'Grashof Sayısı (Gr)',
        formula: 'Gr = g × β × ΔT × L³ / ν²',
    };
}

// ================================================
// ISI DEĞİŞTİRİCİ HESAPLARI
// ================================================

/**
 * Overall Heat Transfer Coefficient (Plane Wall)
 * 1/U = 1/h₁ + L/k + 1/h₂
 */
export function overallHeatTransferCoefficient(
    h1: number,
    thickness: number,
    thermalConductivity: number,
    h2: number
): FormulaResult {
    const value = 1 / (1 / h1 + thickness / thermalConductivity + 1 / h2);
    return {
        value,
        unit: 'W/(m²·K)',
        name: 'Toplam Isı Geçiş Katsayısı (U)',
        formula: '1/U = 1/h₁ + L/k + 1/h₂',
    };
}

/**
 * Log Mean Temperature Difference (LMTD)
 * LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)
 */
export function logMeanTemperatureDifference(
    deltaT1: number,
    deltaT2: number
): FormulaResult {
    // Handle edge case where deltaT1 ≈ deltaT2
    if (Math.abs(deltaT1 - deltaT2) < 0.001) {
        return {
            value: deltaT1,
            unit: 'K',
            name: 'LMTD',
            formula: 'LMTD ≈ ΔT (when ΔT₁ ≈ ΔT₂)',
        };
    }

    const value = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
    return {
        value,
        unit: 'K',
        name: 'Logaritmik Ortalama Sıcaklık Farkı (LMTD)',
        formula: 'LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)',
    };
}

/**
 * Heat Exchanger Heat Transfer Rate
 * Q = U × A × LMTD
 */
export function heatExchangerRate(
    overallCoefficient: number,
    area: number,
    lmtd: number
): FormulaResult {
    const value = overallCoefficient * area * lmtd;
    return {
        value,
        unit: 'W',
        name: 'Isı Değiştirici Kapasitesi (Q)',
        formula: 'Q = U × A × LMTD',
    };
}
