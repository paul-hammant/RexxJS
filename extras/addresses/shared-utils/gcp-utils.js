/* Shared GCP utility functions for handlers */

/**
 * Parse key=value parameters from command string
 * Supports both quoted and unquoted values: key="value" or key=value
 * For unquoted values, captures until the next key= pattern or end of string
 */
const parseKeyValueParams = (paramString) => {
  const params = {};
  // Support both quoted and unquoted values: key="value" or key=value
  // For unquoted values, capture until the next key= pattern or end of string
  const regex = /(\w+)=(?:["']([^"']*)["']|([^"'\s]\S*(?:\s+(?!\w+=)[^\s]\S*)*))/g;
  let match;

  while ((match = regex.exec(paramString)) !== null) {
    params[match[1]] = match[2] || match[3]; // Use quoted value (match[2]) or unquoted (match[3])
  }

  return params;
};

module.exports = {
  parseKeyValueParams
};
