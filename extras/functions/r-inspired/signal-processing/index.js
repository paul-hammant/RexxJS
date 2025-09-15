/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const rSignalFunctions = require('./r-signal-functions');
const rTimeseriesFunctions = require('./r-timeseries-functions');

const signalProcessingFunctions = {
  ...rSignalFunctions,
  ...rTimeseriesFunctions
};

function SIGNAL_PROCESSING_MAIN() {
  return {
    type: 'function-library',
    name: 'R Signal Processing Functions',
    version: '1.0.0',
    provides: {
      functions: Object.keys(signalProcessingFunctions),
      categories: ['signal-processing', 'time-series', 'digital-signal-processing', 'fourier-transform', 'filtering']
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...signalProcessingFunctions,
    SIGNAL_PROCESSING_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, signalProcessingFunctions);
  window.SIGNAL_PROCESSING_MAIN = SIGNAL_PROCESSING_MAIN;
}