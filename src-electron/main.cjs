const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Suppress Wayland color management warnings on Linux
app.commandLine.appendSwitch('disable-features', 'WaylandColorManagement');
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');

// =============================================================================
// Native CAD Addon Loading (in Main Process)
// =============================================================================
let cadAddon = null;

function loadNativeAddon() {
    try {
        const addonPath = path.join(__dirname, '../native/build/Release/cad_addon.node');
        cadAddon = require(addonPath);
        console.log('✅ Native CAD addon loaded successfully');
        return true;
    } catch (error) {
        console.warn('⚠️ Native CAD addon not available:', error.message);
        console.log('   Renderer will use WASM fallback');
        return false;
    }
}

// Export for preload to access
global.cadAddon = null;

function createWindow() {
    // Try to load native addon before creating window
    if (loadNativeAddon()) {
        global.cadAddon = cadAddon;
    }

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'TSuperMachine',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Required for native addon in preload
            preload: path.join(__dirname, 'preload.cjs'),
            devTools: isDev
        },
        backgroundColor: '#111827',
        show: false
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
