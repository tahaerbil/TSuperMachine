// Preload script - runs before renderer process
// Can be used to expose specific Node.js APIs to the renderer

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific electron features without exposing the entire API
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true
});
