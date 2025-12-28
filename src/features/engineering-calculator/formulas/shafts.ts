/**
 * Shaft and Fastener Calculations
 * Mil/Şaft ve Bağlantı Elemanı Hesapları
 */

import { PI } from '../data/constants';
import type { FormulaResult } from './strength';

// ================================================
// MİL/ŞAFT HESAPLARI
// ================================================

/**
 * Power Transmitted by Shaft
 * P = T × ω = T × 2πn/60
 * @param torque - Tork (N·m)
 * @param rpm - Devir sayısı (dev/dak)
 * @returns Güç (W)
 */
export function shaftPower(torque: number, rpm: number): FormulaResult {
    const omega = (2 * PI * rpm) / 60;
    const value = torque * omega;
    return {
        value,
        unit: 'W',
        name: 'Şaft Gücü (P)',
        formula: 'P = T × 2πn/60',
    };
}

/**
 * Torque from Power
 * T = P × 60 / (2πn)
 * @param power - Güç (W)
 * @param rpm - Devir sayısı (dev/dak)
 * @returns Tork (N·m)
 */
export function torqueFromPower(power: number, rpm: number): FormulaResult {
    const value = (power * 60) / (2 * PI * rpm);
    return {
        value,
        unit: 'N·m',
        name: 'Burulma Momenti (T)',
        formula: 'T = P × 60 / (2πn)',
    };
}

/**
 * Shaft Diameter for Torsion (τ = T×r/J)
 * d = ∛(16T / (π×τallow))
 * @param torque - Tork (N·m)
 * @param allowableShearStress - İzin verilen kayma gerilmesi (Pa)
 * @returns Çap (m)
 */
export function shaftDiameterForTorsion(
    torque: number,
    allowableShearStress: number
): FormulaResult {
    const value = Math.pow((16 * torque) / (PI * allowableShearStress), 1 / 3);
    return {
        value,
        unit: 'm',
        name: 'Şaft Çapı (d)',
        formula: 'd = ∛(16T / (π×τallow))',
    };
}

/**
 * Critical Speed of Shaft (simplified - Rayleigh)
 * nc = (60/2π) × √(g×Σ(miδi) / Σ(miδi²))
 * For single mass: nc ≈ 946 / √δ (rpm, δ in mm)
 * @param deflection - Statik sehim (m)
 * @returns Kritik hız (dev/dak)
 */
export function criticalSpeed(deflection: number): FormulaResult {
    // Using nc = (60/2π) × √(g/δ) = 30/π × √(9.81/δ)
    const value = (30 / PI) * Math.sqrt(9.81 / deflection);
    return {
        value,
        unit: 'rpm',
        name: 'Kritik Hız (nc)',
        formula: 'nc = (30/π) × √(g/δ)',
    };
}

/**
 * Shaft Deflection (Simply Supported, Center Load)
 * δ = F×L³ / (48×E×I)
 */
export function shaftDeflectionCenterLoad(
    force: number,
    length: number,
    elasticModulus: number,
    momentOfInertia: number
): FormulaResult {
    const value = (force * Math.pow(length, 3)) / (48 * elasticModulus * momentOfInertia);
    return {
        value,
        unit: 'm',
        name: 'Şaft Sehimi (δ)',
        formula: 'δ = F×L³ / (48×E×I)',
    };
}

// ================================================
// CIVATA HESAPLARI
// ================================================

/**
 * Bolt Tensile Stress Area (metric)
 * As = π/4 × (d - 0.9382×P)²
 * @param nominalDiameter - Nominal çap (m)
 * @param threadPitch - Diş adımı (m)
 * @returns Gerilme alanı (m²)
 */
export function boltStressArea(
    nominalDiameter: number,
    threadPitch: number
): FormulaResult {
    const d2 = nominalDiameter - 0.9382 * threadPitch;
    const value = (PI / 4) * d2 * d2;
    return {
        value,
        unit: 'm²',
        name: 'Cıvata Gerilme Alanı (As)',
        formula: 'As = π/4 × (d - 0.9382×P)²',
    };
}

/**
 * Bolt Preload (Tightening)
 * Fi = T / (K × d)
 * @param torque - Sıkma momenti (N·m)
 * @param torqueCoefficient - Tork katsayısı (0.15-0.20 typical)
 * @param nominalDiameter - Nominal çap (m)
 * @returns Ön yükleme kuvveti (N)
 */
export function boltPreload(
    torque: number,
    torqueCoefficient: number,
    nominalDiameter: number
): FormulaResult {
    const value = torque / (torqueCoefficient * nominalDiameter);
    return {
        value,
        unit: 'N',
        name: 'Ön Yükleme Kuvveti (Fi)',
        formula: 'Fi = T / (K × d)',
    };
}

/**
 * Tightening Torque
 * T = K × d × Fi
 */
export function tighteningTorque(
    torqueCoefficient: number,
    nominalDiameter: number,
    preload: number
): FormulaResult {
    const value = torqueCoefficient * nominalDiameter * preload;
    return {
        value,
        unit: 'N·m',
        name: 'Sıkma Momenti (T)',
        formula: 'T = K × d × Fi',
    };
}

/**
 * Bolt Tensile Stress
 * σ = F / As
 */
export function boltTensileStress(force: number, stressArea: number): FormulaResult {
    const value = force / stressArea;
    return {
        value,
        unit: 'Pa',
        name: 'Cıvata Çekme Gerilmesi (σ)',
        formula: 'σ = F / As',
    };
}

/**
 * Bolt Joint Stiffness Ratio
 * C = kb / (kb + km)
 * @param boltStiffness - Cıvata rijitliği (N/m)
 * @param memberStiffness - Birleşim parçaları rijitliği (N/m)
 * @returns Rijitlik oranı (boyutsuz)
 */
export function jointStiffnessRatio(
    boltStiffness: number,
    memberStiffness: number
): FormulaResult {
    const value = boltStiffness / (boltStiffness + memberStiffness);
    return {
        value,
        unit: '-',
        name: 'Rijitlik Oranı (C)',
        formula: 'C = kb / (kb + km)',
    };
}

/**
 * Bolt Load with External Force
 * Fb = Fi + C × Fe (bolt load when external force applied)
 */
export function boltLoadWithExternalForce(
    preload: number,
    stiffnessRatio: number,
    externalForce: number
): FormulaResult {
    const value = preload + stiffnessRatio * externalForce;
    return {
        value,
        unit: 'N',
        name: 'Cıvata Yükü (Fb)',
        formula: 'Fb = Fi + C × Fe',
    };
}

// ================================================
// COMMON METRIC BOLT DATA
// ================================================

export const metricBoltData = {
    M3: { d: 0.003, P: 0.0005, As: 5.03e-6 },
    M4: { d: 0.004, P: 0.0007, As: 8.78e-6 },
    M5: { d: 0.005, P: 0.0008, As: 14.2e-6 },
    M6: { d: 0.006, P: 0.001, As: 20.1e-6 },
    M8: { d: 0.008, P: 0.00125, As: 36.6e-6 },
    M10: { d: 0.010, P: 0.0015, As: 58.0e-6 },
    M12: { d: 0.012, P: 0.00175, As: 84.3e-6 },
    M14: { d: 0.014, P: 0.002, As: 115e-6 },
    M16: { d: 0.016, P: 0.002, As: 157e-6 },
    M20: { d: 0.020, P: 0.0025, As: 245e-6 },
    M24: { d: 0.024, P: 0.003, As: 353e-6 },
    M30: { d: 0.030, P: 0.0035, As: 561e-6 },
} as const;

// Bolt strength classes (metric)
export const boltStrengthClasses = {
    '4.6': { proofStress: 225e6, yieldStress: 240e6, tensileStrength: 400e6 },
    '4.8': { proofStress: 310e6, yieldStress: 340e6, tensileStrength: 420e6 },
    '5.8': { proofStress: 380e6, yieldStress: 420e6, tensileStrength: 520e6 },
    '8.8': { proofStress: 600e6, yieldStress: 640e6, tensileStrength: 800e6 },
    '10.9': { proofStress: 830e6, yieldStress: 940e6, tensileStrength: 1040e6 },
    '12.9': { proofStress: 970e6, yieldStress: 1100e6, tensileStrength: 1220e6 },
} as const;
