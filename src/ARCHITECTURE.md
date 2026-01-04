# Source Code Architecture Guide

## Widget Organization Policy

All widgets in TSuperMachine are organized under `src/features/`. Each widget is a self-contained feature module with its own directory, barrel export, and optional sub-components.

---

## Feature Structure

```
src/features/
├── automations/        ← Automation & Workflow system (complex)
├── cad-2d/                 ← 2D CAD Editor (complex)
├── cad-3d/                 ← 3D CAD Viewer
├── engineering-calculator/ ← Calculator (complex)
├── image-viewer/           ← Image display
├── note-editor/            ← Rich text editor (complex)
├── pdf-viewer/             ← PDF display
├── presentation/           ← Slide viewer
├── project/                ← Project manager (headless)
├── project-menu/           ← Project menu UI
├── settings/               ← App settings
├── spreadsheet/            ← Excel-like grid
└── todo/                   ← Task management
```

---

## Feature Complexity Levels

### Simple Features (Single File)

Minimum structure for simple widgets:

```
feature-name/
├── index.ts           ← Barrel export (REQUIRED)
└── FeatureWidget.tsx  ← Main component
```

**Examples:** `cad-3d`, `image-viewer`, `presentation`, `spreadsheet`, `todo`

### Complex Features (Multiple Files)

Extended structure for complex widgets:

```
feature-name/
├── index.ts              ← Barrel export (REQUIRED)
├── FeatureWidget.tsx     ← Main component
├── components/           ← Sub-components
│   └── *.tsx
├── hooks/                ← Custom hooks
│   └── use*.ts
├── utils/                ← Helper functions
│   └── *.ts
├── styles/               ← CSS modules (optional)
│   └── *.css
├── data/                 ← Static data (optional)
│   └── *.ts
├── api/                  ← External API calls (optional)
│   └── *.ts
├── native/               ← Native bindings (optional)
│   └── *.ts
└── types.ts              ← Type definitions
```

**Examples:** `cad-2d`, `engineering-calculator`, `note-editor`, `pdf-viewer`, `automations`

---

## Current Widget Inventory

| Feature | Files | Complexity | Key Dependencies |
|---------|-------|------------|------------------|
| `automations` | 3+ | High | - |
| `cad-2d` | 12 | High | C++ Native, WASM |
| `cad-3d` | 2 | Low | Three.js |
| `engineering-calculator` | 20 | High | C++ Native, Python |
| `image-viewer` | 2 | Low | - |
| `note-editor` | 11 | Medium | TipTap |
| `pdf-viewer` | 20+ | Medium | react-pdf |
| `presentation` | 2 | Low | - |
| `project` | 2 | Low | - |
| `project-menu` | 2 | Low | - |
| `settings` | 2 | Low | - |
| `spreadsheet` | 2 | Low | Fortune Sheet |
| `todo` | 2 | Low | - |

---

## Adding a New Widget

1. Create directory: `src/features/{feature-name}/`
2. Create main component: `{FeatureName}Widget.tsx`
3. Create barrel export: `index.ts`
4. Register widget type in `src/store/store.ts` (WidgetType)
5. Import in `src/components/Canvas.tsx`
6. Add to `src/components/Toolbar.tsx` (widget launcher)

---

## Hook Organization (CAD Editor Example)

The CAD editor demonstrates proper hook decomposition for complex features:

```
cad-2d/hooks/
├── types.ts           ← Shared types and constants
├── useCADCommand.ts   ← Main orchestrator (Facade pattern)
├── useCADDrawing.ts   ← Drawing operations
├── useCADEditing.ts   ← Editing operations
├── useCADSelection.ts ← Selection logic
└── useCADPreview.ts   ← Preview state management
```

**Principle:** Single Responsibility - each hook handles one concern.

---

## Hook Organization (PDF Viewer Example)

The PDF viewer demonstrates modular hook architecture:

```
pdf-viewer/
├── hooks/
│   ├── index.ts              ← Barrel export
│   ├── usePDFDocument.ts     ← Document loading & state
│   ├── usePDFNavigation.ts   ← Page navigation
│   ├── usePDFZoom.ts         ← Zoom, rotation, scale
│   ├── usePDFUI.ts           ← Sidebar, search UI state
│   ├── useDragAndDrop.ts     ← File drag & drop
│   ├── useKeyboardShortcuts.ts ← Keyboard navigation
│   └── useAutomationEvents.ts  ← Cross-widget events
├── components/
│   ├── index.ts              ← Barrel export
│   ├── EmptyState.tsx        ← Empty/drag placeholder
│   ├── LoadingErrorState.tsx ← Loading/error display
│   ├── PageNavigator.tsx     ← Page controls
│   ├── PDFToolbar.tsx        ← Main toolbar
│   ├── SearchBar.tsx         ← Search UI
│   ├── StatusBar.tsx         ← Bottom status
│   ├── ThumbnailSidebar.tsx  ← Page thumbnails
│   └── ZoomControls.tsx      ← Zoom UI
└── types/
    └── index.ts              ← Shared types
```

---

## Migration History

- **2025-12-28**: Consolidated all widgets from `components/widgets/` to `features/`
- **2025-12-28**: Refactored `useCADCommand.ts` into modular hooks
- **2026-01-03**: Added `automations` feature for cross-widget workflows
- **2026-01-04**: Refactored PDF viewer into modular hooks and components

---

*Last updated: 2026-01-04*
