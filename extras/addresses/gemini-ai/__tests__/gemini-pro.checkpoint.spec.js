/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for the CHECKPOINT-based Google Gemini Pro ADDRESS Library
 */

// Load the address target handlers
require('../src/gemini-pro.js');
const { handleGeminiCheckpoint } = require('../src/checkpoint-handler.js');

// Mock the global fetch function
global.fetch = jest.fn();

describe('Gemini Pro CHECKPOINT ADDRESS Library', () => {
    let originalApiKey;

    beforeEach(() => {
        // Mock environment variable
        originalApiKey = process.env.GEMINI_API_KEY;
        process.env.GEMINI_API_KEY = 'test-gemini-api-key';

        // Reset fetch mock before each test
        global.fetch.mockReset();
    });

    afterEach(() => {
        // Restore environment
        if (originalApiKey) {
            process.env.GEMINI_API_KEY = originalApiKey;
        } else {
            delete process.env.GEMINI_API_KEY;
        }
    });

    // Test the address handler's ability to create a checkpoint request
    test('ADDRESS_GEMINI_PRO_HANDLER should create a valid checkpoint-request', () => {
        const handler = global.ADDRESS_GEMINI_PRO_HANDLER;
        const request = handler('chat_message', { sessionId: 1, message: 'Hello' });

        expect(request).toEqual({
            type: 'checkpoint-request',
            operation: 'CHAT_MESSAGE',
            parameters: {
                sessionId: 1,
                message: 'Hello',
                model: 'gemini-pro'
            }
        });
    });

    // Test the full checkpoint flow
    test('should handle a full session via checkpoint flow: START, CHAT, END', async () => {
        const postResponse = jest.fn();

        // 1. Start Session
        let startRequest = {
            requestId: 'req1',
            checkpoint: {
                operation: 'START_SESSION',
                parameters: { system: 'Test bot' }
            }
        };

        await handleGeminiCheckpoint(startRequest, postResponse);

        expect(postResponse).toHaveBeenCalledWith(expect.objectContaining({
            status: 'done',
            result: expect.objectContaining({
                operation: 'START_SESSION',
                success: true
            })
        }));

        const sessionId = postResponse.mock.calls[0][0].result.sessionId;
        expect(sessionId).toBeGreaterThan(0);

        // 2. Send a message
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'Mock response' }] } }],
                usageMetadata: { totalTokenCount: 10 }
            })
        });

        let chatRequest = {
            requestId: 'req2',
            checkpoint: {
                operation: 'CHAT_MESSAGE',
                parameters: { sessionId, message: 'Hi there', model: 'gemini-pro' }
            }
        };

        await handleGeminiCheckpoint(chatRequest, postResponse);

        expect(global.fetch).toHaveBeenCalledWith(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            expect.any(Object)
        );

        const fetchBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(fetchBody.contents[0].parts[0].text).toBe('Hi there');
        expect(fetchBody.systemInstruction.parts[0].text).toBe('Test bot');

        expect(postResponse).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'req2',
            status: 'done',
            result: expect.objectContaining({
                operation: 'CHAT_MESSAGE',
                success: true,
                response: 'Mock response'
            })
        }));

        // 3. End Session
        let endRequest = {
            requestId: 'req3',
            checkpoint: {
                operation: 'END_SESSION',
                parameters: { sessionId }
            }
        };

        await handleGeminiCheckpoint(endRequest, postResponse);

        expect(postResponse).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'req3',
            status: 'done',
            result: expect.objectContaining({
                operation: 'END_SESSION',
                success: true,
                sessionId: sessionId
            })
        }));
    });

    test('should handle API error during chat', async () => {
        const postResponse = jest.fn();

        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Internal Server Error' } })
        });

        let chatRequest = {
            requestId: 'req_error',
            checkpoint: {
                operation: 'CHAT_MESSAGE',
                parameters: { sessionId: 1, message: 'trigger error', model: 'gemini-pro' }
            }
        };
        // Need to start a session first for the chat to work
        await handleGeminiCheckpoint({
            requestId: 'req_start_for_error',
            checkpoint: { operation: 'START_SESSION', parameters: {} }
        }, jest.fn());


        await handleGeminiCheckpoint(chatRequest, postResponse);

        expect(postResponse).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'req_error',
            status: 'error',
            error: expect.stringContaining('Gemini API error 500')
        }));
    });
});
