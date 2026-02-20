class MessageProcessor {
    constructor(geminiService, historyManager, onLog) {
        this.geminiService = geminiService;
        this.historyManager = historyManager;
        this.onLog = onLog || (() => {});
        this.operatorResponse = null;
        this.waitingForOperator = false;
    }

    setOperatorResponse(response) {
        this.operatorResponse = response;
        this.waitingForOperator = false;
    }

    async processMessage(inputData, config) {
        try {
            this.log(`Processing message from ${inputData.sender_name}`, 'info', 'processor');

            // Extract message context
            const context = {
                message_history: this.historyManager.buildContextString(),
                social_profiles: this.extractProfiles(),
                current_message: inputData
            };

            // Call Gemini
            this.log('Requesting Gemini response...', 'debug', 'processor');

            const geminiResponse = await this.geminiService.generateResponse(
                context,
                {
                    temperature: config.gemini.temperature,
                    groundingSearch: config.gemini.groundingSearch,
                    responseStrictness: config.gemini.responseStrictness
                }
            );

            this.log(`Gemini response: ${geminiResponse.action}`, 'debug', 'processor');

            // Handle response
            if (geminiResponse.action === 'operator') {
                this.log(
                    `Operator escalation: ${geminiResponse.thought_process}`,
                    'warning',
                    'operator'
                );
                this.waitingForOperator = true;
                return {
                    action: 'operator',
                    message: geminiResponse.content || geminiResponse.thought_process,
                    originalData: inputData
                };
            }

            // Record in history (normalize keys to HistoryManager format)
            geminiResponse.aiResponse = geminiResponse.content || null;
            try {
                this.historyManager.addMessage({
                    messageId: inputData.message_id || inputData.messageId,
                    timestamp: inputData.timestamp || new Date().toISOString(),
                    senderId: inputData.sender_id || inputData.senderId,
                    senderName: inputData.sender_name || inputData.senderName,
                    isGroup: inputData.is_group || inputData.isGroup,
                    chatName: inputData.chat_name || inputData.chatName || 'Private',
                    content: inputData.content || inputData.body || '',
                    isReply: inputData.is_reply || inputData.isReply || false,
                    replyContext: inputData.reply_context || inputData.replyContext || null,
                    aiResponse: geminiResponse.aiResponse,
                    attachments: inputData.attachments || []
                });
            } catch (e) {
                this.log(`Failed to record in history: ${e.message}`, 'warning', 'processor');
            }

            return geminiResponse;
        } catch (error) {
            this.log(`Processing error: ${error.message}`, 'error', 'processor');
            return {
                action: 'operator',
                content: null,
                thought_process: `Error: ${error.message}`
            };
        }
    }

    extractProfiles() {
        const stats = this.historyManager.getStatistics();
        const profiles = {};

        for (const [senderName, data] of Object.entries(stats.senderStats)) {
            profiles[senderName] = {
                message_count: data.count,
                average_message_length: data.averageLength
            };
        }

        return profiles;
    }

    shouldProcess(inputData, config) {
        // Private messages: always process
        if (!inputData.is_group) {
            return true;
        }

        // Group settings
        const groupHandling = config.messageHandling.groupHandling;

        if (groupHandling === 'always') {
            return true;
        }

        if (groupHandling === 'ignore') {
            return false;
        }

        // 'mention_only' - check if bot is mentioned or replied to
        return inputData.isMentioned || inputData.isReplyToBot;
    }

    log(message, level = 'info', source = 'processor') {
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

module.exports = { MessageProcessor };
