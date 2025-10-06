/*!
 * rexxjs/openai-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=OPENAI_ADDRESS_META
 */
/**
 * OpenAI Chat Completions API ADDRESS Library - Provides AI chat operations via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "openai-address" AS OPENAI
 *   ADDRESS OPENAI
 *   <<PROMPT
 *   model=gpt-3.5-turbo
 *   prompt=Say hello in one word
 *   PROMPT
 *
 * Environment Variable Required:
 *   OPENAI_API_KEY - Your OpenAI API key
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
// Interpolation is provided via sourceContext.interpolation parameter

// Active conversation state (single conversation at a time)
let activeConversation = null;  // { messages: [], system: string }

// Consolidated metadata provider function
function OPENAI_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/openai-address",
    type: "address-handler",
    dependencies: {},
    envVars: ["OPENAI_API_KEY"],
    libraryMetadata: {
      interpreterHandlesInterpolation: true
    },
    name: 'OpenAI Chat Completions Service',
    version: '1.0.0',
    description: 'OpenAI Chat Completions API integration via ADDRESS interface',
    provides: {
      addressTarget: 'openai',
      handlerFunction: 'ADDRESS_OPENAI_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    requirements: {
      environment: 'nodejs-or-browser',
      modules: ['fetch'],
      apiKey: 'OPENAI_API_KEY'
    },
    detectionFunction: 'OPENAI_ADDRESS_MAIN'
  };
}

// Primary detection function with ADDRESS target metadata
function OPENAI_ADDRESS_MAIN() {
  return OPENAI_ADDRESS_META();
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_OPENAI_HANDLER(commandOrMethod, params, sourceContext) {
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
    const messageCount = activeConversation ? activeConversation.messages.length : 0;
    let statusMessage;

    if (apiKey) {
      statusMessage = `OpenAI ADDRESS ready (${messageCount} messages in conversation)`;
    } else {
      statusMessage = `OpenAI ADDRESS ready (${messageCount} messages in conversation) - OPENAI_API_KEY not set`;
    }

    return formatOpenAIResultForREXX({
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
      throw new Error('OpenAI ADDRESS library requires OPENAI_API_KEY environment variable');
    }

    // Handle heredoc/multi-line key=value format (ADDRESS OPENAI <<LABEL)
    // Detect heredoc by checking for key=value pattern (single or multi-line)
    if (typeof interpolatedCommand === 'string' &&
        /^\s*\w+=/.test(interpolatedCommand)) {
      const parsedParams = parseKeyValueHeredoc(interpolatedCommand);
      const result = await handleOpenAIHeredoc(parsedParams, apiKey);
      return formatOpenAIResultForREXX(result);
    }

    // Handle CLOSE_CHAT command
    if (typeof interpolatedCommand === 'string' &&
        interpolatedCommand.trim().toUpperCase() === 'CLOSE_CHAT') {
      const messageCount = activeConversation ? activeConversation.messages.length : 0;
      activeConversation = null;
      return formatOpenAIResultForREXX({
        operation: 'CLOSE_CHAT',
        success: true,
        messageCount: messageCount,
        message: `Conversation closed (${messageCount} messages)`
      });
    }

    // Only heredoc format is supported
    throw new Error('OpenAI ADDRESS only supports heredoc format (<<LABEL...LABEL), CLOSE_CHAT, or STATUS command');

  } catch (error) {
    const formattedError = formatOpenAIErrorForREXX(error);
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

// Handle heredoc-style OpenAI request
async function handleOpenAIHeredoc(params, apiKey) {
  const model = params.model || 'gpt-3.5-turbo';
  const prompt = params.prompt || params.message || '';
  const system = params.system || 'You are a helpful assistant.';
  const temperature = params.temperature ? parseFloat(params.temperature) : undefined;
  const maxTokens = params.max_tokens ? parseInt(params.max_tokens) : undefined;

  if (!prompt) {
    throw new Error('Heredoc format requires "prompt=" parameter');
  }

  // If no active conversation, start one with the system prompt
  if (!activeConversation) {
    activeConversation = {
      messages: [],
      system: system
    };
  }

  // Add user message to conversation
  activeConversation.messages.push({
    role: 'user',
    content: prompt
  });

  try {
    // Make API call with full conversation history
    const response = await callOpenAIAPI({
      model: model,
      messages: activeConversation.messages,
      system: activeConversation.system,
      temperature: temperature,
      maxTokens: maxTokens
    }, apiKey);

    // Add assistant response to conversation
    activeConversation.messages.push({
      role: 'assistant',
      content: response.content
    });

    return {
      success: true,
      response: response.content,
      model: response.model,
      tokensUsed: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens
      }
    };
  } catch (error) {
    throw error;
  }
}

// Get API key from environment or configuration
function getApiKey() {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Try global configuration
  if (typeof global !== 'undefined' && global.OPENAI_API_KEY) {
    return global.OPENAI_API_KEY;
  }

  // Try window configuration (browser)
  if (typeof window !== 'undefined' && window.OPENAI_API_KEY) {
    return window.OPENAI_API_KEY;
  }

  return null;
}

// Make HTTP request to OpenAI API
async function callOpenAIAPI(session, apiKey) {
  // Build messages array with system message first
  const messages = [
    { role: 'system', content: session.system },
    ...session.messages
  ];

  const requestBody = {
    model: session.model,
    messages: messages
  };

  // Add optional parameters if provided
  if (session.temperature !== undefined) {
    requestBody.temperature = session.temperature;
  }
  if (session.maxTokens !== undefined) {
    requestBody.max_tokens = session.maxTokens;
  }

  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    // Node.js environment - try to require node-fetch
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('OpenAI ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }

  const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
  }

  if (!data.choices || data.choices.length === 0) {
    throw new Error('OpenAI API returned no choices');
  }

  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    throw new Error('OpenAI API returned no content');
  }

  return {
    content: choice.message.content,
    model: data.model,
    usage: data.usage
  };
}

// ADDRESS target methods metadata
const ADDRESS_OPENAI_METHODS = {
  chat: {
    description: "Send a message to OpenAI (with optional session ID)",
    params: ["message", "chat_id", "system"],
    returns: "object with OpenAI's response"
  },
  message: {
    description: "Send a message to OpenAI (alias for chat)",
    params: ["message", "chat_id", "system"],
    returns: "object with OpenAI's response"
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
    description: "Get OpenAI service status",
    params: [],
    returns: "object with service information"
  }
};

// Format OpenAI result for proper REXX variable handling
function formatOpenAIResultForREXX(result) {
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
  // For chat messages, return OpenAI's response as RESULT
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

// Format OpenAI error for proper REXX variable handling
function formatOpenAIErrorForREXX(error) {
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

// Export to global scope (required for REQUIRE system detection)
if (typeof window !== 'undefined') {
  // Browser environment
  window.OPENAI_ADDRESS_META = OPENAI_ADDRESS_META;
  window.OPENAI_ADDRESS_MAIN = OPENAI_ADDRESS_MAIN;
  window.ADDRESS_OPENAI_HANDLER = ADDRESS_OPENAI_HANDLER;
  window.ADDRESS_OPENAI_METHODS = ADDRESS_OPENAI_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.OPENAI_ADDRESS_META = OPENAI_ADDRESS_META;
  global.OPENAI_ADDRESS_MAIN = OPENAI_ADDRESS_MAIN;
  global.ADDRESS_OPENAI_HANDLER = ADDRESS_OPENAI_HANDLER;
  global.ADDRESS_OPENAI_METHODS = ADDRESS_OPENAI_METHODS;
}
