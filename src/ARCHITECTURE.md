# Source Code Architecture Guide

## Widget Organization Policy

All widgets in TSuperMachine are organized under `src/features/`. Each widget is a self-contained feature module with its own directory, barrel export, and optional sub-components.

---

## Feature Structure

```
src/features/
├── ai-assistant/          ← AI Chat Widget
├── automations/           ← Automation & Workflow system (complex)
├── cad-2d/                ← 2D CAD Editor (complex)
├── cad-3d/                ← 3D CAD Viewer
├── data-vault/            ← Project File Explorer
├── engineering-calculator/ ← Calculator (complex)
├── image-viewer/          ← Image display
├── note-editor/           ← Rich text editor (complex)
├── pdf-viewer/            ← PDF display
├── presentation/          ← Slide viewer
├── project/               ← Project manager (UI only - uses projectStore)
├── settings/              ← App settings + AI config
├── spreadsheet/           ← Excel-like grid
└── todo/                  ← Task management
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
| `ai-assistant` | 4+ | Medium | node-llama-cpp, Zustand |
| `automations` | 3+ | High | - |
| `cad-2d` | 12 | High | C++ Native, WASM |
| `cad-3d` | 2 | Low | Three.js |
| `data-vault` | 2 | Low | Electron IPC |
| `engineering-calculator` | 20 | High | C++ Native, Python |
| `image-viewer` | 2 | Low | - |
| `note-editor` | 11 | Medium | TipTap |
| `pdf-viewer` | 20+ | Medium | react-pdf |
| `presentation` | 2 | Low | - |
| `project` | 4 | Medium | projectStore, projectService |
| `settings` | 2 | Medium | Zustand, AI Settings |
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

## Core Modules

### Canvas System (`src/core/canvas/`)

The canvas system has been refactored into modular hooks for maintainability:

```
core/canvas/
├── index.ts              ← Barrel export
├── constants.ts          ← Configuration values (zoom limits, grid spacing, z-index)
└── hooks/
    ├── index.ts          ← Hook exports
    ├── useCanvasNavigation.ts  ← Pan, zoom, middle-click, fit-to-screen
    ├── useLassoSelection.ts    ← Marquee selection with world coords
    ├── useCanvasPaste.ts       ← Clipboard paste (image/text)
    ├── useCanvasGrid.ts        ← Dot grid rendering with RAF throttling
    └── useCanvasKeyboard.ts    ← Keyboard shortcuts (Ctrl+A, Delete, Escape)
```

**Principle:** Each hook handles a single canvas concern. The main `Canvas.tsx` composes these hooks.

### Widget System (`src/core/widgets/`)

Centralized widget rendering and utilities:

```
core/widgets/
├── index.ts              ← Barrel export
├── WidgetRenderer.tsx    ← Central widget type → component mapping
└── hooks/
    ├── index.ts          ← Hook exports
    ├── useWidgetDrag.ts      ← Drag, snap, group movement
    ├── useExternalWindow.tsx ← Pop-out to browser window
    ├── useContextMenu.ts     ← Right-click menu handling
    └── useWireDropTarget.ts  ← Automation wire connection
```

**Note:** WidgetContainer.tsx implements the "Dormant vs Edit" value interaction model.


---

### AI Core System (`src/core/ai/`)

The AI system provides embedded LLM capabilities with tool calling:

```
core/ai/
├── index.ts              ← Module exports + tool registration
├── types.ts              ← AI types (ChatMessage, AIProvider, Tool)
├── AIService.ts          ← Main AI orchestrator with tool loop
├── ToolRegistry.ts       ← Tool registration and execution
├── providers/
│   ├── SimpleProvider.ts    ← Rule-based (no external deps)
│   ├── EmbeddedProvider.ts  ← Qwen2.5-3B via IPC
│   └── OllamaProvider.ts    ← External Ollama connection
├── tools/
│   ├── std/                 ← Standard tools
│   │   ├── CalculatorTool.ts
│   │   ├── FileSystemTool.ts
│   │   └── DocumentReaderTool.ts
│   └── rag/                 ← RAG tools
│       └── KnowledgeTools.ts
└── rag/
    └── RAGService.ts        ← Document indexing & search
```

**AI Providers:**
- **SimpleProvider**: Rule-based pattern matching (always available)
- **EmbeddedProvider**: Local Qwen2.5-3B via node-llama-cpp in main process
- **OllamaProvider**: External Ollama API connection

---

## Project Store Architecture

The project system follows the **Store-Service-UI** pattern (same as AI Assistant):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FEATURES LAYER (UI)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  src/features/project/                                                      │
│  ├── components/                                                            │
│  │   ├── ProjectWidget.tsx      ← UI Component (render + actions only)     │
│  │   └── ProjectFileTree.tsx    ← File tree display                        │
│  ├── ProjectController.tsx      ← Headless: shortcuts, menu, auto-save     │
│  └── index.ts                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORE LAYER (State)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  src/store/                                                                 │
│  ├── projectStore.ts    ← Zustand store (state + actions + autosave)       │
│  ├── store.ts           ← Widgets, canvas, project name                     │
│  ├── aiStore.ts         ← AI chat (same pattern)                            │
│  └── themeStore.ts      ← Theme settings                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER (Logic)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  src/core/services/project/                                                 │
│  └── projectService.ts  ← Pure functions: ZIP, parse, validate             │
│                                                                             │
│  src/core/services/filesystem/                                              │
│  └── fileSystemAdapter.ts  ← Platform I/O (Electron/Browser)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Folder-First Save System

Default save mode is **folder** (not ZIP):

| Action | Mode | Use Case |
|--------|------|----------|
| **Save (Ctrl+S)** | Folder | Fast, git-compatible, working mode |
| **Export .tsm** | ZIP | Distribution, sharing, archival |

Project folder structure:
```
📁 ProjectName/
├── 📄 project.json
├── 📄 canvas.json
├── 📄 cadData.json (if CAD data exists)
├── 📁 parts/
├── 📁 assemblies/
├── 📁 drawings/
├── 📁 resources/
├── 📁 calculations/
├── 📁 documents/
└── 📁 images/
```

---

## Migration History

- **2025-12-28**: Consolidated all widgets from `components/widgets/` to `features/`
- **2025-12-28**: Refactored `useCADCommand.ts` into modular hooks
- **2026-01-03**: Added `automations` feature for cross-widget workflows
- **2026-01-04**: Refactored PDF viewer into modular hooks and components
- **2026-01-04**: Refactored Canvas.tsx into modular hooks (722 → 282 lines)
- **2026-01-04**: Created centralized WidgetRenderer and widget hooks
- **2026-01-04**: Refactored AlignmentToolbar.tsx (batch updates, React.memo, useMemo)
- **2026-01-04**: Refactored Toolbar.tsx (memoized components, useCallback, extracted config)
- **2026-01-04**: Implemented "Dormant" vs "Edit" mode interaction model
- **2026-01-04**: Refined Parent-Child widget grouping and recursive dragging
- **2026-01-04**: Enhanced PDF Viewer with compact mode scaling fixes
- **2026-01-04**: Improved Widget Loading state and error boundaries
- **2026-01-06**: Added AI Assistant widget with embedded Qwen2.5-3B support
- **2026-01-06**: Added Data Vault widget for project file management
- **2026-01-06**: Added RAG system with knowledge indexing and search
- **2026-01-06**: Added AI Settings tab with provider management
- **2026-01-07**: **Major Refactor** - Project system refactored to Store-Service-UI pattern
- **2026-01-07**: Created `projectStore.ts` (Zustand) for centralized project state
- **2026-01-07**: Created `projectService.ts` (pure functions) for file operations
- **2026-01-07**: Removed old hooks (`useProjectSystem.ts`, `useAutoSave.ts`)
- **2026-01-07**: Implemented folder-first save system (default: folder, export: .tsm)

---

## Widget Interaction Architecture

The widget system uses a **Three-State Interaction Model** to manage user interactions:

### 1. Dormant State (Default)
- Widget content is **inert** (non-interactive, `pointer-events: none`).
- **Single-click & Drag**: Users can click anywhere on the widget to drag it.
- **Visual Cue**: `cursor: grab` / `cursor: grabbing`.

### 2. Focus State (New)
- Triggered by **Double-clicking** the widget.
- Widget becomes **interactive** but remains on the canvas.
- **Canvas Auto-Zoom**: Canvas smoothly animates to center and zoom on the focused widget.
- **Visual Cue**: Blue glow ring (`ring-2 ring-blue-500 shadow-glow`) + toolbar appears at bottom.
- **Canvas Locked**: Pan/zoom disabled while widget is focused.
- **Dragging Disabled**: Focused widget cannot be moved.
- **Exit**: Press `Escape` or double-click outside the widget.
- **Animation**: 400ms cubic-bezier transition for smooth enter/exit.

### 3. Maximized State
- Triggered by **Maximize button** in toolbar.
- Widget fills the entire viewport.
- **Exit**: Click maximize button again or press `Escape`.

### Store State for Focus Mode

```typescript
// store.ts
focusedWidgetId: string | null;          // Currently focused widget
preFocusCanvasState: {                    // Saved for restoration
    scale: number;
    offset: { x: number; y: number };
} | null;
isAnimatingFocus: boolean;                // Animation control flag

// Actions
enterFocusMode: (widgetId: string) => void;
exitFocusMode: () => void;
updateFocusView: () => void;              // Called after resize/rotate
```

### Animation Implementation

Focus transitions use a two-phase approach for smooth CSS transitions:
1. **Phase 1**: Set `isAnimatingFocus = true` (enables CSS transition in Canvas)
2. **Phase 2**: Update canvas via `requestAnimationFrame` (animates)
3. **Phase 3**: Clear animation flag after 450ms

This ensures the transition property is applied BEFORE the transform changes.


---

## Migration History

- **2025-12-28**: Consolidated all widgets from `components/widgets/` to `features/`
- **2025-12-28**: Refactored `useCADCommand.ts` into modular hooks
- **2026-01-03**: Added `automations` feature for cross-widget workflows
- **2026-01-04**: Refactored PDF viewer into modular hooks and components
- **2026-01-04**: Refactored Canvas.tsx into modular hooks (722 → 282 lines)
- **2026-01-04**: Created centralized WidgetRenderer and widget hooks
- **2026-01-04**: Refactored AlignmentToolbar.tsx (batch updates, React.memo, useMemo)
- **2026-01-04**: Refactored Toolbar.tsx (memoized components, useCallback, extracted config)
- **2026-01-04**: Implemented "Dormant" vs "Edit" mode interaction model
- **2026-01-04**: Refined Parent-Child widget grouping and recursive dragging
- **2026-01-04**: Enhanced PDF Viewer with compact mode scaling fixes
- **2026-01-04**: Improved Widget Loading state and error boundaries
- **2026-01-06**: Added AI Assistant widget with embedded Qwen2.5-3B support
- **2026-01-06**: Added Data Vault widget for project file management
- **2026-01-06**: Added RAG system with knowledge indexing and search
- **2026-01-06**: Added AI Settings tab with provider management
- **2026-01-07**: **Major Refactor** - Project system refactored to Store-Service-UI pattern
- **2026-01-07**: Created `projectStore.ts` (Zustand) for centralized project state
- **2026-01-07**: Created `projectService.ts` (pure functions) for file operations
- **2026-01-07**: Removed old hooks (`useProjectSystem.ts`, `useAutoSave.ts`)
- **2026-01-07**: Implemented folder-first save system (default: folder, export: .tsm)
- **2026-01-11**: **Focus Mode** - Implemented widget focus mode with smooth animations
- **2026-01-11**: Added `focusedWidgetId`, `preFocusCanvasState`, `isAnimatingFocus` to store
- **2026-01-11**: Implemented canvas auto-zoom/pan on focus with 400ms cubic-bezier animation
- **2026-01-11**: Disabled canvas pan/zoom and widget dragging when in focus mode
- **2026-01-11**: Added `updateFocusView` for dynamic adaptation after resize/rotate
- **2026-01-12**: **CAD 2D Rendering Improvements** - Fixed zoom/pan coordinate issues
- **2026-01-12**: Added `devicePixelRatio` support to `WasmCanvas.tsx` for high-DPI displays
- **2026-01-12**: Implemented CSS Transform Compensation for accurate mouse coordinates in focus mode
- **2026-01-12**: Refactored `CanvasRenderer.ts` with viewport-based grid and adaptive step size
- **2026-01-12**: Fixed zoom calculations with proper world coordinate conversions

*Last updated: 2026-01-12*
