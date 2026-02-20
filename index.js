require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { execSync } = require('child_process');
const memory = require('./memory');

// -----------------------------------------------------------
// 🔥 REPLIT AGRESİF TEMİZLİK (DO NOT REMOVE)
// -----------------------------------------------------------
console.log('🔄 Replit ortamı için Chromium temizliği başlatılıyor...');

try {
    const commands = [
        'pkill -9 -f chromium',
        'pkill -9 -f chrome',
        'rm -rf .wwebjs_auth/session/Default/Singleton*',
        'rm -rf /tmp/puppeteer_dev_profile*',
        'rm -rf /tmp/chrome-user-data*'
    ];

    commands.forEach(cmd => {
        try {
            execSync(cmd + ' 2>/dev/null || true');
        } catch (e) {}
    });
    console.log('✅ Hafıza ve kilit dosyaları temizlendi.');
} catch (err) {
    console.log('⚠️ Temizlik uyarısı:', err.message);
}
// -----------------------------------------------------------

memory.initStorage();
const systemInstruction = fs.readFileSync('gemini.txt', 'utf8');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--user-data-dir=/tmp/puppeteer_db'
        ],
        headless: true
    }
});

// QR Kodu
client.on('qr', qr => {
    console.log('📱 Lütfen QR kodu taratın:');
    qrcode.generate(qr, { small: true });
});

// Hazır
client.on('ready', () => {
    console.log('-------------------------------------------');
    console.log('🚀 ŞAMİL V2.0 ÇALIŞIYOR (REPLIT MODE)');
    console.log('-------------------------------------------');
});

// --- GEMINI BAĞLANTISI ---
async function handleGeminiRequest(currentMsgData, attachments = []) {
    const historyContext = memory.buildContextString();
    const socialProfiles = memory.getProfiles();

    const fullPrompt = {
        system_context: { time: new Date().toLocaleString('tr-TR') },
        social_profiles: socialProfiles,
        message_history: historyContext,
        current_message: currentMsgData
    };

    try {
        const response = await fetch(`${process.env.AI_INTEGRATIONS_GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_GEMINI_API_KEY}`
            },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: JSON.stringify(fullPrompt) }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.trim();
        return JSON.parse(text);
    } catch (err) {
        console.log("Gemini Hata:", err.message);
        return null;
    }
}

// --- MESAJ OLAYI ---
client.on('message', async msg => {
    if (msg.fromMe) return;

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    let quotedMsg = null;
    if (msg.hasQuotedMsg) quotedMsg = await msg.getQuotedMessage();

    const senderName = contact.pushname || contact.name || contact.number;

    const inputData = {
        message_id: msg.id._serialized,
        timestamp: new Date().toLocaleString(),
        is_group: chat.isGroup,
        chat_name: chat.isGroup ? chat.name : "Private",
        sender_id: contact.id._serialized,
        sender_name: senderName,
        content: msg.body,
        is_reply: !!quotedMsg,
        reply_context: quotedMsg ? { sender: quotedMsg._data?.notifyName || "Unknown", text: quotedMsg.body } : null
    };

    // Hafıza kaydı
    memory.addToHistory(inputData);
    memory.updateProfile(contact.id._serialized, senderName, chat.isGroup, msg.body);

    // Yanıt verme kuralı (Özel mesaj veya Bot etiketlenmişse)
    const isMentioned = msg.mentionedIds.includes(client.info.wid._serialized);
    const isReplyToBot = quotedMsg && quotedMsg.fromMe;
    
    if (!chat.isGroup || isMentioned || isReplyToBot) {
        chat.sendStateTyping();
        let output = await handleGeminiRequest(inputData);
        await chat.clearState();

        if (output && output.action === 'reply') {
            if (output.target_message_id === inputData.message_id) {
                await msg.reply(output.content);
            } else {
                await client.sendMessage(msg.from, output.content);
            }
        }
    }
});

client.initialize();