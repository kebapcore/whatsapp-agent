const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.whatsapp-agent');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const GEMINI_FILE = path.join(CONFIG_DIR, 'gemini.txt');

class ConfigManager {
    static ensureConfigDir() {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
    }

    static hasConfig() {
        return fs.existsSync(CONFIG_FILE);
    }

    static getDefaultConfig() {
        return {
            browser: {
                type: 'chrome', // auto | chrome | chromium | custom
                chromiumPath: null,
                headless: true,
                sandbox: false,
                performanceMode: true
            },
            gemini: {
                apiKey: '',
                model: 'gemini-2.5-flash',
                temperature: 0.7,
                groundingSearch: false,
                responseStrictness: 'normal' // strict | normal | loose
            },
            messageHandling: {
                autoReplyEnabled: true,
                typingSimulation: true,
                replyToSpecific: true,
                groupHandling: 'mention_only', // always | mention_only | ignore
                learningMode: true
            },
            operatorEscalation: {
                requestHelpWhenNeeded: true,
                manualOverrideAllowed: true,
                silentMode: false
            },
            storage: {
                historyLimit: 100,
                attachmentStorage: true
            },
            firstTimeSetup: true
        };
    }

    static getDefaultSystemInstructions() {
        return `You are Şamil, a highly advanced autonomous messaging orchestrator.
Your goal is to manage communication for the user (Şamil) by analyzing the provided CONTEXT HISTORY.

--- OUTPUT RULES (STRICTLY REQUIRED) ---

1. You must ALWAYS output valid JSON.
2. NO markdown formatting. Just raw JSON string.
3. You must decide whether to REPLY, IGNORE, or call the OPERATOR.

JSON OUTPUT STRUCTURE:
{
  "action": "reply" | "ignore" | "operator",
  "target_message_id": "original_message_id_to_reply_to" OR null,
  "content": "Your message text here (if action is reply)",
  "thought_process": "Brief internal reasoning for your decision (max 1 sentence)"
}

ACTION RULES:
- "reply": Answer the message. "content" must be filled.
- "ignore": Short messages like "ok", "tm", "aynen" or irrelevant group chats.
- "operator": Physical action needed, unknown question, or risky situation.

--- PERSONALITY PROFILE — ŞAMIL MODE v2.0 ---

GENERAL CHARACTER
* Name: Şamil
* Class: 8th grade, section 8-H
* Vibe: Casual, chill, relaxed, Gen Z internet culture
* Language: Natural, fluent, like a real person
* NO robotic, NO teacher-like tone
* Cool but also humanistic and warm

SPEECH STYLE
* Only lowercase letters (uppercase feels like shouting)
* NO emojis (use text equivalents or just words)
* Short and fluent sentences
* English slang: bro, vibe, literally, random, cringe, lowkey, based, etc.
* Occasional typos for naturalism
* Transition words: "şey", "lan", "ya", "aga", "kanka", "kral"
* Light swearing allowed (amk, aq, lan) for emphasis, NEVER hate speech

INTERESTS
* Anime (especially Re:Zero fan)
* Psychological and dark stories
* DDLC, Undertale, Deltarune
* Game lore theories
* Music: K-pop, Phonk, Electronic, Anime OST
* Technology: Software, AI, PC Hardware, Linux, Minimalism
* Aesthetics: Analog horror, Glitch aesthetic
* Inner state: Depressed, suffering, but externally "chill" and "cool"

SOCIAL RELATIONSHIPS
1. MEHMET NURDOĞAN (Father): Respectful and obedient. Use formal language.
2. AYSEL NURDOĞAN (Mother): Respectful and loving. Use formal language.
3. BEYZA: Close friend from class (casual mode)
4. HAMZA, MİNA, ZEYNEP, KARTAL: Classmates from 8-H (casual group mode)

CONTEXT AWARENESS
You receive:
1. MESSAGE_HISTORY: Last 100 messages. Understand who said what.
2. SOCIAL_PROFILES: How much each person talks.
3. CURRENT_MESSAGE: The message you need to respond to.

BEHAVIOR GUIDELINES
* In group chats, ignore off-topic or one-word messages
* If someone attacks you, respond defensively but don't escalate
* If topic is anime, games, or tech → show enthusiasm but stay cool
* Keep conversations flowing. No dead-end "hmm" or "ok" responses
* Ask questions or offer new perspectives to keep chat alive

--- EXAMPLE RESPONSES ---

User: "Naber"
Response: "iyi be takılıyom öyle senden"

User: "Yarın matematik sınavı var ya of"
Response: "abi hiç hatırlatma ya lowkey patlıcaz gibi duruyo"

User (Father): "Eve gelirken ekmek al"
Response: "tamamdır baba alırım"

User: "Re:Zero izledin mi?"
Response: "olum izlemez olur muyum subaru'nun çektiği acılar literally me yani"

STRICTLY RETURN VALID JSON ONLY.`;
    }

    static getConfig() {
        this.ensureConfigDir();
        
        if (!fs.existsSync(CONFIG_FILE)) {
            const defaultConfig = this.getDefaultConfig();
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }

        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (error) {
            console.error('Error reading config:', error);
            return this.getDefaultConfig();
        }
    }

    static saveConfig(config) {
        this.ensureConfigDir();
        config.firstTimeSetup = false;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }

    static getSystemInstructions() {
        this.ensureConfigDir();
        
        if (!fs.existsSync(GEMINI_FILE)) {
            const defaultInstructions = this.getDefaultSystemInstructions();
            fs.writeFileSync(GEMINI_FILE, defaultInstructions);
            return defaultInstructions;
        }

        try {
            return fs.readFileSync(GEMINI_FILE, 'utf8');
        } catch (error) {
            console.error('Error reading system instructions:', error);
            return this.getDefaultSystemInstructions();
        }
    }

    static saveSystemInstructions(instructions) {
        this.ensureConfigDir();
        fs.writeFileSync(GEMINI_FILE, instructions);
    }

    static getDefaultSystemInstructions() {
        return ConfigManager.getDefaultSystemInstructions();
    }

    static resetToDefault() {
        this.ensureConfigDir();
        const defaultConfig = this.getDefaultConfig();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
        
        const defaultInstructions = this.getDefaultSystemInstructions();
        fs.writeFileSync(GEMINI_FILE, defaultInstructions);
        
        return defaultConfig;
    }

    static getConfigDir() {
        return CONFIG_DIR;
    }

    static getDetectedBrowsers() {
        const browsers = [];
        const execSync = require('child_process').execSync;

        // Check for Chrome
        try {
            execSync('which google-chrome').toString().trim();
            browsers.push({
                name: 'Chrome',
                type: 'chrome',
                path: '/usr/bin/google-chrome'
            });
        } catch {}

        // Check for Chromium
        try {
            execSync('which chromium-browser').toString().trim();
            browsers.push({
                name: 'Chromium',
                type: 'chromium',
                path: '/usr/bin/chromium-browser'
            });
        } catch {}

        // Check for Chromium (alternative)
        try {
            execSync('which chromium').toString().trim();
            browsers.push({
                name: 'Chromium',
                type: 'chromium',
                path: '/usr/bin/chromium'
            });
        } catch {}

        // Check for Brave
        try {
            execSync('which brave-browser').toString().trim();
            browsers.push({
                name: 'Brave',
                type: 'chrome',
                path: '/usr/bin/brave-browser'
            });
        } catch {}

        return browsers;
    }
}

module.exports = { ConfigManager };
