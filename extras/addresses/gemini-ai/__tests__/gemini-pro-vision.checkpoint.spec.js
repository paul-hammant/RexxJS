/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for the CHECKPOINT-based Google Gemini Pro Vision ADDRESS Library
 */

// Load the address target handlers
require('../src/gemini-pro-vision.js');
const { handleGeminiCheckpoint } = require('../src/checkpoint-handler.js');

// Mock the global fetch function
global.fetch = jest.fn();

describe('Gemini Pro Vision CHECKPOINT ADDRESS Library', () => {

    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'test-gemini-api-key';
        global.fetch.mockReset();
    });

    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
    });

    // Test the address handler's ability to create a checkpoint request
    test('ADDRESS_GEMINI_PRO_VISION_HANDLER should create a valid checkpoint-request', () => {
        const handler = global.ADDRESS_GEMINI_PRO_VISION_HANDLER;
        const request = handler('chat_message', {
            sessionId: 1,
            message: 'What is this?',
            imageUrl: 'http://example.com/image.jpg'
        });

        expect(request).toEqual({
            type: 'checkpoint-request',
            operation: 'CHAT_MESSAGE',
            parameters: {
                sessionId: 1,
                message: 'What is this?',
                imageUrl: 'http://example.com/image.jpg',
                model: 'gemini-pro-vision'
            }
        });
    });

    // Test the full checkpoint flow with an image
    test('should handle a CHAT_MESSAGE with an image URL', async () => {
        const postResponse = jest.fn();

        // Mock fetch for the image URL
        global.fetch.mockResolvedValueOnce({
            ok: true,
            headers: new Map([['Content-Type', 'image/jpeg']]),
            arrayBuffer: async () => new ArrayBuffer(8) // dummy image data
        });

        // Mock fetch for the Gemini API call
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'This is a mock image response' }] } }]
            })
        });

        // Start a session first
        const startRequest = {
            requestId: 'req_start_vision',
            checkpoint: { operation: 'START_SESSION', parameters: {} }
        };
        await handleGeminiCheckpoint(startRequest, jest.fn());
        const sessionId = 1; // Assume session ID is 1

        // Now, send the chat message with image
        const chatRequest = {
            requestId: 'req_chat_vision',
            checkpoint: {
                operation: 'CHAT_MESSAGE',
                parameters: {
                    sessionId,
                    message: 'Describe this image',
                    imageUrl: 'http://example.com/image.jpg',
                    model: 'gemini-pro-vision'
                }
            }
        };

        await handleGeminiCheckpoint(chatRequest, postResponse);

        // Check that fetch was called for the image
        expect(global.fetch).toHaveBeenCalledWith('http://example.com/image.jpg');

        // Check that fetch was called for the Gemini API
        expect(global.fetch).toHaveBeenCalledWith(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
            expect.any(Object)
        );

        const fetchBody = JSON.parse(global.fetch.mock.calls[1][1].body);
        expect(fetchBody.contents[0].role).toBe('user');
        expect(fetchBody.contents[0].parts[0].text).toBe('Describe this image');
        expect(fetchBody.contents[0].parts[1].inline_data.mime_type).toBe('image/jpeg');
        expect(fetchBody.contents[0].parts[1].inline_data.data).toBeDefined();

        expect(postResponse).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'req_chat_vision',
            status: 'done',
            result: expect.objectContaining({
                success: true,
                response: 'This is a mock image response'
            })
        }));
    });
});
