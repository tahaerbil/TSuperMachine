/**
 * CAD Editor Feature Module
 * 
 * Public API exports for the 2D CAD Editor feature.
 * Use this barrel export to maintain a clean public interface.
 */

// ============================================================================
// Main Component
// ============================================================================
export { CAD2DWidget } from './CAD2DWidget';

// ============================================================================
// Sub-components
// ============================================================================
export { WasmCanvas } from './components/WasmCanvas';
export { CommandLine } from './components/CommandLine';

// ============================================================================
// Hooks
// ============================================================================
export { useCADCommand } from './hooks/useCADCommand';
export type { UseCADCommandProps } from './hooks/types';

// ============================================================================
// Utilities
// ============================================================================
export { CommandParser } from './CommandParser';

// ============================================================================
// Types
// ============================================================================
export type {
    CommandState,
    PreviewState,
    Point2D
} from './types';
