const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const os = require('os');

const SESSION_DIR = path.join(os.homedir(), '.whatsapp-agent', 'session');

class WhatsAppService {
    constructor(config, onLog) {
        this.config = config;
        this.onLog = onLog || (() => {});
        this.client = null;
        this.qrCode = null;
        this.isConnected = false;
        this.isReady = false;
        this.lastAction = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                const puppeteerConfig = {
                    handleSIGINT: false,
                    handleSIGTERM: false,
                    handleSIGHUP: false,
                    headless: this.config.browser.headless,
                    args: this.buildPuppeteerArgs()
                };

                // Use custom browser path if provided
                if (
                    this.config.browser.type === 'custom' &&
                    this.config.browser.chromiumPath
                ) {
                    puppeteerConfig.executablePath = this.config.browser.chromiumPath;
                }

                this.client = new Client({
                    authStrategy: new LocalAuth({
                        clientId: 'whatsapp-agent',
                        dataPath: SESSION_DIR
                    }),
                    puppeteer: puppeteerConfig
                });

                // QR Event
                this.client.on('qr', (qr) => {
                    this.qrCode = qr;
                    console.log('📱 QR Code generated');
                    qrcode.generate(qr, { small: true });
                    this.log('QR code ready', 'info', 'qr');
                });

                // Authentication failed
                this.client.on('auth_failure', (msg) => {
                    this.log(`Authentication failed: ${msg}`, 'error');
                    reject(new Error(`Authentication failed: ${msg}`));
                });

                // Session restored
                this.client.on('authenticated', () => {
                    this.log('Authenticated successfully', 'success');
                });

                // Ready event
                this.client.on('ready', () => {
                    this.isReady = true;
                    this.isConnected = true;
                    this.log('WhatsApp Web is ready', 'success', 'connection');
                    resolve();
                });

                // Connection lost
                this.client.on('disconnected', (reason) => {
                    this.isConnected = false;
                    this.isReady = false;
                    this.log(`Disconnected: ${reason}`, 'warning');
                });

                // Error event
                this.client.on('error', (error) => {
                    this.log(`WhatsApp error: ${error.message}`, 'error');
                });

                // Initialize
                this.client.initialize().catch(reject);
            } catch (error) {
                this.log(`Initialization error: ${error.message}`, 'error');
                reject(error);
            }
        });
    }

    buildPuppeteerArgs() {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--user-data-dir=/tmp/puppeteer_agent'
        ];

        if (this.config.browser.performanceMode) {
            args.push('--disable-plugins');
            args.push('--disable-images');
            args.push('--single-process');
        }

        if (!this.config.browser.sandbox) {
            args.push('--disable-sandbox');
        }

        return args;
    }

    async sendMessage(chatId, content, quotedMessageId = null) {
        if (!this.isReady) {
            throw new Error('WhatsApp not ready');
        }

        try {
            const chat = await this.client.getChatById(chatId);

            if (quotedMessageId) {
                const quotedMessage = await this.client.getMessageById(quotedMessageId);
                await chat.sendMessage(content, { quotedMessageId: quotedMessage.id._serialized });
            } else {
                await chat.sendMessage(content);
            }

            this.lastAction = new Date();
            this.log(`Message sent to ${chat.name || chatId}`, 'info', 'message-sent');
        } catch (error) {
            this.log(`Failed to send message: ${error.message}`, 'error');
            throw error;
        }
    }

    async setTyping(chatId, state = true) {
        if (!this.isReady) return;

        try {
            const chat = await this.client.getChatById(chatId);
            if (state) {
                await chat.sendStateTyping();
                this.log('Typing indicator started', 'debug');
            } else {
                await chat.clearState();
                this.log('Typing indicator stopped', 'debug');
            }
        } catch (error) {
            console.error('Typing state error:', error);
        }
    }

    async logout() {
        if (this.client) {
            try {
                await this.client.logout();
                this.isConnected = false;
                this.isReady = false;
                this.log('Logged out successfully', 'info');
            } catch (error) {
                this.log(`Logout error: ${error.message}`, 'error');
            }
        }
    }

    getQRCode() {
        return this.qrCode;
    }

    getStatus() {
        return {
            connectionState: this.isConnected ? 'connected' : 'disconnected',
            sessionState: this.isReady ? 'ready' : 'initializing',
            lastAction: this.lastAction?.toISOString() || null,
            memoryUsage: process.memoryUsage()
        };
    }

    onMessage(callback) {
        if (!this.client) return;
        this.client.on('message', callback);
    }

    log(message, level = 'info', source = 'whatsapp') {
        const logEntry = {
            timestamp: new Date(),
            level,
            source,
            message
        };

        console.log(`[${source.toUpperCase()}] ${message}`);
        this.onLog(logEntry);
    }
}

async function startWhatsAppService(config, onLog) {
    const service = new WhatsAppService(config, onLog);
    await service.initialize();
    return service;
}

module.exports = { WhatsAppService, startWhatsAppService };
