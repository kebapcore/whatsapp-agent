const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';
const { startWhatsAppService } = require('../backend/whatsapp-service');
const { ConfigManager } = require('../backend/config-manager');
const { HistoryManager } = require('../backend/history-manager');
const { GeminiService } = require('../backend/gemini-service');
const { MessageProcessor } = require('../backend/message-processor');

let mainWindow;
let whatsappService = null;
let geminiService = null;
let messageProcessor = null;
let historyManager = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true
        },
        icon: path.join(__dirname, '../../public/icon.png')
    });

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
    setupMenu();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// ============================================================
// IPC HANDLERS - Configuration & Initialization
// ============================================================

ipcMain.handle('app:init-config-wizard', async (event) => {
    return {
        currentConfig: ConfigManager.getConfig(),
        systemInfo: {
            platform: process.platform,
            nodeVersion: process.version
        }
    };
});

ipcMain.handle('app:save-config', async (event, config) => {
    try {
        ConfigManager.saveConfig(config);
        await reinitializeServices(config);
        return { success: true };
    } catch (error) {
        console.error('Config save error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('app:check-config-exists', async (event) => {
    return ConfigManager.hasConfig();
});

// ============================================================
// IPC HANDLERS - WhatsApp Operations
// ============================================================

ipcMain.handle('whatsapp:start', async (event) => {
    try {
        if (!whatsappService) {
            const config = ConfigManager.getConfig();
            whatsappService = await startWhatsAppService(
                config,
                (log) => mainWindow?.webContents.send('log:new', log)
            );
        }
        return { success: true };
    } catch (error) {
        console.error('WhatsApp start error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('whatsapp:restart', async (event) => {
    try {
        if (whatsappService) {
            await whatsappService.logout();
            whatsappService = null;
        }
        
        const config = ConfigManager.getConfig();
        whatsappService = await startWhatsAppService(
            config,
            (log) => mainWindow?.webContents.send('log:new', log)
        );
        return { success: true };
    } catch (error) {
        console.error('WhatsApp restart error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('whatsapp:get-qr', async (event) => {
    if (!whatsappService) return null;
    return whatsappService.getQRCode();
});

ipcMain.handle('whatsapp:is-ready', async (event) => {
    if (!whatsappService) return false;
    return whatsappService.isReady();
});

ipcMain.handle('whatsapp:get-status', async (event) => {
    if (!whatsappService) {
        return {
            connectionState: 'disconnected',
            sessionState: 'not_initialized',
            activeChats: 0,
            lastAction: null
        };
    }
    return whatsappService.getStatus();
});

// ============================================================
// IPC HANDLERS - Message Operations
// ============================================================

ipcMain.handle('message:send-operator-response', async (event, response) => {
    if (messageProcessor) {
        messageProcessor.setOperatorResponse(response);
        return { success: true };
    }
    return { success: false };
});

// ============================================================
// IPC HANDLERS - System Instructions
// ============================================================

ipcMain.handle('system:get-instructions', async (event) => {
    try {
        const instructions = ConfigManager.getSystemInstructions();
        return { success: true, data: instructions };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('system:save-instructions', async (event, instructions) => {
    try {
        ConfigManager.saveSystemInstructions(instructions);
        if (geminiService) {
            geminiService.updateSystemInstructions(instructions);
        }
        mainWindow?.webContents.send('log:new', {
            level: 'info',
            message: 'System instructions updated',
            timestamp: new Date()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('system:get-default-instructions', async (event) => {
    try {
        const defaultInstructions = ConfigManager.getDefaultSystemInstructions();
        return { success: true, data: defaultInstructions };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ============================================================
// IPC HANDLERS - Logs
// ============================================================

ipcMain.handle('log:clear', async (event) => {
    mainWindow?.webContents.send('log:clear-all');
    return { success: true };
});

// ============================================================
// IPC HANDLERS - History
// ============================================================

ipcMain.handle('history:get-recent', async (event, limit = 50) => {
    if (!historyManager) return [];
    return historyManager.getRecent(limit);
});

ipcMain.handle('history:clear', async (event) => {
    if (!historyManager) return { success: false };
    historyManager.clear();
    return { success: true };
});

// ============================================================
// Helper Functions
// ============================================================

async function reinitializeServices(config) {
    try {
        // Initialize Gemini Service
        geminiService = new GeminiService(
            config.gemini.apiKey,
            config.gemini.model,
            ConfigManager.getSystemInstructions()
        );

        // Initialize History Manager
        historyManager = new HistoryManager(config.storage.historyLimit);

        // Initialize Message Processor
        messageProcessor = new MessageProcessor(
            geminiService,
            historyManager,
            (log) => mainWindow?.webContents.send('log:new', log)
        );

        console.log('Services reinitialized successfully');
    } catch (error) {
        console.error('Service reinitialization error:', error);
    }
}

function setupMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    accelerator: 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (whatsappService) {
        await whatsappService.logout();
    }
    app.quit();
});
