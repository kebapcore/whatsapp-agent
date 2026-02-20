const fs = require('fs');
const path = require('path');

const HISTORY_FILE = 'history.json';
const PROFILES_FILE = 'person_profiles.json';
const MAX_HISTORY = 100;

// Initialize files if they don't exist
function initStorage() {
    if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
    if (!fs.existsSync(PROFILES_FILE)) fs.writeFileSync(PROFILES_FILE, JSON.stringify({}));
}

// Load History
function getHistory() {
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
}

// Load Profiles
function getProfiles() {
    try {
        const data = fs.readFileSync(PROFILES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return {}; }
}

// Add Message to History (Rolling Window)
function addToHistory(messageObj) {
    const history = getHistory();
    
    // Add new message
    history.push(messageObj);

    // Enforce 100 message limit
    while (history.length > MAX_HISTORY) {
        history.shift(); // Remove oldest
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Update Person Profile (Basic Learning)
function updateProfile(contactId, name, isGroup, textContent) {
    const profiles = getProfiles();
    
    if (!profiles[contactId]) {
        profiles[contactId] = {
            name: name,
            first_seen: new Date().toISOString(),
            message_count: 0,
            avg_length: 0,
            is_group: isGroup
        };
    }

    // Update stats
    const p = profiles[contactId];
    p.last_seen = new Date().toISOString();
    p.message_count++;
    
    // Simple moving average for message length (to detect short/long talkers)
    const currentLen = textContent.length;
    p.avg_length = Math.round(((p.avg_length * (p.message_count - 1)) + currentLen) / p.message_count);

    // Update name if it changed/improved
    if (name && name !== p.name) p.name = name;

    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

// Format History for Gemini Context
function buildContextString() {
    const history = getHistory();
    if (history.length === 0) return "[NO HISTORY YET]";

    return history.map(msg => {
        const type = msg.is_group ? `[GROUP: ${msg.chat_name}]` : `[PRIVATE]`;
        const sender = `[${msg.sender_name}]`;
        const replyInfo = msg.is_reply ? `(Replying to: "${msg.reply_context?.text?.substring(0, 20)}...")` : "";
        return `${msg.timestamp} ${type} ${sender} ${replyInfo}: ${msg.content} (ID: ${msg.message_id})`;
    }).join("\n");
}

module.exports = {
    initStorage,
    addToHistory,
    updateProfile,
    getProfiles,
    buildContextString
};