import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { Upload, ZoomIn, ZoomOut, RotateCw, Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageViewerWidgetProps {
    id: string;
    initialImage?: string;
}

export const ImageViewerWidget: React.FC<ImageViewerWidgetProps> = ({ id, initialImage }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(initialImage || null);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setImageUrl(url);
            updateWidget(id, { data: { image: url } });
        };
        reader.readAsDataURL(file);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 400));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'image.png';
        link.click();
    };

    const handleClear = () => {
        setImageUrl(null);
        setZoom(100);
        setRotation(0);
        updateWidget(id, { data: { image: null } });
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                        <div className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            <span>{t('app.widgets.image.upload') || 'Upload'}</span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </label>

                    {imageUrl && (
                        <>
                            <button
                                onClick={handleZoomOut}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                title="Zoom Out"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <span className="text-xs text-gray-600 min-w-12 text-center">{zoom}%</span>
                            <button
                                onClick={handleZoomIn}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                title="Zoom In"
                            >
                                <ZoomIn size={16} />
                            </button>
                            <button
                                onClick={handleRotate}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                title="Rotate"
                            >
                                <RotateCw size={16} />
                            </button>
                        </>
                    )}
                </div>

                {imageUrl && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={handleClear}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Clear"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Image Display */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Uploaded"
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        className="select-none"
                    />
                ) : (
                    <div className="text-center text-gray-400">
                        <Upload size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">{t('app.widgets.image.empty') || 'Click Upload to add an image'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
