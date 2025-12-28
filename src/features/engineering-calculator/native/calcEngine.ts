/**
 * TypeScript Wrapper for C++ Calculation Engine
 * Provides type-safe access to native C++ engineering calculations
 */

// Types for calculation results
export interface StressResult {
    normal: number;      // Normal stress (Pa)
    shear: number;       // Shear stress (Pa)
    vonMises: number;    // Von Mises equivalent stress (Pa)
    principal1: number;  // Principal stress 1 (Pa)
    principal2: number;  // Principal stress 2 (Pa)
    principal3: number;  // Principal stress 3 (Pa)
}

export interface DeflectionResult {
    maxDeflection: number;  // Maximum deflection (m)
    slope: number;          // Slope at point (rad)
    position: number;       // Position of max deflection (m)
}

export interface ShaftResult {
    diameter: number;       // Required diameter (m)
    criticalSpeed: number;  // Critical speed (rpm)
    deflection: number;     // Maximum deflection (m)
    torsionalStress: number; // Torsional stress (Pa)
    bendingStress: number;  // Bending stress (Pa)
}

export interface BoltResult {
    preload: number;        // Preload force (N)
    tensileStress: number;  // Tensile stress (Pa)
    safetyFactor: number;   // Safety factor
    tighteningTorque: number; // Tightening torque (N·m)
}

export interface BearingResult {
    dynamicLoad: number;    // Dynamic load rating (N)
    lifeL10: number;        // L10 life (million revolutions)
    lifeHours: number;      // Life in hours
}

export interface GearResult {
    pitchDiameter: number;  // Pitch diameter (m)
    contactStress: number;  // Contact stress (Pa)
    bendingStress: number;  // Bending stress (Pa)
    safetyFactor: number;   // Safety factor
}

export interface FatigueResult {
    fatigueStrength: number; // Fatigue strength (Pa)
    enduranceLimit: number;  // Endurance limit (Pa)
    cycles: number;          // Expected life cycles
    safetyFactor: number;    // Fatigue safety factor
}

// Native addon interface
interface CalcEngineNative {
    // Strength
    normalStress(force: number, area: number): number;
    bendingStress(moment: number, y: number, I: number): number;
    torsionalStress(torque: number, radius: number, J: number): number;
    vonMisesStress2D(sigmaX: number, sigmaY: number, tauXY: number): number;
    analyzeCombinedStress(
        axialForce: number, shearForce: number, bendingMoment: number, torque: number,
        area: number, y: number, I: number, J: number, r: number
    ): StressResult;

    // Beam Deflection
    beamDeflection_simplySupportedCenter(force: number, length: number, E: number, I: number): DeflectionResult;
    beamDeflection_cantileverEnd(force: number, length: number, E: number, I: number): DeflectionResult;

    // Shaft
    shaftDiameterForTorsion(torque: number, allowableShear: number): number;
    shaftPower(torque: number, rpm: number): number;
    shaftTorqueFromPower(power: number, rpm: number): number;
    analyzeShaft(power: number, rpm: number, length: number, E: number, allowableShear: number, allowableBending: number): ShaftResult;

    // Bolt
    boltStressArea(diameter: number, pitch: number): number;
    analyzeBolt(externalForce: number, diameter: number, pitch: number, torque: number, K: number, proofStrength: number): BoltResult;

    // Bearing
    analyzeBearing(radialLoad: number, axialLoad: number, rpm: number, dynamicCapacity: number, X: number, Y: number, exponent: number): BearingResult;

    // Gear
    analyzeGear(power: number, rpm: number, module: number, z1: number, z2: number, faceWidth: number, E: number, allowableStress: number): GearResult;

    // Fatigue
    analyzeFatigue(sigmaMax: number, sigmaMin: number, Sut: number, diameter: number, surfaceFinish: string): FatigueResult;

    // Spring
    springRate(G: number, wireDiameter: number, meanDiameter: number, activeCoils: number): number;

    // Section Properties
    circleArea(radius: number): number;
    circleMomentOfInertia(radius: number): number;
    circlePolarMoment(radius: number): number;
}

// Try to load native addon
let nativeCalcEngine: CalcEngineNative | null = null;

try {
    // In Electron environment
    if (typeof window !== 'undefined' && (window as Window & { require?: NodeRequire }).require) {
        const electronRequire = (window as Window & { require?: NodeRequire }).require;
        if (electronRequire) {
            nativeCalcEngine = electronRequire('../native/build/Release/calc_engine.node') as CalcEngineNative;
            console.log('✅ Native Calculation Engine loaded successfully');
        }
    }
} catch {
    console.warn('⚠️ Native Calculation Engine not available, using TypeScript fallback');
    nativeCalcEngine = null;
}

// Check if native module is available
export const isNativeAvailable = (): boolean => nativeCalcEngine !== null;

// ============================================
// EXPORTED CALCULATION FUNCTIONS
// ============================================

// These functions use native C++ if available, otherwise fallback to JavaScript

export const normalStress = (force: number, area: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.normalStress(force, area);
    }
    // TypeScript fallback
    return force / area;
};

export const bendingStress = (moment: number, y: number, I: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.bendingStress(moment, y, I);
    }
    return (moment * y) / I;
};

export const torsionalStress = (torque: number, radius: number, J: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.torsionalStress(torque, radius, J);
    }
    return (torque * radius) / J;
};

export const vonMisesStress2D = (sigmaX: number, sigmaY: number, tauXY: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.vonMisesStress2D(sigmaX, sigmaY, tauXY);
    }
    return Math.sqrt(sigmaX * sigmaX - sigmaX * sigmaY + sigmaY * sigmaY + 3 * tauXY * tauXY);
};

export const analyzeCombinedStress = (
    axialForce: number, shearForce: number, bendingMoment: number, torque: number,
    area: number, y: number, I: number, J: number, r: number
): StressResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeCombinedStress(
            axialForce, shearForce, bendingMoment, torque, area, y, I, J, r
        );
    }
    // TypeScript fallback (simplified)
    const normal = (axialForce / area) + (bendingMoment * y / I);
    const shear = (shearForce / area) + (torque * r / J);
    const vonMises = Math.sqrt(normal * normal + 3 * shear * shear);
    return { normal, shear, vonMises, principal1: normal, principal2: 0, principal3: 0 };
};

export const shaftPower = (torque: number, rpm: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.shaftPower(torque, rpm);
    }
    return torque * 2 * Math.PI * rpm / 60;
};

export const shaftTorqueFromPower = (power: number, rpm: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.shaftTorqueFromPower(power, rpm);
    }
    return (power * 60) / (2 * Math.PI * rpm);
};

export const analyzeShaft = (
    power: number, rpm: number, length: number, E: number,
    allowableShear: number, allowableBending: number
): ShaftResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeShaft(power, rpm, length, E, allowableShear, allowableBending);
    }
    // TypeScript fallback (simplified)
    const torque = shaftTorqueFromPower(power, rpm);
    const diameter = Math.pow((16 * torque) / (Math.PI * allowableShear), 1 / 3);
    return {
        diameter,
        criticalSpeed: 3000, // Placeholder
        deflection: 0.001,
        torsionalStress: allowableShear * 0.8,
        bendingStress: allowableBending * 0.5,
    };
};

export const analyzeBolt = (
    externalForce: number, diameter: number, pitch: number,
    torque: number, K: number, proofStrength: number
): BoltResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeBolt(externalForce, diameter, pitch, torque, K, proofStrength);
    }
    // TypeScript fallback
    const d2 = diameter - 0.9382 * pitch;
    const As = (Math.PI / 4) * d2 * d2;
    const preload = torque / (K * diameter);
    const tensileStress = (preload + 0.2 * externalForce) / As;
    return {
        preload,
        tensileStress,
        safetyFactor: proofStrength / tensileStress,
        tighteningTorque: torque,
    };
};

export const analyzeBearing = (
    radialLoad: number, axialLoad: number, rpm: number,
    dynamicCapacity: number, X: number, Y: number, exponent: number
): BearingResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeBearing(radialLoad, axialLoad, rpm, dynamicCapacity, X, Y, exponent);
    }
    // TypeScript fallback
    const P = X * radialLoad + Y * axialLoad;
    const L10 = Math.pow(dynamicCapacity / P, exponent);
    const hours = (L10 * 1e6) / (60 * rpm);
    return { dynamicLoad: P, lifeL10: L10, lifeHours: hours };
};

export const analyzeGear = (
    power: number, rpm: number, module: number, z1: number, z2: number,
    faceWidth: number, E: number, allowableStress: number
): GearResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeGear(power, rpm, module, z1, z2, faceWidth, E, allowableStress);
    }
    // TypeScript fallback (simplified)
    const d1 = module * z1;
    const Ft = (60000 * power) / (Math.PI * d1 * rpm);
    const bendingStress = Ft / (faceWidth * module * 0.3);
    return {
        pitchDiameter: d1,
        contactStress: bendingStress * 1.5,
        bendingStress,
        safetyFactor: allowableStress / bendingStress,
    };
};

export const analyzeFatigue = (
    sigmaMax: number, sigmaMin: number, Sut: number,
    diameter: number, surfaceFinish: string
): FatigueResult => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.analyzeFatigue(sigmaMax, sigmaMin, Sut, diameter, surfaceFinish);
    }
    // TypeScript fallback (simplified)
    const Se = 0.5 * Sut * 0.7; // Rough estimate
    const sigmaA = (sigmaMax - sigmaMin) / 2;
    const sigmaM = (sigmaMax + sigmaMin) / 2;
    const n = 1 / (sigmaA / Se + sigmaM / Sut);
    return {
        fatigueStrength: Se,
        enduranceLimit: Se,
        cycles: n >= 1 ? 1e7 : 1e5,
        safetyFactor: n,
    };
};

export const springRate = (G: number, wireDiameter: number, meanDiameter: number, activeCoils: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.springRate(G, wireDiameter, meanDiameter, activeCoils);
    }
    return (G * Math.pow(wireDiameter, 4)) / (8 * Math.pow(meanDiameter, 3) * activeCoils);
};

// Section Properties
export const circleArea = (radius: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.circleArea(radius);
    }
    return Math.PI * radius * radius;
};

export const circleMomentOfInertia = (radius: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.circleMomentOfInertia(radius);
    }
    return (Math.PI * Math.pow(radius, 4)) / 4;
};

export const circlePolarMoment = (radius: number): number => {
    if (nativeCalcEngine) {
        return nativeCalcEngine.circlePolarMoment(radius);
    }
    return (Math.PI * Math.pow(radius, 4)) / 2;
};
