import '@testing-library/jest-dom';

// Mocking required browser APIs that aren't available in jsdom or need shim
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
window.ResizeObserver = ResizeObserver;

// Mock Pointer Events if needed (jsdom doesn't support them fully)
// Object.defineProperty(window, 'PointerEvent', { value: MouseEvent });
