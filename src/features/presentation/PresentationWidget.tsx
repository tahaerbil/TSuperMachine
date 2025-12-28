import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { Plus, Trash2, ChevronLeft, ChevronRight, Presentation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Slide {
    id: string;
    title: string;
    content: string;
}

interface PresentationWidgetProps {
    id: string;
    initialSlides?: Slide[];
}

export const PresentationWidget: React.FC<PresentationWidgetProps> = ({ id, initialSlides = [] }) => {
    const [slides, setSlides] = useState<Slide[]>(
        initialSlides.length > 0 ? initialSlides : [{ id: crypto.randomUUID(), title: 'Slide 1', content: '' }]
    );
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPresentMode, setIsPresentMode] = useState(false);
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    const saveSlides = (newSlides: Slide[]) => {
        setSlides(newSlides);
        updateWidget(id, { data: { slides: newSlides } });
    };

    const addSlide = () => {
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            title: `Slide ${slides.length + 1}`,
            content: ''
        };
        saveSlides([...slides, newSlide]);
        setCurrentSlide(slides.length);
    };

    const deleteSlide = (index: number) => {
        if (slides.length === 1) return;
        const newSlides = slides.filter((_, i) => i !== index);
        saveSlides(newSlides);
        if (currentSlide >= newSlides.length) {
            setCurrentSlide(newSlides.length - 1);
        }
    };

    const updateSlide = (index: number, updates: Partial<Slide>) => {
        const newSlides = slides.map((slide, i) =>
            i === index ? { ...slide, ...updates } : slide
        );
        saveSlides(newSlides);
    };

    const goToPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
    const goToNext = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));

    if (isPresentMode) {
        return (
            <div className="w-full h-full flex flex-col bg-gray-900 text-white">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-4xl w-full">
                        <h1 className="text-4xl font-bold mb-6">{slides[currentSlide].title}</h1>
                        <div className="text-xl whitespace-pre-wrap">{slides[currentSlide].content}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
                    <button
                        onClick={goToPrev}
                        disabled={currentSlide === 0}
                        className="p-2 hover:bg-gray-700 rounded disabled:opacity-30"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-sm">
                        {currentSlide + 1} / {slides.length}
                    </span>
                    <button
                        onClick={goToNext}
                        disabled={currentSlide === slides.length - 1}
                        className="p-2 hover:bg-gray-700 rounded disabled:opacity-30"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
                <button
                    onClick={() => setIsPresentMode(false)}
                    className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                    {t('app.widgets.presentation.exit') || 'Exit Presentation'}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={addSlide}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <Plus size={14} />
                        <span>{t('app.widgets.presentation.addSlide') || 'Add Slide'}</span>
                    </button>
                    <button
                        onClick={() => setIsPresentMode(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <Presentation size={14} />
                        <span>{t('app.widgets.presentation.present') || 'Present'}</span>
                    </button>
                </div>
                <span className="text-sm text-gray-600">
                    {currentSlide + 1} / {slides.length}
                </span>
            </div>

            {/* Editor */}
            <div className="flex-1 flex overflow-hidden">
                {/* Slide thumbnails */}
                <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 p-2">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`mb-2 p-2 border-2 rounded cursor-pointer group relative ${index === currentSlide ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setCurrentSlide(index)}
                        >
                            <div className="text-xs font-semibold truncate">{slide.title}</div>
                            <div className="text-xs text-gray-500 truncate mt-1">{slide.content || '(empty)'}</div>
                            {slides.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSlide(index);
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Slide editor */}
                <div className="flex-1 p-6 overflow-auto">
                    <input
                        type="text"
                        value={slides[currentSlide].title}
                        onChange={(e) => updateSlide(currentSlide, { title: e.target.value })}
                        className="w-full text-3xl font-bold mb-4 px-2 py-1 border-b-2 border-transparent focus:border-blue-500 outline-none"
                        placeholder={t('app.widgets.presentation.titlePlaceholder') || 'Slide Title'}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <textarea
                        value={slides[currentSlide].content}
                        onChange={(e) => updateSlide(currentSlide, { content: e.target.value })}
                        className="w-full h-64 p-2 border border-gray-300 rounded resize-none outline-none focus:border-blue-500"
                        placeholder={t('app.widgets.presentation.contentPlaceholder') || 'Slide content...'}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    );
};
