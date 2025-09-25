/*!
 * rexxjs/gemini-pro-vision-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=GEMINI_PRO_VISION_ADDRESS_META
 */
/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Google Gemini Pro Vision API ADDRESS Library (CHECKPOINT-based)
 * Provides multimodal chat operations via REXX ADDRESS CHECKPOINT interface.
 *
 * This module defines the ADDRESS target for REXX. The actual API calls
 * are handled by a separate checkpoint handler in the host environment.
 *
 * Usage (in REXX):
 *   REQUIRE "gemini-pro-vision-address"
 *   CHECKPOINT OPERATION="START_SESSION" PARAMS=[system: "You are an image analyst."]
 *   -- chat_id is in checkpointResult.sessionId
 *
 *   CHECKPOINT OPERATION="CHAT_MESSAGE" PARAMS=[sessionId: chat_id, message: "What is in this image?", imageUrl: "http://..."]
 *   -- response is in checkpointResult.response
 */

// Gemini Pro Vision ADDRESS metadata function
function GEMINI_PRO_VISION_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    type: 'address-target',
    name: 'Gemini Pro Vision AI Service (Checkpoint)',
    version: '1.1.0',
    description: 'Google Gemini Pro Vision API integration via ADDRESS CHECKPOINT interface',
    provides: {
      addressTarget: 'gemini-pro-vision',
      handlerFunction: 'ADDRESS_GEMINI_PRO_VISION_HANDLER',
      commandSupport: false,
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
function ADDRESS_GEMINI_PRO_VISION_HANDLER(method, params) {
  const operation = method.toUpperCase();
  const parameters = { ...params, model: 'gemini-pro-vision' };

  // Return the special object to trigger a CHECKPOINT
  return {
    type: 'checkpoint-request',
    operation: operation,
    parameters: parameters
  };
}

// ADDRESS target methods metadata
const ADDRESS_GEMINI_PRO_VISION_METHODS = {
  start_session: { description: "Start a new chat session", params: ["system"] },
  chat_message: { description: "Send a message and optional image to Gemini Pro Vision", params: ["sessionId", "message", "imageUrl"] },
  end_session: { description: "End a chat session", params: ["sessionId"] }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.GEMINI_PRO_VISION_ADDRESS_META = GEMINI_PRO_VISION_ADDRESS_META;
  window.ADDRESS_GEMINI_PRO_VISION_HANDLER = ADDRESS_GEMINI_PRO_VISION_HANDLER;
  window.ADDRESS_GEMINI_PRO_VISION_METHODS = ADDRESS_GEMINI_PRO_VISION_METHODS;
} else if (typeof global !== 'undefined') {
  global.GEMINI_PRO_VISION_ADDRESS_META = GEMINI_PRO_VISION_ADDRESS_META;
  global.ADDRESS_GEMINI_PRO_VISION_HANDLER = ADDRESS_GEMINI_PRO_VISION_HANDLER;
  global.ADDRESS_GEMINI_PRO_VISION_METHODS = ADDRESS_GEMINI_PRO_VISION_METHODS;
}
