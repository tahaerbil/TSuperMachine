/**
 * Physical Constants for Engineering Calculations
 */

// Gravitational acceleration (m/s²)
export const GRAVITY = 9.80665;

// Pi
export const PI = Math.PI;

// Atmospheric pressure at sea level (Pa)
export const ATMOSPHERIC_PRESSURE = 101325;

// Stefan-Boltzmann constant (W/(m²·K⁴))
export const STEFAN_BOLTZMANN = 5.670374419e-8;

// Universal gas constant (J/(mol·K))
export const GAS_CONSTANT = 8.314462618;

// Boltzmann constant (J/K)
export const BOLTZMANN = 1.380649e-23;

// Speed of light (m/s)
export const SPEED_OF_LIGHT = 299792458;

// Avogadro's number (mol⁻¹)
export const AVOGADRO = 6.02214076e23;

// Standard temperature (K)
export const STANDARD_TEMPERATURE = 273.15;

// Water properties at 20°C
export const WATER = {
    density: 998.2,          // kg/m³
    viscosity: 1.002e-3,     // Pa·s (dynamic viscosity)
    specificHeat: 4182,      // J/(kg·K)
    thermalConductivity: 0.598, // W/(m·K)
};

// Air properties at 20°C, 1 atm
export const AIR = {
    density: 1.204,          // kg/m³
    viscosity: 1.825e-5,     // Pa·s (dynamic viscosity)
    specificHeat: 1006,      // J/(kg·K)
    thermalConductivity: 0.0257, // W/(m·K)
    gasConstant: 287.05,     // J/(kg·K) specific gas constant
};

// Safety factors (commonly used)
export const SAFETY_FACTORS = {
    static: 2.0,             // Static loading
    fatigue: 3.0,            // Fatigue loading
    impact: 5.0,             // Impact loading
    unknown: 4.0,            // Unknown loading
};
