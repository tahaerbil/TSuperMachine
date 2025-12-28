/**
 * Strength of Materials Calculations
 * Mukavemet Hesapları
 */

import { PI } from '../data/constants';

export interface FormulaResult {
    value: number;
    unit: string;
    name: string;
    formula: string;
}

// ================================================
// GERILME HESAPLARI (Stress Calculations)
// ================================================

/**
 * Normal Stress (Eksenel Gerilme)
 * σ = F / A
 * @param force - Kuvvet (N)
 * @param area - Kesit alanı (m²)
 * @returns Gerilme (Pa)
 */
export function normalStress(force: number, area: number): FormulaResult {
    const value = force / area;
    return {
        value,
        unit: 'Pa',
        name: 'Normal Gerilme (σ)',
        formula: 'σ = F / A',
    };
}

/**
 * Shear Stress (Kayma Gerilmesi)
 * τ = V / A
 * @param shearForce - Kesme kuvveti (N)
 * @param area - Kesit alanı (m²)
 * @returns Kayma gerilmesi (Pa)
 */
export function shearStress(shearForce: number, area: number): FormulaResult {
    const value = shearForce / area;
    return {
        value,
        unit: 'Pa',
        name: 'Kayma Gerilmesi (τ)',
        formula: 'τ = V / A',
    };
}

/**
 * Bending Stress (Eğilme Gerilmesi)
 * σ = M × y / I
 * @param moment - Eğilme momenti (N·m)
 * @param y - Nötr eksenden uzaklık (m)
 * @param momentOfInertia - Atalet momenti (m⁴)
 * @returns Eğilme gerilmesi (Pa)
 */
export function bendingStress(
    moment: number,
    y: number,
    momentOfInertia: number
): FormulaResult {
    const value = (moment * y) / momentOfInertia;
    return {
        value,
        unit: 'Pa',
        name: 'Eğilme Gerilmesi (σ)',
        formula: 'σ = M × y / I',
    };
}

/**
 * Torsional Shear Stress (Burulma Kayma Gerilmesi)
 * τ = T × r / J
 * @param torque - Burulma momenti (N·m)
 * @param radius - Yarıçap (m)
 * @param polarMoment - Polar atalet momenti (m⁴)
 * @returns Burulma gerilmesi (Pa)
 */
export function torsionalStress(
    torque: number,
    radius: number,
    polarMoment: number
): FormulaResult {
    const value = (torque * radius) / polarMoment;
    return {
        value,
        unit: 'Pa',
        name: 'Burulma Gerilmesi (τ)',
        formula: 'τ = T × r / J',
    };
}

// ================================================
// DEFORMASYON HESAPLARI (Deformation Calculations)
// ================================================

/**
 * Axial Deformation (Eksenel Uzama)
 * δ = F × L / (A × E)
 * @param force - Kuvvet (N)
 * @param length - Uzunluk (m)
 * @param area - Kesit alanı (m²)
 * @param elasticModulus - Elastisite modülü (Pa)
 * @returns Uzama miktarı (m)
 */
export function axialDeformation(
    force: number,
    length: number,
    area: number,
    elasticModulus: number
): FormulaResult {
    const value = (force * length) / (area * elasticModulus);
    return {
        value,
        unit: 'm',
        name: 'Eksenel Uzama (δ)',
        formula: 'δ = F × L / (A × E)',
    };
}

/**
 * Angle of Twist (Burulma Açısı)
 * φ = T × L / (G × J)
 * @param torque - Burulma momenti (N·m)
 * @param length - Uzunluk (m)
 * @param shearModulus - Kayma modülü (Pa)
 * @param polarMoment - Polar atalet momenti (m⁴)
 * @returns Burulma açısı (rad)
 */
export function angleOfTwist(
    torque: number,
    length: number,
    shearModulus: number,
    polarMoment: number
): FormulaResult {
    const value = (torque * length) / (shearModulus * polarMoment);
    return {
        value,
        unit: 'rad',
        name: 'Burulma Açısı (φ)',
        formula: 'φ = T × L / (G × J)',
    };
}

// ================================================
// KESİT ÖZELLİKLERİ (Section Properties)
// ================================================

/**
 * Circle Area (Daire Alanı)
 * A = π × r²
 */
export function circleArea(radius: number): FormulaResult {
    const value = PI * radius * radius;
    return {
        value,
        unit: 'm²',
        name: 'Daire Alanı',
        formula: 'A = π × r²',
    };
}

/**
 * Circle Moment of Inertia (Daire Atalet Momenti)
 * I = π × r⁴ / 4
 */
export function circleMomentOfInertia(radius: number): FormulaResult {
    const value = (PI * Math.pow(radius, 4)) / 4;
    return {
        value,
        unit: 'm⁴',
        name: 'Daire Atalet Momenti',
        formula: 'I = π × r⁴ / 4',
    };
}

/**
 * Circle Polar Moment of Inertia (Daire Polar Atalet Momenti)
 * J = π × r⁴ / 2
 */
export function circlePolarMoment(radius: number): FormulaResult {
    const value = (PI * Math.pow(radius, 4)) / 2;
    return {
        value,
        unit: 'm⁴',
        name: 'Daire Polar Atalet Momenti',
        formula: 'J = π × r⁴ / 2',
    };
}

/**
 * Rectangle Moment of Inertia (Dikdörtgen Atalet Momenti)
 * I = b × h³ / 12
 */
export function rectangleMomentOfInertia(
    width: number,
    height: number
): FormulaResult {
    const value = (width * Math.pow(height, 3)) / 12;
    return {
        value,
        unit: 'm⁴',
        name: 'Dikdörtgen Atalet Momenti',
        formula: 'I = b × h³ / 12',
    };
}

/**
 * Hollow Circle (Pipe) Moment of Inertia
 * I = π × (R⁴ - r⁴) / 4
 */
export function pipeAreaAndInertia(
    outerRadius: number,
    innerRadius: number
): { area: FormulaResult; inertia: FormulaResult; polarInertia: FormulaResult } {
    const area = PI * (outerRadius * outerRadius - innerRadius * innerRadius);
    const inertia = (PI / 4) * (Math.pow(outerRadius, 4) - Math.pow(innerRadius, 4));
    const polarInertia = (PI / 2) * (Math.pow(outerRadius, 4) - Math.pow(innerRadius, 4));

    return {
        area: {
            value: area,
            unit: 'm²',
            name: 'Boru Kesit Alanı',
            formula: 'A = π × (R² - r²)',
        },
        inertia: {
            value: inertia,
            unit: 'm⁴',
            name: 'Boru Atalet Momenti',
            formula: 'I = π × (R⁴ - r⁴) / 4',
        },
        polarInertia: {
            value: polarInertia,
            unit: 'm⁴',
            name: 'Boru Polar Atalet Momenti',
            formula: 'J = π × (R⁴ - r⁴) / 2',
        },
    };
}

// ================================================
// GÜVENLIK FAKTÖRÜ (Safety Factor)
// ================================================

/**
 * Safety Factor
 * n = σallow / σactual
 */
export function safetyFactor(
    allowableStress: number,
    actualStress: number
): FormulaResult {
    const value = allowableStress / actualStress;
    return {
        value,
        unit: '-',
        name: 'Güvenlik Faktörü (n)',
        formula: 'n = σallow / σactual',
    };
}

// ================================================
// Von MISES GERİLMESİ (Combined Stress)
// ================================================

/**
 * Von Mises Equivalent Stress (2D)
 * σvm = √(σx² - σx×σy + σy² + 3×τxy²)
 */
export function vonMisesStress2D(
    sigmaX: number,
    sigmaY: number,
    tauXY: number
): FormulaResult {
    const value = Math.sqrt(
        sigmaX * sigmaX - sigmaX * sigmaY + sigmaY * sigmaY + 3 * tauXY * tauXY
    );
    return {
        value,
        unit: 'Pa',
        name: 'Von Mises Gerilmesi (σvm)',
        formula: 'σvm = √(σx² - σx×σy + σy² + 3×τxy²)',
    };
}
