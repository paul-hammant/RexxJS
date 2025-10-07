/*!
 * SED Text Transformation Functions
 * Requires: sed-lite package
 * Works in both Node.js and browser (after bundling)
 * @rexxjs-meta=SED_FUNCTIONS_META
 */

const { sed } = require('sed-lite');

/**
 * SED - Apply sed-style text transformations
 * Currently supports the 's' (substitute) command
 *
 * Note: This implementation uses sed-lite which focuses on the substitute command.
 * Future enhancements may add more sed commands (d, p, a, i, c, y, etc.)
 *
 * @param {string|array} input - Text to transform (string or array of lines)
 * @param {string|array} commands - Sed command(s) to apply
 * @param {object} options - Options for sed processing
 * @returns {string|array} - Transformed text
 *
 * @example
 * // Basic substitution
 * SED("hello world", "s/world/universe/") // "hello universe"
 *
 * // Global substitution
 * SED("foo foo foo", "s/foo/bar/g") // "bar bar bar"
 *
 * // Multiple commands
 * SED("hello world", ["s/hello/hi/", "s/world/there/"]) // "hi there"
 *
 * // Array input (line-by-line processing)
 * SED(["line1", "line2"], "s/line/LINE/g") // ["LINE1", "LINE2"]
 *
 * // Alternative delimiters
 * SED("path/to/file", "s#/#-#g") // "path-to-file"
 */
function SED(input, commands, options = {}) {
  const {
    returnArray = false  // Return array of lines instead of joined string
  } = options;

  // Handle escape sequences in input (like DIFF and FILESPLIT)
  let processedInput = input;
  if (typeof input === 'string') {
    processedInput = input.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  }

  // Convert input to array of lines for processing
  const inputArray = Array.isArray(processedInput)
    ? processedInput
    : processedInput.split('\n');

  // Convert commands to array
  const commandArray = Array.isArray(commands) ? commands : [commands];

  // Compile all sed commands
  const transformers = commandArray.map(cmd => {
    try {
      // REXX keeps backslashes literal (\\w becomes \\w in the string)
      // sed-lite expects single backslashes for regex (\w)
      // So we need to convert \\ -> \ for regex patterns
      const processedCmd = String(cmd).replace(/\\\\/g, '\\');

      return sed(processedCmd);
    } catch (e) {
      throw new Error(`Invalid sed command "${cmd}": ${e.message}`);
    }
  });

  // Apply transformations line by line
  const outputArray = inputArray.map(line => {
    let result = line;
    for (const transform of transformers) {
      result = transform(result);
    }
    return result;
  });

  // Return based on input type and options
  if (Array.isArray(input) || returnArray) {
    return outputArray;
  } else {
    return outputArray.join('\n');
  }
}

/**
 * SED_SUBSTITUTE - Shorthand for substitute command
 * Convenience function for the most common sed operation
 *
 * @param {string|array} input - Text to transform
 * @param {string} pattern - Pattern to search for (regex string)
 * @param {string} replacement - Replacement text
 * @param {object} options - Options
 * @returns {string|array} - Transformed text
 *
 * @example
 * SED_SUBSTITUTE("hello world", "world", "universe") // "hello universe"
 * SED_SUBSTITUTE("foo foo", "foo", "bar", {global: true}) // "bar bar"
 */
function SED_SUBSTITUTE(input, pattern, replacement, options = {}) {
  const {
    global = false,      // Apply to all occurrences
    caseInsensitive = false,  // Case-insensitive matching
    delimiter = '/'      // Delimiter character
  } = options;

  // Build sed command
  let flags = '';
  if (global) flags += 'g';
  if (caseInsensitive) flags += 'i';

  const sedCommand = `s${delimiter}${pattern}${delimiter}${replacement}${delimiter}${flags}`;

  return SED(input, sedCommand, options);
}

/**
 * Detection function for RexxJS library system
 * @returns {object} Library metadata
 */
function SED_FUNCTIONS_META() {
  return {
    library: 'sed-functions',
    version: '1.0.0',
    description: 'Stream editing and text transformation functions',
    functions: ['SED', 'SED_SUBSTITUTE'],
    dependencies: ['sed-lite'],
    environment: ['nodejs', 'browser']
  };
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SED,
    SED_SUBSTITUTE,
    SED_FUNCTIONS_META
  };
}
