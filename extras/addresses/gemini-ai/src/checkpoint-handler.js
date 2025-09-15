/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Google Gemini API Checkpoint Handler
 *
 * This module provides the core logic for handling CHECKPOINT requests for the Gemini API.
 * It is designed to be used by a controlling environment (e.g., a browser-based runner)
 * that listens for `checkpoint-request` messages from a REXX interpreter.
 *
 * It manages chat sessions and makes the actual API calls to Google.
 */

const chatSessions = new Map();
let sessionCounter = 0;

// This is the main function that the host environment will call.
async function handleGeminiCheckpoint(request, postResponse) {
    const { requestId, checkpoint } = request;
    const { operation, parameters } = checkpoint;

    try {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable not set.');
        }

        let result;
        switch (operation.toUpperCase()) {
            case 'START_SESSION':
                result = handleStartSession(parameters.system);
                break;
            case 'CHAT_MESSAGE':
                result = await handleChatMessage(parameters, apiKey);
                break;
            case 'END_SESSION':
                result = handleEndSession(parameters.sessionId);
                break;
            default:
                throw new Error(`Unknown Gemini operation: ${operation}`);
        }

        postResponse({
            type: 'checkpoint-response',
            requestId,
            status: 'done',
            result,
            metadata: { collaborator: 'gemini-ai' }
        });

    } catch (error) {
        postResponse({
            type: 'checkpoint-response',
            requestId,
            status: 'error',
            error: error.message
        });
    }
}

function getApiKey() {
    // In a real environment, this might come from a config store or environment variables.
    if (typeof process !== 'undefined' && process.env) return process.env.GEMINI_API_KEY;
    if (typeof window !== 'undefined') return window.GEMINI_API_KEY;
    return null;
}

function handleStartSession(systemPrompt) {
    sessionCounter++;
    const sessionId = sessionCounter;
    const session = {
        id: sessionId,
        contents: [],
        created: new Date().toISOString(),
        system: systemPrompt || "You are a helpful assistant."
    };
    chatSessions.set(sessionId, session);

    return {
        operation: 'START_SESSION',
        success: true,
        sessionId: sessionId,
        system: session.system,
        message: `Started chat session ${sessionId}`
    };
}

async function handleChatMessage(params, apiKey) {
    const { sessionId, message, imageUrl, model } = params;
    let session;

    if (sessionId && chatSessions.has(sessionId)) {
        session = chatSessions.get(sessionId);
    } else {
        const newSessionResult = handleStartSession(params.system);
        session = chatSessions.get(newSessionResult.sessionId);
    }

    const userParts = [{ text: message }];
    if (imageUrl) {
        // Image handling logic adapted from gemini-pro-vision.js
        const { mimeType, base64Data } = await getImageData(imageUrl);
        userParts.push({
            inline_data: { mime_type: mimeType, data: base64Data }
        });
    }

    session.contents.push({ role: 'user', parts: userParts });

    try {
        const apiResponse = await callGeminiAPI(session, apiKey, model);
        session.contents.push({ role: 'model', parts: [{ text: apiResponse.text }] });

        return {
            operation: 'CHAT_MESSAGE',
            success: true,
            sessionId: session.id,
            userMessage: message,
            response: apiResponse.text,
            tokensUsed: apiResponse.usage || {},
            messageCount: session.contents.length
        };
    } catch (error) {
        // If API call fails, remove the user message we just added
        session.contents.pop();
        throw error;
    }
}

function handleEndSession(sessionId) {
    if (!sessionId || !chatSessions.has(sessionId)) {
        throw new Error(`Session ${sessionId} not found`);
    }
    const session = chatSessions.get(sessionId);
    const messageCount = session.contents.length;
    chatSessions.delete(sessionId);

    return {
        operation: 'END_SESSION',
        success: true,
        sessionId: sessionId,
        messageCount: messageCount,
        message: `Chat session ${sessionId} closed`
    };
}

async function callGeminiAPI(session, apiKey, model = 'gemini-pro') {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const requestBody = {
        contents: session.contents,
        systemInstruction: {
            parts: [{ text: session.system }]
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
        const errorDetails = data.error ? JSON.stringify(data.error) : await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorDetails}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'undefined') {
        if (data.promptFeedback?.blockReason) {
            throw new Error(`Response blocked due to: ${data.promptFeedback.blockReason}`);
        }
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error('Response blocked due to safety settings.');
        }
        throw new Error('Could not parse text from Gemini response.');
    }

    return {
        text: text,
        usage: data.usageMetadata || {}
    };
}

async function getImageData(imageUrl) {
    const isBase64 = imageUrl.startsWith('data:image');
    if (isBase64) {
        const parts = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
        if (!parts) throw new Error('Invalid base64 data URI format.');
        return { mimeType: parts[1], base64Data: parts[2] };
    }

    // Assume it's a URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
    const mimeType = imageResponse.headers.get('Content-Type') || 'image/jpeg';
    const buffer = await imageResponse.arrayBuffer();

    let base64Data;
    if (typeof btoa === 'function') { // Browser
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        base64Data = btoa(binary);
    } else { // Node.js
        base64Data = Buffer.from(buffer).toString('base64');
    }

    return { mimeType, base64Data };
}

module.exports = { handleGeminiCheckpoint };
