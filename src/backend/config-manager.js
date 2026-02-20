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
