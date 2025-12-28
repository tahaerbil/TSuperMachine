// Engineering Calculator Feature Module
// Public API exports

// Main component
export { EngineeringCalculator } from './EngineeringCalculator';

// Sub-components
export { UnitConverter } from './components/UnitConverter';
export { MaterialSelector } from './components/MaterialSelector';
export { FormulaPanel } from './components/FormulaPanel';
export {
    StressStrainDiagram,
    MohrCircle,
    BeamDeflectionDiagram,
    SNDiagram,
    PHDiagram,
} from './components/EngineeringCharts';

// Hooks
export { useCalculator } from './hooks/useCalculator';

// Data
export { materials, materialCategories, getMaterialsByCategory } from './data/materials';
export { unitCategories, convertUnit } from './data/units';
export * from './data/constants';

// Formulas (includes machineElements which uses native wrapper)
export * from './formulas';

// Native check only
export { isNativeAvailable } from './native/calcEngine';

// Thermodynamics API (Python sidecar)
export * from './api/thermodynamics';
