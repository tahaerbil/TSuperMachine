import React, { useState, useCallback } from 'react';
import {
    FileText,
    Users,
    Sun,
    Folder,
    Bug,
    Code,
    Calendar,
    CheckSquare,
    X,
    ChevronRight
} from 'lucide-react';
import { noteTemplates, type NoteTemplate } from '../templates';

interface TemplatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: NoteTemplate) => void;
}

const iconMap: Record<string, React.ReactNode> = {
    file: <FileText size={20} />,
    users: <Users size={20} />,
    sun: <Sun size={20} />,
    folder: <Folder size={20} />,
    bug: <Bug size={20} />,
    code: <Code size={20} />,
    calendar: <Calendar size={20} />,
    checkSquare: <CheckSquare size={20} />,
};

const categoryLabels: Record<NoteTemplate['category'], string> = {
    productivity: '📊 Productivity',
    meeting: '👥 Meetings',
    personal: '📝 Personal',
    development: '💻 Development',
};

const categoryColors: Record<NoteTemplate['category'], string> = {
    productivity: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    meeting: 'bg-green-500/10 text-green-600 border-green-500/20',
    personal: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    development: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<NoteTemplate['category'] | 'all'>('all');

    const filteredTemplates = selectedCategory === 'all'
        ? noteTemplates
        : noteTemplates.filter(t => t.category === selectedCategory);

    const handleSelect = useCallback((template: NoteTemplate) => {
        onSelectTemplate(template);
        onClose();
    }, [onSelectTemplate, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                            Choose a Template
                        </h2>
                        <p className="text-sm opacity-60" style={{ color: 'var(--color-text)' }}>
                            Start with a pre-built structure
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--color-text)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Category Filter */}
                <div
                    className="flex gap-2 px-6 py-3 border-b overflow-x-auto"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-black/5 hover:bg-black/10'
                            }`}
                        style={selectedCategory !== 'all' ? { color: 'var(--color-text)' } : {}}
                    >
                        All
                    </button>
                    {(Object.keys(categoryLabels) as NoteTemplate['category'][]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-blue-500 text-white'
                                : 'bg-black/5 hover:bg-black/10'
                                }`}
                            style={selectedCategory !== cat ? { color: 'var(--color-text)' } : {}}
                        >
                            {categoryLabels[cat]}
                        </button>
                    ))}
                </div>

                {/* Template Grid */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    <div className="grid grid-cols-2 gap-4">
                        {filteredTemplates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                onMouseEnter={() => setHoveredId(template.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`
                                    relative flex items-start gap-4 p-4 rounded-xl border text-left
                                    transition-all duration-200 group
                                    ${hoveredId === template.id ? 'border-blue-500 shadow-lg scale-[1.02]' : ''}
                                `}
                                style={{
                                    borderColor: hoveredId === template.id ? undefined : 'var(--color-border)',
                                    backgroundColor: hoveredId === template.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className={`
                                        flex items-center justify-center w-12 h-12 rounded-lg border
                                        ${categoryColors[template.category]}
                                    `}
                                >
                                    {iconMap[template.icon] || <FileText size={20} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="font-medium truncate"
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        {template.name}
                                    </h3>
                                    <p
                                        className="text-sm opacity-60 line-clamp-2"
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        {template.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ChevronRight
                                    size={18}
                                    className={`
                                        absolute right-4 top-1/2 -translate-y-1/2
                                        transition-all duration-200
                                        ${hoveredId === template.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                                    `}
                                    style={{ color: 'var(--color-text)' }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer hint */}
                <div
                    className="px-6 py-3 border-t text-center text-sm opacity-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                    Tip: You can also type <kbd className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-xs">/</kbd> in the editor for quick commands
                </div>
            </div>
        </div>
    );
};
