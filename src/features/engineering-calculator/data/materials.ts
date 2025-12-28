/**
 * Material Properties Database for Engineering Calculations
 * All values are typical/nominal - actual values may vary
 */

export interface Material {
    name: string;
    nameEN: string;
    category: 'steel' | 'aluminum' | 'copper' | 'plastic' | 'other';
    density: number;              // kg/m³
    elasticModulus: number;       // GPa (Young's modulus)
    shearModulus: number;         // GPa
    yieldStrength: number;        // MPa
    tensileStrength: number;      // MPa
    poissonsRatio: number;        // dimensionless
    thermalConductivity: number;  // W/(m·K)
    thermalExpansion: number;     // 1/K (×10⁻⁶)
    specificHeat: number;         // J/(kg·K)
    meltingPoint?: number;        // °C
}

export const materials: Record<string, Material> = {
    // Steels
    'steel_s235': {
        name: 'S235 Yapı Çeliği',
        nameEN: 'S235 Structural Steel',
        category: 'steel',
        density: 7850,
        elasticModulus: 210,
        shearModulus: 80,
        yieldStrength: 235,
        tensileStrength: 360,
        poissonsRatio: 0.3,
        thermalConductivity: 50,
        thermalExpansion: 12,
        specificHeat: 480,
        meltingPoint: 1425,
    },
    'steel_s355': {
        name: 'S355 Yapı Çeliği',
        nameEN: 'S355 Structural Steel',
        category: 'steel',
        density: 7850,
        elasticModulus: 210,
        shearModulus: 80,
        yieldStrength: 355,
        tensileStrength: 470,
        poissonsRatio: 0.3,
        thermalConductivity: 50,
        thermalExpansion: 12,
        specificHeat: 480,
        meltingPoint: 1420,
    },
    'steel_aisi304': {
        name: 'AISI 304 Paslanmaz Çelik',
        nameEN: 'AISI 304 Stainless Steel',
        category: 'steel',
        density: 8000,
        elasticModulus: 193,
        shearModulus: 77,
        yieldStrength: 215,
        tensileStrength: 505,
        poissonsRatio: 0.29,
        thermalConductivity: 16.2,
        thermalExpansion: 17.3,
        specificHeat: 500,
        meltingPoint: 1400,
    },
    'steel_aisi316': {
        name: 'AISI 316 Paslanmaz Çelik',
        nameEN: 'AISI 316 Stainless Steel',
        category: 'steel',
        density: 8000,
        elasticModulus: 193,
        shearModulus: 77,
        yieldStrength: 290,
        tensileStrength: 580,
        poissonsRatio: 0.29,
        thermalConductivity: 16.3,
        thermalExpansion: 16,
        specificHeat: 500,
        meltingPoint: 1375,
    },
    'steel_4140': {
        name: '4140 Alaşımlı Çelik',
        nameEN: '4140 Alloy Steel',
        category: 'steel',
        density: 7850,
        elasticModulus: 210,
        shearModulus: 80,
        yieldStrength: 655,
        tensileStrength: 1020,
        poissonsRatio: 0.29,
        thermalConductivity: 42,
        thermalExpansion: 12.2,
        specificHeat: 473,
        meltingPoint: 1416,
    },

    // Aluminum
    'aluminum_6061': {
        name: '6061-T6 Alüminyum',
        nameEN: '6061-T6 Aluminum',
        category: 'aluminum',
        density: 2700,
        elasticModulus: 68.9,
        shearModulus: 26,
        yieldStrength: 276,
        tensileStrength: 310,
        poissonsRatio: 0.33,
        thermalConductivity: 167,
        thermalExpansion: 23.6,
        specificHeat: 896,
        meltingPoint: 582,
    },
    'aluminum_7075': {
        name: '7075-T6 Alüminyum',
        nameEN: '7075-T6 Aluminum',
        category: 'aluminum',
        density: 2810,
        elasticModulus: 71.7,
        shearModulus: 26.9,
        yieldStrength: 503,
        tensileStrength: 572,
        poissonsRatio: 0.33,
        thermalConductivity: 130,
        thermalExpansion: 23.4,
        specificHeat: 960,
        meltingPoint: 477,
    },

    // Copper
    'copper_pure': {
        name: 'Saf Bakır',
        nameEN: 'Pure Copper',
        category: 'copper',
        density: 8960,
        elasticModulus: 117,
        shearModulus: 44,
        yieldStrength: 70,
        tensileStrength: 220,
        poissonsRatio: 0.34,
        thermalConductivity: 401,
        thermalExpansion: 16.5,
        specificHeat: 385,
        meltingPoint: 1085,
    },
    'brass_c36000': {
        name: 'C36000 Pirinç',
        nameEN: 'C36000 Brass',
        category: 'copper',
        density: 8500,
        elasticModulus: 97,
        shearModulus: 37,
        yieldStrength: 140,
        tensileStrength: 340,
        poissonsRatio: 0.34,
        thermalConductivity: 115,
        thermalExpansion: 20.5,
        specificHeat: 380,
        meltingPoint: 885,
    },

    // Plastics
    'abs': {
        name: 'ABS Plastik',
        nameEN: 'ABS Plastic',
        category: 'plastic',
        density: 1050,
        elasticModulus: 2.3,
        shearModulus: 0.85,
        yieldStrength: 45,
        tensileStrength: 50,
        poissonsRatio: 0.35,
        thermalConductivity: 0.17,
        thermalExpansion: 90,
        specificHeat: 1400,
    },
    'pom': {
        name: 'POM (Delrin)',
        nameEN: 'POM (Delrin)',
        category: 'plastic',
        density: 1410,
        elasticModulus: 3.1,
        shearModulus: 1.15,
        yieldStrength: 65,
        tensileStrength: 70,
        poissonsRatio: 0.35,
        thermalConductivity: 0.31,
        thermalExpansion: 110,
        specificHeat: 1500,
        meltingPoint: 175,
    },
    'nylon_6': {
        name: 'Naylon 6',
        nameEN: 'Nylon 6',
        category: 'plastic',
        density: 1130,
        elasticModulus: 2.9,
        shearModulus: 1.1,
        yieldStrength: 75,
        tensileStrength: 85,
        poissonsRatio: 0.39,
        thermalConductivity: 0.25,
        thermalExpansion: 80,
        specificHeat: 1700,
        meltingPoint: 220,
    },
};

// Get materials by category
export const getMaterialsByCategory = (category: Material['category']): Material[] => {
    return Object.values(materials).filter(m => m.category === category);
};

// Get all material categories
export const materialCategories = [
    { id: 'steel', name: 'Çelik', nameEN: 'Steel' },
    { id: 'aluminum', name: 'Alüminyum', nameEN: 'Aluminum' },
    { id: 'copper', name: 'Bakır/Pirinç', nameEN: 'Copper/Brass' },
    { id: 'plastic', name: 'Plastik', nameEN: 'Plastic' },
] as const;
