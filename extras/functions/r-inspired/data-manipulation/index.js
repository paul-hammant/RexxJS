/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * R-style Data Manipulation Functions for RexxJS
 * 
 * This module exports data manipulation, transformation, and processing functions
 * compatible with R programming language conventions.
 */

const rDataframeFunctions = require('./r-dataframe-functions');
const rDataFunctions = require('./r-data-functions'); 
const rApplyStringFunctions = require('./r-apply-string-functions');
const rSetFunctions = require('./r-set-functions');

// Combine all functions into a single export
const dataManipulationFunctions = {
  ...rDataframeFunctions,
  ...rDataFunctions,
  ...rApplyStringFunctions,
  ...rSetFunctions
};

// Function library metadata
function DATA_MANIPULATION_MAIN() {
  return {
    type: 'function-library',
    name: 'R Data Manipulation Functions',
    version: '1.0.0',
    description: 'R-style data manipulation, transformation, and processing functions',
    provides: {
      functions: Object.keys(dataManipulationFunctions),
      categories: ['data-manipulation', 'dataframes', 'strings', 'sets', 'transformation']
    },
    dependencies: [],
    loaded: true
  };
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    ...dataManipulationFunctions,
    DATA_MANIPULATION_MAIN
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  Object.assign(window, dataManipulationFunctions);
  window.DATA_MANIPULATION_MAIN = DATA_MANIPULATION_MAIN;
}