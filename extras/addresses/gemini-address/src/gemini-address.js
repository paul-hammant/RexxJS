/*!
 * rexxjs/gemini-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=GEMINI_ADDRESS_META
 */
/**
 * Gemini API ADDRESS Library - Provides AI chat operations via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Supports both text and vision (image) capabilities in one module.
 *
 * Usage (text):
 *   REQUIRE "gemini-address" AS GEMINI
 *   ADDRESS GEMINI
 *   <<PROMPT
 *   model=gemini-2.5-flash-lite
 *   prompt=What is the meaning of life according to Douglas Adams? Answer in one sentence.
 *   PROMPT
 *
 * Usage (vision with image):
 *   <<ANALYZE
 *   model=gemini-2.5-flash-lite
 *   prompt=What do you see in this image?
 *   image=https://example.com/photo.jpg
 *   ANALYZE
 *
 *   OR with base64 data URI:
 *   image=data:image/png;base64,iVBORw0KG...
 *
 * Environment Variable Required:
 *   GEMINI_API_KEY - Your Google Gemini API key
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
// Interpolation is provided via sourceContext.interpolation parameter

// Active conversation state (single conversation at a time)
let activeConversation = null;  // { contents: [], systemInstruction: string }

// Consolidated metadata provider function
function GEMINI_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/gemini-address",
    type: "address-handler",
    dependencies: {},
    envVars: ["GEMINI_API_KEY"],
    libraryMetadata: {
      interpreterHandlesInterpolation: true
    },
    name: 'Gemini AI Chat Service',
    version: '1.0.0',
    description: 'Google Gemini API integration via ADDRESS interface (text + vision)',
    provides: {
      addressTarget: 'gemini',
      handlerFunction: 'ADDRESS_GEMINI_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    requirements: {
      environment: 'nodejs-or-browser',
      modules: ['fetch'],
      apiKey: 'GEMINI_API_KEY'
    },
    detectionFunction: 'GEMINI_ADDRESS_MAIN'
  };
}

// Primary detection function with ADDRESS target metadata
function GEMINI_ADDRESS_MAIN() {
  return GEMINI_ADDRESS_META();
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_GEMINI_HANDLER(commandOrMethod, params, sourceContext) {
  // Apply RexxJS variable interpolation
  const variablePool = params || {};
  const interpolate = sourceContext && sourceContext.interpolation ? sourceContext.interpolation.interpolate : (str => str);
  const interpolatedCommand = typeof commandOrMethod === 'string'
    ? interpolate(commandOrMethod, variablePool)
    : commandOrMethod;

  // Handle STATUS command (no API key required, never throws exceptions)
  if (typeof interpolatedCommand === 'string' &&
      interpolatedCommand.trim().toUpperCase() === 'STATUS') {
    const apiKey = getApiKey();
    const messageCount = activeConversation ? activeConversation.contents.length : 0;
    let statusMessage;

    if (apiKey) {
      statusMessage = `Gemini ADDRESS ready (${messageCount} messages in conversation)`;
    } else {
      statusMessage = `Gemini ADDRESS ready (${messageCount} messages in conversation) - GEMINI_API_KEY not set`;
    }

    return formatGeminiResultForREXX({
      operation: 'STATUS',
      success: true,
      apiKeyConfigured: !!apiKey,
      hasActiveConversation: !!activeConversation,
      messageCount: messageCount,
      message: statusMessage
    });
  }

  try {

    // Check API key availability for operations that need it
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Gemini ADDRESS library requires GEMINI_API_KEY environment variable');
    }

    // Handle heredoc/multi-line key=value format (ADDRESS GEMINI <<LABEL)
    // Detect heredoc by checking for key=value pattern (single or multi-line)
    if (typeof interpolatedCommand === 'string' &&
        /^\s*\w+=/.test(interpolatedCommand)) {
      const parsedParams = parseKeyValueHeredoc(interpolatedCommand);
      const result = await handleGeminiHeredoc(parsedParams, apiKey);
      return formatGeminiResultForREXX(result);
    }

    // Handle CLOSE_CHAT command
    if (typeof interpolatedCommand === 'string' &&
        interpolatedCommand.trim().toUpperCase() === 'CLOSE_CHAT') {
      const messageCount = activeConversation ? activeConversation.contents.length : 0;
      activeConversation = null;
      return formatGeminiResultForREXX({
        operation: 'CLOSE_CHAT',
        success: true,
        messageCount: messageCount,
        message: `Conversation closed (${messageCount} messages)`
      });
    }

    // Only heredoc format is supported
    throw new Error('Gemini ADDRESS only supports heredoc format (<<LABEL...LABEL), CLOSE_CHAT, or STATUS command');

  } catch (error) {
    const formattedError = formatGeminiErrorForREXX(error);
    throw new Error(error.message);
  }
}

// Parse heredoc key=value format
function parseKeyValueHeredoc(multilineText) {
  const params = {};
  const lines = multilineText.split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this is a key=value line
    const kvMatch = trimmed.match(/^(\w+)=(.*)$/);
    if (kvMatch) {
      // Save previous key/value if exists
      if (currentKey) {
        params[currentKey] = currentValue.join('\n').trim();
      }
      // Start new key/value
      currentKey = kvMatch[1];
      currentValue = [kvMatch[2]];
    } else if (currentKey) {
      // Continuation of previous value
      currentValue.push(trimmed);
    }
  }

  // Save last key/value
  if (currentKey) {
    params[currentKey] = currentValue.join('\n').trim();
  }

  return params;
}

// Handle heredoc-style Gemini request
async function handleGeminiHeredoc(params, apiKey) {
  const model = params.model || 'gemini-2.5-flash-lite';
  const prompt = params.prompt || params.message || '';
  const system = params.system || 'You are a helpful AI assistant.';
  const temperature = params.temperature ? parseFloat(params.temperature) : undefined;
  const maxTokens = params.max_tokens ? parseInt(params.max_tokens) : undefined;
  const imageUrl = params.image || params.imageUrl;

  if (!prompt) {
    throw new Error('Heredoc format requires "prompt=" parameter');
  }

  // If no active conversation, start one with the system instruction
  if (!activeConversation) {
    activeConversation = {
      contents: [],
      systemInstruction: system
    };
  }

  // Build user message parts (text + optional image)
  const userParts = [{ text: prompt }];

  // Add image if provided
  if (imageUrl) {
    const { mimeType, base64Data } = await getImageData(imageUrl);
    userParts.push({
      inline_data: { mime_type: mimeType, data: base64Data }
    });
  }

  // Add user message to conversation
  activeConversation.contents.push({
    role: 'user',
    parts: userParts
  });

  try {
    // Make API call with full conversation history
    const response = await callGeminiAPI({
      model: model,
      contents: activeConversation.contents,
      systemInstruction: activeConversation.systemInstruction,
      temperature: temperature,
      maxTokens: maxTokens
    }, apiKey);

    // Add model response to conversation
    activeConversation.contents.push({
      role: 'model',
      parts: [{ text: response.text }]
    });

    return {
      success: true,
      response: response.text,
      model: model,
      tokensUsed: response.usageMetadata ? {
        input: response.usageMetadata.promptTokenCount,
        output: response.usageMetadata.candidatesTokenCount,
        total: response.usageMetadata.totalTokenCount
      } : undefined
    };
  } catch (error) {
    throw error;
  }
}

// Get API key from environment or configuration
function getApiKey() {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Try global configuration
  if (typeof global !== 'undefined' && global.GEMINI_API_KEY) {
    return global.GEMINI_API_KEY;
  }

  // Try window configuration (browser)
  if (typeof window !== 'undefined' && window.GEMINI_API_KEY) {
    return window.GEMINI_API_KEY;
  }

  return null;
}

// Make HTTP request to Gemini API
async function callGeminiAPI(session, apiKey) {
  const requestBody = {
    contents: session.contents,
    systemInstruction: {
      parts: [{ text: session.systemInstruction }]
    }
  };

  // Add optional parameters if provided
  if (session.temperature !== undefined) {
    requestBody.generationConfig = requestBody.generationConfig || {};
    requestBody.generationConfig.temperature = session.temperature;
  }
  if (session.maxTokens !== undefined) {
    requestBody.generationConfig = requestBody.generationConfig || {};
    requestBody.generationConfig.maxOutputTokens = session.maxTokens;
  }

  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    // Node.js environment - try to require node-fetch
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Gemini ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${session.model}:generateContent?key=${apiKey}`;

  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorData}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
  }

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned no candidates');
  }

  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('Gemini API returned no content');
  }

  return {
    text: candidate.content.parts[0].text || 'No response content',
    usageMetadata: data.usageMetadata
  };
}

// ADDRESS target methods metadata
const ADDRESS_GEMINI_METHODS = {
  chat: {
    description: "Send a message to Gemini (with optional session ID)",
    params: ["message", "chat_id", "system"],
    returns: "object with Gemini's response"
  },
  message: {
    description: "Send a message to Gemini (alias for chat)",
    params: ["message", "chat_id", "system"],
    returns: "object with Gemini's response"
  },
  start: {
    description: "Start a new chat session",
    params: ["system"],
    returns: "object with session ID"
  },
  session: {
    description: "Start a new chat session (alias for start)",
    params: ["system"],
    returns: "object with session ID"
  },
  end: {
    description: "End a chat session",
    params: ["chat_id"],
    returns: "object with session closure details"
  },
  close: {
    description: "Close a chat session (alias for end)",
    params: ["chat_id"],
    returns: "object with session closure details"
  },
  status: {
    description: "Get Gemini service status",
    params: [],
    returns: "object with service information"
  }
};

// Format Gemini result for proper REXX variable handling
function formatGeminiResultForREXX(result) {
  const rexxResult = {
    ...result, // Preserve original result structure
    errorCode: 0  // Always 0 - REXX will check result.rc or result.success instead
  };

  // For heredoc prompts (success case)
  if (result.success && result.response) {
    rexxResult.output = result.response;
    rexxResult.message = result.response;
  }
  // For session start, return session ID as RESULT
  else if (result.operation === 'START_SESSION') {
    rexxResult.output = result.sessionId.toString();
  }
  // For chat messages, return Gemini's response as RESULT
  else if (result.operation === 'CHAT_MESSAGE') {
    rexxResult.output = result.response;
    rexxResult.message = result.response;
  }
  // For session end or close chat, return confirmation message
  else if (result.operation === 'END_SESSION' || result.operation === 'CLOSE_CHAT') {
    rexxResult.output = result.message || `Conversation closed (${result.messageCount} messages)`;
  }
  // Default: return success message
  else {
    rexxResult.output = result.message || 'Operation completed';
  }

  return rexxResult;
}

// Format Gemini error for proper REXX variable handling
function formatGeminiErrorForREXX(error) {
  const rexxResult = {
    operation: 'ERROR',
    success: false,
    errorCode: 1,
    errorMessage: error.message,
    output: error.message,
    timestamp: new Date().toISOString()
  };

  return rexxResult;
}

// Get image data from URL or base64 data URI
async function getImageData(imageUrl) {
  const isBase64 = imageUrl.startsWith('data:image');
  if (isBase64) {
    const parts = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!parts) throw new Error('Invalid base64 data URI format.');
    return { mimeType: parts[1], base64Data: parts[2] };
  }

  // Fetch from URL
  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Image fetching requires fetch API or node-fetch module');
    }
  } else {
    throw new Error('No fetch implementation available');
  }

  const imageResponse = await fetchFn(imageUrl);
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

// Export to global scope (required for REQUIRE system detection)
if (typeof window !== 'undefined') {
  // Browser environment
  window.GEMINI_ADDRESS_META = GEMINI_ADDRESS_META;
  window.GEMINI_ADDRESS_MAIN = GEMINI_ADDRESS_MAIN;
  window.ADDRESS_GEMINI_HANDLER = ADDRESS_GEMINI_HANDLER;
  window.ADDRESS_GEMINI_METHODS = ADDRESS_GEMINI_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.GEMINI_ADDRESS_META = GEMINI_ADDRESS_META;
  global.GEMINI_ADDRESS_MAIN = GEMINI_ADDRESS_MAIN;
  global.ADDRESS_GEMINI_HANDLER = ADDRESS_GEMINI_HANDLER;
  global.ADDRESS_GEMINI_METHODS = ADDRESS_GEMINI_METHODS;
}
