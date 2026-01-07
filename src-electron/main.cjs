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
// IPC Handlers for File System
ipcMain.handle('save-project-file', async (event, { data, filePath, saveAs, asFolder, projectName }) => {
    let targetPath = filePath;

    // Use provided projectName for default filename, fallback to Untitled
    const defaultName = projectName ? `${projectName}.tsm` : 'Untitled.tsm';

    if (!targetPath || saveAs) {
        if (asFolder) {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Project Folder',
                properties: ['openDirectory', 'createDirectory']
            });
            if (canceled || filePaths.length === 0) return { success: false, canceled: true };
            targetPath = filePaths[0]; // This is a directory path
        } else {
            const { canceled, filePath: promptPath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Save Project',
                defaultPath: defaultName,
                filters: [{ name: 'TSM Project', extensions: ['tsm'] }]
            });
            if (canceled) return { success: false, canceled: true };
            targetPath = promptPath;
        }
    }

    try {
        if (asFolder) {
            // Data is expected to be a map of { filename: content }
            // If data is passed as a Map, it will be an array of entries via IPC
            // or a plain object. Let's assume plain object for IPC simplicity.
            const files = data; // { "project.json": string, "canvas.json": string, ... }

            // Ensure directory exists
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            // Create standard project folder structure
            const standardFolders = [
                'parts',
                'assemblies',
                'drawings',
                'resources',
                'calculations',
                'documents',
                'images'
            ];

            for (const folder of standardFolders) {
                const folderPath = path.join(targetPath, folder);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }
            }

            for (const [relativePath, content] of Object.entries(files)) {
                const fullPath = path.join(targetPath, relativePath);
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                // If content is string or buffer, write it
                fs.writeFileSync(fullPath, content);
            }
            return { success: true, filePath: targetPath };

        } else {
            // Existing Logic for Single File (.tsm)
            let contentToWrite;
            if (Buffer.isBuffer(data) || data instanceof Uint8Array || Array.isArray(data)) {
                contentToWrite = Buffer.from(data);
            } else {
                contentToWrite = JSON.stringify(data, null, 2);
            }
            fs.writeFileSync(targetPath, contentToWrite);
            return { success: true, filePath: targetPath };
        }

    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Save Temp Project (Auto-Recovery)
ipcMain.handle('save-temp-project', async (event, data) => {
    try {
        const recoveryDir = path.join(app.getPath('userData'), 'Recovery');
        if (!fs.existsSync(recoveryDir)) {
            fs.mkdirSync(recoveryDir, { recursive: true });
        }
        const filePath = path.join(recoveryDir, 'recovery.json');

        // Write as JSON string since this is internal recovery data
        const contentToWrite = JSON.stringify(data, null, 2);

        fs.writeFileSync(filePath, contentToWrite);
        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Open Project Handler (Returns binary data for ZIP support)
// Open Project Handler (Returns binary data for ZIP support)
ipcMain.handle('open-project-file', async (event, { asFolder } = { asFolder: false }) => {

    if (asFolder) {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Open Project Folder',
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) return { canceled: true };
        const dirPath = filePaths[0];

        // Read directory recursively and build a file map
        // We only need specific files for now, or we can read all.
        // Let's simple read the expected JSONs.
        try {
            const files = {};
            const readDirRecursive = (dir, baseDir) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = path.relative(baseDir, fullPath);

                    if (entry.isDirectory()) {
                        readDirRecursive(fullPath, baseDir);
                    } else {
                        // Read as buffer to be safe, convert to string on client if needed
                        // Or read text files as utf-8
                        if (entry.name.endsWith('.json')) {
                            files[relPath] = fs.readFileSync(fullPath, 'utf-8');
                        }
                        // read .dxf, .png etc later
                    }
                }
            };

            readDirRecursive(dirPath, dirPath);
            return { success: true, data: files, filePath: dirPath, isFolder: true };

        } catch (err) {
            return { success: false, error: err.message };
        }

    } else {
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
            return { success: true, data: data, filePath, isFolder: false };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
});

// =============================================================================
// Config Management (Persistent Settings)
// =============================================================================
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// Default Workspace Structure
const DEFAULT_WORKSPACE_PATH = path.join(app.getPath('documents'), 'T-Workspace');
const DEFAULT_PROJECTS_DIR = 'Projects';
const DEFAULT_LIBRARY_DIR = 'Library';

// Helper to ensure standard directory structure exists
function ensureStandardDirectories(rootPath) {
    const dirs = [
        rootPath,
        path.join(rootPath, DEFAULT_PROJECTS_DIR),
        path.join(rootPath, DEFAULT_LIBRARY_DIR),
        path.join(rootPath, DEFAULT_LIBRARY_DIR, 'Standards'),
        path.join(rootPath, DEFAULT_LIBRARY_DIR, 'Datasheets'),
        path.join(rootPath, DEFAULT_LIBRARY_DIR, 'Symbols'),
        path.join(rootPath, DEFAULT_LIBRARY_DIR, 'Scripts'),
        path.join(rootPath, DEFAULT_LIBRARY_DIR, 'Templates'),
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

ipcMain.handle('load-config', async () => {
    try {
        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
            config = JSON.parse(data);
        }

        // Initialize default workspace path if not set
        if (!config.workspacePath) {
            config.workspacePath = DEFAULT_WORKSPACE_PATH;
        }

        // Ensure directories exist based on current config
        ensureStandardDirectories(config.workspacePath);

        return config;
    } catch (error) {
        console.error('Failed to load config:', error);
        return { workspacePath: DEFAULT_WORKSPACE_PATH };
    }
});

ipcMain.handle('save-config', async (event, config) => {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

        // Ensure standard directories if workspace path changed
        if (config.workspacePath) {
            ensureStandardDirectories(config.workspacePath);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to save config:', error);
        return { success: false, error: error.message };
    }
});

// =============================================================================
// File System Operations (Explorer Support)
// =============================================================================

ipcMain.handle('list-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: false, error: 'Directory does not exist' };
        }

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const items = entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            path: path.join(dirPath, entry.name),
            size: entry.isFile() ? fs.statSync(path.join(dirPath, entry.name)).size : 0
        }));

        // Sort directories first, then files
        items.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
        });

        return { success: true, items };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('copy-file', async (event, { sourcePath, targetPath }) => {
    try {
        fs.copyFileSync(sourcePath, targetPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Copy external file to project folder with auto-categorization
ipcMain.handle('copy-file-to-project', async (event, { filePath, projectPath }) => {
    try {
        if (!projectPath) {
            return { success: false, error: 'No active project folder' };
        }

        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Source file does not exist' };
        }

        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        // Auto-categorize by file type
        let subFolder = 'resources';
        if (['.pdf', '.doc', '.docx', '.txt', '.md'].includes(ext)) {
            subFolder = 'documents';
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
            subFolder = 'images';
        } else if (['.dxf', '.dwg', '.step', '.stp', '.iges', '.igs'].includes(ext)) {
            subFolder = 'drawings';
        } else if (['.stl', '.obj', '.3mf', '.fbx'].includes(ext)) {
            subFolder = 'parts';
        }

        const targetDir = path.join(projectPath, subFolder);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Handle duplicate names
        let targetPath = path.join(targetDir, fileName);
        let counter = 1;
        const baseName = path.basename(fileName, ext);
        while (fs.existsSync(targetPath)) {
            targetPath = path.join(targetDir, `${baseName}_${counter}${ext}`);
            counter++;
        }

        fs.copyFileSync(filePath, targetPath);

        return {
            success: true,
            targetPath,
            relativePath: path.relative(projectPath, targetPath),
            subFolder,
            fileName: path.basename(targetPath)
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// =============================================================================
// Document Reading Operations (AI Support)
// =============================================================================

// Read text-based files
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File does not exist' };
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Read PDF files with text extraction
ipcMain.handle('read-pdf', async (event, filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File does not exist' };
        }

        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        return {
            success: true,
            content: data.text,
            numPages: data.numpages,
            info: data.info
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Write text file (for RAG index persistence)
ipcMain.handle('write-file', async (event, { filePath, content }) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// =============================================================================
// LLM (node-llama-cpp) Handler - Runs in Main Process
// =============================================================================

let llamaModule = null;
let llamaInstance = null;
let llamaModel = null;
let llamaContext = null;
let isLlamaLoading = false;

const MODEL_FILENAME = 'qwen2.5-3b-instruct-q4_k_m.gguf';

function getModelPath() {
    if (isDev) {
        return path.join(__dirname, '..', 'models', MODEL_FILENAME);
    } else {
        return path.join(process.resourcesPath, 'models', MODEL_FILENAME);
    }
}

// Check if model exists
ipcMain.handle('llm-check-model', async () => {
    const modelPath = getModelPath();
    const exists = fs.existsSync(modelPath);
    return {
        exists,
        path: modelPath,
        filename: MODEL_FILENAME
    };
});

// Load LLM model
ipcMain.handle('llm-load', async () => {
    if (llamaModel && llamaContext) {
        return { success: true, message: 'Model already loaded' };
    }

    if (isLlamaLoading) {
        return { success: false, error: 'Model is already loading' };
    }

    isLlamaLoading = true;

    try {
        const modelPath = getModelPath();

        if (!fs.existsSync(modelPath)) {
            isLlamaLoading = false;
            return {
                success: false,
                error: `Model not found at: ${modelPath}`,
                needsDownload: true
            };
        }

        console.log('[LLM] Loading node-llama-cpp...');

        // Dynamic import for ESM module
        if (!llamaModule) {
            llamaModule = await import('node-llama-cpp');
        }

        if (!llamaInstance) {
            llamaInstance = await llamaModule.getLlama();
        }

        console.log('[LLM] Loading model from:', modelPath);

        llamaModel = await llamaInstance.loadModel({
            modelPath
        });

        llamaContext = await llamaModel.createContext({
            contextSize: 4096
        });

        console.log('[LLM] Model loaded successfully!');
        isLlamaLoading = false;

        return { success: true };

    } catch (error) {
        console.error('[LLM] Load error:', error);
        isLlamaLoading = false;
        return { success: false, error: error.message };
    }
});

// Generate response from LLM
ipcMain.handle('llm-generate', async (event, { prompt, maxTokens = 1024, temperature = 0.7 }) => {
    if (!llamaModel || !llamaModule) {
        return {
            success: false,
            error: 'Model not loaded. Call llm-load first.'
        };
    }

    try {
        // Create a fresh context for each generation to avoid "No sequences left" error
        if (llamaContext) {
            try {
                await llamaContext.dispose();
            } catch (e) {
                // Ignore disposal errors
            }
        }

        llamaContext = await llamaModel.createContext({
            contextSize: 4096
        });

        const session = new llamaModule.LlamaChatSession({
            contextSequence: llamaContext.getSequence()
        });

        const response = await session.prompt(prompt, {
            maxTokens,
            temperature
        });

        return { success: true, response };

    } catch (error) {
        console.error('[LLM] Generate error:', error);
        return { success: false, error: error.message };
    }
});

// Unload model to free memory
ipcMain.handle('llm-unload', async () => {
    try {
        if (llamaContext) {
            await llamaContext.dispose?.();
            llamaContext = null;
        }
        if (llamaModel) {
            await llamaModel.dispose?.();
            llamaModel = null;
        }
        console.log('[LLM] Model unloaded');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

