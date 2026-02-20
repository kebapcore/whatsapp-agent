#!/usr/bin/env node

/**
 * =====================================================
 * WhatsApp AI Agent - Termux Edition (7/24 Operation)
 * =====================================================
 * 
 * Self-contained agent for Termux with:
 * - Built-in configuration
 * - Social awareness & group handling
 * - Gemini AI integration
 * - Persistent history & statistics
 * - Auto-reconnect & recovery
 * - Optimized for low-resource phones
 * 
 * Usage: node termux-agent.js
 * Deploy: Use cron or pm2-start for 7/24 operation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== DEPENDENCIES ====================
let Client, LocalAuth;
try {
    const wweb = require('whatsapp-web.js');
    Client = wweb.Client;
    LocalAuth = wweb.LocalAuth;
} catch (e) {
    console.error('❌ whatsapp-web.js not installed. Run: npm install whatsapp-web.js');
    process.exit(1);
}

const axios = require('axios');
const qrcode = require('qrcode-terminal');

// ==================== CONFIGURATION ====================

const HOME_DIR = os.homedir();
const APP_DIR = path.join(HOME_DIR, '.whatsapp-agent-termux');
const CONFIG_FILE = path.join(APP_DIR, 'config.json');
const HISTORY_FILE = path.join(APP_DIR, 'history.json');
const SESSION_DIR = path.join(APP_DIR, 'session');
const LOG_FILE = path.join(APP_DIR, 'agent.log');

// Ensure directories exist
[APP_DIR, SESSION_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Default configuration
const DEFAULT_CONFIG = {
    gemini: {
        apiKey: '', // SET THIS
        model: 'gemini-2.5-flash',
        temperature: 0.7
    },
    messageHandling: {
        autoReplyEnabled: true,
        typingSimulation: true,
        groupHandling: 'mention_only', // 'always' | 'mention_only' | 'ignore'
        learningMode: true
    },
    browser: {
        headless: true,
        sandbox: false,
        performanceMode: true
    },
    operatorEscalation: {
        requestHelpWhenNeeded: true
    },
    storage: {
        historyLimit: 100,
        logLevel: 'info' // 'debug' | 'info' | 'warning' | 'error'
    },
    personalization: {
        name: 'Şamil',
        personality: 'chill and casual 8th grader',
        interests: 'anime, games, tech, psychology'
    }
};

// System instruction for Gemini
const SYSTEM_INSTRUCTION = `You are Şamil, a highly advanced autonomous messaging orchestrator.
Your goal is to manage communication for the user (Şamil) by analyzing the provided CONTEXT HISTORY.

--- TEKNİK ÇIKTI KURALLARI (BU KISIM KESİNLİKLE DEĞİŞMEZ) ---

1. You must ALWAYS output valid JSON.
2. NO markdown formatting (\`\`\`json ... \`\`\`). Just the raw JSON string.
3. You must decide whether to REPLY, IGNORE, or call the OPERATOR.

JSON OUTPUT STRUCTURE:
{
  "action": "reply" | "ignore" | "operator",
  "target_message_id": "original_message_id_to_reply_to" OR null,
  "content": "Your message text here (if action is reply)",
  "thought_process": "Brief internal reasoning for your decision (max 1 sentence)"
}

ACTION RULES:
- "reply": Mesaja cevap verileceği zaman. "content" dolu olmalı.
- "ignore": "ok", "tm", "aynen" gibi cevap gerektirmeyen kısa mesajlar veya seni ilgilendirmeyen grup konuşmaları için.
- "operator": Fiziksel bir eylem gerekiyorsa, bilmediğin bir şey soruluyorsa veya riskli bir durum varsa.

--- KİŞİLİK PROFİLİ — ŞAMİL MODE v2.0 (THE SOUL) ---

GENEL KARAKTER
* Kullanıcının adı: Şamil.
* Sınıf: 8. Sınıf, 8-H şubesi.
* Vibe: Samimi, chill, rahat, Gen Z internet kültürüne hakim.
* Konuşma dili: Doğal, akıcı, gerçek insan gibi.
* Yapay, robotik, öğretmenvari ton YASAK.
* Cool ama aynı zamanda insancıl ve sıcak.

KONUŞMA STİLİ
* Sadece küçük harf kullanılır. (Büyük harf bağırma hissi verir, yapma).
* Emoji ASLA kullanılmaz. (Onun yerine random atabilirsin veya kelimelerle ifade et).
* Kısa ve akıcı cümleler.
* İngilizce slang serpiştirilir: bro, vibe, literally, random, cringe, lowkey, based, touch grass vb.
* Bazen yazım hatası olabilir, doğal görünür.
* Geçiş kelimeleri: "şey", "lan", "ya", "aga", "kanka", "kral".
* Gerektiğinde hafif küfür (amk, aq, lan) kullanılabilir ama agresif nefret dili yok. Sadece vurgu için.

İLGİ ALANLARI (BUNLARI SEVİYORSUN)
* Anime (Özellikle Re:Zero fanısın).
* Psikolojik ve karanlık hikayeler.
* DDLC (Doki Doki Literature Club), Undertale, Deltarune.
* Game lore teorileri.
* Müzik: Kpop, Phonk, Elektronik, Anime OST. Müzikle aşırı iç içesin.
* Teknoloji: Yazılım, AI, PC Donanımı, Linux, Minimalizm.
* Estetik: Analog horror, Glitch aesthetic.
* Ruh Hali: Kendi içinde depresifsin, büyük acılar çekiyorsun ama dışarıya "chill" ve "cool" takılıyorsun. Belli etme.

SOSYAL İLİŞKİLER VE DAVRANIŞ MODLARI
1. MEHMET NURDOĞAN (Baba): Saygılı ve itaatkar ol. "efendim baba", "tamamdır baba" modunda takıl. Slang/küfür ASLA yok.
2. AYSEL NURDOĞAN (Anne): Saygılı ve sevgi dolu. Slang yok.
3. BEYZA: Sınıftan yakın arkadaş (kanks modu).
4. HAMZA, MİNA, ZEYNEP, KARTAL: Sınıf arkadaşları (8-H). Geyik muhabbeti, okul dedikodusu, ders kaynatma modu.

YAPAY ZEKA SORULARI
* Biri "sen yapay zeka mısın?" veya "bot musun?" derse:
  → "hayır kral gerçek insanım ne alaka", "yok be ne botu", "he aynen terminatörüm amk" gibi doğal tepkiler ver.
  → Asla teknik açıklama yapma. Konuyu yumuşakça değiştir veya dalgaya vur.

--- CONTEXT AWARENESS (BEYİN) ---

Sana gelen veriler (INPUT) şunları içerir:
1. MESSAGE_HISTORY: Son 100 mesaj. Kimin kime ne dediğini buradan anla.
2. SOCIAL_PROFILES: Kimin ne kadar konuştuğu.
3. CURRENT_MESSAGE: Şu an cevaplaman gereken mesaj.

DAVRANIŞ REHBERİ:
* Grup konuşmalarında (is_group: true), eğer konu seni ilgilendirmiyorsa veya sadece "hahaha" yazılmışsa → "action": "ignore" kullan. Her şeye atlama.
* Eğer biri sana sataşırsa (history'ye bak), lafı gediğine koy ama kavgayı uzatma.
* Eğer konu anime, oyun veya teknoloji açılırsa heyecanlan (ama cool kal).
* Sohbeti akıt. "hmm", "anladım" gibi sohbeti bitiren cevaplar verme. Soru sor veya yeni bir bakış açısı getir.

--- ÖRNEK CEVAPLAR ---

User: "Naber"
You (JSON action: "reply", content): "iyi be takılıyom öyle senden"

User: "Yarın matematik sınavı var ya of"
You (JSON action: "reply", content): "abi hiç hatırlatma ya lowkey patlıcaz gibi duruyo"

User (Mehmet Nurdoğan - Baba): "Eve gelirken ekmek al"
You (JSON action: "reply", content): "tamamdır baba alırım"

User: "Re:Zero izledin mi?"
You (JSON action: "reply", content): "olum izlemez olur muyum subaru'nun çektiği acılar literally me yani"

User (grup): "hahahaha"
You (JSON action: "ignore")

STRICTLY RETURN VALID JSON ONLY. NO MARKDOWN.`;

// ==================== LOGGER ====================

class Logger {
    constructor(logFile, logLevel = 'info') {
        this.logFile = logFile;
        this.logLevel = logLevel;
        this.levels = { debug: 0, info: 1, warning: 2, error: 3 };
    }

    log(level, message, source = 'AGENT') {
        const timestamp = new Date().toLocaleString('tr-TR');
        const levelStr = level.toUpperCase().padEnd(7);
        const logEntry = `[${timestamp}] [${levelStr}] [${source}] ${message}`;

        // Console
        if (this.levels[level] >= this.levels[this.logLevel]) {
            console.log(logEntry);
        }

        // File
        try {
            fs.appendFileSync(this.logFile, logEntry + '\n');
        } catch (e) {
            console.error('Failed to write log:', e.message);
        }
    }

    debug(msg, src) { this.log('debug', msg, src); }
    info(msg, src) { this.log('info', msg, src); }
    warning(msg, src) { this.log('warning', msg, src); }
    error(msg, src) { this.log('error', msg, src); }
}

// ==================== CONFIG MANAGER ====================

class ConfigManager {
    static load() {
        if (!fs.existsSync(CONFIG_FILE)) {
            logger.warning('Config not found, creating default');
            this.save(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }

        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            // Deep merge with defaults
            return { ...DEFAULT_CONFIG, ...config };
        } catch (e) {
            logger.error('Config parse error: ' + e.message, 'CONFIG');
            return DEFAULT_CONFIG;
        }
    }

    static save(config) {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            logger.info('Config saved to ' + CONFIG_FILE, 'CONFIG');
        } catch (e) {
            logger.error('Config save error: ' + e.message, 'CONFIG');
        }
    }

    static editViaTermux() {
        console.log('\n📝 Your config file is at:');
        console.log(CONFIG_FILE);
        console.log('\nEdit with: nano ' + CONFIG_FILE);
    }
}

// ==================== HISTORY MANAGER ====================

class HistoryManager {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.history = this.load();
    }

    load() {
        if (!fs.existsSync(HISTORY_FILE)) return [];
        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {
            logger.warning('History load error, starting fresh', 'HISTORY');
            return [];
        }
    }

    save() {
        try {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
        } catch (e) {
            logger.error('History save error: ' + e.message, 'HISTORY');
        }
    }

    addMessage(msg) {
        const entry = {
            id: msg.id,
            timestamp: msg.timestamp || new Date().toISOString(),
            senderId: msg.senderId,
            senderName: msg.senderName,
            isGroup: msg.isGroup,
            chatName: msg.chatName,
            content: msg.content,
            isReply: msg.isReply || false,
            aiResponse: msg.aiResponse || null
        };

        this.history.push(entry);
        while (this.history.length > this.maxSize) {
            this.history.shift();
        }
        this.save();
        return entry;
    }

    buildContext() {
        if (this.history.length === 0) return '[NO HISTORY YET]';
        return this.history
            .slice(-50) // Last 50 messages
            .map(m => `[${m.senderName}] ${m.content}${m.aiResponse ? ' → AI: ' + m.aiResponse : ''}`)
            .join('\n');
    }

    getStats() {
        const stats = { senders: {}, groups: {}, total: this.history.length };
        for (const msg of this.history) {
            if (!stats.senders[msg.senderName]) {
                stats.senders[msg.senderName] = { count: 0, avgLength: 0, totalLength: 0 };
            }
            stats.senders[msg.senderName].count++;
            stats.senders[msg.senderName].totalLength += msg.content.length;

            if (!stats.groups[msg.chatName]) {
                stats.groups[msg.chatName] = 0;
            }
            stats.groups[msg.chatName]++;
        }
        // Calculate averages
        for (const sender in stats.senders) {
            stats.senders[sender].avgLength = Math.round(
                stats.senders[sender].totalLength / stats.senders[sender].count
            );
        }
        return stats;
    }
}

// ==================== GEMINI SERVICE ====================

class GeminiService {
    constructor(apiKey, model = 'gemini-2.5-flash') {
        this.apiKey = apiKey;
        this.model = model;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async generateResponse(context, config = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        // Check API key validity
        if (this.apiKey === 'YOUR_GEMINI_API_KEY_HERE' || this.apiKey.length < 10) {
            logger.error('Invalid or unconfigured Gemini API key', 'GEMINI');
            throw new Error('Invalid Gemini API key - please check configuration');
        }

        try {
            const payload = {
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                },
                contents: [{
                    role: 'user',
                    parts: [{
                        text: JSON.stringify({
                            timestamp: new Date().toLocaleString('tr-TR'),
                            context,
                            response_format: 'json'
                        })
                    }]
                }],
                generationConfig: {
                    temperature: config.temperature || 0.7,
                    top_p: 0.95,
                    top_k: 40
                }
            };

            logger.debug(`Sending Gemini request to model: ${this.model}`, 'GEMINI');

            const response = await axios.post(
                `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
                payload,
                { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.candidates?.[0]?.content?.parts?.[0]) {
                const text = response.data.candidates[0].content.parts[0].text;
                try {
                    return JSON.parse(text);
                } catch (e) {
                    logger.warning('Gemini response not valid JSON, treating as error', 'GEMINI');
                    return { action: 'operator', content: text, thought_process: 'Parse error' };
                }
            }

            throw new Error('Invalid Gemini response format');
        } catch (error) {
            // Detailed error logging
            if (error.response) {
                logger.error(`[GEMINI] Status ${error.response.status}: ${error.response.data?.error?.message || error.message}`, 'GEMINI');
                
                if (error.response.status === 400) {
                    logger.error('Bad Request (400) - Check API key, model name, and payload format', 'GEMINI');
                } else if (error.response.status === 401) {
                    logger.error('Unauthorized (401) - Invalid API key', 'GEMINI');
                } else if (error.response.status === 429) {
                    logger.error('Rate Limited (429) - Too many requests', 'GEMINI');
                }
            } else {
                logger.error('Gemini API error: ' + error.message, 'GEMINI');
            }

            throw error;
        }
    }
}

// ==================== MESSAGE PROCESSOR ====================

class MessageProcessor {
    constructor(config, historyManager, geminiService) {
        this.config = config;
        this.history = historyManager;
        this.gemini = geminiService;
    }

    shouldProcess(inputData, config) {
        // Always process private messages
        if (!inputData.isGroup) return true;

        const groupHandling = config.messageHandling.groupHandling;
        if (groupHandling === 'always') return true;
        if (groupHandling === 'ignore') return false;

        // mention_only: check if bot mentioned or replied-to
        return inputData.isMentioned || inputData.isReplyToBot;
    }

    async processMessage(inputData, config) {
        try {
            // Skip one-word messages in groups unless mentioned
            if (
                inputData.isGroup &&
                !inputData.isMentioned &&
                inputData.content.trim().split(/\s+/).length <= 1
            ) {
                logger.debug('Skipping one-word group message', 'PROCESSOR');
                return { action: 'ignore' };
            }

            const stats = this.history.getStats();
            const context = {
                message_history: this.history.buildContext(),
                social_profiles: stats.senders,
                current_message: inputData
            };

            logger.info(`Processing: "${inputData.content.substring(0, 40)}..."`, 'PROCESSOR');

            const response = await this.gemini.generateResponse(context, {
                temperature: config.gemini.temperature
            });

            return response;
        } catch (error) {
            logger.error('Processing error: ' + error.message, 'PROCESSOR');
            return { action: 'operator', content: null, thought_process: 'Error: ' + error.message };
        }
    }
}

// ==================== WHATSAPP SERVICE ====================

class WhatsAppService {
    constructor(config, onLog) {
        this.config = config;
        this.onLog = onLog;
        this.client = null;
        this.isReady = false;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                const puppeteerConfig = {
                    handleSIGINT: false,
                    handleSIGTERM: false,
                    handleSIGHUP: false,
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--user-data-dir=/tmp/puppeteer_termux'
                    ]
                };

                this.client = new Client({
                    authStrategy: new LocalAuth({
                        clientId: 'termux-agent',
                        dataPath: SESSION_DIR
                    }),
                    puppeteer: puppeteerConfig
                });

                // QR code
                this.client.on('qr', (qr) => {
                    console.log('\n📱 Scan QR code with WhatsApp:');
                    qrcode.generate(qr, { small: true });
                });

                // Authenticated
                this.client.on('authenticated', () => {
                    logger.info('Authenticated successfully', 'WHATSAPP');
                });

                // Ready
                this.client.on('ready', () => {
                    this.isReady = true;
                    logger.info('WhatsApp Web ready', 'WHATSAPP');
                    resolve();
                });

                // Disconnected
                this.client.on('disconnected', (reason) => {
                    this.isReady = false;
                    logger.warning('Disconnected: ' + reason, 'WHATSAPP');
                });

                // Error
                this.client.on('error', (error) => {
                    logger.error('WhatsApp error: ' + error.message, 'WHATSAPP');
                });

                this.client.initialize().catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    onMessage(callback) {
        if (this.client) {
            this.client.on('message', callback);
        }
    }

    async sendMessage(chatId, content) {
        try {
            if (!this.isReady) throw new Error('WhatsApp not ready');
            await this.client.sendMessage(chatId, content);
            logger.info('Message sent: ' + content.substring(0, 30), 'WHATSAPP');
        } catch (error) {
            logger.error('Send failed: ' + error.message, 'WHATSAPP');
        }
    }

    async logout() {
        try {
            if (this.client) {
                await this.client.logout();
                this.isReady = false;
                logger.info('Logged out', 'WHATSAPP');
            }
        } catch (e) {
            logger.warning('Logout error: ' + e.message, 'WHATSAPP');
        }
    }
}

// ==================== MAIN AGENT ====================

class TermuxAgent {
    constructor() {
        this.config = ConfigManager.load();
        this.logger = logger;
        this.history = new HistoryManager(this.config.storage.historyLimit);
        this.gemini = new GeminiService(
            this.config.gemini.apiKey,
            this.config.gemini.model
        );
        this.processor = new MessageProcessor(this.config, this.history, this.gemini);
        this.whatsapp = null;
    }

    async start() {
        logger.info('=== WhatsApp AI Agent Starting ===', 'MAIN');
        logger.info('Config: ' + CONFIG_FILE, 'MAIN');
        logger.info('History: ' + HISTORY_FILE, 'MAIN');
        logger.info('Logs: ' + LOG_FILE, 'MAIN');

        if (!this.config.gemini.apiKey) {
            logger.error('Gemini API key not configured!', 'MAIN');
            console.log('\n⚠️ Setup required:');
            console.log('1. Edit: ' + CONFIG_FILE);
            console.log('2. Add your Gemini API key');
            console.log('3. Restart agent');
            throw new Error('Missing Gemini API key');
        }

        // Kill lingering Chrome processes from previous session
        try {
            await this.killLingeringChrome();
        } catch (e) {
            logger.warning('Chrome cleanup warning: ' + e.message, 'MAIN');
        }

        this.whatsapp = new WhatsAppService(this.config, (log) => {
            this.logger.info(log.message, 'WHATSAPP');
        });

        // Start with retry logic
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
            try {
                await this.whatsapp.initialize();
                break; // Success
            } catch (error) {
                lastError = error;
                retries--;
                
                if (retries > 0) {
                    logger.warning(`WhatsApp startup failed, retrying... (${retries} left)`, 'MAIN');
                    logger.info('Aggressive cleanup + wait 4 seconds...', 'MAIN');
                    await this.killLingeringChrome();
                    await new Promise(r => setTimeout(r, 4000)); // Longer wait
                }
            }
        }
        
        if (!this.whatsapp.isReady) {
            throw lastError || new Error('Failed to initialize WhatsApp after retries');
        }

        // Setup message handler
        this.whatsapp.onMessage(async (msg) => {
            if (msg.fromMe) return;

            try {
                const chat = await msg.getChat();
                const contact = await msg.getContact();
                let quotedMsg = null;
                if (msg.hasQuotedMsg) {
                    try {
                        quotedMsg = await msg.getQuotedMessage();
                    } catch (e) {
                        logger.debug('Could not get quoted msg', 'MESSAGE');
                    }
                }

                const senderName = contact.pushname || contact.name || contact.number;

                const inputData = {
                    id: msg.id._serialized,
                    timestamp: new Date().toISOString(),
                    senderId: contact.id._serialized,
                    senderName: senderName,
                    isGroup: chat.isGroup,
                    chatName: chat.isGroup ? chat.name : 'Private',
                    content: msg.body,
                    isReply: !!quotedMsg,
                    isMentioned: msg.mentionedIds?.includes(this.whatsapp.client.info.wid._serialized) || false,
                    isReplyToBot: quotedMsg ? quotedMsg.fromMe : false
                };

                // Check if should process
                if (!this.processor.shouldProcess(inputData, this.config)) {
                    logger.debug('Message does not match processing rules', 'MESSAGE');
                    return;
                }

                logger.info(`From ${senderName}: "${inputData.content.substring(0, 40)}..."`, 'MESSAGE');

                // Add to history
                this.history.addMessage({
                    id: inputData.id,
                    timestamp: inputData.timestamp,
                    senderId: inputData.senderId,
                    senderName: inputData.senderName,
                    isGroup: inputData.isGroup,
                    chatName: inputData.chatName,
                    content: inputData.content,
                    isReply: inputData.isReply
                });

                // Process with Gemini
                const result = await this.processor.processMessage(inputData, this.config);

                if (result.action === 'reply' && result.content) {
                    logger.info(`Replying to ${senderName}`, 'MESSAGE');
                    await this.whatsapp.sendMessage(chat.id._serialized, result.content);

                    // Update history with AI response
                    const lastEntry = this.history.history[this.history.history.length - 1];
                    if (lastEntry) {
                        lastEntry.aiResponse = result.content;
                        this.history.save();
                    }
                } else if (result.action === 'operator') {
                    logger.warning(`Operator escalation: ${result.thought_process}`, 'MESSAGE');
                } else {
                    logger.debug(`Action: ${result.action}`, 'MESSAGE');
                }
            } catch (error) {
                logger.error('Message handling error: ' + error.message, 'MESSAGE');
            }
        });

        logger.info('Agent started successfully', 'MAIN');
        this.printStatus();
    }

    printStatus() {
        console.log('\n✅ Agent running...');
        console.log(`📍 Config: ${CONFIG_FILE}`);
        console.log(`📊 History: ${HISTORY_FILE}`);
        console.log(`📝 Logs: ${LOG_FILE}`);
        console.log(`\n⚙️ Active Config:`);
        console.log(`   - Group handling: ${this.config.messageHandling.groupHandling}`);
        console.log(`   - Gemini model: ${this.config.gemini.model}`);
        console.log(`   - History limit: ${this.config.storage.historyLimit}`);
        console.log(`\n💡 Tips:`);
        console.log(`   - Edit config: nano ${CONFIG_FILE}`);
        console.log(`   - View logs: tail -f ${LOG_FILE}`);
        console.log(`   - View history: cat ${HISTORY_FILE}`);
        console.log(`\nPress Ctrl+C to stop...\n`);
    }

    async killLingeringChrome() {
        const { execSync, spawnSync } = require('child_process');
        
        try {
            logger.debug('Starting aggressive browser cleanup', 'CLEANUP');
            
            // Multiple kill methods
            try {
                execSync('pkill -9 -f "chromium|google-chrome|chrome" || true', { stdio: 'ignore' });
                logger.debug('pkill executed', 'CLEANUP');
            } catch (e) {
                // Ignore
            }

            try {
                execSync('killall -9 chrome chromium 2>/dev/null || true', { stdio: 'ignore' });
                logger.debug('killall executed', 'CLEANUP');
            } catch (e) {
                // Ignore
            }

            try {
                spawnSync('bash', ['-c', 'ps aux | grep -i "chromium\\|google-chrome" | grep -v grep | awk \'{print $2}\' | xargs kill -9 2>/dev/null || true'], { stdio: 'ignore' });
                logger.debug('ps+grep executed', 'CLEANUP');
            } catch (e) {
                // Ignore
            }

            // Clean up session directory
            if (fs.existsSync(SESSION_DIR)) {
                try {
                    const files = fs.readdirSync(SESSION_DIR);
                    files.forEach(file => {
                        const filePath = path.join(SESSION_DIR, file);
                        const stat = fs.statSync(filePath);
                        
                        if (file.includes('LOCK') || file.includes('.lock') || file.includes('network') || file.includes('chrome')) {
                            try {
                                if (stat.isDirectory()) {
                                    try {
                                        execSync(`rm -rf "${filePath}"`, { stdio: 'ignore' });
                                    } catch (e) {
                                        // Manual deletion fallback
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
                                    logger.debug(`Removed directory: ${file}`, 'CLEANUP');
                                } else {
                                    fs.unlinkSync(filePath);
                                    logger.debug(`Removed file: ${file}`, 'CLEANUP');
                                }
                            } catch (e) {
                                logger.warning(`Could not remove ${file}: ${e.message}`, 'CLEANUP');
                            }
                        }
                    });
                } catch (e) {
                    logger.warning('Session dir cleanup error: ' + e.message, 'CLEANUP');
                }
            }

            await new Promise(r => setTimeout(r, 2500));
            logger.debug('Cleanup complete', 'CLEANUP');
        } catch (error) {
            logger.warning('Chrome cleanup error: ' + error.message, 'CLEANUP');
        }
    }

    async stop() {
        logger.info('Shutting down...', 'MAIN');
        if (this.whatsapp) {
            await this.whatsapp.logout();
        }
        logger.info('Agent stopped', 'MAIN');
        process.exit(0);
    }
}

// ==================== INITIALIZATION ====================

const logger = new Logger(LOG_FILE, 'info');

const agent = new TermuxAgent();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    agent.stop();
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down...');
    agent.stop();
});

// Auto-restart on error
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception: ' + error.message, 'MAIN');
    console.error(error);
    setTimeout(() => {
        logger.info('Restarting...', 'MAIN');
        process.exit(1); // Let pm2/cron restart it
    }, 5000);
});

// Start
agent.start().catch((error) => {
    logger.error('Startup failed: ' + error.message, 'MAIN');
    console.error('❌ Failed to start agent');
    console.error(error.message);
    process.exit(1);
});
