// Preload script - runs before renderer process
// Exposes native CAD engine to renderer (with WASM fallback support)

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Try to load native CAD addon (2D)
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

// Try to load native CAD3D addon (3D OpenCASCADE)
let cad3dAddon = null;
let hasNativeCAD3D = false;

try {
    const addon3dPath = path.join(__dirname, '../native/build/Release/cad3d_addon.node');
    cad3dAddon = require(addon3dPath);
    hasNativeCAD3D = true;
    console.log('✅ [Preload] Native CAD3D addon loaded (OpenCASCADE)');
} catch (error) {
    console.warn('⚠️ [Preload] Native CAD3D addon not available:', error.message);
}

// Expose basic Electron info and File System API
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
    hasNativeCAD: hasNativeCAD,
    hasNativeCAD3D: hasNativeCAD3D,

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

// Expose native CAD API if available (2D)
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

// Expose native CAD3D API if available (3D OpenCASCADE)
if (hasNativeCAD3D && cad3dAddon) {
    contextBridge.exposeInMainWorld('nativeCAD3D', {
        // Engine lifecycle
        createEngine: () => cad3dAddon.createEngine(),
        destroyEngine: () => cad3dAddon.destroyEngine(),

        // Feature Modeling (Phase 2)
        createDatumPlane: (ox, oy, oz, nx, ny, nz) => cad3dAddon.createDatumPlane(ox, oy, oz, nx, ny, nz),
        createSketch: (planeId) => cad3dAddon.createSketch(planeId),
        addSketchLine: (sketchId, x1, y1, x2, y2) => cad3dAddon.addSketchLine(sketchId, x1, y1, x2, y2),
        addSketchCircle: (sketchId, cx, cy, r) => cad3dAddon.addSketchCircle(sketchId, cx, cy, r),
        createExtrude: (sketchId, height) => cad3dAddon.createExtrude(sketchId, height),
        createRevolve: (sketchId, px, py, pz, dx, dy, dz, angle) => cad3dAddon.createRevolve(sketchId, px, py, pz, dx, dy, dz, angle),

        // Primitive creation
        createBox: (dx, dy, dz) => cad3dAddon.createBox(dx, dy, dz),
        createCylinder: (radius, height) => cad3dAddon.createCylinder(radius, height),
        createSphere: (radius) => cad3dAddon.createSphere(radius),
        createCone: (bottomRadius, topRadius, height) => cad3dAddon.createCone(bottomRadius, topRadius, height),
        createTorus: (majorRadius, minorRadius) => cad3dAddon.createTorus(majorRadius, minorRadius),

        // Boolean operations
        booleanFuse: (shapeA, shapeB) => cad3dAddon.booleanFuse(shapeA, shapeB),
        booleanCut: (shapeA, shapeB) => cad3dAddon.booleanCut(shapeA, shapeB),
        booleanCommon: (shapeA, shapeB) => cad3dAddon.booleanCommon(shapeA, shapeB),

        // Modifications
        translateShape: (id, dx, dy, dz) => cad3dAddon.translateShape(id, dx, dy, dz),
        rotateShape: (id, axisX, axisY, axisZ, angleDeg) => cad3dAddon.rotateShape(id, axisX, axisY, axisZ, angleDeg),
        filletEdges: (id, radius) => cad3dAddon.filletEdges(id, radius),
        chamferEdges: (id, distance) => cad3dAddon.chamferEdges(id, distance),

        // Mesh data for Three.js rendering
        getMeshData: (id, deflection) => cad3dAddon.getMeshData(id, deflection || 0.1),

        // File I/O (STEP, IGES)
        exportSTEP: (id, filePath) => cad3dAddon.exportSTEP(id, filePath),
        exportIGES: (id, filePath) => cad3dAddon.exportIGES(id, filePath),
        importSTEP: (filePath) => cad3dAddon.importSTEP(filePath),
        importIGES: (filePath) => cad3dAddon.importIGES(filePath),

        // Management
        deleteShape: (id) => cad3dAddon.deleteShape(id),
        clear: () => cad3dAddon.clear(),
        getAllShapeIds: () => cad3dAddon.getAllShapeIds()
    });
}
