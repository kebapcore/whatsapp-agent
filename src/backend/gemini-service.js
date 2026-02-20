const axios = require('axios');

class GeminiService {
    constructor(apiKey, model = 'gemini-2.5-flash', systemInstructions = '') {
        this.apiKey = apiKey;
        this.model = model;
        this.systemInstructions = systemInstructions;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    updateSystemInstructions(instructions) {
        this.systemInstructions = instructions;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    setModel(model) {
        this.model = model;
    }

    async generateResponse(context, config = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not set');
        }

        const defaultConfig = {
            temperature: 0.7,
            groundingSearch: false,
            responseStrictness: 'normal',
            ...config
        };

        try {
            const payload = {
                system_instruction: {
                    parts: [
                        {
                            text: this.systemInstructions
                        }
                    ]
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: JSON.stringify({
                                    timestamp: new Date().toLocaleString('tr-TR'),
                                    context: context,
                                    response_format: 'json'
                                })
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: defaultConfig.temperature,
                    top_p: 0.95,
                    top_k: 40
                },
                safety_settings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ]
            };

            // Add grounding with Google Search if enabled
            if (defaultConfig.groundingSearch) {
                payload.tools = [
                    {
                        googleSearch: {}
                    }
                ];
            }

            // Debug: Check API key
            if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE' || this.apiKey.length < 10) {
                console.error('[GEMINI] ❌ Invalid API key detected:', this.apiKey ? `[${this.apiKey.substring(0, 5)}...]` : 'EMPTY');
                throw new Error('Invalid or unconfigured Gemini API key');
            }

            // Debug: Log request (sanitized)
            console.log('[GEMINI] Sending request to:', `${this.baseURL}/${this.model}:generateContent`);
            console.log('[GEMINI] Payload size:', JSON.stringify(payload).length, 'bytes');

            const response = await axios.post(
                `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`,
                payload,
                {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.candidates && response.data.candidates.length > 0) {
                const content = response.data.candidates[0].content;
                if (content && content.parts && content.parts.length > 0) {
                    const text = content.parts[0].text;

                    try {
                        return JSON.parse(text);
                    } catch (parseError) {
                        console.error('Failed to parse Gemini response as JSON:', text);
                        return {
                            action: 'operator',
                            target_message_id: null,
                            content: text,
                            thought_process: 'Response format error - operator review needed'
                        };
                    }
                }
            }

            throw new Error('No valid response from Gemini API');
        } catch (error) {
            // Detailed error logging
            console.error('[GEMINI] ❌ API Error:', error.message);
            
            if (error.response) {
                console.error('[GEMINI] Status:', error.response.status);
                console.error('[GEMINI] Response body:', JSON.stringify(error.response.data, null, 2));
                
                if (error.response.status === 400) {
                    console.error('[GEMINI] 400 Bad Request - Check:');
                    console.error('  1. API key is valid');
                    console.error('  2. Model name is correct');
                    console.error('  3. Payload format matches Gemini API specs');
                    throw new Error(`Gemini API error (400): ${error.response.data?.error?.message || 'Invalid request'}`);
                } else if (error.response.status === 401) {
                    console.error('[GEMINI] 401 Unauthorized - Invalid API key');
                    throw new Error('Invalid Gemini API key');
                } else if (error.response.status === 429) {
                    console.error('[GEMINI] 429 Rate Limited');
                    throw new Error('Gemini API rate limit exceeded');
                }
            } else if (error.code === 'ECONNABORTED') {
                console.error('[GEMINI] Request timeout');
                throw new Error('Gemini API request timeout');
            }

            throw new Error(`Gemini API error: ${error.message}`);
        }
    }

    async testConnection() {
        try {
            await this.generateResponse(
                {
                    current_message: {
                        content: 'test',
                        sender_name: 'test',
                        is_group: false
                    }
                },
                { temperature: 0.5 }
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isConfigured() {
        return Boolean(this.apiKey && this.systemInstructions);
    }
}

module.exports = { GeminiService };
