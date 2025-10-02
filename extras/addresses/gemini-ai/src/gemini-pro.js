/*!
 * rexxjs/gemini-pro-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=GEMINI_PRO_ADDRESS_META
 */
/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Google Gemini Pro API ADDRESS Library (CHECKPOINT-based)
 * Provides AI chat operations via REXX ADDRESS CHECKPOINT interface.
 *
 * This module defines the ADDRESS target for REXX. The actual API calls
 * are handled by a separate checkpoint handler in the host environment.
 *
 * Usage (in REXX):
 *   REQUIRE "gemini-pro-address"
 *   CHECKPOINT OPERATION="START_SESSION" PARAMS=[system: "You are a helpful assistant."]
 *   -- chat_id is in checkpointResult.sessionId
 *
 *   CHECKPOINT OPERATION="CHAT_MESSAGE" PARAMS=[sessionId: chat_id, message: "Hello!"]
 *   -- response is in checkpointResult.response
 */

// Try to import RexxJS interpolation config for variable interpolation
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will work without interpolation
}

/**
 * Interpolate variables using RexxJS global interpolation pattern
 */
function interpolateVariables(str, variablePool) {
  if (!interpolationConfig || !variablePool) {
    return str;
  }

  const pattern = interpolationConfig.getCurrentPattern();
  if (!pattern.hasDelims(str)) {
    return str;
  }

  return str.replace(pattern.regex, (match) => {
    const varName = pattern.extractVar(match);
    if (varName in variablePool) {
      return variablePool[varName];
    }
    return match; // Variable not found - leave as-is
  });
}

// Gemini Pro ADDRESS metadata function
function GEMINI_PRO_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    type: 'address-target',
    name: 'Gemini Pro AI Chat Service (Checkpoint)',
    version: '1.1.0',
    description: 'Google Gemini Pro API integration via ADDRESS CHECKPOINT interface',
    provides: {
      addressTarget: 'gemini-pro',
      handlerFunction: 'ADDRESS_GEMINI_PRO_HANDLER',
      commandSupport: false, // We only support method-style calls for CHECKPOINT
      methodSupport: true
    },
    dependencies: {},
    envVars: ["GOOGLE_API_KEY"],
    requirements: {
      apiKey: 'GEMINI_API_KEY',
      environment: 'managed-checkpoint'
    }
  };
}

// ADDRESS target handler function
// This function is now synchronous. It just fires off the checkpoint request.
function ADDRESS_GEMINI_PRO_HANDLER(method, params) {
  // The CHECKPOINT command in the interpreter will handle the async waiting.
  // This handler's job is just to format the request correctly.
  // The 'CHECKPOINT' keyword must be the first argument to the interpreter's
  // executeAddress method for this to work.

  const operation = method.toUpperCase();

  // Apply RexxJS variable interpolation to params
  const variablePool = params || {};
  const interpolatedParams = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (typeof value === 'string') {
      interpolatedParams[key] = interpolateVariables(value, variablePool);
    } else {
      interpolatedParams[key] = value;
    }
  }

  const parameters = { ...interpolatedParams, model: 'gemini-pro' };

  // This is a special return value that the interpreter understands
  // as a request to initiate a CHECKPOINT.
  return {
    type: 'checkpoint-request',
    operation: operation,
    parameters: parameters
  };
}

// ADDRESS target methods metadata
const ADDRESS_GEMINI_PRO_METHODS = {
  start_session: { description: "Start a new chat session", params: ["system"] },
  chat_message: { description: "Send a message to Gemini Pro", params: ["sessionId", "message"] },
  end_session: { description: "End a chat session", params: ["sessionId"] }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.GEMINI_PRO_ADDRESS_META = GEMINI_PRO_ADDRESS_META;
  window.ADDRESS_GEMINI_PRO_HANDLER = ADDRESS_GEMINI_PRO_HANDLER;
  window.ADDRESS_GEMINI_PRO_METHODS = ADDRESS_GEMINI_PRO_METHODS;
} else if (typeof global !== 'undefined') {
  global.GEMINI_PRO_ADDRESS_META = GEMINI_PRO_ADDRESS_META;
  global.ADDRESS_GEMINI_PRO_HANDLER = ADDRESS_GEMINI_PRO_HANDLER;
  global.ADDRESS_GEMINI_PRO_METHODS = ADDRESS_GEMINI_PRO_METHODS;
}
