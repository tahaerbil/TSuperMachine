const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

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

let mainWindow = null;

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'new');
                    }
                },
                {
                    label: 'Open Project...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'open');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'save');
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'save-as');
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { role: 'close' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

async function handleOpenProject() {
    if (!mainWindow) return;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Open TSuperMachine Project',
        filters: [{ name: 'TSM Project', extensions: ['tsm'] }],
        properties: ['openFile']
    });

    if (!canceled && filePaths.length > 0) {
        const filePath = filePaths[0];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const projectData = JSON.parse(data);
            // Verify it looks like a TSM file
            if (!projectData.meta || projectData.meta.version !== '1.0') {
                // You might want to be more lenient or handle upgrades here
                console.log('Legacy or unknown format, attempting load anyway...');
            }
            // Send file path with data so we know where to save updates
            mainWindow.webContents.send('load-project-data', { data: projectData, filePath });
        } catch (err) {
            dialog.showErrorBox('Error Opening File', err.message);
        }
    }
}


function createWindow() {
    // Try to load native addon before creating window
    if (loadNativeAddon()) {
        global.cadAddon = cadAddon;
    }

    mainWindow = new BrowserWindow({
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

    createMenu();

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

// IPC Handlers for File System
ipcMain.handle('save-project-file', async (event, { data, filePath, saveAs }) => {
    let targetPath = filePath;

    if (!targetPath || saveAs) {
        const { canceled, filePath: promptPath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Project',
            defaultPath: 'Untitled.tsm',
            filters: [{ name: 'TSM Project', extensions: ['tsm'] }]
        });

        if (canceled) return { success: false, canceled: true };
        targetPath = promptPath;
    }

    try {
        let contentToWrite;
        // Check if data is binary (Buffer, Uint8Array, or Array from IPC)
        if (Buffer.isBuffer(data) || data instanceof Uint8Array || Array.isArray(data)) {
            contentToWrite = Buffer.from(data);
        } else {
            // Default to JSON
            contentToWrite = JSON.stringify(data, null, 2);
        }

        // Write file (no encoding specified allows Buffer writing)
        fs.writeFileSync(targetPath, contentToWrite);
        return { success: true, filePath: targetPath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Open Project Handler (Returns binary data for ZIP support)
ipcMain.handle('open-project-file', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Open TSuperMachine Project',
        filters: [{ name: 'TSM Project', extensions: ['tsm'] }],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
        return { canceled: true };
    }

    const filePath = filePaths[0];
    try {
        const data = fs.readFileSync(filePath); // Returns Buffer
        return { success: true, data: data, filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// =============================================================================
// Config Management (Persistent Settings)
// =============================================================================
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

ipcMain.handle('load-config', async () => {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(data);
        }
        return null; // Return null if no config exists yet
    } catch (error) {
        console.error('Failed to load config:', error);
        return null;
    }
});

ipcMain.handle('save-config', async (event, config) => {
    try {
        // Ensure the directory exists before writing (Critical for first run)
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save config:', error);
        return { success: false, error: error.message };
    }
});
