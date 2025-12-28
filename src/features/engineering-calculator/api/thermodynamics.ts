/**
 * Thermodynamics API for Renderer Process
 * Communicates with Python sidecar via Electron IPC
 */

// Types
export interface FluidInfo {
    id: string;
    name: string;
    nameEN: string;
}

export interface FluidProperties {
    fluid: string;
    pressure: number;  // Pa
    temperature: number;  // K
    density: number;  // kg/m³
    specificVolume: number;  // m³/kg
    enthalpy: number;  // J/kg
    entropy: number;  // J/(kg·K)
    internalEnergy: number;  // J/kg
    cp: number;  // J/(kg·K)
    cv: number;  // J/(kg·K)
    viscosity: number;  // Pa·s
    thermalConductivity: number;  // W/(m·K)
    speedOfSound: number;  // m/s
    phase: string;
    quality?: number;
    error?: string;
}

export interface SaturationProperties {
    fluid: string;
    saturationTemperature: number;  // K
    saturationPressure: number;  // Pa
    liquid: {
        density: number;
        enthalpy: number;
        entropy: number;
        cp: number;
        viscosity: number;
        thermalConductivity: number;
    };
    vapor: {
        density: number;
        enthalpy: number;
        entropy: number;
        cp: number;
        viscosity: number;
        thermalConductivity: number;
    };
    latentHeat: number;  // J/kg
    error?: string;
}

export interface CriticalPoint {
    fluid: string;
    criticalTemperature: number;  // K
    criticalPressure: number;  // Pa
    criticalDensity: number;  // kg/m³
    error?: string;
}

export interface CompressionResult {
    fluid: string;
    inlet: {
        pressure: number;
        temperature: number;
        enthalpy: number;
        entropy: number;
    };
    outletIsentropic: {
        pressure: number;
        temperature: number;
        enthalpy: number;
    };
    outletActual: {
        pressure: number;
        temperature: number;
        enthalpy: number;
    };
    isentropicWork: number;  // J/kg
    actualWork: number;  // J/kg
    efficiency: number;
    error?: string;
}

export interface HumidAirProperties {
    dryBulbTemperature: number;  // K
    relativeHumidity: number;  // -
    pressure: number;  // Pa
    humidityRatio: number;  // kg/kg
    wetBulbTemperature: number;  // K
    dewPointTemperature: number;  // K
    enthalpy: number;  // J/kg
    specificVolume: number;  // m³/kg
    density: number;  // kg/m³
    error?: string;
}

// Check if running in Electron with IPC
interface ElectronWindow {
    electron?: {
        ipcRenderer?: {
            invoke: <T>(channel: string, ...args: unknown[]) => Promise<T>;
        };
    };
}

const hasIPC = typeof window !== 'undefined' &&
    (window as unknown as ElectronWindow).electron?.ipcRenderer;

// Wrapper for IPC invoke with fallback
async function invokeIPC<T>(channel: string, ...args: unknown[]): Promise<T> {
    if (!hasIPC) {
        throw new Error('Thermodynamics API requires Electron with Python sidecar');
    }

    const electronWindow = window as unknown as ElectronWindow;
    return await electronWindow.electron!.ipcRenderer!.invoke<T>(channel, ...args);
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Check if thermodynamics API is available
 */
export const isThermodynamicsAvailable = async (): Promise<boolean> => {
    try {
        return await invokeIPC<boolean>('thermo:isReady');
    } catch {
        return false;
    }
};

/**
 * Start the Python sidecar
 */
export const startThermodynamics = async (): Promise<boolean> => {
    try {
        return await invokeIPC<boolean>('thermo:start');
    } catch {
        return false;
    }
};

/**
 * Get list of available fluids
 */
export const getFluidList = async (): Promise<FluidInfo[]> => {
    return await invokeIPC<FluidInfo[]>('thermo:getFluids');
};

/**
 * Get fluid properties at pressure and temperature
 * 
 * @param fluid - Fluid ID (e.g., 'water', 'r134a')
 * @param pressure - Pressure in Pa
 * @param temperature - Temperature in K
 */
export const getFluidProperties = async (
    fluid: string,
    pressure: number,
    temperature: number
): Promise<FluidProperties> => {
    return await invokeIPC<FluidProperties>('thermo:getPropertiesPT', fluid, pressure, temperature);
};

/**
 * Get saturation properties at given temperature or pressure
 * 
 * @param fluid - Fluid ID
 * @param options - Either { temperature: K } or { pressure: Pa }
 */
export const getSaturationProperties = async (
    fluid: string,
    options: { temperature?: number; pressure?: number }
): Promise<SaturationProperties> => {
    return await invokeIPC<SaturationProperties>(
        'thermo:getSaturation',
        fluid,
        options.temperature,
        options.pressure
    );
};

/**
 * Get critical point properties
 */
export const getCriticalPoint = async (fluid: string): Promise<CriticalPoint> => {
    return await invokeIPC<CriticalPoint>('thermo:getCritical', fluid);
};

/**
 * Calculate compression work (compressor)
 * 
 * @param fluid - Fluid ID
 * @param p1 - Inlet pressure (Pa)
 * @param t1 - Inlet temperature (K)
 * @param p2 - Outlet pressure (Pa)
 * @param efficiency - Isentropic efficiency (0-1)
 */
export const calculateCompressionWork = async (
    fluid: string,
    p1: number,
    t1: number,
    p2: number,
    efficiency: number = 1.0
): Promise<CompressionResult> => {
    return await invokeIPC<CompressionResult>(
        'thermo:compressionWork',
        fluid, p1, t1, p2, efficiency
    );
};

/**
 * Calculate expansion work (turbine)
 * 
 * @param fluid - Fluid ID
 * @param p1 - Inlet pressure (Pa)
 * @param t1 - Inlet temperature (K)
 * @param p2 - Outlet pressure (Pa)
 * @param efficiency - Isentropic efficiency (0-1)
 */
export const calculateExpansionWork = async (
    fluid: string,
    p1: number,
    t1: number,
    p2: number,
    efficiency: number = 1.0
): Promise<CompressionResult> => {
    return await invokeIPC<CompressionResult>(
        'thermo:expansionWork',
        fluid, p1, t1, p2, efficiency
    );
};

/**
 * Get humid air (psychrometric) properties
 * 
 * @param temperature - Dry bulb temperature (K)
 * @param relativeHumidity - Relative humidity (0-1)
 * @param pressure - Atmospheric pressure (Pa), default 101325
 */
export const getHumidAirProperties = async (
    temperature: number,
    relativeHumidity: number,
    pressure: number = 101325
): Promise<HumidAirProperties> => {
    return await invokeIPC<HumidAirProperties>(
        'thermo:humidAir',
        temperature, relativeHumidity, pressure
    );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert Celsius to Kelvin
 */
export const celsiusToKelvin = (celsius: number): number => celsius + 273.15;

/**
 * Convert Kelvin to Celsius
 */
export const kelvinToCelsius = (kelvin: number): number => kelvin - 273.15;

/**
 * Convert bar to Pa
 */
export const barToPa = (bar: number): number => bar * 1e5;

/**
 * Convert Pa to bar
 */
export const paToBar = (pa: number): number => pa / 1e5;

/**
 * Convert MPa to Pa
 */
export const mpaToPa = (mpa: number): number => mpa * 1e6;

/**
 * Convert Pa to MPa
 */
export const paToMpa = (pa: number): number => pa / 1e6;

/**
 * Format pressure for display
 */
export const formatPressure = (pa: number): string => {
    if (pa >= 1e6) {
        return `${(pa / 1e6).toFixed(2)} MPa`;
    } else if (pa >= 1e3) {
        return `${(pa / 1e3).toFixed(2)} kPa`;
    } else {
        return `${pa.toFixed(2)} Pa`;
    }
};

/**
 * Format temperature for display
 */
export const formatTemperature = (kelvin: number, unit: 'K' | 'C' = 'C'): string => {
    if (unit === 'C') {
        return `${(kelvin - 273.15).toFixed(2)} °C`;
    }
    return `${kelvin.toFixed(2)} K`;
};
