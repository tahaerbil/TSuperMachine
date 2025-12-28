import React, { useState, useRef } from 'react';
import { useStore } from '../../store/store';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';
import {
    saveProject,
    saveProjectAs,
    loadProject,
    validateProjectFile,
    getRecentProjects,
    addToRecentProjects,
    hasFileSystemAccess,
    getCurrentFilePath,
    clearCurrentFile
} from '../../core/services/project/projectManager';
import type { CanvasState } from '../../core/services/project/projectManager';
import { Save, SaveAll, FolderOpen, FileText, Trash2, Clock } from 'lucide-react';

export const ProjectMenuWidget: React.FC = () => {
    const { widgets, canvas, projectName, setProjectName, loadProjectState, clearAllWidgets, setProjectMetadata } = useStore();
    const { mode, customTheme } = useThemeStore();
    const { i18n, t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [recentProjects, setRecentProjects] = useState(getRecentProjects());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(getCurrentFilePath());
    const hasFSAPI = hasFileSystemAccess();

    const handleSaveProject = async () => {
        try {
            setLoading(true);
            setError(null);

            const canvasState: CanvasState = {
                canvas,
                widgets,
                theme: { mode, customTheme },
                language: i18n.language,
            };

            await saveProject(projectName, canvasState);
            setCurrentFilePath(getCurrentFilePath());

            const metadata = {
                name: projectName,
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                author: 'User',
            };
            addToRecentProjects(metadata);
            setRecentProjects(getRecentProjects());

            alert(t('app.project.saved') || 'Project saved successfully!');
        } catch (err) {
            if ((err as Error).message !== 'Save cancelled') {
                setError((err as Error).message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsProject = async () => {
        try {
            setLoading(true);
            setError(null);

            const canvasState: CanvasState = {
                canvas,
                widgets,
                theme: { mode, customTheme },
                language: i18n.language,
            };

            await saveProjectAs(projectName, canvasState);
            setCurrentFilePath(getCurrentFilePath());

            const metadata = {
                name: projectName,
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                author: 'User',
            };
            addToRecentProjects(metadata);
            setRecentProjects(getRecentProjects());

            alert(t('app.project.saved') || 'Project saved successfully!');
        } catch (err) {
            if ((err as Error).message !== 'Save cancelled') {
                setError((err as Error).message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLoadProject = async (file?: File) => {
        try {
            setLoading(true);
            setError(null);

            if (file && !validateProjectFile(file)) {
                throw new Error('Invalid project file');
            }

            const { metadata, canvasState } = await loadProject(file);

            loadProjectState(canvasState.widgets, canvasState.canvas);
            setProjectName(metadata.name);
            setProjectMetadata({
                created: metadata.created,
                modified: metadata.modified,
                author: metadata.author,
            });

            if (canvasState.language) {
                i18n.changeLanguage(canvasState.language);
            }

            addToRecentProjects(metadata);
            setRecentProjects(getRecentProjects());
            setCurrentFilePath(getCurrentFilePath());

            alert(t('app.project.loaded') || 'Project loaded successfully!');
        } catch (err) {
            if ((err as Error).message !== 'Open cancelled') {
                setError((err as Error).message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleLoadProject(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNewProject = () => {
        if (widgets.length > 0) {
            const confirm = window.confirm(
                t('app.project.confirmNew') || 'Are you sure? All unsaved changes will be lost.'
            );
            if (!confirm) return;
        }

        clearAllWidgets();
        setProjectName('Untitled Project');
        setProjectMetadata({
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: 'User'
        });
        clearCurrentFile();
        setCurrentFilePath(null);
    };

    const handleClearAll = () => {
        const confirm = window.confirm(
            t('app.project.confirmClear') || 'Are you sure you want to clear all widgets?'
        );
        if (confirm) {
            clearAllWidgets();
        }
    };

    return (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t('app.project.title') || 'Project'}
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Project Name */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        {t('app.project.name') || 'Project Name'}
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        style={{
                            backgroundColor: 'var(--color-background)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text)',
                        }}
                        placeholder="Enter project name"
                    />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    <button
                        onClick={handleNewProject}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded border hover:bg-opacity-80 transition-colors"
                        style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text)',
                        }}
                    >
                        <FileText size={20} />
                        <span>{t('app.project.new') || 'New Project'}</span>
                    </button>

                    <button
                        onClick={handleSaveProject}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        <span>{loading ? 'Saving...' : (t('app.project.save') || 'Save Project')}</span>
                    </button>

                    {hasFSAPI && (
                        <button
                            onClick={handleSaveAsProject}
                            disabled={loading}
                            className="w-full flex items-center gap-2 px-4 py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            <SaveAll size={20} />
                            <span>{loading ? 'Saving...' : (t('app.project.saveAs') || 'Save As...')}</span>
                        </button>
                    )}

                    <button
                        onClick={() => hasFSAPI ? handleLoadProject() : fileInputRef.current?.click()}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <FolderOpen size={20} />
                        <span>{loading ? 'Loading...' : (t('app.project.load') || 'Load Project')}</span>
                    </button>
                    {!hasFSAPI && (
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".tsm"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    )}

                    <button
                        onClick={handleClearAll}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={20} />
                        <span>{t('app.project.clear') || 'Clear All Widgets'}</span>
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Current File Path */}
                {hasFSAPI && currentFilePath && (
                    <div className="p-3 rounded border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                        <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                            {t('app.project.currentFile') || 'Current File:'}
                        </div>
                        <div className="text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                            {currentFilePath}
                        </div>
                    </div>
                )}

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                            <Clock size={16} />
                            {t('app.project.recent') || 'Recent Projects'}
                        </h3>
                        <div className="space-y-1">
                            {recentProjects.map((project, index) => (
                                <div
                                    key={index}
                                    className="text-sm p-2 rounded hover:bg-opacity-50 cursor-pointer"
                                    style={{
                                        backgroundColor: 'var(--color-background)',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    <div className="font-medium">{project.name}</div>
                                    <div className="text-xs opacity-70">
                                        {new Date(project.modified).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="pt-4 border-t text-xs opacity-70" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    <p>{widgets.length} widget(s) in current project</p>
                    <p className="mt-1">File format: .tsm (ZIP-based)</p>
                    {hasFSAPI && <p className="mt-1 text-green-600">✓ File System Access API enabled</p>}
                </div>
            </div>
        </div>
    );
};
