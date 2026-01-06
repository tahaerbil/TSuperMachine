# TSuperMachine 🎨

Canvas-based machine design tool for engineers and technical designers. An infinite canvas workspace with multiple specialized widgets for CAD, calculations, documentation, and more.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![C++](https://img.shields.io/badge/C++-00599C?style=flat&logo=c%2B%2B&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat&logo=tauri&logoColor=white)

## ✨ Features

### 🎨 Core Features
- **Infinite Canvas** - Pan (middle-click/Alt+click) and zoom (mouse wheel) across unlimited workspace
- **Draggable Widgets** - Fully resizable and movable windows
- **PWA Support** - Install as a desktop/mobile app
- **Dark/Light Themes** - Built-in themes + custom theme creator
- **Multi-language** - Turkish, English + custom language upload support

### 🚀 High-Performance CAD Engine
- **Native C++ Addon** (Electron) - Maximum performance with Node.js N-API bindings
- **WASM Fallback** (Web/Tauri) - Cross-platform support via WebAssembly
- **Hybrid Architecture** - Automatically selects best engine for platform
- **Full State Saving** - Saves all CAD entities (lines, circles, etc.) to `.tsm` project file via native serialization

### 💾 Robust Save System
- **Dual Save Modes**:
  - **.tsm File**: Compressed single file for easy sharing (ZIP-based).
  - **Folder Structure**: Save as an open folder for version control or external editing.
- **Native File Dialogs**: Uses OS-native dialogs for both files and directories.
- **Virtual File Tree**: In-app project explorer to manage project structure.
- **Drag & Drop Workflow**: Drag files from the project explorer directly onto the canvas to open them (DXF, PDF, JSON).
- **Auto-Serialization**: CAD data is automatically serialized to `cadData.json`.

### 📦 13 Specialized Widgets

1. **📝 Note** - Simple notepad with auto-save
2. **🧮 Calculator** - MathJS-powered engineering calculator (supports `sin`, `cos`, `sqrt`, etc.)
3. **✅ Todo List** - Task management with progress tracking
4. **📊 Spreadsheet** - Excel-like spreadsheet (Fortune Sheet)
5. **🖼️ Image Viewer** - Upload, zoom, rotate, and download images
6. **📄 PDF Viewer** - View PDFs with page navigation, zoom, super-sampling for clarity, auto-fit, and drag-drop upload
7. **🎬 Presentation** - PowerPoint-like slide creator with presentation mode
8. **✏️ 2D CAD** - Vector drawing with C++ engine (lines, circles, arcs, polylines, rectangles)
9. **🎲 3D CAD** - 3D object viewer with orbit controls (Three.js)
10. **⚙️ Settings** - Theme, language, and AI provider configuration
11. **🤖 Automations** - Workflow automation and batch processing (e.g., PDF Export)
12. **🗄️ Data Vault** - Project file explorer with drag-and-drop to canvas
13. **💬 AI Assistant** - Embedded AI chat (Qwen2.5-3B) with RAG (Chat with your documents) and tool calling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- CMake 3.15+ (for native addon)
- C++17 compiler (GCC 9+, Clang 10+)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TSuperMachine.git
cd TSuperMachine/tsupermachinev2

# Install dependencies
npm install

# Build native CAD addon (for Electron) - Using npm Workspaces
npm run native:build

# Start development server
npm run dev

# Build for production
npm run build
```

### Desktop App (Electron) - Recommended

```bash
# Run desktop app in development mode
npm run electron:dev

# Rebuild native addon (if C++ changes)
npm run native:rebuild

# Build desktop app for production
npm run electron:build
```

### 🤖 AI Model Setup (Optional but Recommended)

TSuperMachine includes an embedded AI assistant powered by **Qwen2.5-3B**. To use the local offline model:

1. **Create models directory**:
   ```bash
   mkdir -p models
   ```

2. **Download the GGUF Model**:
   Download `qwen2.5-3b-instruct-q4_k_m.gguf` (approx 2.0 GB) and place it in the `models/` folder.
   
   *Direct High-Speed Download:*
   ```bash
   curl -L -o models/qwen2.5-3b-instruct-q4_k_m.gguf \
     "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true"
   ```

3. **Activation**:
   - Restart the application.
   - Open the **AI Assistant** widget.
   - Select **"Qwen2.5-3B (Gömülü)"** from the provider dropdown.
   - *Note:* First load may take a few seconds.

**Fallback:** If no model is found, the system defaults to "T-Brain Mini" (Rule-based simple assistant).

### Desktop App (Tauri)

```bash
# Prerequisites: Rust installed (https://rustup.rs)

# Run desktop app in development mode
npm run tauri:dev

# Build desktop app for production
npm run tauri:build
```

## 🎮 Usage

### Canvas Controls
- **Zoom**: Mouse wheel (zoom to cursor position)
- **Pan**: Middle-click + drag OR Alt + Left-click + drag
- **Fit to Screen**: Middle-click double-click (fits all widgets in view)
- **Lasso Selection**: Left-click + drag on empty canvas (multi-select widgets)
- **Paste Widget**: Ctrl+V with text/image in clipboard (creates Note/Image at mouse position)

### Widget Management
### Widget Management (Dormant vs Edit Mode)

The interface uses a **Two-State Interaction Model** optimized for both mouse and touch:

#### 1. Dormant Mode (Default)
In this state, widgets are treated as objects to be arranged.
- **Move**: Click and drag **anywhere** on the widget.
- **Resize**: Drag from any edge or corner.
- **Group**: Drag a widget close to another to snap/attach.
- **Select**: Single click to focus.

#### 2. Edit Mode (Interactive)
In this state, the widget's internal content becomes active.
- **Enter Edit Mode**: **Double-click** anywhere on the widget.
- **Interact**: Type text, scroll lists, click internal buttons.
- **Exit Edit Mode**: Press **Escape** or click outside the widget.
- **Visual Cue**: A distinct border/shadow indicates the widget is active.
- *Note: Widgets cannot be dragged while in Edit Mode.*

#### Other Actions
- **Multi-select**: Ctrl+Click or Lasso Select (drag on empty canvas).
- **Maximize**: Toggle full screen (Top-right button).
- **Pop-out**: Detach to separate window (Top-right button).
- **Close**: Remove widget (Top-right X).


### 2D CAD Commands
| Command | Shortcut | Description |
|---------|----------|-------------|
| Line | `L` | Draw a line (Close `C`, Undo `U`) |
| Circle | `C` | Draw a circle (Center+Radius, Diameter `D`, `2P`, `3P`) |
| Rectangle | `REC` | Draw a rectangle (Dimensions `D`, Chamfer `C`, Fillet `F`) |
| Polyline | `PL` | Draw connected lines (Close `C`, Undo `U`) |
| Polygon | `POL` | Draw regular polygon |
| Arc | `ARC` | Draw an arc |
| Move | `M` | Move selected entities |
| Copy | `CO` | Copy selected entities |
| Delete | `DEL` | Delete selected entities |
| Offset | `O` | Offset an entity |

### Theme Customization
1. Open Settings widget (⚙️ icon)
2. Select Theme tab
3. Choose Light, Dark, or Custom
4. For Custom: Use color pickers to create your theme

### Language Support
1. Open Settings widget
2. Select Language tab
3. Choose Turkish or English
4. Or upload custom JSON translation file

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Desktop App** | Electron 39 / Tauri 2 (Rust) |
| **Styling** | TailwindCSS v4 |
| **State Management** | Zustand (+ persist) |
| **Internationalization** | i18next |
| **PWA** | vite-plugin-pwa |
| **Window Management** | react-rnd |
| **Math Engine** | mathjs |
| **Spreadsheet** | @fortune-sheet/react |
| **PDF Viewer** | react-pdf |
| **2D Graphics** | C++ Native Addon / WASM + react-konva |
| **3D Graphics** | @react-three/fiber + drei |
| **AI Engine** | Qwen2.5-3B + node-llama-cpp (Local/Offline) |
| **PDF Generation** | jsPDF + html2canvas |

## 📁 Project Structure

```
tsupermachinev2/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx              # Infinite canvas with zoom/pan
│   │   ├── Toolbar.tsx             # Widget launcher sidebar
│   │   └── WidgetContainer.tsx     # Draggable window wrapper (react-rnd)
│   │
│   ├── features/                   # All widget modules
│   │   ├── automations/            # Automation flows (PDF Export, etc.)
│   │   ├── cad-2d/                 # 2D CAD Editor (C++ Native/WASM)
│   │   │   ├── CADEngine.ts        # Hybrid engine facade
│   │   │   ├── WasmCanvas.tsx      # 2D CAD canvas renderer
│   │   │   ├── CAD2DWidget.tsx     # Widget wrapper
│   │   │   ├── hooks/              # CAD hooks (useCADCommand, etc.)
│   │   │   └── COMMANDS.md         # Command reference
│   │   ├── cad-3d/                 # 3D CAD Viewer (Three.js)
│   │   ├── engineering-calculator/ # Engineering calculator
│   │   ├── image-viewer/           # Image display widget
│   │   ├── note-editor/            # Rich text editor (TipTap)
│   │   ├── pdf-viewer/             # PDF viewer (modular architecture)
│   │   │   ├── PDFViewerWidget.tsx  # Main widget
│   │   │   ├── hooks/               # 7 custom hooks
│   │   │   ├── components/          # 8 UI components
│   │   │   └── types/               # Shared types
│   │   ├── presentation/           # Slide viewer
│   │   ├── project/                # Project manager
│   │   ├── project-menu/           # Project menu UI
│   │   ├── settings/               # App settings
│   │   ├── spreadsheet/            # Excel-like grid (Fortune Sheet)
│   │   └── todo/                   # Task management
│   │
│   ├── store/
│   │   ├── store.ts                # Main app state (Zustand)
│   │   └── themeStore.ts           # Theme state
│   ├── locales/                    # i18n translations
│   ├── ARCHITECTURE.md             # Code architecture guide
│   ├── i18n.ts
│   ├── App.tsx
│   └── main.tsx
│
├── native/                         # C++ Native CAD Engine
│   ├── CMakeLists.txt              # CMake build config
│   ├── package.json                # Node addon config
│   ├── src/
│   │   ├── cad2d/                  # 2D CAD Engine
│   │   │   ├── Geometry.h          # Entity classes
│   │   │   ├── Database.h          # Entity storage
│   │   │   ├── Engine.h            # Engine API
│   │   │   └── Engine.cpp          # Engine implementation
│   │   └── bindings/
│   │       └── node/
│   │           └── addon.cpp       # N-API bindings
│   └── build/Release/
│       └── cad_addon.node          # Compiled addon
│
├── public/wasm/                    # WASM CAD Engine (fallback)
│   ├── cad_engine.js
│   └── cad_engine.wasm
│
├── src-electron/                   # Electron backend
│   ├── main.cjs                    # Main process
│   └── preload.cjs                 # Preload script
│
└── src-tauri/                      # Tauri backend (optional)
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
```

## ⚡ 2D CAD Engine Architecture

The 2D CAD engine uses a **hybrid architecture** for optimal performance:

```
┌─────────────────────────────────────────────────────────┐
│                      CADEngine.ts                        │
│                   (Hybrid Facade)                        │
├─────────────────────────────────────────────────────────┤
│                         │                                │
│    ┌────────────────────┼────────────────────┐          │
│    │                    │                    │          │
│    ▼                    ▼                    ▼          │
│ ┌──────────┐      ┌──────────┐        ┌──────────┐     │
│ │  Native  │      │  WASM    │        │  WASM    │     │
│ │  Addon   │      │ (Tauri)  │        │  (Web)   │     │
│ │(Electron)│      │          │        │          │     │
│ └──────────┘      └──────────┘        └──────────┘     │
│      │                 │                   │            │
│      └─────────────────┼───────────────────┘            │
│                        │                                │
│                        ▼                                │
│              ┌─────────────────┐                        │
│              │   C++ Engine    │                        │
│              │ (Same Codebase) │                        │
│              └─────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

| Platform | Engine | Performance |
|----------|--------|-------------|
| **Electron** | Native C++ Addon | ⚡⚡⚡ Maximum |
| **Tauri** | WASM | ⚡⚡ Very Good |
| **Web Browser** | WASM | ⚡⚡ Very Good |

## 🎨 Themes

### Built-in Themes
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes for night work
- **Custom**: Create your own with color pickers

### Customizable Colors
- Primary, Secondary, Background, Surface, Text, Border

## 🌍 Internationalization

### Supported Languages
- 🇹🇷 Turkish (Türkçe)
- 🇬🇧 English

### Adding Custom Language
1. Download template from Settings
2. Translate JSON file
3. Upload via Settings widget
4. Enter language code (e.g., "de" for German)

## 📊 Performance

- **Bundle Size**: ~5.4 MB (minified)
- **Native Addon Size**: ~138 KB
- **WASM Size**: ~94 KB
- **Widget Limit**: Unlimited (performance depends on device)

## 🔧 Development

```bash
# Install all dependencies
# Install all dependencies
npm install

# Build native addon
npm run native:build
npm run native:rebuild (for forcing clean build)

# Start dev server with HMR
npm run dev

# Start Electron dev
npm run electron:dev

# Type check
npm run build

# Lint
npm run lint
```

## 🚀 Deployment

### Electron Distribution
```bash
npm run electron:build

# Output: out/make/ directory
```

### Tauri Distribution
```bash
npm run tauri:build

# Output: src-tauri/target/release/bundle/
```

### Web Deployment
```bash
npm run build
# Deploy dist/ folder to any static host
```

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ using React + TypeScript + C++**
