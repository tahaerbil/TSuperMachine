import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import tr from './locales/tr.json';

// Custom languages will be stored in localStorage
const customLanguages: Record<string, any> = {};

// Load custom languages from localStorage
const loadCustomLanguages = () => {
    const stored = localStorage.getItem('customLanguages');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            Object.entries(parsed).forEach(([code, translations]) => {
                customLanguages[code] = translations;
            });
        } catch (e) {
            console.error('Failed to load custom languages:', e);
        }
    }
};

loadCustomLanguages();

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            tr: { translation: tr },
            ...Object.fromEntries(
                Object.entries(customLanguages).map(([code, translations]) => [
                    code,
                    { translation: translations }
                ])
            )
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export const addCustomLanguage = (code: string, translations: any) => {
    customLanguages[code] = translations;
    i18n.addResourceBundle(code, 'translation', translations);

    // Save to localStorage
    const stored = localStorage.getItem('customLanguages');
    const existing = stored ? JSON.parse(stored) : {};
    existing[code] = translations;
    localStorage.setItem('customLanguages', JSON.stringify(existing));
};

export const getAvailableLanguages = () => {
    return [
        { code: 'en', name: 'English' },
        { code: 'tr', name: 'Türkçe' },
        ...Object.keys(customLanguages).map(code => ({
            code,
            name: customLanguages[code]?.app?.title || code
        }))
    ];
};

export default i18n;
