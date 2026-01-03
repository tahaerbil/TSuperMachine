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
- **.tsm File Format** - ZIP-based project file containing metadata, canvas state, and CAD data
- **Native File Dialogs** - Uses OS native save/load dialogs in Electron
- **Auto-Serialization** - CAD data is automatically serialized to `cadData.json` within the project file

### 📦 11 Specialized Widgets


1. **📝 Note** - Simple notepad with auto-save
2. **🧮 Calculator** - MathJS-powered engineering calculator (supports `sin`, `cos`, `sqrt`, etc.)
3. **✅ Todo List** - Task management with progress tracking
4. **📊 Spreadsheet** - Excel-like spreadsheet (Fortune Sheet)
5. **🖼️ Image Viewer** - Upload, zoom, rotate, and download images
6. **📄 PDF Viewer** - View PDFs with page navigation and zoom
7. **🎬 Presentation** - PowerPoint-like slide creator with presentation mode
8. **✏️ 2D CAD** - Vector drawing with C++ engine (lines, circles, arcs, polylines, rectangles)
9. **🎲 3D CAD** - 3D object viewer with orbit controls (Three.js)
10. **⚙️ Settings** - Theme and language configuration
11. **🤖 Automations** - Workflow automation and batch processing (e.g., PDF Export)

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
- **Add Widget**: Click icon in left toolbar (adds at viewport center)
- **Move Widget**: Drag from title bar
- **Resize Widget**: Drag from corners/edges
- **Close Widget**: Click X button (hover to reveal)
- **Focus Widget**: Click anywhere on widget
- **Multi-select**: Ctrl+Click or lasso selection
- **Maximize**: Click maximize button (full screen mode)
- **Pop-out**: Click pop-out button (opens in new window)

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
│   │   ├── pdf-viewer/             # PDF viewer
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
