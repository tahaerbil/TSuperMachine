import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore, applyTheme } from '../../store/themeStore';
import type { ThemeMode } from '../../store/themeStore';
import { getAvailableLanguages, addCustomLanguage } from '../../i18n';
import { Palette, Globe, Upload, Download, Maximize2, Grid3X3, Circle, Minus, Bot, Plus, Trash2, Cpu, Cloud, Check } from 'lucide-react';
import { useStore, type GridStyle } from '../../store/store';
import { useAISettingsStore, type AIProviderConfig } from '../../store/aiSettingsStore';

export const SettingsWidget: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { mode, customTheme, setMode, setCustomTheme } = useThemeStore();
    const { zoomSensitivity, setZoomSensitivity, gridStyle, setGridStyle } = useStore();
    const { providers, activeProviderId, addProvider, updateProvider, removeProvider, setActiveProvider } = useAISettingsStore();
    const [activeTab, setActiveTab] = useState<'theme' | 'language' | 'canvas' | 'ai'>('theme');

    // AI Settings state
    const [showAddProvider, setShowAddProvider] = useState(false);
    const [newProviderType, setNewProviderType] = useState<'local' | 'api'>('local');
    const [newProviderName, setNewProviderName] = useState('');
    const [newProviderModel, setNewProviderModel] = useState('qwen2.5:3b');
    const [newProviderEndpoint, setNewProviderEndpoint] = useState('http://localhost:11434');
    const [newProviderApiKey, setNewProviderApiKey] = useState('');
    const [newProviderApiEndpoint, setNewProviderApiEndpoint] = useState('https://api.openai.com/v1');

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

    const handleAddProvider = () => {
        if (!newProviderName.trim()) return;

        const provider: AIProviderConfig = {
            id: `provider-${Date.now()}`,
            name: newProviderName,
            type: newProviderType,
            model: newProviderType === 'local' ? newProviderModel : undefined,
            endpoint: newProviderType === 'local' ? newProviderEndpoint : undefined,
            apiKey: newProviderType === 'api' ? newProviderApiKey : undefined,
            apiEndpoint: newProviderType === 'api' ? newProviderApiEndpoint : undefined
        };

        addProvider(provider);
        setShowAddProvider(false);
        setNewProviderName('');
        setNewProviderModel('qwen2.5:3b');
        setNewProviderApiKey('');
    };

    return (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button
                    className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'theme' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('theme')}
                >
                    <Palette size={16} />
                    {t('app.settings.theme')}
                </button>
                <button
                    className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'language' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('language')}
                >
                    <Globe size={16} />
                    {t('app.settings.language')}
                </button>
                <button
                    className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'canvas' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('canvas')}
                >
                    <Maximize2 size={16} />
                    {t('app.settings.canvas')}
                </button>
                <button
                    className={`flex-1 px-3 py-3 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'ai' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('ai')}
                >
                    <Bot size={16} />
                    AI
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* AI Settings Tab */}
                {activeTab === 'ai' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Providers</h3>
                            <button
                                onClick={() => setShowAddProvider(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        </div>

                        {/* Provider List */}
                        <div className="space-y-2">
                            {providers.map((provider) => (
                                <div
                                    key={provider.id}
                                    className={`p-3 border-2 rounded-lg transition-all ${activeProviderId === provider.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {provider.type === 'embedded' ? (
                                                <Bot size={16} className="text-purple-500" />
                                            ) : provider.type === 'local' ? (
                                                <Cpu size={16} className="text-green-500" />
                                            ) : (
                                                <Cloud size={16} className="text-blue-500" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{provider.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {provider.type === 'embedded'
                                                        ? 'Yerleşik (harici bağlantı gerekmez)'
                                                        : provider.type === 'local'
                                                            ? `Model: ${provider.model}`
                                                            : `API: ${provider.apiEndpoint?.split('/')[2]}`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {activeProviderId === provider.id ? (
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                                    <Check size={12} />
                                                    Active
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveProvider(provider.id)}
                                                    className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                                >
                                                    Select
                                                </button>
                                            )}
                                            {!provider.isDefault && (
                                                <button
                                                    onClick={() => removeProvider(provider.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Editable fields for local provider */}
                                    {provider.type === 'local' && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={provider.model || ''}
                                                    onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                                                    placeholder="Model name (e.g., qwen2.5:3b)"
                                                    className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Provider Form */}
                        {showAddProvider && (
                            <div className="p-4 border-2 border-dashed border-blue-400/50 rounded-lg bg-blue-500/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Add New Provider</h4>
                                    <button
                                        onClick={() => setShowAddProvider(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Type Selection */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewProviderType('local')}
                                        className={`flex-1 p-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 ${newProviderType === 'local'
                                            ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent'
                                            }`}
                                    >
                                        <Cpu size={14} />
                                        Local (Ollama)
                                    </button>
                                    <button
                                        onClick={() => setNewProviderType('api')}
                                        className={`flex-1 p-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 ${newProviderType === 'api'
                                            ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent'
                                            }`}
                                    >
                                        <Cloud size={14} />
                                        API
                                    </button>
                                </div>

                                {/* Name */}
                                <input
                                    type="text"
                                    value={newProviderName}
                                    onChange={(e) => setNewProviderName(e.target.value)}
                                    placeholder="Provider name"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                />

                                {/* Local Settings */}
                                {newProviderType === 'local' && (
                                    <>
                                        <input
                                            type="text"
                                            value={newProviderModel}
                                            onChange={(e) => setNewProviderModel(e.target.value)}
                                            placeholder="Model name (e.g., qwen2.5:3b)"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={newProviderEndpoint}
                                            onChange={(e) => setNewProviderEndpoint(e.target.value)}
                                            placeholder="Endpoint (e.g., http://localhost:11434)"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                        />
                                    </>
                                )}

                                {/* API Settings */}
                                {newProviderType === 'api' && (
                                    <>
                                        <input
                                            type="password"
                                            value={newProviderApiKey}
                                            onChange={(e) => setNewProviderApiKey(e.target.value)}
                                            placeholder="API Key"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                        />
                                        <input
                                            type="text"
                                            value={newProviderApiEndpoint}
                                            onChange={(e) => setNewProviderApiEndpoint(e.target.value)}
                                            placeholder="API Endpoint (e.g., https://api.openai.com/v1)"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg focus:border-blue-500 focus:outline-none placeholder-gray-400"
                                        />
                                    </>
                                )}

                                <button
                                    onClick={handleAddProvider}
                                    disabled={!newProviderName.trim()}
                                    className="w-full py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add Provider
                                </button>
                            </div>
                        )}

                        {/* Info */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            💡 For local AI, install Ollama and run: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ollama pull qwen2.5:3b</code>
                        </p>
                    </div>
                )}

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

