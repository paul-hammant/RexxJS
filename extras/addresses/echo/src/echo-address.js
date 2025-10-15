/*!
 * rexxjs/echo-address v1.0.0 | (c) 2025 Paul Hammant | MIT License
 * @rexxjs-meta=ECHO_ADDRESS_META
 */
/**
 * Echo ADDRESS Library - Simple test ADDRESS that echoes back interpolated input
 *
 * Usage:
 *   REQUIRE "echo-address"
 *   ADDRESS ECHO
 *   <<TEST
 *   message=Hello, {{name}}!
 *   TEST
 *   SAY RESULT.message  // Outputs: Hello, World! (if name="World")
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Metadata provider function
function ECHO_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/echo-address",
    type: "address-handler",
    dependencies: {},
    libraryMetadata: {
      interpreterHandlesInterpolation: true
    },
    name: 'Echo ADDRESS Service',
    version: '1.0.0',
    description: 'Simple echo ADDRESS for testing - returns interpolated input',
    provides: {
      addressTarget: 'echo',
      handlerFunction: 'ADDRESS_ECHO_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    requirements: {
      environment: 'nodejs-or-browser'
    }
  };
}


// ADDRESS target handler function
async function ADDRESS_ECHO_HANDLER(commandOrMethod, params, sourceContext) {
  try {
    // Apply RexxJS variable interpolation
    const variablePool = params || {};
    const interpolate = sourceContext && sourceContext.interpolation ? sourceContext.interpolation.interpolate : (str => str);
    const interpolatedCommand = typeof commandOrMethod === 'string'
      ? interpolate(commandOrMethod, variablePool)
      : commandOrMethod;

    // Handle heredoc/multi-line key=value format
    if (typeof interpolatedCommand === 'string' && /^\s*\w+=/.test(interpolatedCommand)) {
      const parsedParams = parseKeyValueHeredoc(interpolatedCommand);
      return {
        success: true,
        echo: parsedParams,
        message: parsedParams.message || JSON.stringify(parsedParams),
        output: parsedParams.message || JSON.stringify(parsedParams),
        errorCode: 0
      };
    }

    // Handle simple string commands
    if (typeof interpolatedCommand === 'string') {
      return {
        success: true,
        echo: interpolatedCommand,
        message: interpolatedCommand,
        output: interpolatedCommand,
        errorCode: 0
      };
    }

    // Default: return empty result
    return {
      success: true,
      echo: '',
      message: '',
      output: '',
      errorCode: 0
    };

  } catch (error) {
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


// Export to global scope - only metadata, handler discovered via metadata
if (typeof window !== 'undefined') {
  window.ECHO_ADDRESS_META = ECHO_ADDRESS_META;
  window.ADDRESS_ECHO_HANDLER = ADDRESS_ECHO_HANDLER;
} else if (typeof global !== 'undefined') {
  global.ECHO_ADDRESS_META = ECHO_ADDRESS_META;
  global.ADDRESS_ECHO_HANDLER = ADDRESS_ECHO_HANDLER;
}
