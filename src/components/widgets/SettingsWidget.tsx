import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore, applyTheme } from '../../store/themeStore';
import type { ThemeMode } from '../../store/themeStore';
import { getAvailableLanguages, addCustomLanguage } from '../../i18n';
import { Palette, Globe, Upload, Download, Maximize2, Grid3X3, Circle, Minus } from 'lucide-react';
import { useStore, type GridStyle } from '../../store/store';

export const SettingsWidget: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { mode, customTheme, setMode, setCustomTheme } = useThemeStore();
    const { zoomSensitivity, setZoomSensitivity, gridStyle, setGridStyle } = useStore();
    const [activeTab, setActiveTab] = useState<'theme' | 'language' | 'canvas'>('theme');

    const handleThemeChange = (newMode: ThemeMode) => {
        setMode(newMode);
        applyTheme(newMode, customTheme);
    };

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
    };

    const handleCustomLanguageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const code = prompt('Enter language code (e.g., "de" for German):');
                if (code) {
                    addCustomLanguage(code, json);
                    i18n.changeLanguage(code);
                }
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const template = {
            app: {
                title: "TSuperMachine",
                toolbar: {
                    note: "Note",
                    calculator: "Calculator",
                    // ... add all keys
                }
            }
        };
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'language-template.json';
        a.click();
    };

    return (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'theme' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('theme')}
                >
                    <Palette size={16} />
                    {t('app.settings.theme')}
                </button>
                <button
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'language' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('language')}
                >
                    <Globe size={16} />
                    {t('app.settings.language')}
                </button>
                <button
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'canvas' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('canvas')}
                >
                    <Maximize2 size={16} />
                    {t('app.settings.canvas')}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'canvas' && (
                    <div className="space-y-6">
                        {/* Grid Style Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('app.settings.canvasSettings.gridStyle')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['none', 'lines', 'dots'] as GridStyle[]).map((style) => (
                                    <button
                                        key={style}
                                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center gap-2 ${gridStyle === style
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                            }`}
                                        onClick={() => setGridStyle(style)}
                                    >
                                        {style === 'none' && <Minus size={20} />}
                                        {style === 'lines' && <Grid3X3 size={20} />}
                                        {style === 'dots' && <Circle size={20} />}
                                        <span>{t(`app.settings.canvasSettings.grid${style.charAt(0).toUpperCase() + style.slice(1)}`)}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {t('app.settings.canvasSettings.gridDescription')}
                            </p>
                        </div>

                        {/* Divider */}
                        <hr className="border-gray-200" />

                        {/* Zoom Speed */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('app.settings.canvasSettings.zoomSpeed')}
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={zoomSensitivity}
                                    onChange={(e) => setZoomSensitivity(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{t('app.settings.canvasSettings.slower')} (0.5x)</span>
                                    <span className="font-semibold text-blue-600">{zoomSensitivity.toFixed(1)}x</span>
                                    <span>{t('app.settings.canvasSettings.faster')} (2x)</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {t('app.settings.canvasSettings.description')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'theme' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('app.settings.theme')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['light', 'dark', 'custom'] as ThemeMode[]).map((themeMode) => (
                                    <button
                                        key={themeMode}
                                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${mode === themeMode
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleThemeChange(themeMode)}
                                    >
                                        {t(`app.settings.themes.${themeMode}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mode === 'custom' && (
                            <div className="space-y-3 pt-4 border-t">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    {t('app.settings.customTheme.title')}
                                </h3>
                                {Object.entries(customTheme).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <label className="text-sm text-gray-600 w-24">
                                            {t(`app.settings.customTheme.${key}`)}
                                        </label>
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(e) => {
                                                const newTheme = { [key]: e.target.value };
                                                setCustomTheme(newTheme);
                                                applyTheme('custom', { ...customTheme, ...newTheme });
                                            }}
                                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500 font-mono">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'language' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('app.settings.language')}
                            </label>
                            <div className="space-y-2">
                                {getAvailableLanguages().map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`w-full p-3 border-2 rounded-lg text-left text-sm font-medium transition-colors ${i18n.language === lang.code
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                                {t('app.settings.customLanguage.title')}
                            </h3>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer">
                                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                                        <Upload size={16} />
                                        <span className="text-sm">{t('app.settings.customLanguage.upload')}</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="hidden"
                                        onChange={handleCustomLanguageUpload}
                                    />
                                </label>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                                >
                                    <Download size={16} />
                                    <span className="text-sm">{t('app.settings.customLanguage.download')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
