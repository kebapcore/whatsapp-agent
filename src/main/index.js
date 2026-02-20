const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
// isDev: development modda ise, dist/index.html dosyası yoksa dev server'a bağlan
const isDev = process.argv.includes('--dev') || !require('fs').existsSync(path.join(__dirname, '../../dist/index.html'));
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

    // Dev mode: connect to vite server; Production: load from dist
    const devUrl = 'http://localhost:5173';
    const prodUrl = `file://${path.join(__dirname, '../../dist/index.html')}`;

    async function loadAppropriateUrl() {
        try {
            if (isDev) {
                // Wait for Vite dev server to be reachable before loading.
                await waitForPort(5173, '127.0.0.1', 10000);
                console.log(`Loading dev URL: ${devUrl}`);
                await mainWindow.loadURL(devUrl);
                mainWindow.webContents.openDevTools();
            } else {
                console.log(`Loading prod URL: ${prodUrl}`);
                await mainWindow.loadURL(prodUrl);
            }
        } catch (err) {
            console.error('Failed to load URL:', err);
            // Fallback: try prod URL if dev fails
            if (isDev) {
                try {
                    await mainWindow.loadURL(prodUrl);
                } catch (e) {
                    console.error('Fallback load failed:', e);
                }
            }
        }
    }

    loadAppropriateUrl();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function waitForPort(port, host = '127.0.0.1', timeout = 10000) {
    const net = require('net');
    const start = Date.now();

    return new Promise((resolve, reject) => {
        const tryConnect = () => {
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.once('error', () => {
                socket.destroy();
                if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for port'));
                setTimeout(tryConnect, 300);
            });
            socket.once('timeout', () => {
                socket.destroy();
                if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for port'));
                setTimeout(tryConnect, 300);
            });
            socket.connect(port, host, () => {
                socket.end();
                resolve(true);
            });
        };
        tryConnect();
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
            
            // Initialize services if not already initialized
            if (!geminiService || !messageProcessor) {
                await reinitializeServices(config);
            }
            
            // Kill any lingering Chrome processes from previous session
            try {
                await killLingeringProcesses();
            } catch (e) {
                console.warn('Chrome cleanup warning:', e.message);
            }
            
            // Start WhatsApp with retry logic
            let retries = 3;
            let lastError = null;
            
            while (retries > 0) {
                try {
                    whatsappService = await startWhatsAppService(
                        config,
                        (log) => mainWindow?.webContents.send('log:new', log)
                    );
                    break; // Success
                } catch (error) {
                    lastError = error;
                    retries--;
                    
                    if (retries > 0) {
                        console.log(`❌ WhatsApp startup failed, retrying... (${retries} left)`);
                        console.log(`⏳ Aggressive cleanup + wait 4 seconds...`);
                        await killLingeringProcesses();
                        await new Promise(r => setTimeout(r, 4000)); // Longer wait
                    }
                }
            }
            
            if (!whatsappService) {
                throw lastError || new Error('Failed to start WhatsApp after retries');
            }
            
            // Set up message handler after WhatsApp is ready
            setupMessageHandler(config);
        }
        return { success: true };
    } catch (error) {
        console.error('WhatsApp start error:', error);
        whatsappService = null; // Reset on failure
        return { success: false, error: error.message };
    }
});

ipcMain.handle('whatsapp:restart', async (event) => {
    try {
        if (whatsappService) {
            try {
                await whatsappService.logout();
            } catch (e) {
                console.warn('Logout warning:', e.message);
            }
            whatsappService = null;
            
            // Kill lingering processes
            try {
                await killLingeringProcesses();
            } catch (e) {
                console.warn('Process cleanup warning:', e.message);
            }
            
            // Wait for cleanup
            await new Promise(r => setTimeout(r, 2000));
        }
        
        const config = ConfigManager.getConfig();
        
        // Restart with retry logic
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
            try {
                whatsappService = await startWhatsAppService(
                    config,
                    (log) => mainWindow?.webContents.send('log:new', log)
                );
                setupMessageHandler(config);
                break;
            } catch (error) {
                lastError = error;
                retries--;
                
                if (retries > 0) {
                    console.log(`❌ WhatsApp restart attempt failed, retrying... (${retries} left)`);
                    console.log(`⏳ Aggressive cleanup + wait 4 seconds...`);
                    await killLingeringProcesses();
                    await new Promise(r => setTimeout(r, 4000));
                }
            }
        }
        
        if (!whatsappService) {
            throw lastError || new Error('Failed to restart WhatsApp');
        }
        
        return { success: true };
    } catch (error) {
        console.error('WhatsApp restart error:', error);
        whatsappService = null;
        return { success: false, error: error.message };
    }
});

ipcMain.handle('whatsapp:get-qr', async (event) => {
    if (!whatsappService) return null;
    return whatsappService.getQRCode();
});

ipcMain.handle('whatsapp:is-ready', async (event) => {
    if (!whatsappService) return false;
    return whatsappService.isReady;
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

function setupMessageHandler(config) {
    if (!whatsappService || !messageProcessor) return;

    whatsappService.onMessage(async (msg) => {
        try {
            // Skip own messages
            if (msg.fromMe) return;

            const chat = await msg.getChat();
            const contact = await msg.getContact();
            
            // Get quoted message if exists
            let quotedMsg = null;
            if (msg.hasQuotedMsg) {
                try {
                    quotedMsg = await msg.getQuotedMessage();
                } catch (err) {
                    console.log('Could not retrieve quoted message:', err.message);
                }
            }

            const senderName = contact.pushname || contact.name || contact.number;

            // Build input data (same structure as old version)
            const inputData = {
                message_id: msg.id._serialized,
                timestamp: new Date().toLocaleString('tr-TR'),
                is_group: chat.isGroup,
                chat_name: chat.isGroup ? chat.name : 'Private',
                sender_id: contact.id._serialized,
                sender_name: senderName,
                content: msg.body,
                is_reply: !!quotedMsg,
                reply_context: quotedMsg ? {
                    sender: quotedMsg._data?.notifyName || 'Unknown',
                    text: quotedMsg.body
                } : null,
                chat_id: chat.id._serialized,
                isMentioned: msg.mentionedIds?.includes(whatsappService.client.info.wid._serialized) || false,
                isReplyToBot: quotedMsg ? quotedMsg.fromMe : false
            };

            // Check if we should process this message
            if (!messageProcessor.shouldProcess(inputData, config)) {
                console.log(`[PROCESSOR] Skipping message - does not match processing rules`);
                return;
            }

            console.log(`[MESSAGE] Received from ${senderName}: "${msg.body.substring(0, 50)}..."`);

            // Persist incoming message to history so Gemini has context
            try {
                historyManager.addMessage({
                    messageId: inputData.message_id,
                    timestamp: inputData.timestamp,
                    senderId: inputData.sender_id,
                    senderName: inputData.sender_name,
                    isGroup: inputData.is_group,
                    chatName: inputData.chat_name,
                    content: inputData.content,
                    isReply: inputData.is_reply,
                    replyContext: inputData.reply_context,
                    attachments: []
                });
            } catch (e) {
                console.warn('History save failed:', e.message);
            }

            // Set typing indicator
            if (!chat.isGroup) {
                await whatsappService.setTyping(chat.id._serialized, true);
            }

            // Process message with Gemini
            const result = await messageProcessor.processMessage(inputData, config);

            // Clear typing indicator
            if (!chat.isGroup) {
                await whatsappService.setTyping(chat.id._serialized, false);
            }

            // Send response
            if (result.action === 'reply' && result.content) {
                console.log(`[RESPONSE] Sending reply to ${senderName}`);
                await whatsappService.sendMessage(
                    chat.id._serialized,
                    result.content,
                    inputData.message_id
                );
            } else if (result.action === 'operator') {
                // Notify operator escalation
                mainWindow?.webContents.send('operator:escalation', {
                    message: result.message,
                    originalData: inputData
                });
                console.log(`[OPERATOR] Escalation needed: ${result.message}`);
            }
        } catch (err) {
            console.error('[MESSAGE] Error processing message:', err);
            mainWindow?.webContents.send('log:new', {
                level: 'error',
                source: 'message-handler',
                message: `Message processing error: ${err.message}`,
                timestamp: new Date()
            });
        }
    });

    console.log('[INIT] Message handler setup complete');
}

async function killLingeringProcesses() {
    const { execSync, spawnSync } = require('child_process');
    const rimraf = require('rimraf');
    
    try {
        console.log('[CLEANUP] Starting aggressive browser cleanup...');
        
        // Multiple methods to kill Chrome processes
        try {
            // Method 1: pkill
            execSync('pkill -9 -f "chromium|google-chrome|chrome" || true', { stdio: 'ignore' });
            console.log('[CLEANUP] Method 1: pkill executed');
        } catch (e) {
            // Ignore
        }

        try {
            // Method 2: killall
            execSync('killall -9 chrome chromium 2>/dev/null || true', { stdio: 'ignore' });
            console.log('[CLEANUP] Method 2: killall executed');
        } catch (e) {
            // Ignore
        }

        try {
            // Method 3: ps + grep + kill
            const result = spawnSync('bash', ['-c', 'ps aux | grep -i "chromium\\|google-chrome" | grep -v grep | awk \'{print $2}\' | xargs kill -9 2>/dev/null || true'], { stdio: 'ignore' });
            console.log('[CLEANUP] Method 3: ps+grep executed');
        } catch (e) {
            // Ignore
        }

        // Windows fallback
        if (process.platform === 'win32') {
            try {
                execSync('taskkill /F /IM chrome.exe /IM chromium.exe 2>nul || call', { stdio: 'ignore' });
                console.log('[CLEANUP] Windows: taskkill executed');
            } catch (e) {
                // Ignore
            }
        }

        // Clean up session directory aggressively
        const sessionDir = path.join(os.homedir(), '.whatsapp-agent', 'session');
        if (fs.existsSync(sessionDir)) {
            try {
                // Remove all lock files and temp files
                const files = fs.readdirSync(sessionDir);
                files.forEach(file => {
                    const filePath = path.join(sessionDir, file);
                    const stat = fs.statSync(filePath);
                    
                    // Remove lock files, temp files, and Chrome user data cache
                    if (file.includes('LOCK') || file.includes('.lock') || file.includes('network') || file.includes('chrome')) {
                        try {
                            if (stat.isDirectory()) {
                                // Recursive remove directory
                                try {
                                    execSync(`rm -rf "${filePath}"`, { stdio: 'ignore' });
                                } catch (e) {
                                    // Fallback: manual deletion
                                    const removeRecursive = (dir) => {
                                        fs.readdirSync(dir).forEach(f => {
                                            const p = path.join(dir, f);
                                            if (fs.statSync(p).isDirectory()) {
                                                removeRecursive(p);
                                            } else {
                                                fs.unlinkSync(p);
                                            }
                                        });
                                        fs.rmdirSync(dir);
                                    };
                                    removeRecursive(filePath);
                                }
                                console.log(`[CLEANUP] Removed directory: ${file}`);
                            } else {
                                fs.unlinkSync(filePath);
                                console.log(`[CLEANUP] Removed file: ${file}`);
                            }
                        } catch (e) {
                            console.warn(`[CLEANUP] Could not remove ${file}: ${e.message}`);
                        }
                    }
                });
            } catch (e) {
                console.warn('[CLEANUP] Session dir cleanup error:', e.message);
            }
        }

        // Wait longer for processes to die
        await new Promise(r => setTimeout(r, 2500));
        console.log('[CLEANUP] Cleanup complete');
    } catch (error) {
        console.warn('[CLEANUP] Error during process cleanup:', error.message);
    }
}

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
