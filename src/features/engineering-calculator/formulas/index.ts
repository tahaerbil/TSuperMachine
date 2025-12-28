/**
 * Engineering Formulas Index
 * All formula modules exported from here
 */

// Strength of Materials
export * from './strength';

// Fluid Mechanics
export * from './fluids';

// Heat Transfer
export * from './thermal';

// Machine Elements (includes shafts, bolts, bearings, gears, fatigue, springs, welding)
export * from './machineElements';

// Formula categories for UI
export const formulaCategories = [
    {
        id: 'strength',
        name: 'Mukavemet',
        nameEN: 'Strength of Materials',
        icon: 'shield',
        description: 'Gerilme, deformasyon, kesit özellikleri',
    },
    {
        id: 'fluids',
        name: 'Akışkanlar',
        nameEN: 'Fluid Mechanics',
        icon: 'droplet',
        description: 'Reynolds, Bernoulli, boru akışı, pompa',
    },
    {
        id: 'thermal',
        name: 'Isı Transferi',
        nameEN: 'Heat Transfer',
        icon: 'thermometer',
        description: 'İletim, taşınım, ışınım, ısı değiştirici',
    },
    {
        id: 'shafts',
        name: 'Mil ve Cıvata',
        nameEN: 'Shafts & Fasteners',
        icon: 'cog',
        description: 'Şaft tasarımı, cıvata hesapları',
    },
] as const;

// Quick formulas for the main calculator
export const quickFormulas = [
    { id: 'stress', name: 'σ = F/A', desc: 'Normal Gerilme' },
    { id: 'shearStress', name: 'τ = V/A', desc: 'Kayma Gerilmesi' },
    { id: 'reynolds', name: 'Re = ρvD/μ', desc: 'Reynolds Sayısı' },
    { id: 'bernoulli', name: 'P + ½ρv² = sabit', desc: 'Bernoulli' },
    { id: 'fourier', name: 'Q = kAΔT/L', desc: 'Isı İletimi' },
    { id: 'power', name: 'P = Tω', desc: 'Şaft Gücü' },
    { id: 'boltTorque', name: 'T = KdFi', desc: 'Cıvata Sıkma Momenti' },
] as const;
