# TSuperMachine 🎨

Canvas-based machine design tool for engineers and technical designers. An infinite canvas workspace with multiple specialized widgets for CAD, calculations, documentation, and more.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

### 🎨 Core Features
- **Infinite Canvas** - Pan (middle-click/Alt+click) and zoom (mouse wheel) across unlimited workspace
- **Draggable Widgets** - Fully resizable and movable windows
- **PWA Support** - Install as a desktop/mobile app
- **Dark/Light Themes** - Built-in themes + custom theme creator
- **Multi-language** - Turkish, English + custom language upload support

### 📦 10 Specialized Widgets

1. **📝 Note** - Simple notepad with auto-save
2. **🧮 Calculator** - MathJS-powered engineering calculator (supports `sin`, `cos`, `sqrt`, etc.)
3. **✅ Todo List** - Task management with progress tracking
4. **📊 Spreadsheet** - Excel-like spreadsheet (Fortune Sheet)
5. **🖼️ Image Viewer** - Upload, zoom, rotate, and download images
6. **📄 PDF Viewer** - View PDFs with page navigation and zoom
7. **🎬 Presentation** - PowerPoint-like slide creator with presentation mode
8. **✏️ 2D CAD** - Vector drawing with lines, rectangles, and circles (Konva.js)
9. **🎲 3D CAD** - 3D object viewer with orbit controls (Three.js)
10. **⚙️ Settings** - Theme and language configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TSuperMachine.git
cd TSuperMachine/tsupermachine

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Canvas Controls
- **Zoom**: Mouse wheel
- **Pan**: Middle-click + drag OR Alt + Left-click + drag

### Widget Management
- **Add Widget**: Click icon in left toolbar
- **Move Widget**: Drag from title bar
- **Resize Widget**: Drag from corners/edges
- **Close Widget**: Click X button
- **Focus Widget**: Click anywhere on widget

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
| **Styling** | TailwindCSS v4 |
| **State Management** | Zustand (+ persist) |
| **Internationalization** | i18next |
| **PWA** | vite-plugin-pwa |
| **Window Management** | react-rnd |
| **Math Engine** | mathjs |
| **Spreadsheet** | @fortune-sheet/react |
| **PDF Viewer** | react-pdf |
| **2D Graphics** | react-konva |
| **3D Graphics** | @react-three/fiber + drei |

## 📁 Project Structure

```
src/
├── components/
│   ├── Canvas.tsx              # Infinite canvas
│   ├── Toolbar.tsx             # Widget launcher
│   ├── WidgetContainer.tsx     # Draggable window wrapper
│   └── widgets/
│       ├── NoteWidget.tsx
│       ├── CalculatorWidget.tsx
│       ├── TodoWidget.tsx
│       ├── SpreadsheetWidget.tsx
│       ├── ImageViewerWidget.tsx
│       ├── PDFViewerWidget.tsx
│       ├── PresentationWidget.tsx
│       ├── CAD2DWidget.tsx
│       ├── CAD3DWidget.tsx
│       └── SettingsWidget.tsx
├── store/
│   ├── store.ts               # Main app state
│   └── themeStore.ts          # Theme state
├── locales/
│   ├── en.json                # English translations
│   └── tr.json                # Turkish translations
├── i18n.ts                    # i18n config
├── App.tsx
├── main.tsx
└── index.css
```

## 🎨 Themes

### Built-in Themes
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes for night work
- **Custom**: Create your own with color pickers

### Customizable Colors
- Primary
- Secondary
- Background
- Surface
- Text
- Border

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
- **Gzip Size**: ~1.36 MB
- **PWA Cache Limit**: 10 MB
- **Widget Limit**: Unlimited (performance depends on device)

## 🔧 Development

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Type check
npm run build

# Lint
npm run lint
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The `dist/` folder will contain the production build ready for deployment.

### Deploy to Vercel/Netlify
Simply connect your GitHub repository and the build will be automatic.

### PWA Installation
Once deployed, users can install the app:
- **Desktop**: Chrome → Settings → Install App
- **Mobile**: Add to Home Screen

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Created by AI Assistant - Feel free to reach out for questions or suggestions!

---

**Made with ❤️ using React + TypeScript**
