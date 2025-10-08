/*!
 * Enhanced Pattern Matching Functions
 *
 * Provides full glob pattern support using minimatch library.
 * @rexxjs-meta=MINIMATCH_FUNCTIONS_META
 *
 * IMPORTANT: Requiring this module REPLACES the built-in LS and FIND functions
 * with enhanced versions that support advanced glob patterns.
 *
 * Advanced patterns supported:
 * - Character classes
 * - Brace expansion
 * - Negation patterns
 * - Extended globs
 *
 * Usage:
 *   REQUIRE "extras/functions/minimatch/minimatch-functions"
 */

const { minimatch } = require('minimatch');

/**
 * Enhanced LS with full minimatch support
 * Overrides the core LS function with advanced pattern matching
 */
function LS_ENHANCED(pathArg, recursive = false, pattern = null, type = null) {
  // Import the core LS function
  const shellFunctions = require('../../../core/src/shell-functions');
  const coreLS = shellFunctions.LS;

  // If no pattern or simple pattern, use core LS
  if (!pattern || isSimplePattern(pattern)) {
    return coreLS(pathArg, recursive, pattern, type);
  }

  // Get all files without pattern filter
  const allFiles = coreLS(pathArg, recursive, null, type);

  // Apply minimatch pattern matching
  return allFiles.filter(fileInfo => minimatch(fileInfo.name, pattern, {
    dot: true,  // Match dotfiles
    nocase: false  // Case-sensitive by default
  }));
}

/**
 * Enhanced FIND with full minimatch support
 * Overrides the core FIND function with advanced pattern matching
 */
function FIND_ENHANCED(pathArg = '.', type = null, name = null, modifiedWithin = null, minSize = null, maxSize = null) {
  // Import the core FIND function
  const shellFunctions = require('../../../core/src/shell-functions');
  const coreFIND = shellFunctions.FIND;

  // If no name pattern or simple pattern, use core FIND
  if (!name || isSimplePattern(name)) {
    return coreFIND(pathArg, type, name, modifiedWithin, minSize, maxSize);
  }

  // Get all files without name filter
  const allFiles = coreFIND(pathArg, type, null, modifiedWithin, minSize, maxSize);

  // Apply minimatch pattern matching
  return allFiles.filter(fileInfo => minimatch(fileInfo.name, name, {
    dot: true,
    nocase: false
  }));
}

/**
 * Check if pattern is simple (only * and ?)
 * Simple patterns are handled efficiently by core functions
 */
function isSimplePattern(pattern) {
  // Check if pattern contains advanced glob features
  const hasAdvanced = /[\[\]\{\}\(\)\!]/.test(pattern);
  return !hasAdvanced;
}

/**
 * Direct minimatch function for use in REXX scripts
 *
 * @param {string} filename - Filename to test
 * @param {string} pattern - Glob pattern
 * @param {boolean} ignoreCase - Case-insensitive matching
 * @returns {boolean} True if matches
 */
function MINIMATCH(filename, pattern, ignoreCase = false) {
  return minimatch(filename, pattern, {
    nocase: ignoreCase,
    dot: true
  });
}

// Export enhanced functions at top level to replace built-ins
module.exports = {
  LS: LS_ENHANCED,
  FIND: FIND_ENHANCED,
  MINIMATCH,
  MINIMATCH_FUNCTIONS_META: function() {
    return {
      name: "minimatch-functions",
      version: "1.0.0",
      description: "Enhanced pattern matching with full glob support",
      dependencies: ["minimatch"],
      enhances: ["LS", "FIND"],
      functions: ["LS", "FIND", "MINIMATCH"]
    };
  }
};
