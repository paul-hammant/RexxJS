/**
 * ADDRESS Command Handler
 *
 * Handles ADDRESS, ADDRESS_WITH_STRING, SIGNAL, and SIGNAL_JUMP command execution.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

(function() {
'use strict';

/**
 * Execute ADDRESS command - change current address target
 * @param {Object} command - ADDRESS command object
 * @param {Object} interpreter - Interpreter instance with address-related state
 */
function executeAddressCommand(command, interpreter) {
  interpreter.address = command.target.toLowerCase();
  // Clear lines state when switching to default
  if (interpreter.address === 'default') {
    interpreter.addressLinesCount = 0;
    interpreter.addressLinesBuffer = [];
    interpreter.addressLinesStartLine = 0;
  }
}

/**
 * Execute ADDRESS_WITH_STRING command - set address and execute command string
 * @param {Object} command - ADDRESS_WITH_STRING command object
 * @param {Object} interpreter - Interpreter instance
 * @returns {Promise<void>}
 */
async function executeAddressWithStringCommand(command, interpreter) {
  interpreter.address = command.target.toLowerCase();
  await interpreter.executeQuotedString({ type: 'QUOTED_STRING', value: command.commandString });
}

/**
 * Execute SIGNAL command - setup error handler or jump to label
 * @param {Object} command - SIGNAL command object
 * @param {Object} interpreter - Interpreter instance
 * @param {Object} errorHandlingUtils - Error handling utilities
 * @returns {Object|undefined} Jump result if this is a SIGNAL jump
 */
function executeSignalCommand(command, interpreter, errorHandlingUtils) {
  if (command.action === 'ON' || command.action === 'OFF') {
    errorHandlingUtils.setupErrorHandler(
      command.condition,
      command.action,
      command.label,
      interpreter.errorHandlers
    );
  } else if (command.label) {
    // Basic SIGNAL jump
    return interpreter.jumpToLabel(command.label);
  }
}

/**
 * Execute SIGNAL_JUMP command - unconditional jump to label
 * @param {Object} command - SIGNAL_JUMP command object
 * @param {Object} interpreter - Interpreter instance
 * @returns {Object} Jump result
 */
function executeSignalJumpCommand(command, interpreter) {
  return interpreter.jumpToLabel(command.label);
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    executeAddressCommand,
    executeAddressWithStringCommand,
    executeSignalCommand,
    executeSignalJumpCommand
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - register in registry to avoid conflicts
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  if (!window.rexxModuleRegistry.has('commandAddress')) {
    window.rexxModuleRegistry.set('commandAddress', {
      executeAddressCommand,
      executeAddressWithStringCommand,
      executeSignalCommand,
      executeSignalJumpCommand
    });
  }
}

})(); // End IIFE
