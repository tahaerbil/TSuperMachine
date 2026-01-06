/**
 * Widget Renderer
 * 
 * Centralized widget content rendering component.
 * Maps widget types to their corresponding React components.
 * Uses React.lazy and Suspense for code splitting.
 */

import React, { Suspense } from 'react';
import type { Widget } from '../../store/store';
import { WidgetLoading } from '../../components/WidgetLoading';

// Lazy load feature widgets
// Note: We use .then(module => ({ default: module.ComponentName })) because
// our feature barrels use named exports, but React.lazy expects default exports.

const NoteWidget = React.lazy(() =>
    import('../../features/note-editor').then(m => ({ default: m.NoteWidget }))
);
const EngineeringCalculator = React.lazy(() =>
    import('../../features/engineering-calculator').then(m => ({ default: m.EngineeringCalculator }))
);
const CAD2DWidget = React.lazy(() =>
    import('../../features/cad-2d').then(m => ({ default: m.CAD2DWidget }))
);
const CAD3DWidget = React.lazy(() =>
    import('../../features/cad-3d').then(m => ({ default: m.CAD3DWidget }))
);
const SpreadsheetWidget = React.lazy(() =>
    import('../../features/spreadsheet').then(m => ({ default: m.SpreadsheetWidget }))
);
const TodoWidget = React.lazy(() =>
    import('../../features/todo').then(m => ({ default: m.TodoWidget }))
);
const SettingsWidget = React.lazy(() =>
    import('../../features/settings').then(m => ({ default: m.SettingsWidget }))
);
const ImageViewerWidget = React.lazy(() =>
    import('../../features/image-viewer').then(m => ({ default: m.ImageViewerWidget }))
);
const PDFViewerWidget = React.lazy(() =>
    import('../../features/pdf-viewer').then(m => ({ default: m.PDFViewerWidget }))
);
const PresentationWidget = React.lazy(() =>
    import('../../features/presentation').then(m => ({ default: m.PresentationWidget }))
);
const ProjectWidget = React.lazy(() =>
    import('../../features/project').then(m => ({ default: m.ProjectWidget }))
);

const AIWidget = React.lazy(() =>
    import('../../features/ai-assistant').then(m => ({ default: m.AIWidget }))
);

const DataVaultWidget = React.lazy(() =>
    import('../../features/data-vault').then(m => ({ default: m.DataVaultWidget }))
);

// Automation widgets
const PDFExportWidget = React.lazy(() =>
    import('../../features/automations').then(m => ({ default: m.PDFExportWidget }))
);

/**
 * Widget Content Component
 * 
 * Renders the appropriate widget component based on widget type.
 * Wrapped in Suspense for lazy loading.
 */
export const WidgetContent: React.FC<{ widget: Widget }> = ({ widget }) => {
    return (
        <Suspense fallback={<WidgetLoading />}>
            <WidgetContentInner widget={widget} />
        </Suspense>
    );
};

// Inner component to handle the switch case
const WidgetContentInner: React.FC<{ widget: Widget }> = ({ widget }) => {
    switch (widget.type) {
        case 'NOTE':
            return <NoteWidget id={widget.id} initialContent={widget.data?.content} isMaximized={widget.isMaximized} />;
        case 'CALCULATOR':
            return <EngineeringCalculator id={widget.id} isMaximized={widget.isMaximized} />;
        case 'CAD_2D':
            return <CAD2DWidget id={widget.id} isMaximized={widget.isMaximized} />;
        case 'CAD_3D':
            return <CAD3DWidget id={widget.id} initialShapes={widget.data?.shapes3d} />;
        case 'SPREADSHEET':
            return <SpreadsheetWidget id={widget.id} initialData={widget.data?.spreadsheet} isMaximized={widget.isMaximized} />;
        case 'TODO':
            return <TodoWidget id={widget.id} initialTodos={widget.data?.todos} />;
        case 'SETTINGS':
            return <SettingsWidget />;
        case 'IMAGE':
            return <ImageViewerWidget id={widget.id} initialImage={widget.data?.image} />;
        case 'PDF':
            return <PDFViewerWidget id={widget.id} initialPDF={widget.data?.pdf} />;
        case 'PRESENTATION':
            return <PresentationWidget id={widget.id} initialSlides={widget.data?.slides} />;
        case 'PROJECT':
            return <ProjectWidget />;
        case 'DATA_VAULT':
            return <DataVaultWidget id={widget.id} />;
        // Automation widgets
        case 'PDF_EXPORT':
            return <PDFExportWidget id={widget.id} isMaximized={widget.isMaximized} />;
        case 'AI_ASSISTANT':
            return <AIWidget id={widget.id} />;
        default:
            return null;
    }
};
