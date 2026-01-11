// Preload script - runs before renderer process
// Exposes native CAD engine to renderer (with WASM fallback support)

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Try to load native CAD addon
let cadAddon = null;
let hasNativeCAD = false;

try {
    const addonPath = path.join(__dirname, '../native/build/Release/cad_addon.node');
    cadAddon = require(addonPath);
    hasNativeCAD = true;
    console.log('✅ [Preload] Native CAD addon loaded');
} catch (error) {
    console.warn('⚠️ [Preload] Native CAD addon not available:', error.message);
    console.log('   Will use WASM fallback in renderer');
}

// Expose basic Electron info and File System API
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
    hasNativeCAD: hasNativeCAD,

    // File System Ops
    onMenuAction: (callback) => ipcRenderer.on('menu-action', (_event, action) => callback(action)),
    onLoadProjectData: (callback) => ipcRenderer.on('load-project-data', (_event, payload) => callback(payload)),
    saveProject: (data, filePath, saveAs, asFolder, projectName) => ipcRenderer.invoke('save-project-file', { data, filePath, saveAs, asFolder, projectName }),
    saveTempProject: (data) => ipcRenderer.invoke('save-temp-project', data),
    openProjectDialog: (asFolder) => ipcRenderer.invoke('open-project-file', { asFolder }),
    saveDXF: ({ content, suggestedName }) => ipcRenderer.invoke('save-dxf-file', { content, suggestedName }),

    // Config Ops
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),

    // Directory Operations (Data Vault)
    listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
    createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
    copyFile: ({ sourcePath, targetPath }) => ipcRenderer.invoke('copy-file', { sourcePath, targetPath }),
    copyFileToProject: ({ filePath, projectPath }) => ipcRenderer.invoke('copy-file-to-project', { filePath, projectPath }),

    // Document Reading (AI Support)
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    readPdf: (filePath) => ipcRenderer.invoke('read-pdf', filePath),
    writeFile: ({ filePath, content }) => ipcRenderer.invoke('write-file', { filePath, content }),

    // LLM (Embedded Qwen2.5-3B)
    llmCheckModel: () => ipcRenderer.invoke('llm-check-model'),
    llmLoad: () => ipcRenderer.invoke('llm-load'),
    llmGenerate: ({ prompt, maxTokens, temperature }) => ipcRenderer.invoke('llm-generate', { prompt, maxTokens, temperature }),
    llmUnload: () => ipcRenderer.invoke('llm-unload'),

    removeListeners: () => {
        ipcRenderer.removeAllListeners('menu-action');
        ipcRenderer.removeAllListeners('load-project-data');
    }
});

// Expose native CAD API if available
if (hasNativeCAD && cadAddon) {
    contextBridge.exposeInMainWorld('nativeCAD', {
        // Engine lifecycle
        createEngine: () => cadAddon.createEngine(),
        destroyEngine: () => cadAddon.destroyEngine(),

        // Drawing commands
        addLine: (x1, y1, x2, y2) => cadAddon.addLine(x1, y1, x2, y2),
        addCircle: (cx, cy, radius) => cadAddon.addCircle(cx, cy, radius),
        addRectangle: (x1, y1, x2, y2) => cadAddon.addRectangle(x1, y1, x2, y2),
        addArc: (cx, cy, radius, startAngle, endAngle) => cadAddon.addArc(cx, cy, radius, startAngle, endAngle),
        addRegularPolygon: (cx, cy, sides, radius) => cadAddon.addRegularPolygon(cx, cy, sides, radius),
        addPolyline: (points, closed) => cadAddon.addPolyline(points, closed),

        // Serialization
        exportDatabase: () => cadAddon.exportDatabase(),
        importDatabase: (json) => cadAddon.importDatabase(json),
        exportDXF: () => cadAddon.exportDXF(),

        // Modification commands
        clear: () => cadAddon.clear(),
        deleteEntity: (id) => cadAddon.deleteEntity(id),

        // Selection commands
        hitTest: (x, y, threshold) => cadAddon.hitTest(x, y, threshold),
        selectEntity: (id) => cadAddon.selectEntity(id),
        deselectAll: () => cadAddon.deselectAll(),
        deleteSelected: () => cadAddon.deleteSelected(),
        moveSelected: (dx, dy) => cadAddon.moveSelected(dx, dy),
        copySelected: (dx, dy) => cadAddon.copySelected(dx, dy),
        selectByWindow: (x1, y1, x2, y2) => cadAddon.selectByWindow(x1, y1, x2, y2),
        selectByCrossing: (x1, y1, x2, y2) => cadAddon.selectByCrossing(x1, y1, x2, y2),
        rotateSelected: (cx, cy, angle) => cadAddon.rotateSelected(cx, cy, angle),
        offsetEntity: (id, distance, clickX, clickY) => cadAddon.offsetEntity(id, distance, clickX, clickY),

        // Snapping
        findClosestSnapPoint: (x, y, threshold) => cadAddon.findClosestSnapPoint(x, y, threshold),

        // Rendering - returns Float32Array directly (sync, fast!)
        getRenderBuffer: () => cadAddon.getRenderBuffer()
    });
}
