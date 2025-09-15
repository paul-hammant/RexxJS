/**
 * Claude API ADDRESS Library - Provides AI chat operations via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 * 
 * Usage:
 *   REQUIRE "claude-address" AS CLAUDE
 *   ADDRESS CLAUDE
 *   "SYSTEM ROLE You are a fiction editor assistant."
 *   chat_id = result
 *   "EDIT PARAGRAPH 1 CHAT" chat_id "TEXT 'It was a dark and stormy night.'"
 *   "END SESSION" chat_id
 *
 * Environment Variable Required:
 *   ANTHROPIC_API_KEY - Your Anthropic API key
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Session storage for multi-turn conversations
const chatSessions = new Map();
let sessionCounter = 0;

// CHECKPOINT storage for structured collaboration
const activeCheckpoints = new Map();
let checkpointCounter = 0;

// Primary detection function with ADDRESS target metadata
function CLAUDE_ADDRESS_MAIN() {
  // Check Node.js/fetch availability without throwing during registration
  let fetchAvailable = false;
  try {
    if (typeof fetch !== 'undefined' || (typeof require !== 'undefined' && require)) {
      fetchAvailable = true;
    }
  } catch (e) {
    // Will be available as metadata for error handling
  }
  
  return {
    type: 'address-target',
    name: 'Claude AI Chat Service',
    version: '1.0.0',
    description: 'Anthropic Claude API integration via ADDRESS interface',
    provides: {
      addressTarget: 'claude',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: [],
    loaded: true,
    requirements: {
      environment: 'nodejs-or-browser',
      modules: ['fetch'],
      apiKey: 'ANTHROPIC_API_KEY'
    },
    fetchAvailable: fetchAvailable
  };
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_CLAUDE_HANDLER(commandOrMethod, params) {
  try {
    // Check API key availability
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Claude ADDRESS library requires ANTHROPIC_API_KEY environment variable');
    }

    // Handle command-string style (traditional Rexx ADDRESS)
    if (typeof commandOrMethod === 'string' && !params) {
      const result = await handleClaudeCommand(commandOrMethod, apiKey);
      return formatClaudeResultForREXX(result);
    }
    
    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'chat':
      case 'message':
        resultPromise = handleChatMessage(params.message || params.text, params.chat_id, apiKey, params.system);
        break;
        
      case 'start':
      case 'session':
        resultPromise = handleStartSession(params.system || params.role, apiKey);
        break;
        
      case 'end':
      case 'close':
        resultPromise = handleEndSession(params.chat_id || params.session_id);
        break;
        
      case 'checkpoint':
        resultPromise = handleCheckpoint(params, apiKey);
        break;
        
      case 'wait_for_checkpoint':
      case 'poll_checkpoint':
        resultPromise = handleCheckpointPoll(params.checkpoint_id || params.requestId);
        break;
        
      case 'complete_checkpoint':
        resultPromise = handleCheckpointComplete(params.checkpoint_id || params.requestId, params.result);
        break;
        
      case 'status':
        resultPromise = Promise.resolve({
          operation: 'STATUS',
          service: 'claude',
          version: 'sonnet-3.5',
          provider: 'Anthropic',
          activeSessions: chatSessions.size,
          activeCheckpoints: activeCheckpoints.size,
          methods: ['chat', 'message', 'start', 'session', 'end', 'close', 'checkpoint', 'wait_for_checkpoint', 'complete_checkpoint', 'status'],
          timestamp: new Date().toISOString(),
          success: true
        });
        break;
        
      default:
        // Try to interpret as a direct command
        resultPromise = handleClaudeCommand(commandOrMethod, apiKey);
        break;
    }
    
    const result = await resultPromise;
    return formatClaudeResultForREXX(result);
    
  } catch (error) {
    const formattedError = formatClaudeErrorForREXX(error);
    throw new Error(error.message);
  }
}

// Get API key from environment or configuration
function getApiKey() {
  // Try environment variable first
  if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  
  // Try global configuration
  if (typeof global !== 'undefined' && global.ANTHROPIC_API_KEY) {
    return global.ANTHROPIC_API_KEY;
  }
  
  // Try window configuration (browser)
  if (typeof window !== 'undefined' && window.ANTHROPIC_API_KEY) {
    return window.ANTHROPIC_API_KEY;
  }
  
  return null;
}

// Parse command strings and route to appropriate handlers
async function handleClaudeCommand(command, apiKey) {
  const cmd = command.trim().toUpperCase();
  
  // Handle empty commands
  if (!cmd) {
    return {
      operation: 'NOOP',
      success: true,
      message: 'Empty command - no operation performed',
      timestamp: new Date().toISOString()
    };
  }
  
  // Parse SYSTEM ROLE command
  if (cmd.startsWith('SYSTEM ROLE ')) {
    const systemPrompt = command.substring(12).trim(); // Remove "SYSTEM ROLE "
    return handleStartSession(systemPrompt, apiKey);
  }
  
  // Parse EDIT PARAGRAPH commands
  const editMatch = cmd.match(/^EDIT PARAGRAPH (\d+) CHAT (\d+) TEXT ['"](.+)['"]$/);
  if (editMatch) {
    const [, paragraphNum, chatId, text] = editMatch;
    const message = `Edit paragraph ${paragraphNum}: ${text}`;
    return handleChatMessage(message, parseInt(chatId), apiKey);
  }
  
  // Parse END SESSION command
  const endMatch = cmd.match(/^END SESSION (\d+)$/);
  if (endMatch) {
    const [, chatId] = endMatch;
    return handleEndSession(parseInt(chatId));
  }
  
  // Parse general chat message with session
  const chatMatch = cmd.match(/^CHAT (\d+) ['"](.+)['"]$/);
  if (chatMatch) {
    const [, chatId, message] = chatMatch;
    return handleChatMessage(message, parseInt(chatId), apiKey);
  }
  
  // Parse CHECKPOINT command
  if (cmd.startsWith('CHECKPOINT ')) {
    const checkpointParams = parseCheckpointCommand(command);
    return handleCheckpoint(checkpointParams, apiKey);
  }
  
  // Parse WAIT FOR CHECKPOINT command
  const waitMatch = cmd.match(/^WAIT FOR CHECKPOINT ([\w_]+)$/);
  if (waitMatch) {
    const [, checkpointId] = waitMatch;
    return handleCheckpointPoll(checkpointId);
  }
  
  // Check if it's a status command
  if (cmd === 'STATUS') {
    return {
      operation: 'STATUS',
      service: 'claude',
      version: 'sonnet-3.5',
      provider: 'Anthropic',
      activeSessions: chatSessions.size,
      activeCheckpoints: activeCheckpoints.size,
      methods: ['chat', 'message', 'start', 'session', 'end', 'close', 'checkpoint', 'wait_for_checkpoint', 'complete_checkpoint', 'status'],
      timestamp: new Date().toISOString(),
      success: true
    };
  }
  
  // Default: treat as a simple message (start new session)
  return handleChatMessage(command, null, apiKey);
}

// Start a new chat session with optional system prompt
async function handleStartSession(systemPrompt, apiKey) {
  sessionCounter++;
  const sessionId = sessionCounter;
  
  const session = {
    id: sessionId,
    messages: [],
    created: new Date().toISOString(),
    system: systemPrompt || "You are Claude, a helpful AI assistant."
  };
  
  if (systemPrompt) {
    session.messages.push({
      role: 'user',
      content: 'System setup completed.'
    });
  }
  
  chatSessions.set(sessionId, session);
  
  return {
    operation: 'START_SESSION',
    success: true,
    sessionId: sessionId,
    system: session.system,
    message: `Started chat session ${sessionId}`,
    timestamp: new Date().toISOString()
  };
}

// Send message to Claude API
async function handleChatMessage(message, sessionId, apiKey, systemPrompt = null) {
  let session;
  
  if (sessionId && chatSessions.has(sessionId)) {
    session = chatSessions.get(sessionId);
  } else {
    // Create new session if none specified
    const newSession = await handleStartSession(systemPrompt, apiKey);
    session = chatSessions.get(newSession.sessionId);
    sessionId = newSession.sessionId;
  }
  
  // Add user message to session
  session.messages.push({
    role: 'user',
    content: message
  });
  
  try {
    // Make API call to Claude
    const response = await callClaudeAPI(session, apiKey);
    
    // Add Claude's response to session
    session.messages.push({
      role: 'assistant',  
      content: response.content
    });
    
    return {
      operation: 'CHAT_MESSAGE',
      success: true,
      sessionId: sessionId,
      userMessage: message,
      response: response.content,
      tokensUsed: response.usage || {},
      messageCount: session.messages.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Claude API call failed: ${error.message}`);
  }
}

// End a chat session
async function handleEndSession(sessionId) {
  if (!sessionId || !chatSessions.has(sessionId)) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const session = chatSessions.get(sessionId);
  const messageCount = session.messages.length;
  
  chatSessions.delete(sessionId);
  
  return {
    operation: 'END_SESSION',
    success: true,
    sessionId: sessionId,
    messageCount: messageCount,
    duration: new Date().toISOString(),
    message: `Chat session ${sessionId} closed`,
    timestamp: new Date().toISOString()
  };
}

// Parse CHECKPOINT command parameters
function parseCheckpointCommand(command) {
  const params = {};
  const parts = command.split(' ');
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('=')) {
      const [key, ...valueParts] = part.split('=');
      let value = valueParts.join('=');
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      
      params[key.toLowerCase()] = value;
    }
  }
  
  return params;
}

// Handle CHECKPOINT creation with structured outputs
async function handleCheckpoint(params, apiKey) {
  checkpointCounter++;
  const checkpointId = `checkpoint_${checkpointCounter}_${Date.now()}`;
  
  const checkpoint = {
    id: checkpointId,
    operation: params.operation || params.request || 'GENERAL_ANALYSIS',
    context: {
      code: params.code,
      text: params.text,
      data: params.data,
      variables: params.variables ? JSON.parse(params.variables) : {},
      metadata: {
        phase: params.phase || 'analysis',
        format: params.format || 'structured',
        timeout: parseInt(params.timeout) || 30000
      }
    },
    parameters: params,
    status: 'processing',
    created: new Date().toISOString(),
    progress: {
      status: 'initiated',
      percentage: 0,
      message: 'Checkpoint created, sending to Claude...'
    }
  };
  
  activeCheckpoints.set(checkpointId, checkpoint);
  
  // Process with Claude in background using structured output
  processCheckpointWithClaude(checkpoint, apiKey);
  
  return {
    operation: 'CREATE_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: 'processing',
    message: `Checkpoint ${checkpointId} created and processing`,
    timeout: checkpoint.context.metadata.timeout,
    timestamp: new Date().toISOString()
  };
}

// Background processing with Claude using structured outputs
async function processCheckpointWithClaude(checkpoint, apiKey) {
  try {
    // Update progress
    checkpoint.progress = {
      status: 'analyzing',
      percentage: 25,
      message: 'Sending request to Claude...'
    };
    
    // Skip API call if using test API key
    if (apiKey === 'test-api-key-for-testing') {
      // Mock successful response for testing
      setTimeout(() => {
        checkpoint.status = 'completed';
        checkpoint.result = {
          type: 'structured',
          operation: checkpoint.operation,
          data: {
            analysis: 'Mock analysis result',
            issues: [],
            suggestions: ['Mock suggestion'],
            confidence: 0.95
          }
        };
        checkpoint.progress = {
          status: 'completed',
          percentage: 100,
          message: 'Mock analysis complete'
        };
        checkpoint.completedAt = new Date().toISOString();
        checkpoint.processingTime = 100;
      }, 50); // Very fast for testing
      return;
    }
    
    // Create structured prompt based on operation type
    const structuredPrompt = createStructuredPrompt(checkpoint);
    
    // Call Claude with structured output request
    const response = await callClaudeAPIWithStructuredOutput(structuredPrompt, apiKey, checkpoint.operation);
    
    // Update progress
    checkpoint.progress = {
      status: 'processing_response',
      percentage: 75,
      message: 'Processing Claude response...'
    };
    
    // Parse and structure the response
    const structuredResult = parseStructuredResponse(response, checkpoint.operation);
    
    // Complete the checkpoint
    checkpoint.status = 'completed';
    checkpoint.result = structuredResult;
    checkpoint.progress = {
      status: 'completed',
      percentage: 100,
      message: 'Analysis complete'
    };
    checkpoint.completedAt = new Date().toISOString();
    checkpoint.processingTime = new Date(checkpoint.completedAt).getTime() - new Date(checkpoint.created).getTime();
    
  } catch (error) {
    checkpoint.status = 'error';
    checkpoint.error = {
      message: error.message,
      type: 'processing_error',
      timestamp: new Date().toISOString()
    };
    checkpoint.progress = {
      status: 'error',
      percentage: 0,
      message: `Error: ${error.message}`
    };
  }
}

// Create structured prompt based on operation type
function createStructuredPrompt(checkpoint) {
  const { operation, context } = checkpoint;
  
  switch (operation.toUpperCase()) {
    case 'ANALYZE_CODE':
      return {
        system: "You are a expert code analyst. Analyze code for correctness, efficiency, and best practices. Return your analysis in JSON format.",
        message: `Analyze this code:\n\n${context.code}\n\nProvide analysis in this JSON structure:
{
  "analysis": "detailed analysis of the code",
  "issues": ["list of issues found"],
  "suggestions": ["list of improvement suggestions"],
  "confidence": 0.95,
  "complexity": "low|medium|high",
  "quality_score": 85
}`,
        responseFormat: "json"
      };
      
    case 'GENERATE_CODE':
      return {
        system: "You are an expert programmer. Generate clean, efficient, well-documented code based on requirements.",
        message: `Generate code for: ${context.text || context.data}\n\nReturn in this JSON structure:
{
  "code": "generated code here",
  "explanation": "explanation of the code",
  "dependencies": ["list of dependencies"],
  "usage_example": "example of how to use the code",
  "tests": "suggested test cases"
}`,
        responseFormat: "json"
      };
      
    case 'REVIEW_TEXT':
      return {
        system: "You are an expert editor and writing analyst. Review text for clarity, grammar, and style.",
        message: `Review this text:\n\n${context.text}\n\nProvide feedback in this JSON structure:
{
  "review": "overall assessment",
  "grammar_issues": ["list of grammar issues"],
  "style_suggestions": ["list of style improvements"],
  "clarity_score": 85,
  "readability": "easy|moderate|difficult",
  "tone": "formal|informal|neutral"
}`,
        responseFormat: "json"
      };
      
    default:
      return {
        system: "You are a helpful AI assistant. Analyze the provided content and return structured results.",
        message: `Operation: ${operation}\n\nContent: ${context.text || context.code || context.data || 'No content provided'}\n\nProvide analysis in JSON format with relevant fields for this operation.`,
        responseFormat: "json"
      };
  }
}

// Call Claude API with structured output support
async function callClaudeAPIWithStructuredOutput(prompt, apiKey, operation) {
  const messages = [
    {
      role: 'user',
      content: prompt.message
    }
  ];
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: messages,
    system: prompt.system
  };
  
  // Add structured output instructions for better JSON parsing
  if (prompt.responseFormat === 'json') {
    requestBody.system += " Always respond with valid JSON. Do not include any text before or after the JSON object.";
  }
  
  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Claude ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }
  
  const response = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Claude API error: ${data.error.message || 'Unknown error'}`);
  }
  
  return {
    content: data.content[0]?.text || 'No response content',
    usage: data.usage
  };
}

// Parse structured response from Claude
function parseStructuredResponse(response, operation) {
  try {
    // Try to parse as JSON first
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonResult = JSON.parse(jsonMatch[0]);
      return {
        type: 'structured',
        operation: operation,
        data: jsonResult,
        raw: response.content,
        usage: response.usage
      };
    }
  } catch (e) {
    // If JSON parsing fails, return as unstructured
  }
  
  return {
    type: 'unstructured',
    operation: operation,
    data: {
      content: response.content,
      analysis: response.content
    },
    raw: response.content,
    usage: response.usage
  };
}

// Handle checkpoint polling (COMET-style long-polling)
async function handleCheckpointPoll(checkpointId) {
  if (!activeCheckpoints.has(checkpointId)) {
    return {
      operation: 'POLL_CHECKPOINT',
      success: false,
      error: `Checkpoint ${checkpointId} not found`,
      status: 'not_found',
      timestamp: new Date().toISOString()
    };
  }
  
  const checkpoint = activeCheckpoints.get(checkpointId);
  
  // Return current status and results if available
  const result = {
    operation: 'POLL_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: checkpoint.status,
    progress: checkpoint.progress,
    timestamp: new Date().toISOString()
  };
  
  if (checkpoint.status === 'completed') {
    result.done = true; // COMET-style "done" signal
    result.result = checkpoint.result;
    result.processingTime = checkpoint.processingTime;
    // Optionally clean up completed checkpoint
    activeCheckpoints.delete(checkpointId);
  } else if (checkpoint.status === 'error') {
    result.done = true; // Error also completes the checkpoint
    result.error = checkpoint.error;
    activeCheckpoints.delete(checkpointId);
  }
  
  return result;
}

// Handle manual checkpoint completion (for external collaborators)
async function handleCheckpointComplete(checkpointId, externalResult) {
  if (!activeCheckpoints.has(checkpointId)) {
    throw new Error(`Checkpoint ${checkpointId} not found`);
  }
  
  const checkpoint = activeCheckpoints.get(checkpointId);
  
  checkpoint.status = 'completed';
  checkpoint.result = externalResult;
  checkpoint.completedAt = new Date().toISOString();
  checkpoint.progress = {
    status: 'completed',
    percentage: 100,
    message: 'Completed by external collaborator'
  };
  
  return {
    operation: 'COMPLETE_CHECKPOINT',
    success: true,
    checkpointId: checkpointId,
    status: 'completed',
    result: externalResult,
    timestamp: new Date().toISOString()
  };
}

// Make HTTP request to Claude API
async function callClaudeAPI(session, apiKey) {
  const messages = session.messages.filter(msg => msg.role !== 'system');
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: messages,
    system: session.system
  };
  
  let fetchFn;
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else if (typeof require !== 'undefined') {
    // Node.js environment - try to require node-fetch
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Claude ADDRESS library requires fetch API or node-fetch module in Node.js');
    }
  } else {
    throw new Error('No fetch implementation available');
  }
  
  const response = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Claude API error: ${data.error.message || 'Unknown error'}`);
  }
  
  return {
    content: data.content[0]?.text || 'No response content',
    usage: data.usage
  };
}

// ADDRESS target methods metadata
const ADDRESS_CLAUDE_METHODS = {
  chat: {
    description: "Send a message to Claude (with optional session ID)",
    params: ["message", "chat_id", "system"],
    returns: "object with Claude's response"
  },
  message: {
    description: "Send a message to Claude (alias for chat)",
    params: ["message", "chat_id", "system"],
    returns: "object with Claude's response"
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
  checkpoint: {
    description: "Create a structured analysis checkpoint with Claude",
    params: ["operation", "code", "text", "data", "format", "timeout"],
    returns: "object with checkpoint ID and status"
  },
  wait_for_checkpoint: {
    description: "Poll a checkpoint for completion (COMET-style long-polling)",
    params: ["checkpoint_id"],
    returns: "object with checkpoint status and results when done"
  },
  poll_checkpoint: {
    description: "Poll a checkpoint for completion (alias for wait_for_checkpoint)",
    params: ["checkpoint_id"],
    returns: "object with checkpoint status and results when done"
  },
  complete_checkpoint: {
    description: "Manually complete a checkpoint with external results",
    params: ["checkpoint_id", "result"],
    returns: "object with completion confirmation"
  },
  status: {
    description: "Get Claude service status",
    params: [],
    returns: "object with service information"
  }
};

// Format Claude result for proper REXX variable handling
function formatClaudeResultForREXX(result) {
  const rexxResult = {
    ...result, // Preserve original result structure
    errorCode: 0
  };
  
  // For session start, return session ID as RESULT
  if (result.operation === 'START_SESSION') {
    rexxResult.output = result.sessionId.toString();
  }
  // For chat messages, return Claude's response as RESULT and queue detailed response
  else if (result.operation === 'CHAT_MESSAGE') {
    rexxResult.output = result.response;
    // Queue additional details for REXX to pull
    if (typeof queueLine === 'function') {
      queueLine(`[Chat ${result.sessionId}] User: ${result.userMessage}`);
      queueLine(`[Chat ${result.sessionId}] Claude: ${result.response}`);
      if (result.tokensUsed && result.tokensUsed.total) {
        queueLine(`[Chat ${result.sessionId}] Tokens: ${result.tokensUsed.total}`);
      }
    }
  }
  // For session end, return confirmation message
  else if (result.operation === 'END_SESSION') {
    rexxResult.output = `Session ${result.sessionId} closed (${result.messageCount} messages)`;
  }
  // Default: return success message
  else {
    rexxResult.output = result.message || 'Operation completed';
  }
  
  return rexxResult;
}

// Format Claude error for proper REXX variable handling
function formatClaudeErrorForREXX(error) {
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
  window.CLAUDE_ADDRESS_MAIN = CLAUDE_ADDRESS_MAIN;
  window.ADDRESS_CLAUDE_HANDLER = ADDRESS_CLAUDE_HANDLER;
  window.ADDRESS_CLAUDE_METHODS = ADDRESS_CLAUDE_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.CLAUDE_ADDRESS_MAIN = CLAUDE_ADDRESS_MAIN;
  global.ADDRESS_CLAUDE_HANDLER = ADDRESS_CLAUDE_HANDLER;
  global.ADDRESS_CLAUDE_METHODS = ADDRESS_CLAUDE_METHODS;
}