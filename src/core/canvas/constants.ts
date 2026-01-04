/**
 * Canvas Configuration Constants
 * 
 * Centralized configuration for the canvas system.
 * All magic numbers and configuration values should be defined here.
 */

// =============================================================================
// ZOOM CONFIGURATION
// =============================================================================

/** Minimum allowed zoom scale */
export const MIN_ZOOM_SCALE = 0.1;

/** Maximum allowed zoom scale */
export const MAX_ZOOM_SCALE = 5;

/** Base zoom factor (5% change per scroll tick) */
export const BASE_ZOOM_FACTOR = 1.05;

/** Maximum zoom scale for fit-to-screen operation */
export const FIT_TO_SCREEN_MAX_SCALE = 2.0;

// =============================================================================
// GRID CONFIGURATION
// =============================================================================

/** Grid spacing in world units */
export const GRID_SPACING = 50;

/** Dot radius for dot grid style (fixed screen pixels) */
export const GRID_DOT_RADIUS = 1;

/** Grid dot color */
export const GRID_DOT_COLOR = 'rgba(100, 100, 100, 0.8)';

// =============================================================================
// INTERACTION CONFIGURATION
// =============================================================================

/** Padding around content for fit-to-screen (screen pixels) */
export const FIT_TO_SCREEN_PADDING = 50;

/** Double-click detection threshold (milliseconds) */
export const DOUBLE_CLICK_THRESHOLD_MS = 300;

/** Snap distance for widget alignment (world units) */
export const WIDGET_SNAP_DISTANCE = 15;

// =============================================================================
// PERFORMANCE CONFIGURATION
// =============================================================================

/** Throttle delay for grid rendering (milliseconds) */
export const GRID_RENDER_THROTTLE_MS = 16; // ~60fps

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

export const Z_INDEX = {
    /** Grid layer (bottom) */
    GRID: 0,
    /** Wire layer (connections) */
    WIRES: 1,
    /** Normal widgets */
    WIDGET_BASE: 10,
    /** Selected widget indicator */
    SELECTION_INDICATOR: 9999,
    /** Maximized widget */
    MAXIMIZED_WIDGET: 9999,
    /** Lasso selection rectangle */
    LASSO: 9999,
    /** Selection counter badge */
    SELECTION_COUNTER: 10000,
    /** Context menu */
    CONTEXT_MENU: 10001,
} as const;
