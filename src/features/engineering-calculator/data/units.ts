/**
 * Unit Conversion System for Engineering Calculations
 */

export interface UnitCategory {
    name: string;
    nameEN: string;
    baseUnit: string;
    units: UnitDefinition[];
}

export interface UnitDefinition {
    id: string;
    name: string;
    symbol: string;
    toBase: number;     // Multiply by this to convert to base unit
    fromBase: number;   // Multiply by this to convert from base unit
}

export const unitCategories: UnitCategory[] = [
    {
        name: 'Uzunluk',
        nameEN: 'Length',
        baseUnit: 'm',
        units: [
            { id: 'mm', name: 'Milimetre', symbol: 'mm', toBase: 0.001, fromBase: 1000 },
            { id: 'cm', name: 'Santimetre', symbol: 'cm', toBase: 0.01, fromBase: 100 },
            { id: 'm', name: 'Metre', symbol: 'm', toBase: 1, fromBase: 1 },
            { id: 'km', name: 'Kilometre', symbol: 'km', toBase: 1000, fromBase: 0.001 },
            { id: 'in', name: 'İnç', symbol: 'in', toBase: 0.0254, fromBase: 39.3701 },
            { id: 'ft', name: 'Feet', symbol: 'ft', toBase: 0.3048, fromBase: 3.28084 },
            { id: 'yd', name: 'Yard', symbol: 'yd', toBase: 0.9144, fromBase: 1.09361 },
            { id: 'mi', name: 'Mil', symbol: 'mi', toBase: 1609.34, fromBase: 0.000621371 },
        ],
    },
    {
        name: 'Kütle',
        nameEN: 'Mass',
        baseUnit: 'kg',
        units: [
            { id: 'mg', name: 'Miligram', symbol: 'mg', toBase: 1e-6, fromBase: 1e6 },
            { id: 'g', name: 'Gram', symbol: 'g', toBase: 0.001, fromBase: 1000 },
            { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: 1, fromBase: 1 },
            { id: 't', name: 'Ton', symbol: 't', toBase: 1000, fromBase: 0.001 },
            { id: 'lb', name: 'Pound', symbol: 'lb', toBase: 0.453592, fromBase: 2.20462 },
            { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: 0.0283495, fromBase: 35.274 },
        ],
    },
    {
        name: 'Kuvvet',
        nameEN: 'Force',
        baseUnit: 'N',
        units: [
            { id: 'N', name: 'Newton', symbol: 'N', toBase: 1, fromBase: 1 },
            { id: 'kN', name: 'Kilonewton', symbol: 'kN', toBase: 1000, fromBase: 0.001 },
            { id: 'MN', name: 'Meganewton', symbol: 'MN', toBase: 1e6, fromBase: 1e-6 },
            { id: 'kgf', name: 'Kilogram-kuvvet', symbol: 'kgf', toBase: 9.80665, fromBase: 0.101972 },
            { id: 'lbf', name: 'Pound-force', symbol: 'lbf', toBase: 4.44822, fromBase: 0.224809 },
            { id: 'kip', name: 'Kilopound', symbol: 'kip', toBase: 4448.22, fromBase: 0.000224809 },
        ],
    },
    {
        name: 'Basınç',
        nameEN: 'Pressure',
        baseUnit: 'Pa',
        units: [
            { id: 'Pa', name: 'Pascal', symbol: 'Pa', toBase: 1, fromBase: 1 },
            { id: 'kPa', name: 'Kilopascal', symbol: 'kPa', toBase: 1000, fromBase: 0.001 },
            { id: 'MPa', name: 'Megapascal', symbol: 'MPa', toBase: 1e6, fromBase: 1e-6 },
            { id: 'GPa', name: 'Gigapascal', symbol: 'GPa', toBase: 1e9, fromBase: 1e-9 },
            { id: 'bar', name: 'Bar', symbol: 'bar', toBase: 1e5, fromBase: 1e-5 },
            { id: 'atm', name: 'Atmosfer', symbol: 'atm', toBase: 101325, fromBase: 9.8692e-6 },
            { id: 'psi', name: 'PSI', symbol: 'psi', toBase: 6894.76, fromBase: 0.000145038 },
            { id: 'mmHg', name: 'mmHg', symbol: 'mmHg', toBase: 133.322, fromBase: 0.00750062 },
        ],
    },
    {
        name: 'Sıcaklık',
        nameEN: 'Temperature',
        baseUnit: 'K',
        units: [
            { id: 'K', name: 'Kelvin', symbol: 'K', toBase: 1, fromBase: 1 },
            // Note: C and F require offset, handled separately
            { id: 'C', name: 'Celsius', symbol: '°C', toBase: 1, fromBase: 1 }, // + 273.15
            { id: 'F', name: 'Fahrenheit', symbol: '°F', toBase: 0.5556, fromBase: 1.8 }, // special
        ],
    },
    {
        name: 'Alan',
        nameEN: 'Area',
        baseUnit: 'm²',
        units: [
            { id: 'mm2', name: 'mm²', symbol: 'mm²', toBase: 1e-6, fromBase: 1e6 },
            { id: 'cm2', name: 'cm²', symbol: 'cm²', toBase: 1e-4, fromBase: 1e4 },
            { id: 'm2', name: 'm²', symbol: 'm²', toBase: 1, fromBase: 1 },
            { id: 'in2', name: 'in²', symbol: 'in²', toBase: 0.00064516, fromBase: 1550 },
            { id: 'ft2', name: 'ft²', symbol: 'ft²', toBase: 0.092903, fromBase: 10.7639 },
        ],
    },
    {
        name: 'Hacim',
        nameEN: 'Volume',
        baseUnit: 'm³',
        units: [
            { id: 'mm3', name: 'mm³', symbol: 'mm³', toBase: 1e-9, fromBase: 1e9 },
            { id: 'cm3', name: 'cm³', symbol: 'cm³', toBase: 1e-6, fromBase: 1e6 },
            { id: 'm3', name: 'm³', symbol: 'm³', toBase: 1, fromBase: 1 },
            { id: 'L', name: 'Litre', symbol: 'L', toBase: 0.001, fromBase: 1000 },
            { id: 'mL', name: 'Mililitre', symbol: 'mL', toBase: 1e-6, fromBase: 1e6 },
            { id: 'gal', name: 'Galon (US)', symbol: 'gal', toBase: 0.00378541, fromBase: 264.172 },
        ],
    },
    {
        name: 'Hız',
        nameEN: 'Velocity',
        baseUnit: 'm/s',
        units: [
            { id: 'ms', name: 'm/s', symbol: 'm/s', toBase: 1, fromBase: 1 },
            { id: 'kmh', name: 'km/h', symbol: 'km/h', toBase: 0.277778, fromBase: 3.6 },
            { id: 'mph', name: 'mil/saat', symbol: 'mph', toBase: 0.44704, fromBase: 2.23694 },
            { id: 'fts', name: 'ft/s', symbol: 'ft/s', toBase: 0.3048, fromBase: 3.28084 },
            { id: 'knot', name: 'Knot', symbol: 'kn', toBase: 0.514444, fromBase: 1.94384 },
        ],
    },
    {
        name: 'Moment/Tork',
        nameEN: 'Torque',
        baseUnit: 'Nm',
        units: [
            { id: 'Nm', name: 'Newton-metre', symbol: 'N·m', toBase: 1, fromBase: 1 },
            { id: 'kNm', name: 'Kilonewton-metre', symbol: 'kN·m', toBase: 1000, fromBase: 0.001 },
            { id: 'Nmm', name: 'Newton-milimetre', symbol: 'N·mm', toBase: 0.001, fromBase: 1000 },
            { id: 'kgfm', name: 'kgf·m', symbol: 'kgf·m', toBase: 9.80665, fromBase: 0.101972 },
            { id: 'lbfft', name: 'lbf·ft', symbol: 'lbf·ft', toBase: 1.35582, fromBase: 0.737562 },
            { id: 'lbfin', name: 'lbf·in', symbol: 'lbf·in', toBase: 0.112985, fromBase: 8.85075 },
        ],
    },
    {
        name: 'Güç',
        nameEN: 'Power',
        baseUnit: 'W',
        units: [
            { id: 'W', name: 'Watt', symbol: 'W', toBase: 1, fromBase: 1 },
            { id: 'kW', name: 'Kilowatt', symbol: 'kW', toBase: 1000, fromBase: 0.001 },
            { id: 'MW', name: 'Megawatt', symbol: 'MW', toBase: 1e6, fromBase: 1e-6 },
            { id: 'hp', name: 'Beygir gücü (mek.)', symbol: 'hp', toBase: 745.7, fromBase: 0.00134102 },
            { id: 'PS', name: 'Beygir gücü (met.)', symbol: 'PS', toBase: 735.499, fromBase: 0.00135962 },
        ],
    },
];

/**
 * Convert a value from one unit to another within the same category
 */
export function convertUnit(
    value: number,
    fromUnit: string,
    toUnit: string,
    categoryName?: string
): number | null {
    // Find the category containing these units
    const category = categoryName
        ? unitCategories.find(c => c.name === categoryName || c.nameEN === categoryName)
        : unitCategories.find(c =>
            c.units.some(u => u.id === fromUnit) && c.units.some(u => u.id === toUnit)
        );

    if (!category) return null;

    const from = category.units.find(u => u.id === fromUnit);
    const to = category.units.find(u => u.id === toUnit);

    if (!from || !to) return null;

    // Special handling for temperature
    if (category.baseUnit === 'K') {
        let kelvin: number;
        if (fromUnit === 'C') {
            kelvin = value + 273.15;
        } else if (fromUnit === 'F') {
            kelvin = (value - 32) * (5 / 9) + 273.15;
        } else {
            kelvin = value * from.toBase;
        }

        if (toUnit === 'C') {
            return kelvin - 273.15;
        } else if (toUnit === 'F') {
            return (kelvin - 273.15) * (9 / 5) + 32;
        } else {
            return kelvin * to.fromBase;
        }
    }

    // Standard conversion: value → base unit → target unit
    const baseValue = value * from.toBase;
    return baseValue * to.fromBase;
}
