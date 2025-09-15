/**
 * Global Interpolation Configuration
 * Configurable string interpolation patterns for RexxJS
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/**
 * Predefined interpolation patterns for common use cases
 */
const INTERPOLATION_PATTERNS = {
  // Standard RexxJS pattern: {variable}
  rexx: {
    name: 'rexx',
    regex: /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    startDelim: '{',
    endDelim: '}',
    hasDelims: (str) => str.includes('{'),
    extractVar: (match) => match.slice(1, -1)
  },
  
  // Double curly braces: {{variable}}
  handlebars: {
    name: 'handlebars',
    regex: /\{\{([^}]+)\}\}/g,
    startDelim: '{{',
    endDelim: '}}',
    hasDelims: (str) => str.includes('{{'),
    extractVar: (match) => match.slice(2, -2)
  },
  
  // Dollar sign with braces: ${variable}
  shell: {
    name: 'shell',
    regex: /\$\{([^}]+)\}/g,
    startDelim: '${',
    endDelim: '}',
    hasDelims: (str) => str.includes('${'),
    extractVar: (match) => match.slice(2, -1)
  },
  
  // Percent signs: %variable%
  batch: {
    name: 'batch',
    regex: /%([^%]+)%/g,
    startDelim: '%',
    endDelim: '%',
    hasDelims: (str) => str.includes('%'),
    extractVar: (match) => match.slice(1, -1)
  },
  
  // Double dollar: $$variable$$
  custom: {
    name: 'custom',
    regex: /\$\$([^$]+)\$\$/g,
    startDelim: '$$',
    endDelim: '$$',
    hasDelims: (str) => str.includes('$$'),
    extractVar: (match) => match.slice(2, -2)
  },
  
  // Square brackets: [variable]
  brackets: {
    name: 'brackets',
    regex: /\[([^\]]+)\]/g,
    startDelim: '[',
    endDelim: ']',
    hasDelims: (str) => str.includes('['),
    extractVar: (match) => match.slice(1, -1)
  }
};

/**
 * Global interpolation configuration state
 */
let currentPattern = INTERPOLATION_PATTERNS.rexx; // Default to RexxJS pattern

/**
 * Get the current interpolation pattern configuration
 * @returns {Object} Current pattern configuration
 */
function getCurrentPattern() {
  return currentPattern;
}

/**
 * Set the global interpolation pattern
 * @param {string|Object} pattern - Pattern name or custom pattern object
 * @returns {Object} The configured pattern
 */
function setInterpolationPattern(pattern) {
  if (typeof pattern === 'string') {
    const predefinedPattern = INTERPOLATION_PATTERNS[pattern.toLowerCase()];
    if (!predefinedPattern) {
      throw new Error(`Unknown interpolation pattern: ${pattern}. Available patterns: ${Object.keys(INTERPOLATION_PATTERNS).join(', ')}`);
    }
    currentPattern = predefinedPattern;
  } else if (typeof pattern === 'object' && pattern !== null) {
    // Validate custom pattern object
    const required = ['name', 'regex', 'startDelim', 'endDelim', 'hasDelims', 'extractVar'];
    for (const prop of required) {
      if (!(prop in pattern)) {
        throw new Error(`Custom pattern missing required property: ${prop}`);
      }
    }
    currentPattern = { ...pattern };
  } else {
    throw new Error('Pattern must be a string name or pattern object');
  }
  
  return currentPattern;
}

/**
 * Reset to default RexxJS pattern
 */
function resetToDefault() {
  currentPattern = INTERPOLATION_PATTERNS.rexx;
  return currentPattern;
}

/**
 * Get all available predefined patterns
 * @returns {Object} All predefined patterns
 */
function getAvailablePatterns() {
  return { ...INTERPOLATION_PATTERNS };
}

/**
 * Create a custom interpolation pattern
 * @param {string} name - Pattern name
 * @param {string} startDelim - Start delimiter (e.g., '{{')
 * @param {string} endDelim - End delimiter (e.g., '}}')
 * @returns {Object} Custom pattern configuration
 */
function createCustomPattern(name, startDelim, endDelim) {
  // Escape special regex characters in delimiters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedStart = escapeRegex(startDelim);
  const escapedEnd = escapeRegex(endDelim);
  
  // For better matching, we'll use a more specific approach
  // If the end delimiter is a single character, use character class exclusion
  // Otherwise, use a more complex pattern that matches until the full end delimiter
  let regexPattern;
  if (endDelim.length === 1) {
    regexPattern = `${escapedStart}([^${escapeRegex(endDelim)}]+)${escapedEnd}`;
  } else {
    // For multi-character delimiters, use a non-greedy approach
    regexPattern = `${escapedStart}(.*?)${escapedEnd}`;
  }
  
  return {
    name,
    regex: new RegExp(regexPattern, 'g'),
    startDelim,
    endDelim,
    hasDelims: (str) => str.includes(startDelim),
    extractVar: (match) => match.slice(startDelim.length, -endDelim.length)
  };
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    INTERPOLATION_PATTERNS,
    getCurrentPattern,
    setInterpolationPattern,
    resetToDefault,
    getAvailablePatterns,
    createCustomPattern
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  const InterpolationConfig = {
    INTERPOLATION_PATTERNS,
    getCurrentPattern,
    setInterpolationPattern,
    resetToDefault,
    getAvailablePatterns,
    createCustomPattern
  };
  
  window.InterpolationConfig = InterpolationConfig;
}