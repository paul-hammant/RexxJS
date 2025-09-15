/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * R-style Mathematical and Statistical Functions for RexxJS
 * 
 * This module exports mathematical, statistical, and logical functions
 * compatible with R programming language conventions.
 */

const rMathFunctions = require('./r-math-functions');
const rSummaryFunctions = require('./r-summary-functions'); 
const rLogicalFunctions = require('./r-logical-functions');

// Combine all functions into a single export
const mathStatsFunctions = {
  ...rMathFunctions,
  ...rSummaryFunctions,
  ...rLogicalFunctions
};

// Function library metadata
function MATH_STATS_MAIN() {
  return {
    type: 'function-library',
    name: 'R Mathematical and Statistical Functions',
    version: '1.0.0',
    description: 'R-style mathematical, statistical, and logical functions',
    provides: {
      functions: Object.keys(mathStatsFunctions),
      categories: ['mathematics', 'statistics', 'logical-operations']
    },
    dependencies: [],
    loaded: true
  };
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    ...mathStatsFunctions,
    MATH_STATS_MAIN
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  Object.assign(window, mathStatsFunctions);
  window.MATH_STATS_MAIN = MATH_STATS_MAIN;
}