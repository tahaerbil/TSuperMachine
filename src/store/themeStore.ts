import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'custom';

export interface CustomTheme {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
}

interface ThemeState {
    mode: ThemeMode;
    customTheme: CustomTheme;
    setMode: (mode: ThemeMode) => void;
    setCustomTheme: (theme: Partial<CustomTheme>) => void;
}

const defaultCustomTheme: CustomTheme = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#f3f4f6',
    surface: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb'
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'light',
            customTheme: defaultCustomTheme,
            setMode: (mode) => set({ mode }),
            setCustomTheme: (theme) => set((state) => ({
                customTheme: { ...state.customTheme, ...theme }
            }))
        }),
        {
            name: 'theme-storage'
        }
    )
);

// Apply theme to CSS variables
export const applyTheme = (mode: ThemeMode, customTheme: CustomTheme) => {
    const root = document.documentElement;

    if (mode === 'light') {
        root.style.setProperty('--color-primary', '#3b82f6');
        root.style.setProperty('--color-secondary', '#8b5cf6');
        root.style.setProperty('--color-background', '#f3f4f6');
        root.style.setProperty('--color-surface', '#ffffff');
        root.style.setProperty('--color-text', '#1f2937');
        root.style.setProperty('--color-border', '#e5e7eb');
    } else if (mode === 'dark') {
        root.style.setProperty('--color-primary', '#60a5fa');
        root.style.setProperty('--color-secondary', '#a78bfa');
        root.style.setProperty('--color-background', '#111827');
        root.style.setProperty('--color-surface', '#1f2937');
        root.style.setProperty('--color-text', '#f9fafb');
        root.style.setProperty('--color-border', '#374151');
    } else {
        root.style.setProperty('--color-primary', customTheme.primary);
        root.style.setProperty('--color-secondary', customTheme.secondary);
        root.style.setProperty('--color-background', customTheme.background);
        root.style.setProperty('--color-surface', customTheme.surface);
        root.style.setProperty('--color-text', customTheme.text);
        root.style.setProperty('--color-border', customTheme.border);
    }
};
