/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const rDatetimeFunctions = require('./r-datetime-functions');
const rFactorFunctions = require('./r-factor-functions');

const dataTypesFunctions = {
  ...rDatetimeFunctions,
  ...rFactorFunctions
};

function DATA_TYPES_MAIN() {
  return {
    type: 'function-library',
    name: 'R Data Types Functions',
    version: '1.0.0',
    provides: {
      functions: Object.keys(dataTypesFunctions),
      categories: ['datetime', 'date-time', 'factors', 'categorical-data', 'temporal-data']
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...dataTypesFunctions,
    DATA_TYPES_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, dataTypesFunctions);
  window.DATA_TYPES_MAIN = DATA_TYPES_MAIN;
}