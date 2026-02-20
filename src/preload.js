const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Configuration API
    configWizard: () => ipcRenderer.invoke('app:init-config-wizard'),
    saveConfig: (config) => ipcRenderer.invoke('app:save-config', config),
    checkConfigExists: () => ipcRenderer.invoke('app:check-config-exists'),

    // WhatsApp API
    startWhatsApp: () => ipcRenderer.invoke('whatsapp:start'),
    restartWhatsApp: () => ipcRenderer.invoke('whatsapp:restart'),
    getQRCode: () => ipcRenderer.invoke('whatsapp:get-qr'),
    isWhatsAppReady: () => ipcRenderer.invoke('whatsapp:is-ready'),
    getWhatsAppStatus: () => ipcRenderer.invoke('whatsapp:get-status'),

    // Message API
    sendOperatorResponse: (response) =>
        ipcRenderer.invoke('message:send-operator-response', response),

    // System Instructions API
    getSystemInstructions: () => ipcRenderer.invoke('system:get-instructions'),
    saveSystemInstructions: (instructions) =>
        ipcRenderer.invoke('system:save-instructions', instructions),
    getDefaultSystemInstructions: () =>
        ipcRenderer.invoke('system:get-default-instructions'),

    // Logs API
    clearLogs: () => ipcRenderer.invoke('log:clear'),
    onNewLog: (callback) => ipcRenderer.on('log:new', (event, log) => callback(log)),
    onClearLogs: (callback) => ipcRenderer.on('log:clear-all', callback),

    // History API
    getRecentHistory: (limit) => ipcRenderer.invoke('history:get-recent', limit),
    clearHistory: () => ipcRenderer.invoke('history:clear')
});
