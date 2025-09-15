/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const rMatrixFunctions = require('./r-matrix-functions');
const rRegressionFunctions = require('./r-regression-functions');
const rMlFunctions = require('./r-ml-functions');
const rOptimizationFunctions = require('./r-optimization-functions');

const advancedAnalyticsFunctions = {
  ...rMatrixFunctions,
  ...rRegressionFunctions,
  ...rMlFunctions,
  ...rOptimizationFunctions
};

function ADVANCED_ANALYTICS_MAIN() {
  return {
    type: 'function-library',
    name: 'R Advanced Analytics Functions',
    version: '1.0.0',
    provides: {
      functions: Object.keys(advancedAnalyticsFunctions),
      categories: ['matrix-operations', 'linear-algebra', 'regression', 'machine-learning', 'optimization']
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...advancedAnalyticsFunctions,
    ADVANCED_ANALYTICS_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, advancedAnalyticsFunctions);
  window.ADVANCED_ANALYTICS_MAIN = ADVANCED_ANALYTICS_MAIN;
}