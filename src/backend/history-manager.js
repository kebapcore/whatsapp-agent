const fs = require('fs');
const path = require('path');
const os = require('os');

const STORAGE_DIR = path.join(os.homedir(), '.whatsapp-agent');
const HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');

class HistoryManager {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.ensureStorageDir();
        this.history = this.loadHistory();
    }

    ensureStorageDir() {
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }
    }

    loadHistory() {
        if (!fs.existsSync(HISTORY_FILE)) {
            return [];
        }

        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addMessage(message) {
        const entry = {
            messageId: message.messageId,
            timestamp: message.timestamp || new Date().toISOString(),
            senderId: message.senderId,
            senderName: message.senderName,
            isGroup: message.isGroup,
            chatName: message.chatName || 'Private',
            content: message.content,
            isReply: message.isReply || false,
            replyContext: message.replyContext || null,
            aiResponse: message.aiResponse || null,
            attachments: message.attachments || []
        };

        this.history.push(entry);

        // Enforce size limit (FIFO rotation)
        while (this.history.length > this.maxSize) {
            this.history.shift();
        }

        this.saveHistory();
        return entry;
    }

    getRecent(count = 50) {
        return this.history.slice(Math.max(0, this.history.length - count));
    }

    getAll() {
        return this.history;
    }

    getByChat(chatName) {
        return this.history.filter(msg => msg.chatName === chatName);
    }

    buildContextString() {
        if (this.history.length === 0) {
            return '[NO HISTORY YET]';
        }

        return this.history
            .map(msg => {
                const type = msg.isGroup ? `[GROUP: ${msg.chatName}]` : '[PRIVATE]';
                const sender = `[${msg.senderName}]`;
                const replyInfo = msg.isReply
                    ? `(Replying to: "${msg.replyContext?.text?.substring(0, 20) || 'Unknown'}"...)`
                    : '';
                return `${msg.timestamp} ${type} ${sender} ${replyInfo}: ${msg.content}`;
            })
            .join('\n');
    }

    clear() {
        this.history = [];
        this.saveHistory();
    }

    getStatistics() {
        const stats = {
            totalMessages: this.history.length,
            senderStats: {},
            groupStats: {},
            averageMessageLength: 0,
            timeSpan: null
        };

        let totalLength = 0;

        for (const msg of this.history) {
            // Sender statistics
            if (!stats.senderStats[msg.senderName]) {
                stats.senderStats[msg.senderName] = {
                    count: 0,
                    totalLength: 0,
                    averageLength: 0
                };
            }
            stats.senderStats[msg.senderName].count++;
            stats.senderStats[msg.senderName].totalLength += msg.content.length;

            // Group statistics
            if (!stats.groupStats[msg.chatName]) {
                stats.groupStats[msg.chatName] = {
                    count: 0,
                    isGroup: msg.isGroup
                };
            }
            stats.groupStats[msg.chatName].count++;

            // Message length
            totalLength += msg.content.length;
        }

        // Calculate averages
        for (const sender in stats.senderStats) {
            const senderData = stats.senderStats[sender];
            senderData.averageLength = Math.round(senderData.totalLength / senderData.count);
        }

        if (this.history.length > 0) {
            stats.averageMessageLength = Math.round(totalLength / this.history.length);
            stats.timeSpan = {
                start: this.history[0].timestamp,
                end: this.history[this.history.length - 1].timestamp
            };
        }

        return stats;
    }

    exportToJSON() {
        return JSON.stringify(this.history, null, 2);
    }

    exportToCSV() {
        if (this.history.length === 0) {
            return 'No history';
        }

        const headers = [
            'Timestamp',
            'Sender',
            'Chat',
            'Type',
            'Message',
            'AI Response'
        ];

        const rows = this.history.map(msg =>
            [
                msg.timestamp,
                msg.senderName,
                msg.chatName,
                msg.isGroup ? 'Group' : 'Private',
                `"${msg.content.replace(/"/g, '""')}"`,
                `"${(msg.aiResponse || '').replace(/"/g, '""')}"`
            ].join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }
}

module.exports = { HistoryManager };
