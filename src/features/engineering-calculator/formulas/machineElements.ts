/**
 * Machine Element Calculations
 * Makine Elemanları Hesapları
 * 
 * Uses native C++ when available, TypeScript fallback otherwise
 */

import * as native from '../native/calcEngine';
import { PI } from '../data/constants';

// Re-export native types
export type { ShaftResult, BoltResult, BearingResult, GearResult, FatigueResult } from '../native/calcEngine';

// ================================================
// MİL/ŞAFT HESAPLARI
// ================================================

/**
 * Calculate shaft diameter for pure torsion
 */
export const shaftDiameterForTorsion = (torque: number, allowableShear: number): number => {
    return Math.pow((16 * torque) / (PI * allowableShear), 1 / 3);
};

/**
 * Calculate shaft diameter for pure bending
 */
export const shaftDiameterForBending = (moment: number, allowableBending: number): number => {
    return Math.pow((32 * moment) / (PI * allowableBending), 1 / 3);
};

/**
 * Calculate shaft diameter using ASME code
 * Combined bending and torsion with shock factors
 */
export const shaftDiameterASME = (
    bendingMoment: number,
    torque: number,
    Kb: number = 1.5,  // Bending shock factor
    Kt: number = 1.0,  // Torsion shock factor
    allowableShear: number
): number => {
    const combined = Math.sqrt(Math.pow(Kb * bendingMoment, 2) + Math.pow(Kt * torque, 2));
    return Math.pow((16 / (PI * allowableShear)) * combined, 1 / 3);
};

/**
 * Calculate critical speed (Rayleigh method)
 */
export const criticalSpeed = (deflection: number): number => {
    return (30 / PI) * Math.sqrt(9.80665 / deflection);
};

/**
 * Full shaft analysis
 */
export const analyzeShaft = native.analyzeShaft;

// ================================================
// CIVATA HESAPLARI
// ================================================

/**
 * Metric bolt stress area
 * As = π/4 × (d - 0.9382 × P)²
 */
export const boltStressArea = (nominalDiameter: number, pitch: number): number => {
    const d2 = nominalDiameter - 0.9382 * pitch;
    return (PI / 4) * d2 * d2;
};

/**
 * Preload from tightening torque
 * Fi = T / (K × d)
 */
export const boltPreload = (
    torque: number,
    torqueCoefficient: number,
    diameter: number
): number => {
    return torque / (torqueCoefficient * diameter);
};

/**
 * Tightening torque calculation
 * T = K × d × Fi
 */
export const tighteningTorque = (
    torqueCoefficient: number,
    diameter: number,
    preload: number
): number => {
    return torqueCoefficient * diameter * preload;
};

/**
 * Full bolt analysis
 */
export const analyzeBolt = native.analyzeBolt;

// Standard metric bolt data (d in m, P in m, As in m²)
export const metricBolts = {
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

// ================================================
// RULMAN HESAPLARI
// ================================================

/**
 * Equivalent dynamic bearing load
 * P = X × Fr + Y × Fa
 */
export const bearingEquivalentLoad = (
    radialLoad: number,
    axialLoad: number,
    X: number = 1,
    Y: number = 0
): number => {
    return X * radialLoad + Y * axialLoad;
};

/**
 * L10 bearing life (million revolutions)
 * L10 = (C/P)^p
 */
export const bearingLifeL10 = (
    dynamicCapacity: number,
    equivalentLoad: number,
    exponent: number = 3  // 3 for ball, 10/3 for roller
): number => {
    return Math.pow(dynamicCapacity / equivalentLoad, exponent);
};

/**
 * Bearing life in hours
 * Lh = L10 × 10^6 / (60 × n)
 */
export const bearingLifeHours = (L10: number, rpm: number): number => {
    return (L10 * 1e6) / (60 * rpm);
};

/**
 * Full bearing analysis
 */
export const analyzeBearing = native.analyzeBearing;

// ================================================
// DİŞLİ HESAPLARI
// ================================================

/**
 * Spur gear pitch diameter
 * d = m × z
 */
export const gearPitchDiameter = (module: number, teeth: number): number => {
    return module * teeth;
};

/**
 * Center distance
 * a = (d1 + d2) / 2
 */
export const gearCenterDistance = (module: number, z1: number, z2: number): number => {
    return (module * (z1 + z2)) / 2;
};

/**
 * Gear ratio
 * i = z2 / z1
 */
export const gearRatio = (z1: number, z2: number): number => {
    return z2 / z1;
};

/**
 * Tangential force on gear
 * Ft = 2 × P / (d × ω) = 60000 × P / (π × d × n)
 */
export const gearTangentialForce = (
    power: number,  // W
    pitchDiameter: number,  // m
    rpm: number
): number => {
    return (2 * power) / (pitchDiameter * 2 * PI * rpm / 60);
};

/**
 * Full gear analysis
 */
export const analyzeGear = native.analyzeGear;

// ================================================
// YORULMA ANALİZİ
// ================================================

/**
 * Modified endurance limit
 * Se = ka × kb × kc × kd × ke × Se'
 */
export const modifiedEnduranceLimit = (
    Se_prime: number,
    ka: number,  // Surface factor
    kb: number,  // Size factor
    kc: number = 1,  // Load factor
    kd: number = 1,  // Temperature factor
    ke: number = 1   // Reliability factor
): number => {
    return ka * kb * kc * kd * ke * Se_prime;
};

/**
 * Surface finish factor (for steel)
 */
export const surfaceFactor = (Sut: number, surfaceFinish: 'ground' | 'machined' | 'hot-rolled' | 'forged'): number => {
    const Sut_MPa = Sut / 1e6;
    const factors: Record<string, [number, number]> = {
        'ground': [1.58, -0.085],
        'machined': [4.51, -0.265],
        'hot-rolled': [57.7, -0.718],
        'forged': [272, -0.995],
    };
    const [a, b] = factors[surfaceFinish] || factors['machined'];
    return a * Math.pow(Sut_MPa, b);
};

/**
 * Size factor for rotating shaft
 */
export const sizeFactor = (diameter: number): number => {
    const d_mm = diameter * 1000;
    if (d_mm <= 8) return 1.0;
    if (d_mm <= 51) return Math.pow(d_mm / 7.62, -0.107);
    if (d_mm <= 254) return 0.879 * Math.pow(d_mm, -0.107);
    return 0.6;
};

/**
 * Goodman fatigue safety factor
 * n = 1 / (σa/Se + σm/Sut)
 */
export const goodmanSafetyFactor = (
    sigmaA: number,  // Alternating stress
    sigmaM: number,  // Mean stress
    Se: number,      // Endurance limit
    Sut: number      // Ultimate tensile strength
): number => {
    return 1 / (sigmaA / Se + sigmaM / Sut);
};

/**
 * Full fatigue analysis
 */
export const analyzeFatigue = native.analyzeFatigue;

// ================================================
// YAY HESAPLARI
// ================================================

/**
 * Compression/extension spring rate
 * k = G × d^4 / (8 × D^3 × Na)
 */
export const springRate = native.springRate;

/**
 * Wahl stress correction factor
 * K = (4C - 1) / (4C - 4) + 0.615/C
 */
export const wahlFactor = (springIndex: number): number => {
    const C = springIndex;
    return (4 * C - 1) / (4 * C - 4) + 0.615 / C;
};

/**
 * Spring shear stress
 * τ = K × (8 × F × D) / (π × d^3)
 */
export const springShearStress = (
    force: number,
    wireDiameter: number,
    meanDiameter: number,
    wahlK: number
): number => {
    return wahlK * (8 * force * meanDiameter) / (PI * Math.pow(wireDiameter, 3));
};

// ================================================
// KAYNAK HESAPLARI
// ================================================

/**
 * Fillet weld throat area
 * A = 0.707 × a × L
 */
export const weldThroatArea = (legSize: number, length: number): number => {
    return 0.707 * legSize * length;
};

/**
 * Weld shear stress
 */
export const weldShearStress = (force: number, throatArea: number): number => {
    return force / throatArea;
};

/**
 * Combined weld stress (shear + normal)
 */
export const combinedWeldStress = (shearStress: number, normalStress: number): number => {
    return Math.sqrt(shearStress * shearStress + normalStress * normalStress);
};

/**
 * Allowable weld stress (for fillet welds)
 * Typically 0.3 × Sut of electrode
 */
export const allowableWeldStress = (electrodeStrength: number): number => {
    return 0.3 * electrodeStrength;
};

// Common electrode strengths (Pa)
export const electrodeStrengths = {
    'E60': 420e6,  // E6010, E6011, E6013
    'E70': 490e6,  // E7018, E7024
    'E80': 560e6,  // E8018
    'E90': 620e6,  // E9018
    'E100': 690e6, // E10018
} as const;
