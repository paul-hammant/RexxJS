/* eslint-env browser */
'use strict';

// Global registry for safe module loading in browser environment
if (typeof window !== 'undefined' && !window.rexxModuleRegistry) {
  window.rexxModuleRegistry = new Map();
}

// Conditional loading for Node.js/browser compatibility
let parseQuotedParts, interpolateString, evaluateConcatenation;
let compareValues, isTruthy, isLikelyFunctionName, isNumericString, basicBase64Encode, basicBase64Decode;
let executionContextUtils;
let variableStackUtils;
let controlFlowUtils;
let errorHandlingUtils;
let parseSubroutineUtils;
let traceFormattingUtils;
let libraryUrlUtils;
let expressionValueUtils;
let domManagerUtils;
let libraryManagementUtils;
let utils;
let security;
let stringUtils;

if (typeof require !== 'undefined') {
  const stringProcessing = require('./interpreter-string-and-expression-processing.js');
  parseQuotedParts = stringProcessing.parseQuotedParts;
  interpolateString = stringProcessing.interpolateString;
  evaluateConcatenation = stringProcessing.evaluateConcatenation;
  
  const evaluationUtils = require('./interpreter-evaluation-utilities.js');
  compareValues = evaluationUtils.compareValues;
  isTruthy = evaluationUtils.isTruthy;
  isLikelyFunctionName = evaluationUtils.isLikelyFunctionName;
  isNumericString = evaluationUtils.isNumericString;
  basicBase64Encode = evaluationUtils.basicBase64Encode;
  basicBase64Decode = evaluationUtils.basicBase64Decode;
  
  executionContextUtils = require('./interpreter-execution-context.js');
  variableStackUtils = require('./interpreter-variable-stack.js');
  controlFlowUtils = require('./interpreter-control-flow.js');
  errorHandlingUtils = require('./interpreter-error-handling.js');
  parseSubroutineUtils = require('./interpreter-parse-subroutine.js');
  traceFormattingUtils = require('./interpreter-trace-formatting.js');
  libraryUrlUtils = require('./interpreter-library-url.js');
  expressionValueUtils = require('./interpreter-expression-value-resolution.js');
  domManagerUtils = require('./interpreter-dom-manager.js');
  libraryManagementUtils = require('./interpreter-library-management.js');
  utils = require('./utils.js');
  security = require('./security.js');
  stringUtils = require('./string-processing.js');
} else {
  // Browser environment - pull from registry and setup window globals
  const registry = window.rexxModuleRegistry;
  
  // String processing functions
  if (registry.has('stringProcessing')) {
    const stringProcessing = registry.get('stringProcessing');
    parseQuotedParts = stringProcessing.parseQuotedParts;
    interpolateString = stringProcessing.interpolateString;
    evaluateConcatenation = stringProcessing.evaluateConcatenation;
    
    // Set up window globals for backward compatibility
    window.parseQuotedParts = parseQuotedParts;
    window.interpolateString = interpolateString;
    window.evaluateConcatenation = evaluateConcatenation;
  }
  
  // Evaluation utilities
  if (registry.has('evaluationUtils')) {
    const evaluationUtils = registry.get('evaluationUtils');
    compareValues = evaluationUtils.compareValues;
    isTruthy = evaluationUtils.isTruthy;
    isLikelyFunctionName = evaluationUtils.isLikelyFunctionName;
    isNumericString = evaluationUtils.isNumericString;
    basicBase64Encode = evaluationUtils.basicBase64Encode;
    basicBase64Decode = evaluationUtils.basicBase64Decode;
    
    // Set up window globals for backward compatibility
    window.compareValues = compareValues;
    window.isTruthy = isTruthy;
    window.isLikelyFunctionName = isLikelyFunctionName;
    window.isNumericString = isNumericString;
    window.basicBase64Encode = basicBase64Encode;
    window.basicBase64Decode = basicBase64Decode;
  }
  
  // Execution context utilities
  if (registry.has('executionContext')) {
    const executionContext = registry.get('executionContext');
    executionContextUtils = executionContext;
    
    // Set up window globals for backward compatibility
    Object.assign(window, executionContext);
  } else {
    executionContextUtils = {
      pushExecutionContext: window.pushExecutionContext,
      popExecutionContext: window.popExecutionContext,
      getCurrentExecutionContext: window.getCurrentExecutionContext,
      getInterpretContext: window.getInterpretContext,
      getCurrentLineNumber: window.getCurrentLineNumber,
      updateCurrentContextLine: window.updateCurrentContextLine
    };
  }
  
  // Variable stack utilities
  if (registry.has('variableStack')) {
    const variableStack = registry.get('variableStack');
    variableStackUtils = variableStack;
    
    // Set up window globals for backward compatibility
    Object.assign(window, variableStack);
  } else {
    variableStackUtils = {
      resolveVariableValue: window.resolveVariableValue,
      interpolateStringWithVars: window.interpolateStringWithVars,
      getVariable: window.getVariable,
      setVariable: window.setVariable,
      stackPush: window.stackPush,
      stackPull: window.stackPull,
      stackQueue: window.stackQueue,
      stackSize: window.stackSize,
      stackPeek: window.stackPeek,
      stackClear: window.stackClear,
      executePush: window.executePush,
      executePull: window.executePull,
      executeQueue: window.executeQueue
    };
  }
  
  // Control flow utilities
  if (registry.has('controlFlow')) {
    const controlFlow = registry.get('controlFlow');
    controlFlowUtils = controlFlow;
    
    // Set up window globals for backward compatibility
    Object.assign(window, controlFlow);
  } else {
    controlFlowUtils = {
      executeIfStatement: window.executeIfStatement,
      executeDoStatement: window.executeDoStatement,
      executeRangeLoop: window.executeRangeLoop,
      executeRangeLoopWithStep: window.executeRangeLoopWithStep,
      executeWhileLoop: window.executeWhileLoop,
      executeRepeatLoop: window.executeRepeatLoop,
      executeOverLoop: window.executeOverLoop,
      executeSelectStatement: window.executeSelectStatement
    };
  }
  
  // Error handling utilities
  if (registry.has('errorHandling')) {
    const errorHandling = registry.get('errorHandling');
    errorHandlingUtils = errorHandling;
    
    // Set up window globals for backward compatibility
    Object.assign(window, errorHandling);
  } else {
    errorHandlingUtils = {
      handleError: window.handleError,
      getCommandText: window.getCommandText,
      getCurrentFunctionName: window.getCurrentFunctionName,
      jumpToLabel: window.jumpToLabel,
      discoverLabels: window.discoverLabels,
      setupErrorHandler: window.setupErrorHandler,
      shouldHandleError: window.shouldHandleError
    };
  }
  
  // Parse subroutine utilities
  if (registry.has('parseSubroutine')) {
    const parseSubroutine = registry.get('parseSubroutine');
    parseSubroutineUtils = parseSubroutine;
    
    // Set up window globals for backward compatibility
    Object.assign(window, parseSubroutine);
  } else {
    parseSubroutineUtils = {
      executeParse: window.executeParse,
      parseTemplate: window.parseTemplate,
      discoverSubroutines: window.discoverSubroutines,
      executeCall: window.executeCall,
      isExternalScriptCall: window.isExternalScriptCall
    };
  }
  
  // Trace formatting utilities
  if (registry.has('traceFormatting')) {
    const traceFormatting = registry.get('traceFormatting');
    traceFormattingUtils = traceFormatting;
    
    // Set up window globals for backward compatibility
    Object.assign(window, traceFormatting);
  } else {
    traceFormattingUtils = {
      executeTrace: window.executeTrace,
      addTraceOutput: window.addTraceOutput,
      getTraceOutput: window.getTraceOutput,
      clearTraceOutput: window.clearTraceOutput,
      formatDate: window.formatDate,
      formatTime: window.formatTime,
      formatDateTime: window.formatDateTime,
      setNumericSetting: window.setNumericSetting
    };
  }
  
  libraryUrlUtils = {
    isLocalOrNpmModule: window.isLocalOrNpmModule,
    getLibraryType: window.getLibraryType,
    getLibraryRepository: window.getLibraryRepository,
    getLibraryTag: window.getLibraryTag,
    getLibraryPath: window.getLibraryPath,
    shouldUseGitHubRelease: window.shouldUseGitHubRelease,
    resolveGitHubRawUrl: window.resolveGitHubRawUrl,
    resolveWebLibraryUrl: window.resolveWebLibraryUrl,
    getLibrarySources: window.getLibrarySources,
    shouldTryCDN: window.shouldTryCDN,
    getCDNSources: window.getCDNSources,
    getGitHubReleaseSources: window.getGitHubReleaseSources
  };
  
  // Expression value utilities
  if (registry.has('expressionValue')) {
    const expressionValue = registry.get('expressionValue');
    expressionValueUtils = expressionValue;
    
    // Set up window globals for backward compatibility
    Object.assign(window, expressionValue);
  } else {
    expressionValueUtils = {
      resolveValue: window.resolveValue,
      evaluateExpression: window.evaluateExpression,
      evaluateCondition: window.evaluateCondition
    };
  }
  
  // DOM manager utilities
  if (registry.has('domManager')) {
    const domManager = registry.get('domManager');
    domManagerUtils = domManager;
    
    // Set up window globals for backward compatibility
    Object.assign(window, domManager);
  } else {
    domManagerUtils = {
      initializeDOMManager: window.initializeDOMManager,
      executeRetryOnStale: window.executeRetryOnStale,
      isDOMAvailable: window.isDOMAvailable,
      isDOMElementManagerAvailable: window.isDOMElementManagerAvailable
    };
  }
  
  libraryManagementUtils = {
    requireWithDependencies: window.requireWithDependencies,
    isLibraryLoaded: window.isLibraryLoaded,
    getDependencyInfo: window.getDependencyInfo,
    getLoadOrder: window.getLoadOrder,
    validateNoCycles: window.validateNoCycles,
    clearLibraryCache: window.clearLibraryCache,
    getCacheInfo: window.getCacheInfo,
    validateLoadingQueue: window.validateLoadingQueue,
    updateLoadingStatus: window.updateLoadingStatus
  };
  
  utils = {
    generateRequestId: window.generateRequestId,
    isBuiltinLibrary: window.isBuiltinLibrary,
    detectEnvironment: window.detectEnvironment
  };
  
  security = {
    createMissingFunctionError: window.createMissingFunctionError,
    assessRiskLevel: window.assessRiskLevel,
    getBlockedRepositories: window.getBlockedRepositories,
    validateGitHubLibrary: window.validateGitHubLibrary
  };
  
  // String processing utilities
  if (registry.has('stringProcessingUtils')) {
    const stringProcessingUtils = registry.get('stringProcessingUtils');
    stringUtils = stringProcessingUtils;
    
    // Set up window globals for backward compatibility
    Object.assign(window, stringProcessingUtils);
  } else {
    stringUtils = {
      callConvertParamsToArgs: window.callConvertParamsToArgs,
      executeBrowserStringFunction: window.executeBrowserStringFunction
    };
  }
}

/**
 * @fileoverview Browser-compatible Rexx interpreter - no Node.js dependencies
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Global registry for library detection functions
const LIBRARY_DETECTION_REGISTRY = new Map();

// Self-registration function for libraries
function registerLibraryDetectionFunction(libraryName, detectionFunctionName) {
  LIBRARY_DETECTION_REGISTRY.set(libraryName, detectionFunctionName);
}

// Make registration function globally available
if (typeof window !== 'undefined') {
  window.registerLibraryDetectionFunction = registerLibraryDetectionFunction;
} else if (typeof global !== 'undefined') {
  global.registerLibraryDetectionFunction = registerLibraryDetectionFunction;
}

// Import parameter converter
function callConvertParamsToArgs(functionName, params) {
  return stringUtils.callConvertParamsToArgs(functionName, params);
}

// RexxError class for non-assertion errors with source context
class RexxError extends Error {
  constructor(message, type = 'REXX', sourceContext = null) {
    super(message);
    this.name = 'RexxError';
    this.type = type;
    this.sourceContext = sourceContext;
    
    // Format the message with source context if available
    if (sourceContext && sourceContext.lineNumber && sourceContext.sourceLine) {
      const filename = sourceContext.sourceFilename || 'unknown';
      const contextLine = sourceContext.sourceLine.trim();
      this.message = `Rexx ${type}: ${contextLine} (${filename}: ${sourceContext.lineNumber})\n${message}`;
    }
  }
}

class RexxInterpreterBuilder {
  constructor(addressSender) {
    this.addressSender = addressSender;
    this.options = {
      'dom-interop': true,
      'tracing': false,
      'numeric-digits': 9,
      'numeric-fuzz': 0,
      'numeric-form': 'SCIENTIFIC'
    };
    this.outputHandler = null;
  }
  
  withoutDomInterop() {
    this.options['dom-interop'] = false;
    return this;
  }
  
  withDomInterop(enabled = true) {
    this.options['dom-interop'] = enabled;
    return this;
  }
  
  withTracing(enabled = true) {
    this.options['tracing'] = enabled;
    return this;
  }
  
  withOutputHandler(handler) {
    this.outputHandler = handler;
    return this;
  }
  
  withNumericPrecision(digits) {
    this.options['numeric-digits'] = digits;
    return this;
  }
  
  withNumericFuzz(fuzz) {
    this.options['numeric-fuzz'] = fuzz;
    return this;
  }
  
  withNumericForm(form) {
    this.options['numeric-form'] = form;
    return this;
  }
  
  build() {
    return new RexxInterpreter(this.addressSender, this.options, this.outputHandler);
  }
}

class RexxInterpreter {
  constructor(addressSender, optionsOrHandler = null, explicitOutputHandler = null) {
    this.addressSender = addressSender;
    
    // Handle different constructor signatures for backwards compatibility
    let outputHandler = null;
    let options = {};
    
    if (explicitOutputHandler !== null) {
      // New internal constructor: (rpcClient, options, outputHandler)
      options = optionsOrHandler || {};
      outputHandler = explicitOutputHandler;
    } else if (optionsOrHandler && typeof optionsOrHandler === 'object') {
      // Legacy: Check if it has output handler-like properties vs option-like properties
      if (typeof optionsOrHandler.output === 'function' || 
          typeof optionsOrHandler.handleOutput === 'function' ||
          typeof optionsOrHandler.log === 'function') {
        // This is an output handler
        outputHandler = optionsOrHandler;
      } else {
        // This is an options object
        options = optionsOrHandler;
        outputHandler = null;
      }
    } else if (typeof optionsOrHandler === 'function') {
      // Legacy: function passed as outputHandler
      outputHandler = optionsOrHandler;
    }
    
    // Store options for use throughout the interpreter
    this.options = {
      'dom-interop': true,
      'tracing': false,
      'numeric-digits': 9,
      'numeric-fuzz': 0,
      'numeric-form': 'SCIENTIFIC',
      ...options
    };
    
    // Set up output handler (defaults to simple console.log)
    if (outputHandler) {
      this.outputHandler = outputHandler;
    } else {
      // Default inline output handler - just console.log
      this.outputHandler = {
        output: (text) => console.log(text)
      };
    }
    
    this.address = 'default';  // Default namespace
    this.variables = new Map();
    this.builtInFunctions = this.initializeBuiltInFunctions();
    
    // ADDRESS MATCHING and LINES functionality
    this.addressMatchingPattern = null;
    this.addressLinesCount = 0;
    this.addressLinesBuffer = [];
    this.addressLinesStartLine = 0;
    
    // ADDRESS MATCHING MULTILINE functionality
    this.addressMultilineMode = false;
    this.addressCollectedLines = [];
    
    // ADDRESS target registry for REQUIRE'd service libraries
    this.addressTargets = new Map(); // targetName -> { handler: function, methods: object, metadata: object }
    
    // Library cache for Node.js environment
    this.libraryCache = new Map(); // libraryName -> { loaded: boolean, code: string, timestamp: number }
    
    // Dependency tracking
    this.dependencyGraph = new Map(); // libraryName -> { dependencies: [], dependents: [], loading: boolean }
    this.loadingQueue = new Set(); // Currently loading libraries to prevent infinite loops
    
    // Security and permissions
    this.securityPolicy = 'default'; // Security policy: strict, moderate, default, permissive
    this.approvedLibraries = new Set(); // Session-approved libraries for control-bus mode
    this.pendingPermissionRequests = new Map(); // requestId -> { resolve, reject, timeoutId }
    
    // Error handling state
    this.errorHandlers = new Map(); // condition -> {label, enabled}
    this.labels = new Map(); // label name -> command index
    this.currentCommands = []; // Currently executing commands
    this.executionStack = []; // For nested execution contexts
    
    // INTERPRET control
    this.interpretBlocked = false; // NO-INTERPRET flag
    
    // NUMERIC settings - use values from options
    this.numericSettings = {
      digits: this.options['numeric-digits'] || 9,      // Default precision
      fuzz: this.options['numeric-fuzz'] || 0,        // Digits ignored in arithmetic comparisons  
      form: this.options['numeric-form'] || 'SCIENTIFIC'  // SCIENTIFIC or ENGINEERING
    };
    
    // Initialize DOM Element Manager
    this.domManager = null;
    
    // Only initialize DOM manager if dom-interop is not explicitly disabled
    if (this.options['dom-interop'] !== false) {
      this.initializeDOMManager();
    }
    
    // Initialize security message handlers
    this.initializeSecurityHandlers();
    
    // Stack for PUSH/PULL/QUEUE operations
    this.stack = [];
    
    // Subroutine support
    this.subroutines = new Map(); // name -> {commands, parameters}
    this.callStack = []; // For nested subroutine calls
    this.returnValue = null; // Value returned from subroutine
    
    // TRACE support
    this.traceMode = 'OFF'; // OFF, A, R, I, O, NORMAL
    this.traceOutput = []; // Store trace output
    
    // DOM Element Manager for stale element handling
    this.domManager = null; // Will be initialized when DOM functions are used
    
    // RETRY_ON_STALE state
    this.retryOnStaleActive = false;
    
    // Source line tracking for error reporting
    this.sourceLines = []; // Store original source lines
    this.currentLineNumber = null; // Current executing line number (for backward compatibility)
    this.retryOnStaleTimeout = 10000;
    this.retryOnStalePreserved = new Map();
    
    // Execution context stack for proper nested execution tracking
    this.executionStack = [];
  }
  
  // Execution context stack management
  pushExecutionContext(type, lineNumber, sourceLine, sourceFilename, details = {}) {
    const context = executionContextUtils.pushExecutionContext(
      this.executionStack, type, lineNumber, sourceLine, sourceFilename, details
    );
    
    // Update current line number for backward compatibility
    this.currentLineNumber = lineNumber;
    return context;
  }
  
  popExecutionContext() {
    const popped = executionContextUtils.popExecutionContext(this.executionStack);
    
    // Update current line number from the new top of stack (or null if empty)
    this.currentLineNumber = executionContextUtils.getCurrentLineNumber(this.executionStack);
    
    return popped;
  }
  
  getCurrentExecutionContext() {
    return executionContextUtils.getCurrentExecutionContext(this.executionStack);
  }

  // Handle operation-specific result processing (override in subclasses for test-specific logic)
  handleOperationResult(result) {
    // Default implementation: no special handling
    // Subclasses like TestRexxInterpreter can override this for test-specific behavior
    return;
  }

  registerAddressTarget(name, target) {
    this.addressTargets.set(name, target);
  }
  
  getInterpretContext() {
    return executionContextUtils.getInterpretContext(this.executionStack);
  }
  
  // Static builder factory method
  static builder(rpcClient) {
    return new RexxInterpreterBuilder(rpcClient);
  }

  // Create interpreter-aware array functions that support pure-REXX callbacks
  createInterpreterAwareArrayFunctions(originalArrayFunctions) {
    const interpreterContext = this;
    
    return {
      ...originalArrayFunctions,
      'ARRAY_FILTER': async (array, filterExpression) => {
        try {
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));
          
          // Simple filter for non-null/undefined/empty values if no filterExpression
          if (!filterExpression) {
            return arr.filter(item => item != null && item !== '');
          }
          
          const expr = String(filterExpression).trim();
          
          // Check for pure-REXX callback syntax
          // Must NOT have JS syntax (=>, &&, ||, ===, !==) and MUST have REXX function calls or REXX operators
          const hasJSLogicalOps = expr.includes('&&') || expr.includes('||') || expr.includes('===') || expr.includes('!==');
          const hasRexxFunctions = expr.includes('pos(') || expr.includes('length(') || 
                                   expr.includes('upper(') || expr.includes('lower(') ||
                                   expr.includes('substr(') || expr.includes('word(');
          const hasRexxLogicalOps = (expr.includes(' & ') && !expr.includes('&&')) || 
                                   (expr.includes(' | ') && !expr.includes('||'));
          
          const isRexxCallback = !expr.includes('=>') && 
                                !expr.startsWith('function') && 
                                !hasJSLogicalOps &&
                                (hasRexxFunctions || hasRexxLogicalOps);
          
          if (isRexxCallback) {
            // Pure-REXX callback evaluation using a simpler approach
            const filteredResults = [];
            for (const item of arr) {
              try {
                // Save current item variable if it exists
                const originalItem = interpreterContext.variables.get('item');
                interpreterContext.variables.set('item', item);
                
                // Evaluate the REXX expression by treating it as a mini REXX script
                let result = await interpreterContext.evaluateRexxCallbackExpression(expr);
                
                // Restore original item variable
                if (originalItem !== undefined) {
                  interpreterContext.variables.set('item', originalItem);
                } else {
                  interpreterContext.variables.delete('item');
                }
                
                // Add item to results if condition is true
                if (!!result) {
                  filteredResults.push(item);
                }
              } catch (e) {
                console.debug('REXX callback evaluation failed:', e.message);
                // Don't add item to results if evaluation failed
              }
            }
            return filteredResults;
          }
          
          // Fall back to original ARRAY_FILTER implementation for JS callbacks and object expressions
          return originalArrayFunctions.ARRAY_FILTER(array, filterExpression);
        } catch (e) {
          return [];
        }
      },
      
      'ARRAY_FIND': async (array, searchProperty, searchValue) => {
        try {
          // Ensure we have the right data types
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));
          
          // Call original implementation with proper parameter resolution
          return originalArrayFunctions.ARRAY_FIND(arr, searchProperty, searchValue);
        } catch (e) {
          return null;
        }
      },
      
      'ARRAY_MAP': async (array, mapExpression) => {
        try {
          // Ensure we have the right data types  
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));
          
          // Call original implementation with proper parameter resolution
          return originalArrayFunctions.ARRAY_MAP(arr, mapExpression);
        } catch (e) {
          return [];
        }
      }
    };
  }
  
  initializeBuiltInFunctions() {
    // Import external function modules
    let importedStringFunctions = {};
    let importedMathFunctions = {};
    let importedJsonFunctions = {};
    let importedArrayFunctions = {};
    let importedDateTimeFunctions = {};
    let importedUrlFunctions = {};
    let importedRandomFunctions = {};
    let importedRegexFunctions = {};
    let importedValidationFunctions = {};
    let importedFileFunctions = {};
    let importedStatisticsFunctions = {};
    let importedLogicFunctions = {};
    let importedCryptoFunctions = {};
    let importedDomFunctions = {};
    let importedDataFunctions = {};
    let importedProbabilityFunctions = {};
    // R functions removed - use REQUIRE statements to load them
    try {
      if (typeof require !== 'undefined') {
        // command line mode (NodeJs) is allowed to use require() but the two web modes are not.
        // All these are co-located with interpreter.js in the main RexxJS project, we should
        // auto-load them if so (provisional decision).
        const { stringFunctions } = require('./string-functions');
        const { mathFunctions } = require('./math-functions');
        const { jsonFunctions } = require('./json-functions');
        const { arrayFunctions } = require('./array-functions');
        const { dateTimeFunctions } = require('./date-time-functions');
        const { urlFunctions } = require('./url-functions');
        const { randomFunctions } = require('./random-functions');
        const { regexFunctions } = require('./regex-functions');
        const { validationFunctions } = require('./validation-functions');
        const { fileFunctions } = require('./file-functions');
        // Excel functions are loaded via REQUIRE statement in REXX scripts
        // e.g., REQUIRE "../extras/functions/excel/excel-functions"
        const { statisticsFunctions } = require('./statistics-functions');
        const { logicFunctions } = require('./logic-functions');
        const { cryptoFunctions } = require('./cryptography-functions');
        const { domFunctions } = require('./dom-functions');
        const { dataFunctions } = require('./data-functions');
        const { probabilityFunctions } = require('./probability-functions');
        // R functions are now available via REQUIRE statements in user scripts
        // e.g., REQUIRE "r-inspired/math-stats" to load R math functions
        importedStringFunctions = stringFunctions;
        importedMathFunctions = mathFunctions;
        importedJsonFunctions = jsonFunctions;
        importedArrayFunctions = arrayFunctions;
        importedDateTimeFunctions = dateTimeFunctions;
        importedUrlFunctions = urlFunctions;
        importedRandomFunctions = randomFunctions;
        importedRegexFunctions = regexFunctions;
        importedValidationFunctions = validationFunctions;
        importedFileFunctions = fileFunctions;
        importedStatisticsFunctions = statisticsFunctions;
        importedLogicFunctions = logicFunctions;
        importedCryptoFunctions = cryptoFunctions;
        importedDomFunctions = domFunctions;
        importedDataFunctions = dataFunctions;
        importedProbabilityFunctions = probabilityFunctions;
        // R functions removed - use REQUIRE statements to load them
      } else if (typeof window !== 'undefined') {
        // Browser environment
        importedStringFunctions = window.stringFunctions || {};
        importedMathFunctions = window.mathFunctions || {};
        importedJsonFunctions = window.jsonFunctions || {};
        importedArrayFunctions = window.arrayFunctions || {};
        importedDateTimeFunctions = window.dateTimeFunctions || {};
        importedUrlFunctions = window.urlFunctions || {};
        importedRandomFunctions = window.randomFunctions || {};
        importedRegexFunctions = window.regexFunctions || {};
        importedValidationFunctions = window.validationFunctions || {};
        importedFileFunctions = window.fileFunctions || {};
        importedStatisticsFunctions = window.statisticsFunctions || {};
        importedLogicFunctions = window.logicFunctions || {};
        importedCryptoFunctions = window.cryptoFunctions || {};
        importedDomFunctions = window.domFunctions || {};
        importedDataFunctions = window.dataFunctions || {};
        importedProbabilityFunctions = window.probabilityFunctions || {};
        // R functions removed - use REQUIRE statements to load them
      }
    } catch (e) {
      console.warn('Could not import external functions:', e.message);
    }

    // Create interpreter-aware array functions for pure-REXX callback support
    const interpreterAwareArrayFunctions = this.createInterpreterAwareArrayFunctions(importedArrayFunctions);

    return {
      // Import external functions
      ...importedStringFunctions,
      ...importedMathFunctions,
      ...importedJsonFunctions,
      ...interpreterAwareArrayFunctions,
      ...importedDateTimeFunctions,
      ...importedUrlFunctions,
      ...importedRandomFunctions,
      ...importedRegexFunctions,
      ...importedValidationFunctions,
      ...importedFileFunctions,
      ...importedStatisticsFunctions,
      ...importedLogicFunctions,
      ...importedCryptoFunctions,
      ...importedDomFunctions,
      ...importedDataFunctions,
      ...importedProbabilityFunctions,
      // R functions removed - use REQUIRE statements to load them
      
      // Debug function for JavaScript introspection
      'JS_SHOW': (value) => {
        const output = [];
        output.push('=== JS_SHOW Debug Output ===');
        
        // Basic type info
        output.push(`Type: ${typeof value}`);
        output.push(`Constructor: ${value?.constructor?.name || 'N/A'}`);
        output.push(`String representation: ${String(value)}`);
        
        // JSON representation (if possible)
        try {
          output.push(`JSON: ${JSON.stringify(value, null, 2)}`);
        } catch (e) {
          output.push(`JSON: [Cannot stringify: ${e.message}]`);
        }
        
        // Object properties (if it's an object)
        if (typeof value === 'object' && value !== null) {
          output.push('Properties:');
          try {
            const keys = Object.keys(value);
            if (keys.length === 0) {
              output.push('  [No enumerable properties]');
            } else {
              keys.slice(0, 20).forEach(key => { // Limit to first 20 properties
                try {
                  const propValue = value[key];
                  const propType = typeof propValue;
                  output.push(`  ${key}: (${propType}) ${String(propValue).slice(0, 100)}`);
                } catch (e) {
                  output.push(`  ${key}: [Error accessing: ${e.message}]`);
                }
              });
              if (keys.length > 20) {
                output.push(`  ... and ${keys.length - 20} more properties`);
              }
            }
          } catch (e) {
            output.push(`  [Error getting properties: ${e.message}]`);
          }
          
          // Prototype chain
          try {
            const proto = Object.getPrototypeOf(value);
            output.push(`Prototype: ${proto?.constructor?.name || 'N/A'}`);
          } catch (e) {
            output.push(`Prototype: [Error: ${e.message}]`);
          }
        }
        
        // Array-like info
        if (value && typeof value.length !== 'undefined') {
          output.push(`Length: ${value.length}`);
          if (Array.isArray(value) || value.length < 10) {
            output.push('Array-like contents:');
            for (let i = 0; i < Math.min(value.length, 10); i++) {
              try {
                output.push(`  [${i}]: ${String(value[i]).slice(0, 100)}`);
              } catch (e) {
                output.push(`  [${i}]: [Error: ${e.message}]`);
              }
            }
            if (value.length > 10) {
              output.push(`  ... and ${value.length - 10} more items`);
            }
          }
        }
        
        // Function info
        if (typeof value === 'function') {
          output.push(`Function name: ${value.name || '[anonymous]'}`);
          output.push(`Function length (arity): ${value.length}`);
          const funcStr = value.toString();
          output.push(`Function source: ${funcStr.slice(0, 200)}${funcStr.length > 200 ? '...' : ''}`);
        }
        
        output.push('=== End JS_SHOW ===');
        
        // Console output for immediate visibility
        console.log(output.join('\n'));
        
        // Return the formatted output as a string for REXX
        return output.join('\n');
      },
      
      'TYPEOF': (value) => {
        return typeof value;
      },
      
      // String functions
      
      // Math functions
      
      // Modern Date/Time functions with timezone and format support
      
      // Date arithmetic functions
      
      
      // JSON Functions
      
      // Array/Object Access Functions
      
      
      // URL/Web Functions
      
      
      
      'BASE64_ENCODE': (string) => {
        try {
          // In browser environment, use btoa; in Node.js, use Buffer
          if (typeof btoa !== 'undefined') {
            return btoa(string);
          } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(string, 'utf8').toString('base64');
          } else {
            // Fallback - basic base64 implementation
            return basicBase64Encode(string);
          }
        } catch (e) {
          return '';
        }
      },
      
      'BASE64_DECODE': (string) => {
        try {
          // In browser environment, use atob; in Node.js, use Buffer
          if (typeof atob !== 'undefined') {
            return atob(string);
          } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(string, 'base64').toString('utf8');
          } else {
            // Fallback - basic base64 implementation
            return basicBase64Decode(string);
          }
        } catch (e) {
          return '';
        }
      },
      
      // UUID/ID Generation Functions
      
      
      
      
      
      // Enhanced String Functions
      
      
      
      
      
      
      

      // Array/Collection Functions













      // File System Functions (Browser-compatible with localStorage fallback)

      // Validation Functions

      // Math/Calculation Functions

      // Date/Time Functions
      // Duplicate NOW removed - using the version at line 61
      
      

      


      // Statistical Functions

      // Lookup Functions  



      // Error Context Functions - Available only within error handlers after SIGNAL ON ERROR
      'ERROR_LINE': () => {
        return this.errorContext?.line || 0;
      },

      'ERROR_MESSAGE': () => {
        return this.errorContext?.message || '';
      },

      'ERROR_STACK': () => {
        return this.errorContext?.stack || '';
      },

      'ERROR_FUNCTION': () => {
        return this.errorContext?.functionName || 'Unknown';
      },

      'ERROR_COMMAND': () => {
        return this.errorContext?.commandText || '';
      },

      'ERROR_VARIABLES': () => {
        if (!this.errorContext?.variables) {
          return '{}';
        }
        
        const vars = {};
        for (const [key, value] of this.errorContext.variables) {
          vars[key] = value;
        }
        return JSON.stringify(vars);
      },

      'ERROR_TIMESTAMP': () => {
        return this.errorContext?.timestamp || '';
      },

      'ERROR_DETAILS': () => {
        if (!this.errorContext) {
          return '{}';
        }
        
        return JSON.stringify({
          line: this.errorContext.line,
          message: this.errorContext.message,
          function: this.errorContext.functionName,
          command: this.errorContext.commandText,
          timestamp: this.errorContext.timestamp,
          hasStack: !!this.errorContext.stack
        });
      },
      
      // Dynamic Rexx execution
      'INTERPRET': async (rexxCode, options = {}) => {
        // Check if INTERPRET is blocked by NO-INTERPRET
        if (this.interpretBlocked) {
          throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
        }
        
        try {
          // Parse options
          const opts = typeof options === 'string' ? JSON.parse(options) : options;
          const shareVars = opts.shareVars !== false; // Default to true for compatibility
          const allowedVars = opts.allowedVars || null; // null means all vars
          
          // Convert escaped newlines to actual newlines
          const normalizedCode = String(rexxCode).replace(/\\n/g, '\n');
          
          // Import parser to compile the Rexx code
          const { parse } = require('./parser');
          const commands = parse(normalizedCode);
          
          // Create new interpreter instance for isolated execution
          const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
          
          // Share the same address context
          subInterpreter.address = this.address;
          
          // Share the same built-in functions and error handling state
          subInterpreter.builtInFunctions = this.builtInFunctions;
          subInterpreter.errorHandlers = new Map(this.errorHandlers);
          subInterpreter.labels = new Map(this.labels);
          subInterpreter.subroutines = new Map(this.subroutines);
          
          // Handle variable sharing
          if (shareVars) {
            if (allowedVars === null) {
              // Share all variables (classic Rexx behavior)
              for (const [key, value] of this.variables) {
                subInterpreter.variables.set(key, value);
              }
            } else if (Array.isArray(allowedVars)) {
              // Share only whitelisted variables
              for (const varName of allowedVars) {
                if (this.variables.has(varName)) {
                  subInterpreter.variables.set(varName, this.variables.get(varName));
                }
              }
            }
          }
          
          // Execute the interpreted code
          await subInterpreter.run(commands);
          
          // Copy back variables from sub-interpreter if sharing enabled
          if (shareVars) {
            if (allowedVars === null) {
              // Copy back all variables
              for (const [key, value] of subInterpreter.variables) {
                this.variables.set(key, value);
              }
            } else if (Array.isArray(allowedVars)) {
              // Copy back only whitelisted variables (strict whitelist mode)
              for (const varName of allowedVars) {
                if (subInterpreter.variables.has(varName)) {
                  this.variables.set(varName, subInterpreter.variables.get(varName));
                }
              }
            }
          }
          
          // Return success indicator
          return true;
        } catch (e) {
          throw new Error(`INTERPRET failed: ${e.message}`);
        }
      },
      
      // JavaScript execution - executes JS code in browser context
      'INTERPRET_JS': (jsCode, type = 'auto') => {
        if (typeof jsCode !== 'string') {
          throw new Error('INTERPRET_JS requires a string parameter');
        }
        
        // Check if INTERPRET is blocked by NO-INTERPRET
        if (this.interpretBlocked) {
          throw new Error('INTERPRET_JS is blocked by NO-INTERPRET directive');
        }
        
        try {
          // Create variable context from Rexx variables
          const context = Object.fromEntries(this.variables);
          
          // Get variable names and values for the function parameters
          // Filter out invalid variable names and convert values safely
          const varNames = [];
          const varValues = [];
          
          for (const [name, value] of Object.entries(context)) {
            // Only include valid JavaScript identifier names
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
              varNames.push(name);
              varValues.push(value);
            }
          }
          
          let result;
          const execType = (typeof type === 'string' ? type : 'auto').toLowerCase();
          
          switch (execType) {
            case 'expression':
              // Force expression mode - always wrap with return
              const exprFunc = new Function(...varNames, `return (${jsCode})`);
              result = exprFunc(...varValues);
              break;
              
            case 'statement':
              // Force statement mode - execute as-is
              const stmtFunc = new Function(...varNames, jsCode);
              result = stmtFunc(...varValues);
              break;
              
            case 'auto':
            default:
              // Try expression first, fall back to statement
              try {
                const func = new Function(...varNames, `return (${jsCode})`);
                result = func(...varValues);
              } catch (e) {
                // If expression fails, try as function body (for statements)
                try {
                  const func = new Function(...varNames, jsCode);
                  result = func(...varValues);
                } catch (e2) {
                  // If both fail, throw the expression error (more informative)
                  throw e;
                }
              }
              break;
          }
          
          return result !== undefined ? result : null;
        } catch (e) {
          throw new Error(`INTERPRET_JS failed: ${e.message}`);
        }
      },
      
      // Streaming control function for remote procedure control
      'CHECKPOINT': (...params) => {
        // If we have at least 2 parameters, set a variable with the first param as name
        if (params.length >= 2) {
          const variableName = String(params[0]);
          const variableValue = String(params[1]);
          this.variables.set(variableName, variableValue);
        }
        
        // Send progress update with parameters to streaming controller
        const progressData = {
          type: 'rexx-progress',
          timestamp: Date.now(),
          variables: Object.fromEntries(this.variables),
          params: params,
          line: this.currentLineNumber || 0
        };
        
        // If we have a streaming callback, use it (for streaming execution mode)
        if (this.streamingProgressCallback) {
          this.streamingProgressCallback(progressData);
        } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          // Default: send to parent window for cross-iframe communication
          window.parent.postMessage(progressData, '*');
        }
        
        // For now, return a default continue response synchronously
        // The real streaming control will be handled by the worker's override
        return {
          action: 'continue',
          message: 'Default continue response',
          timestamp: Date.now()
        };
      },

      // Graphics display command
      'SHOW': (value) => {
        // Check if value has an error (handle error case first)
        if (value && typeof value === 'object' && value.error) {
          return `Graphics error: ${value.error}`;
        }
        
        // Check if value is a valid graphics object
        if (value && typeof value === 'object' && value.type && 
            ['hist', 'scatter', 'boxplot', 'barplot', 'pie', 'qqplot', 'density', 'heatmap', 'contour', 'pairs'].includes(value.type)) {
          
          // Emit graphics event for display systems to handle
          if (this.options && this.options.onGraphics) {
            this.options.onGraphics(value);
          }
          
          // Also emit as custom event in browser
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rexx-graphics', { 
              detail: { 
                plotData: value,
                command: 'SHOW'
              } 
            }));
          }
          
          return `Displayed ${value.type} plot`;
        } else {
          return `SHOW: Not a graphics object (type: ${typeof value})`;
        }
      },

      // Library loading and dependency management
      'REQUIRE': async (libraryName, asClause = null) => {
        if (typeof libraryName !== 'string') {
          throw new Error('REQUIRE requires a string library name');
        }
        
        // Strip surrounding quotes if present (handles both single and double quotes)
        const cleanLibraryName = libraryName.replace(/^['"]|['"]$/g, '');
        let cleanAsClause = null;
        
        if (asClause !== null) {
          if (typeof asClause !== 'string') {
            throw new Error('AS clause must be a string');
          }
          cleanAsClause = asClause.replace(/^['"]|['"]$/g, '');
        }
        
        return await this.requireWithDependencies(cleanLibraryName, cleanAsClause);
      },

      // Stack Operations (PUSH/PULL/QUEUE functions)
      'STACK_PUSH': (value) => {
        return variableStackUtils.stackPush(value, this.stack);
      },

      'STACK_PULL': () => {
        return variableStackUtils.stackPull(this.stack);
      },

      'STACK_QUEUE': (value) => {
        return variableStackUtils.stackQueue(value, this.stack);
      },

      'STACK_SIZE': () => {
        return variableStackUtils.stackSize(this.stack);
      },

      'STACK_PEEK': () => {
        return variableStackUtils.stackPeek(this.stack);
      },

      'STACK_CLEAR': () => {
        return variableStackUtils.stackClear(this.stack);
      },
      
      // Reflection functions
      'SUBROUTINES': (pattern = null) => {
        const allSubroutines = Array.from(this.subroutines.keys());
        const patternStr = (pattern === null || pattern === undefined) ? null : String(pattern).trim();

        const results = allSubroutines
            .map(name => name.trim().toUpperCase())
            .filter(name => {
              if (name.length === 0) return false;
              if (patternStr === null || patternStr === '') return true;
              
              // Check if pattern contains regex metacharacters
              const regexChars = /[.*+?^${}()|[\]\\]/;
              if (regexChars.test(patternStr)) {
                // Treat as regex pattern (case-insensitive)
                try {
                  const regex = new RegExp(patternStr, 'i');
                  return regex.test(name);
                } catch (e) {
                  // If regex is invalid, fall back to substring matching
                  return name.includes(patternStr.toUpperCase());
                }
              } else {
                // Simple substring matching (original behavior)
                return name.includes(patternStr.toUpperCase());
              }
            });
        return results;
      },
      
    };
  }
  
  // Helper methods for date/time formatting
  formatDate(date, timezone = 'UTC', format = 'YYYY-MM-DD') {
    return traceFormattingUtils.formatDate(date, timezone, format);
  }
  
  formatTime(date, timezone = 'UTC', format = 'HH:MM:SS') {
    return traceFormattingUtils.formatTime(date, timezone, format);
  }
  
  formatDateTime(date, timezone = 'UTC', format = 'ISO') {
    return traceFormattingUtils.formatDateTime(date, timezone, format);
  }

  getVariable(name) {
    return variableStackUtils.getVariable(name, this.variables);
  }

  isExternalScriptCall(subroutineName) {
    return parseSubroutineUtils.isExternalScriptCall(subroutineName);
  }

  async run(commands, sourceText = '', sourceFilename = '') {
    // Store commands and discover labels and subroutines
    this.currentCommands = commands;
    errorHandlingUtils.discoverLabels(commands, this.labels);
    parseSubroutineUtils.discoverSubroutines(commands, this.subroutines);
    
    // Store source lines and filename for error reporting
    if (sourceText) {
      this.sourceLines = sourceText.replace(/\r\n/g, '\n').split('\n');
    }
    // Only set sourceFilename if it's provided and we don't already have one
    if (sourceFilename && !this.sourceFilename) {
      this.sourceFilename = sourceFilename;
    }
    
    try {
      return await this.executeCommands(commands);
    } catch (error) {
      // Handle EXIT statement termination
      if (error.isExit) {
        return { exitCode: error.exitCode, terminated: true };
      }
      
      // Only handle error at this level if it wasn't already handled at command level
      if (error.rexxUnhandled) {
        throw error; // Re-throw unhandled errors
      }
      // This shouldn't normally happen since errors should be caught at command level
      return await this.handleError(error);
    }
  }

  discoverLabels(commands) {
    errorHandlingUtils.discoverLabels(commands, this.labels);
  }

  async executeCommands(commands, startIndex = 0) {
    for (let i = startIndex; i < commands.length; i++) {
      const command = commands[i];
      
      
      
      // Track current line number for error reporting and push execution context
      if (command && command.lineNumber) {
        // Update execution context if line number changes
        const currentCtx = this.getCurrentExecutionContext();
        if (!currentCtx || currentCtx.lineNumber !== command.lineNumber) {
          const sourceLine = this.sourceLines && command.lineNumber ? 
            this.sourceLines[command.lineNumber - 1] || '' : '';
          
          // Don't push a new context if we're just updating the same main execution
          if (!currentCtx || currentCtx.type === 'main') {
            if (currentCtx && currentCtx.type === 'main') {
              // Update existing main context
              currentCtx.lineNumber = command.lineNumber;
              currentCtx.sourceLine = sourceLine;
              this.currentLineNumber = command.lineNumber;
            } else {
              // Push new main context
              this.pushExecutionContext('main', command.lineNumber, sourceLine, this.sourceFilename || '');
            }
          } else {
            // We're in a subroutine or other context - still update currentLineNumber for error reporting
            this.currentLineNumber = command.lineNumber;
          }
        }
      }
      
      // Check if LABEL should be handled as ADDRESS MATCHING before skipping as subroutine
      if (command.type === 'LABEL' && this.callStack.length === 0) {
        // First check if this should be handled as ADDRESS MATCHING
        if (this.address !== 'default' && this.addressMatchingPattern) {
          const originalLine = this.reconstructCommandAsLine(command);
          if (originalLine.trim()) {
            try {
              const regex = new RegExp(this.addressMatchingPattern);
              const match = regex.exec(originalLine);
              if (match) {
                // This line matches ADDRESS MATCHING pattern, execute it instead of skipping
                await this.executeCommand(command);
                continue;
              }
            } catch (error) {
              // If regex is invalid, fall through to normal subroutine skipping
            }
          }
        }
        
        // Skip subroutine bodies during main execution  
        // Skip to the end of this subroutine
        i++; // Skip the label
        while (i < commands.length) {
          const cmd = commands[i];
          if (cmd.type === 'LABEL') {
            i--; // Back up one so the outer loop will process this label
            break;
          }
          if (cmd.type === 'RETURN') {
            break; // Include the RETURN but don't execute it
          }
          i++;
        }
        continue;
      }
      
      try {
        const result = await this.executeCommand(command);
        if (result && result.jump) {
          // Handle SIGNAL jumps
          return result;
        }
        if (result && result.terminated) {
          // Handle EXIT (always terminates) or RETURN (only terminates if not in subroutine)
          if (result.type === 'EXIT' || this.callStack.length === 0) {
            return result;
          }
          // If we're in a subroutine, RETURN should bubble up to executeCall
          if (result.type === 'RETURN') {
            return result;
          }
        }
        if (result && result.skipCommands) {
          // Handle LINES command skipping - skip the next N commands
          i += result.skipCommands;
        }
      } catch (error) {
        const handled = await this.handleError(error, i);
        if (handled && handled.jump) {
          return handled;
        } else if (!handled) {
          // Check if this is a DOM/REXX-recognizable error and we have error handlers configured
          if (errorHandlingUtils.shouldHandleError(error, this.errorHandlers)) {
            // This is a DOM/REXX error and we have error handlers - handle gracefully
            // The error variables (RC, ERRORTEXT, SIGL) have already been set by handleError
            // Include line information in error message
            const currentCommand = this.currentCommands[i];
            const lineInfo = currentCommand && currentCommand.lineNumber 
              ? `Error at line ${currentCommand.lineNumber}: ${this.getCommandText(currentCommand)}`
              : `Error in command ${i + 1}`;
            console.log(`${lineInfo}\n${error.message}`);
            return { 
              terminated: true, 
              error: true, 
              exitCode: this.variables.get('RC') || 1,
              message: this.variables.get('ERRORTEXT') || error.message
            };
          } else {
            // Add line information to error message before re-throwing
            const currentCommand = this.currentCommands[i];
            if (currentCommand && currentCommand.lineNumber) {
              const lineInfo = `Error at line ${currentCommand.lineNumber}: ${this.getCommandText(currentCommand)}`;
              error.message = `${lineInfo}\n${error.message}`;
            }
            // Mark error as unhandled by adding a flag, then re-throw
            error.rexxUnhandled = true;
            throw error;
          }
        }
        // If handled but no jump, continue execution
      }
    }
    
    // Flush any remaining multiline content at end of execution
    if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
      const multilineContent = this.addressCollectedLines.join('\n');
      await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
      this.addressCollectedLines = [];
    }
    
    return null;
  }

  // Auto-detect multiline mode from ADDRESS MATCHING pattern
  shouldUseMultilineMode(pattern) {
    // Analyze the pattern to determine if multiline collection makes sense
    
    // Based on test expectations:
    // - Prefix patterns like "SQL: (.*)" should collect consecutive lines (multiline)
    // - Indentation patterns like "  (.*)" should collect consecutive lines (multiline)
    
    // Check for prefix patterns that should collect consecutive related lines
    if (pattern.match(/^[A-Z]+:\s*\(/) || pattern.match(/^\w+:\s*\(/)) {
      return true; // Multiline mode for SQL: patterns etc.
    }
    
    // Check for indentation patterns that should collect consecutive lines
    if (pattern.match(/^[\s\t]+\(/) || pattern.match(/^\^[\s\t]+/)) {
      return true; // Multiline mode for indentation patterns
    }
    
    // Default to single-line mode for other patterns
    return false;
  }

  // Browser-compatible string functions
  executeBrowserStringFunction(functionName, args) {
    return stringUtils.executeBrowserStringFunction(functionName, args);
  }

  async executeCommand(command) {
    // Add trace output for instruction execution
    this.addTraceOutput(`${command.type}`, 'instruction');
    
    switch (command.type) {
        case 'ADDRESS':
          // Flush any pending multiline content before changing address
          if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
            const multilineContent = this.addressCollectedLines.join('\n');
            await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
          }
          
          this.address = command.target.toLowerCase();
          // Clear matching pattern and lines state when switching to default or new target
          if (this.address === 'default') {
            this.addressMatchingPattern = null;
            this.addressLinesCount = 0;
            this.addressLinesBuffer = [];
            this.addressLinesStartLine = 0;
            this.addressMultilineMode = false;
            this.addressCollectedLines = [];
          }
          break;
          
        case 'ADDRESS_WITH_STRING':
          // Set the address target and execute the command string immediately
          this.address = command.target.toLowerCase();
          await this.executeQuotedString({ type: 'QUOTED_STRING', value: command.commandString });
          break;
          
        case 'ADDRESS_WITH_MATCHING':
          // Set the address target and store the matching pattern for subsequent lines
          this.address = command.target.toLowerCase();
          this.addressMatchingPattern = command.matchingPattern;
          
          // Auto-detect multiline mode from pattern
          if (this.shouldUseMultilineMode(command.matchingPattern)) {
            this.addressMultilineMode = true;
            this.addressCollectedLines = [];
          } else {
            this.addressMultilineMode = false;
            this.addressCollectedLines = [];
          }
          break;

          
        case 'ADDRESS_WITH_LINES':
          // Set the address target and capture raw source lines immediately, checking for ADDRESS interruption
          this.address = command.target.toLowerCase();
          this.addressMatchingPattern = null; // Clear any existing matching pattern
          
          // Capture the required number of raw source lines, but stop at ADDRESS commands
          const linesToCapture = [];
          const startLine = command.lineNumber || 0;
          let commandsToSkip = 0;
          
          for (let i = 1; i <= command.lineCount; i++) {
            const targetLineNumber = startLine + i;
            if (this.sourceLines && targetLineNumber > 0 && this.sourceLines[targetLineNumber - 1] !== undefined) {
              const rawLine = this.sourceLines[targetLineNumber - 1].trim();
              if (rawLine) {
                // Check if this line is an ADDRESS command that would interrupt
                if (rawLine.match(/^ADDRESS\s+/i)) {
                  break; // Stop capturing at ADDRESS command
                }
                linesToCapture.push(rawLine);
                commandsToSkip++;
              }
            }
          }
          
          // Send captured lines to the address handler immediately
          if (linesToCapture.length > 0) {
            const combinedMessage = linesToCapture.join('\n');
            await this.executeQuotedString({ type: 'QUOTED_STRING', value: combinedMessage });
          }
          
          // Reset to default address after capture
          this.address = 'default';
          
          // Return info to skip the captured commands from normal execution
          return { skipCommands: commandsToSkip };
          break;
        
        case 'SIGNAL':
          if (command.action === 'ON' || command.action === 'OFF') {
            errorHandlingUtils.setupErrorHandler(command.condition, command.action, command.label, this.errorHandlers);
          } else if (command.label) {
            // Basic SIGNAL jump
            return this.jumpToLabel(command.label);
          }
          break;
          
        case 'SIGNAL_JUMP':
          return this.jumpToLabel(command.label);
          
        case 'LABEL':
          // Check if this should be handled as an ADDRESS MATCHING line instead
          if (this.address !== 'default' && this.addressMatchingPattern) {
            const originalLine = this.reconstructCommandAsLine(command);
            if (originalLine.trim()) {
              // Test if this line matches the address pattern
              try {
                const regex = new RegExp(this.addressMatchingPattern);
                const match = regex.exec(originalLine);
                if (match) {
                  // Extract content (remove the matched prefix)
                  let extractedContent = originalLine;
                  
                  // If the pattern has capture groups, use the first capture group as the content
                  if (match.length > 1) {
                    extractedContent = match[1].trim();
                  } else {
                    // Otherwise, remove the matched portion and trim
                    extractedContent = originalLine.replace(regex, '').trim();
                  }
                  
                  if (this.addressMultilineMode) {
                    // Collect lines for multiline processing
                    if (extractedContent) {
                      this.addressCollectedLines.push(extractedContent);
                    }
                  } else {
                    // Regular ADDRESS MATCHING - send immediately
                    if (extractedContent) {
                      await this.executeQuotedString({ type: 'QUOTED_STRING', value: extractedContent });
                    }
                  }
                  break;
                } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
                  // Line doesn't match - send collected multiline content and reset
                  const multilineContent = this.addressCollectedLines.join('\n');
                  await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
                  
                  // Reset multiline collection
                  this.addressCollectedLines = [];
                }
              } catch (error) {
                // If regex is invalid, fall through to normal label processing
              }
            } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
              // Empty line encountered - send collected multiline content and reset
              const multilineContent = this.addressCollectedLines.join('\n');
              await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
              
              // Reset multiline collection
              this.addressCollectedLines = [];
            }
          }
          
          // Execute any command on the same line as the label
          if (command.statement) {
            return await this.executeCommand(command.statement);
          }
          break;
          
        case 'NUMERIC':
          // Evaluate the value expression to handle variables
          let evaluatedValue;
          if (typeof command.value === 'string') {
            // Handle simple string literals and variable references
            evaluatedValue = this.variables.get(command.value) || command.value;
          } else {
            evaluatedValue = this.evaluateExpression(command.value);
          }
          traceFormattingUtils.setNumericSetting(command.setting, evaluatedValue, this.numericSettings);
          break;
          
        case 'PARSE':
          await parseSubroutineUtils.executeParse(command, this.variables, this.evaluateExpression.bind(this), parseSubroutineUtils.parseTemplate);
          break;
          
        case 'PUSH':
          this.executePush(command);
          break;
          
        case 'PULL':
          this.executePull(command);
          break;
          
        case 'QUEUE':
          this.executeQueue(command);
          break;
          
        case 'CALL':
          this.addTraceOutput(`CALL ${command.subroutine} (${command.arguments.length} args)`, 'call');
          const callResult = await parseSubroutineUtils.executeCall(
            command, 
            this.variables, 
            this.subroutines, 
            this.callStack, 
            this.evaluateExpression.bind(this),
            this.pushExecutionContext.bind(this),
            this.popExecutionContext.bind(this),
            this.getCurrentExecutionContext.bind(this),
            this.executeCommands.bind(this),
            parseSubroutineUtils.isExternalScriptCall,
            this.executeExternalScript.bind(this),
            this.sourceFilename,
            this.returnValue,
            this.builtInFunctions,
            callConvertParamsToArgs
          );
          if (callResult && callResult.terminated) {
            return callResult;
          }
          // Set RESULT variable if subroutine returned a value
          if (callResult && callResult.returnValue !== undefined) {
            this.variables.set('RESULT', callResult.returnValue);
          }
          break;
          
        case 'RETURN':
          return await this.executeReturn(command);
          
        case 'TRACE':
          this.traceMode = traceFormattingUtils.executeTrace(command, this.traceOutput, this.addTraceOutput.bind(this));
          break;
        
        case 'FUNCTION_CALL':
          // Check if this should be handled as an ADDRESS MATCHING line instead
          if (this.address !== 'default' && this.addressMatchingPattern) {
            const originalLine = this.reconstructCommandAsLine(command);
            if (originalLine.trim()) {
              // Test if this line matches the address pattern
              try {
                const regex = new RegExp(this.addressMatchingPattern);
                const match = regex.exec(originalLine);
                if (match) {
                  // Extract content (remove the matched prefix)
                  let extractedContent = originalLine;
                  
                  // If the pattern has capture groups, use the first capture group as the content
                  if (match.length > 1) {
                    extractedContent = match[1].trim();
                  } else {
                    // Otherwise, remove the matched portion and trim
                    extractedContent = originalLine.replace(regex, '').trim();
                  }
                  
                  if (this.addressMultilineMode) {
                    // Collect lines for multiline processing
                    if (extractedContent) {
                      this.addressCollectedLines.push(extractedContent);
                    }
                  } else {
                    // Regular ADDRESS MATCHING - send immediately
                    if (extractedContent) {
                      await this.executeQuotedString({ type: 'QUOTED_STRING', value: extractedContent });
                    }
                  }
                  break;
                } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
                  // Line doesn't match - send collected multiline content and reset
                  const multilineContent = this.addressCollectedLines.join('\n');
                  await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
                  
                  // Reset multiline collection
                  this.addressCollectedLines = [];
                }
              } catch (error) {
                // If regex is invalid, fall through to normal function call processing
              }
            } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
              // Empty line encountered - send collected multiline content and reset
              const multilineContent = this.addressCollectedLines.join('\n');
              await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
              
              // Reset multiline collection
              this.addressCollectedLines = [];
            }
          }
          
          // Normal function call processing
          await this.executeFunctionCall(command);
          break;

        case 'ASSIGNMENT':
          if (command.command) {
            // Check if it's a CALL command assignment
            if (command.command.type === 'CALL') {
              // Execute the CALL and get its return value
              const result = await parseSubroutineUtils.executeCall(
                command.command, 
                this.variables, 
                this.subroutines, 
                this.callStack, 
                this.evaluateExpression.bind(this),
                this.pushExecutionContext.bind(this),
                this.popExecutionContext.bind(this),
                this.getCurrentExecutionContext.bind(this),
                this.executeCommands.bind(this),
                parseSubroutineUtils.isExternalScriptCall,
                this.executeExternalScript.bind(this),
                this.sourceFilename,
                this.returnValue,
                this.builtInFunctions,
                callConvertParamsToArgs
              );
              const variableName = await this.interpolateString(command.variable);
              
              // If the result is a return object, extract the value
              let value;
              if (result && result.type === 'RETURN' && result.value !== undefined) {
                value = result.value;
              } else if (result && typeof result === 'object' && result.success) {
                // Handle successful external script calls
                value = result.returnValue || null;
              } else {
                value = result;
              }
              
              this.variables.set(variableName, value);
              this.addTraceOutput(`LET ${variableName} = CALL ${command.command.subroutine}`, 'assignment', null, value);
            } else {
              // Function call assignment: LET var = functionCall
              const result = await this.executeFunctionCall(command.command);
              const variableName = await this.interpolateString(command.variable);
              this.variables.set(variableName, result);
              this.addTraceOutput(`LET ${variableName} = ${command.command.command}()`, 'assignment', null, result);
            }
          } else if (command.expression) {
            // Expression assignment: LET var = expr
            let result;
            
            // Special case: RESULT() with no parameters should be treated as RESULT variable reference
            if (command.expression.type === 'FUNCTION_CALL' && 
                command.expression.command === 'RESULT' && 
                Object.keys(command.expression.params || {}).length === 0) {
              result = this.variables.get('RESULT');
            } 
            // Special case: ADDRESS method call - check if we're in ADDRESS context and expression is a simple variable
            else if (command.expression.type === 'VARIABLE' && 
                     this.address && this.address !== 'default') {
              const addressTarget = this.addressTargets.get(this.address);
              
              // If we have an ADDRESS target and the variable name matches a method
              if (addressTarget && addressTarget.handler &&
                  addressTarget.methods && addressTarget.methods.includes(command.expression.name.toLowerCase())) {
                
                try {
                  // Execute as ADDRESS method call with empty params (parameterless call)
                  const params = { params: '' };
                  const context = Object.fromEntries(this.variables);
                  if (this.addressMatchingPattern) {
                    context._addressMatchingPattern = this.addressMatchingPattern;
                  }
                  const sourceContext = this.currentLineNumber ? {
                    lineNumber: this.currentLineNumber,
                    sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                    sourceFilename: this.sourceFilename || '',
                    interpreter: this
                  } : null;
                  
                  // Call the ADDRESS handler directly
                  result = await addressTarget.handler(command.expression.name, params, sourceContext);
                  
                  // Update standard REXX variables like RC
                  if (result && typeof result === 'object') {
                    this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
                    if (!result.success && result.errorMessage) {
                      this.variables.set('ERRORTEXT', result.errorMessage);
                    }
                  }
                } catch (error) {
                  // If ADDRESS method call fails, fall back to normal expression evaluation
                  result = await this.evaluateExpression(command.expression);
                }
              } else {
                // Not an ADDRESS method or no ADDRESS target, evaluate normally
                result = await this.evaluateExpression(command.expression);
              }
            } else {
              result = await this.evaluateExpression(command.expression);
            }
            
            const variableName = await this.interpolateString(command.variable);
            this.variables.set(variableName, result);
            this.addTraceOutput(`LET ${variableName} = expression`, 'assignment', null, result);
          } else if (command.value !== undefined) {
            // Simple value assignment: LET var = value (resolve value in case it's a variable reference)
            let resolvedValue;
            
            // For quoted strings, don't resolve as expressions or function calls - keep as literal
            if (command.isQuotedString) {
              resolvedValue = command.value;
            } else {
              // Check if we're in an ADDRESS context and the value could be an ADDRESS method call
              if (this.address && this.address !== 'default' && typeof command.value === 'string') {
                const addressTarget = this.addressTargets.get(this.address);
                
                // If we have an ADDRESS target and the value looks like a method name
                if (addressTarget && addressTarget.handler && 
                    addressTarget.methods && addressTarget.methods.includes(command.value.toLowerCase())) {
                  
                  try {
                    // Execute as ADDRESS method call with empty params (parameterless call)
                    const params = { params: '' };
                    const context = Object.fromEntries(this.variables);
                    if (this.addressMatchingPattern) {
                      context._addressMatchingPattern = this.addressMatchingPattern;
                    }
                    const sourceContext = this.currentLineNumber ? {
                      lineNumber: this.currentLineNumber,
                      sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                      sourceFilename: this.sourceFilename || '',
                      interpreter: this
                    } : null;
                    
                    // Call the ADDRESS handler directly
                    resolvedValue = await addressTarget.handler(command.value, params, sourceContext);
                    
                    // Update standard REXX variables like RC
                    if (resolvedValue && typeof resolvedValue === 'object') {
                      this.variables.set('RC', resolvedValue.success ? 0 : (resolvedValue.errorCode || 1));
                      if (!resolvedValue.success && resolvedValue.errorMessage) {
                        this.variables.set('ERRORTEXT', resolvedValue.errorMessage);
                      }
                    }
                  } catch (error) {
                    // If ADDRESS method call fails, fall back to normal variable resolution
                    resolvedValue = await this.resolveValue(command.value);
                  }
                } else {
                  // Not an ADDRESS method, resolve normally
                  resolvedValue = await this.resolveValue(command.value);
                }
              } else {
                // Not in ADDRESS context, resolve normally
                resolvedValue = await this.resolveValue(command.value);
              }
            }
            
            // Handle JSON parsing for object/array literals in LET assignments
            // Only parse JSON for unquoted values (not originally quoted strings)
            if (typeof resolvedValue === 'string' && !command.isQuotedString) {
              const trimmed = resolvedValue.trim();
              if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                  (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                  resolvedValue = JSON.parse(trimmed);
                } catch (e) {
                  // If JSON parsing fails, keep as string
                }
              }
            }
            
            const variableName = await this.interpolateString(command.variable);
            this.variables.set(variableName, resolvedValue);
            this.addTraceOutput(`LET ${variableName} = "${resolvedValue}"`, 'assignment', null, resolvedValue);
          }
          break;
        
        case 'IF':
          const ifResult = await controlFlowUtils.executeIfStatement(command, this.evaluateCondition.bind(this), this.run.bind(this));
          if (ifResult && ifResult.terminated) {
            if (ifResult.type === 'RETURN') {
              // RETURN inside IF should bubble up to caller
              return ifResult;
            } else {
              // EXIT inside IF should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${ifResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = ifResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'DO':
          const doResult = await controlFlowUtils.executeDoStatement(command, this.resolveValue.bind(this), this.evaluateCondition.bind(this), this.run.bind(this), this.variables, {
            RexxError,
            currentLineNumber: this.currentLineNumber,
            sourceLines: this.sourceLines,
            sourceFilename: this.sourceFilename,
            interpreter: this
          });
          if (doResult && doResult.terminated) {
            if (doResult.type === 'RETURN') {
              // RETURN inside DO should bubble up to caller
              return doResult;
            } else {
              // EXIT inside DO should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${doResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = doResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'SELECT':
          const selectResult = await controlFlowUtils.executeSelectStatement(command, this.evaluateCondition.bind(this), this.run.bind(this));
          if (selectResult && selectResult.terminated) {
            if (selectResult.type === 'RETURN') {
              // RETURN inside SELECT should bubble up to caller
              return selectResult;
            } else {
              // EXIT inside SELECT should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${selectResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = selectResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'EXIT':
          await this.executeExitStatement(command);
          break;

        case 'SAY':
          await this.executeSayStatement(command);
          break;
        
        case 'INTERPRET_STATEMENT':
          await this.executeInterpretStatement(command);
          break;
          
        case 'NO_INTERPRET':
          this.interpretBlocked = true;
          break;
          
        case 'RETRY_ON_STALE':
          return await this.executeRetryOnStale(command);
          
        case 'QUOTED_STRING':
          await this.executeQuotedString(command);
          break;
          
        case 'HEREDOC_STRING':
          await this.executeHeredocString(command);
          break;

        default:
          // Handle unrecognized commands in ADDRESS context with MATCHING pattern
          if (this.address !== 'default' && this.addressMatchingPattern) {
            const line = this.reconstructCommandAsLine(command);
            if (line.trim()) {
              // Test if this line matches the address pattern
              try {
                const regex = new RegExp(this.addressMatchingPattern);
                const match = regex.exec(line);
                
                if (match) {
                  // Extract the matched content (use capture group if available)
                  let extractedContent;
                  if (match.length > 1) {
                    extractedContent = match[1].trim();
                  } else {
                    extractedContent = line.replace(regex, '').trim();
                  }
                  
                  if (this.addressMultilineMode) {
                    // Collect lines for multiline processing
                    if (extractedContent) {
                      this.addressCollectedLines.push(extractedContent);
                    }
                  } else {
                    // Regular ADDRESS MATCHING - send immediately
                    if (extractedContent) {
                      await this.executeQuotedString({ type: 'QUOTED_STRING', value: extractedContent });
                    }
                  }
                } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
                  // Line doesn't match - send collected multiline content and reset
                  const multilineContent = this.addressCollectedLines.join('\n');
                  await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
                  
                  // Reset multiline collection
                  this.addressCollectedLines = [];
                }
              } catch (error) {
                // If regex is invalid, skip this line
              }
            } else if (this.addressMultilineMode && this.addressCollectedLines.length > 0) {
              // Empty line encountered - send collected multiline content and reset
              const multilineContent = this.addressCollectedLines.join('\n');
              await this.executeQuotedString({ type: 'QUOTED_STRING', value: multilineContent });
              
              // Reset multiline collection
              this.addressCollectedLines = [];
            }
          }
          break;
    }
  }

  reconstructCommandAsLine(command) {
    // Try to get the original line from source text using line number
    if (command.lineNumber && this.sourceLines && this.sourceLines[command.lineNumber - 1]) {
      return this.sourceLines[command.lineNumber - 1];
    }
    
    // Use the preserved original line if available (fallback)
    if (command.originalLine) {
      return command.originalLine;
    }
    
    // Last resort: reconstruct from command properties
    switch (command.type) {
      case 'ASSIGNMENT':
        if (command.expression && typeof command.expression === 'string') {
          return command.expression;
        }
        // Reconstruct standard LET assignment
        if (command.variable && command.value !== undefined) {
          if (command.isQuotedString) {
            return `LET ${command.variable} = "${command.value}"`;
          } else if (typeof command.value === 'string') {
            return `LET ${command.variable} = ${command.value}`;
          } else {
            return `LET ${command.variable} = ${JSON.stringify(command.value)}`;
          }
        }
        break;
      case 'FUNCTION_CALL':
        if (command.originalExpression) {
          return command.originalExpression;
        }
        break;
      default:
        if (command.value) {
          return command.value;
        }
        if (command.expression) {
          return command.expression;
        }
        break;
    }
    
    return '';
  }

  async executeFunctionCall(funcCall) {
    const method = funcCall.command.toUpperCase();
    
    
    // Special handling for REXX built-in variables that might be parsed as function calls
    const rexxSpecialVars = ['RC', 'ERRORTEXT', 'SIGL'];
    if (rexxSpecialVars.includes(method)) {
      return this.variables.get(method) || method; // Return variable value or variable name if not set
    }
    
    // Check if current ADDRESS target is registered via REQUIRE (takes precedence over built-ins)
    if (this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);
      if (addressTarget && addressTarget.handler) {
        const resolvedParams = {};
        for (const [key, value] of Object.entries(funcCall.params || {})) {
          resolvedParams[key] = await this.resolveValue(value);
        }
        const result = await addressTarget.handler(funcCall.command, resolvedParams);
        return result;
      }
    }
    
    // Check if this is a built-in function
    if (this.builtInFunctions[method]) {
      // Built-in functions can have both positional and named parameters
      const resolvedParams = {};
      
      // Debug logging for DOM functions
      if (method.startsWith('DOM_')) {
        console.log(`Executing ${method} with params:`, funcCall.params);
      }
      
      for (const [key, value] of Object.entries(funcCall.params || {})) {
        const resolved = await this.resolveValue(value);
        resolvedParams[key] = resolved;
        if (method.startsWith('DOM_')) {
          console.log(`  Resolved ${key}: ${value} -> ${resolved}`);
        }
      }
      
      // For built-in functions, we need to handle parameter conversion
      const builtInFunc = this.builtInFunctions[method];
      
      // Convert named parameters to positional arguments based on function
      const args = callConvertParamsToArgs(method, resolvedParams);
      
      if (method.startsWith('DOM_')) {
        console.log(`${method} converted args:`, args);
      }
      
      return await builtInFunc(...args);
    }
    
    // Try browser-compatible string functions before missing function check
    const resolvedParams = {};
    for (const [key, value] of Object.entries(funcCall.params || {})) {
      resolvedParams[key] = await this.resolveValue(value);
    }
    const args = Object.values(resolvedParams);
    
    const browserResult = this.executeBrowserStringFunction(method, args);
    if (browserResult !== null) {
      return browserResult;
    }
    
    // Not a built-in function, proceed with RPC call
    if (!this.addressSender) {
      const sourceContext = this.currentLineNumber ? {
        lineNumber: this.currentLineNumber,
        sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
        sourceFilename: this.sourceFilename || '',
        interpreter: this
      } : null;
      
      // Enhanced error message with categorization and documentation links
      const errorMessage = this.createMissingFunctionError(method);
      throw new RexxError(errorMessage, 'FUNCTION', sourceContext);
    }
    
    // resolvedParams already computed above for browser functions
    
    // Fall back to Address Sender for unregistered ADDRESS targets
    const namespace = this.address;
    const rpcMethod = funcCall.command;
    
    return await this.addressSender.send(namespace, rpcMethod, resolvedParams);
  }

  createMissingFunctionError(method) {
    return security.createMissingFunctionError(method);
  }

  async executeIfStatement(ifCommand) {
    return await controlFlowUtils.executeIfStatement(ifCommand, this.evaluateCondition.bind(this), this.run.bind(this));
  }

  async executeDoStatement(doCommand) {
    return await controlFlowUtils.executeDoStatement(doCommand, this.resolveValue.bind(this), this.evaluateCondition.bind(this), this.run.bind(this), this.variables, {
      RexxError,
      currentLineNumber: this.currentLineNumber,
      sourceLines: this.sourceLines,
      sourceFilename: this.sourceFilename,
      interpreter: this
    });
  }

  async executeRangeLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRangeLoop(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }

  async executeRangeLoopWithStep(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRangeLoopWithStep(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }
  
  // Legacy implementation preserved for reference
  async executeRangeLoopWithStepLegacy(loopSpec, bodyCommands) {
    const start = await this.resolveValue(loopSpec.start);
    const end = await this.resolveValue(loopSpec.end);
    const step = await this.resolveValue(loopSpec.step);
    const variable = loopSpec.variable;
    
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const stepNum = parseInt(step);
    
    if (isNaN(startNum) || isNaN(endNum) || isNaN(stepNum)) {
      throw new Error(`Invalid range values in DO loop: ${start} TO ${end} BY ${step}`);
    }
    
    if (stepNum === 0) {
      throw new Error('DO loop step cannot be zero');
    }
    
    // Store original value if variable already exists
    const originalValue = this.variables.get(variable);
    
    try {
      if (stepNum > 0) {
        for (let i = startNum; i <= endNum; i += stepNum) {
          this.variables.set(variable, i);
          await this.run(bodyCommands);
        }
      } else {
        for (let i = startNum; i >= endNum; i += stepNum) {
          this.variables.set(variable, i);
          await this.run(bodyCommands);
        }
      }
    } finally {
      // In Rexx, DO loop variables persist after the loop completes
      // Only restore the original value if one existed before the loop
      if (originalValue !== undefined) {
        this.variables.set(variable, originalValue);
      }
      // If no original value existed, keep the loop variable with its final value
    }
  }

  async executeWhileLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeWhileLoop(loopSpec, bodyCommands, this.evaluateCondition.bind(this), this.run.bind(this));
  }
  
  // Legacy implementation preserved for reference
  async executeWhileLoopLegacy(loopSpec, bodyCommands) {
    const maxIterations = 10000; // Safety limit
    let iterations = 0;
    
    while (await this.evaluateCondition(loopSpec.condition)) {
      if (iterations++ > maxIterations) {
        throw new Error('DO WHILE loop exceeded maximum iterations (safety limit)');
      }
      
      await this.run(bodyCommands);
    }
  }

  async executeRepeatLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRepeatLoop(loopSpec, bodyCommands, this.run.bind(this));
  }
  
  // Legacy implementation preserved for reference
  async executeRepeatLoopLegacy(loopSpec, bodyCommands) {
    const count = loopSpec.count;
    
    if (count < 0) {
      throw new Error('DO repeat count cannot be negative');
    }
    
    for (let i = 0; i < count; i++) {
      await this.run(bodyCommands);
    }
  }

  async executeOverLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeOverLoop(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }
  
  // Legacy implementation preserved for reference
  async executeOverLoopLegacy(loopSpec, bodyCommands) {
    const variable = loopSpec.variable;
    const arrayValue = await this.resolveValue(loopSpec.array);
    
    // Handle null or undefined arrays
    if (arrayValue == null) {
      throw new Error('DO OVER: Array cannot be null or undefined');
    }
    
    // Handle strings (convert to character array)
    if (typeof arrayValue === 'string') {
      const chars = arrayValue.split('');
      
      // Store original variable value if it exists
      const originalValue = this.variables.get(variable);
      
      try {
        for (const char of chars) {
          this.variables.set(variable, char);
          await this.run(bodyCommands);
        }
      } finally {
        // Restore original variable value or remove if it didn't exist
        if (originalValue !== undefined) {
          this.variables.set(variable, originalValue);
        } else {
          this.variables.delete(variable);
        }
      }
      return;
    }
    
    // Handle arrays (both JavaScript arrays and array-like objects)
    let itemsToIterate = [];
    
    if (Array.isArray(arrayValue)) {
      itemsToIterate = arrayValue;
    } else if (typeof arrayValue === 'object' && arrayValue.length !== undefined) {
      // Array-like object (has length property)
      // Check if it's 1-indexed (like DOM_GET_ALL result) or 0-indexed
      const hasZeroIndex = arrayValue.hasOwnProperty('0') || arrayValue.hasOwnProperty(0);
      const hasOneIndex = arrayValue.hasOwnProperty('1') || arrayValue.hasOwnProperty(1);
      
      if (hasOneIndex && !hasZeroIndex) {
        // 1-indexed array-like object (e.g., from DOM_GET_ALL)
        for (let i = 1; i <= arrayValue.length; i++) {
          itemsToIterate.push(arrayValue[i]);
        }
      } else {
        // 0-indexed array-like object (standard JavaScript arrays)
        for (let i = 0; i < arrayValue.length; i++) {
          itemsToIterate.push(arrayValue[i]);
        }
      }
    } else if (typeof arrayValue === 'object') {
      // Regular object - iterate over values
      itemsToIterate = Object.values(arrayValue);
    } else {
      // Single value - treat as array with one element
      itemsToIterate = [arrayValue];
    }
    
    // Store original variable value if it exists
    const originalValue = this.variables.get(variable);
    
    try {
      for (const item of itemsToIterate) {
        this.variables.set(variable, item);
        await this.run(bodyCommands);
      }
    } finally {
      // In REXX, loop variables typically persist after the loop
      // But we'll restore the original value if one existed before
      if (originalValue !== undefined) {
        this.variables.set(variable, originalValue);
      }
      // If no original value existed, keep the final loop value
    }
  }

  async executeSelectStatement(selectCommand) {
    return await controlFlowUtils.executeSelectStatement(selectCommand, this.evaluateCondition.bind(this), this.run.bind(this));
  }

  async executeSayStatement(sayCommand) {
    const expression = sayCommand.expression;
    
    // Check if the expression contains concatenation operators (||)
    if (expression.includes('||')) {
      // Handle as a concatenation expression
      const result = await this.evaluateConcatenation(expression);
      this.outputHandler.output(String(result));
      return;
    }
    
    // Parse the expression to handle multiple values and interpolation
    const outputParts = [];
    
    // Split on spaces but preserve quoted strings
    const parts = parseQuotedParts(expression);
    
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        // Handle quoted string with potential interpolation
        const rawString = part.substring(1, part.length - 1);
        if (rawString.match(/\{[a-zA-Z_][a-zA-Z0-9_.]*\}/)) {
          // Interpolated string
          const interpolated = await this.interpolateString(rawString);
          outputParts.push(interpolated);
        } else {
          // Simple string
          outputParts.push(rawString);
        }
      } else if (part.startsWith("'") && part.endsWith("'")) {
        // Single quoted string (no interpolation)
        outputParts.push(part.substring(1, part.length - 1));
      } else {
        // Variable reference or literal
        const resolved = await this.resolveValue(part);
        outputParts.push(String(resolved));
      }
    }
    
    // Join all parts with spaces and output
    const output = outputParts.join(' ');
    this.outputHandler.output(output);
  }

  async executeQuotedString(command) {
    const commandString = command.value;
    
    // Check if there's an active ADDRESS target
    if (this.address && this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);
      
      if (addressTarget && addressTarget.handler) {
        let finalCommandString = commandString;

        // Conditionally interpolate based on library metadata
        if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
          finalCommandString = await this.interpolateString(commandString);
        }

        try {
          // Execute the command string via the ADDRESS target handler
          // Pass interpreter variables as context for variable resolution
          const context = Object.fromEntries(this.variables);
          // Add matching pattern to context if available
          if (this.addressMatchingPattern) {
            context._addressMatchingPattern = this.addressMatchingPattern;
          }
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this
          } : null;
          const result = await addressTarget.handler(finalCommandString, context, sourceContext);
          
          // Set standard REXX variables for ADDRESS operations
          if (result && typeof result === 'object') {
            this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
            // Only set RESULT if the ADDRESS target explicitly provides output
            // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
            if (this.address !== 'expectations') {
              this.variables.set('RESULT', result);
            }
            if (!result.success && result.errorMessage) {
              this.variables.set('ERRORTEXT', result.errorMessage);
            }
            
            // Handle operation-specific result processing (can be overridden by subclasses)
            this.handleOperationResult(result);
            
            // Set domain-specific variables requested by ADDRESS target
            if (result.rexxVariables && typeof result.rexxVariables === 'object') {
              for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
                this.variables.set(varName, varValue);
              }
            }
          } else {
            this.variables.set('RC', 0);
            this.variables.set('RESULT', result);
          }
          
          this.addTraceOutput(`"${finalCommandString}"`, 'address_command', null, result);
        } catch (error) {
          // Set error state
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      } else {
        // No ADDRESS target handler, fall back to RPC
        try {
          const interpolated = await this.interpolateString(commandString);
          const result = await this.addressSender.send(this.address, 'execute', { command: interpolated });
          this.variables.set('RC', 0);
          this.variables.set('RESULT', result);
          this.addTraceOutput(`"${interpolated}"`, 'address_command', null, result);
        } catch (error) {
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      }
    } else {
      // No ADDRESS target set - perform string interpolation and output
      const interpolated = await this.interpolateString(commandString);
      this.outputHandler.output(interpolated);
    }
  }

  async executeHeredocString(command) {
    const commandString = command.value;
    
    // Check if there's an active ADDRESS target
    if (this.address && this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);
      
      if (addressTarget && addressTarget.handler) {
        let finalCommandString = commandString;

        // Conditionally interpolate based on library metadata
        if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
          finalCommandString = await this.interpolateString(commandString);
        }

        try {
          // Execute the command string via the ADDRESS target handler
          // Pass interpreter variables as context for variable resolution
          const context = Object.fromEntries(this.variables);
          // Add matching pattern to context if available
          if (this.addressMatchingPattern) {
            context._addressMatchingPattern = this.addressMatchingPattern;
          }
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this
          } : null;
          const result = await addressTarget.handler(finalCommandString, context, sourceContext);
          
          // Set standard REXX variables for ADDRESS operations
          if (result && typeof result === 'object') {
            this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
            // Only set RESULT if the ADDRESS target explicitly provides output
            // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
            if (this.address !== 'expectations') {
              this.variables.set('RESULT', result);
            }
            if (!result.success && result.errorMessage) {
              this.variables.set('ERRORTEXT', result.errorMessage);
            }
            
            // Handle operation-specific result processing (can be overridden by subclasses)
            this.handleOperationResult(result);
            
            // Set domain-specific variables requested by ADDRESS target
            if (result.rexxVariables && typeof result.rexxVariables === 'object') {
              for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
                this.variables.set(varName, varValue);
              }
            }
          } else {
            this.variables.set('RC', 0);
            this.variables.set('RESULT', result);
          }
          
          this.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', null, result);
        } catch (error) {
          // Set error state
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      } else {
        // No ADDRESS target handler, fall back to RPC
        try {
          const interpolated = await this.interpolateString(commandString);
          const result = await this.addressSender.send(this.address, 'execute', { command: interpolated });
          this.variables.set('RC', 0);
          this.variables.set('RESULT', result);
          this.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', null, result);
        } catch (error) {
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      }
    } else {
      // No ADDRESS target set - perform string interpolation and output
      const interpolated = await this.interpolateString(commandString);
      this.outputHandler.output(interpolated);
    }
  }

  async executeExitStatement(command) {
    // Evaluate exit code if provided
    let exitCode = 0;
    if (command.code !== undefined) {
      if (typeof command.code === 'object' && command.code !== null) {
        // It's an expression object, evaluate it
        exitCode = await this.evaluateExpression(command.code);
      } else {
        // It's a direct value
        exitCode = await this.resolveValue(command.code);
      }
    }

    // Convert to number if possible
    const numericCode = Number(exitCode);
    const finalCode = isNaN(numericCode) ? 0 : numericCode;

    // Create and throw special exit exception to terminate execution
    const exitError = new Error(`Script terminated with EXIT ${finalCode}`);
    exitError.isExit = true;
    exitError.exitCode = finalCode;
    throw exitError;
  }

  async executeInterpretStatement(command) {
    // Check if INTERPRET is blocked
    if (this.interpretBlocked) {
      throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
    }

    // Push INTERPRET context onto execution stack
    const currentContext = this.getCurrentExecutionContext();
    const interpretContext = this.pushExecutionContext(
      'interpret',
      this.currentLineNumber,
      this.sourceLines && this.currentLineNumber ? this.sourceLines[this.currentLineNumber - 1] || '' : '',
      this.sourceFilename || '',
      { command }
    );
    
    let codeToExecute;
    let normalizedCode;

    try {
      // Evaluate the expression to get the code string
      if (typeof command.expression === 'string' && command.expression.includes('||')) {
        // Handle concatenation expressions
        codeToExecute = await this.evaluateConcatenation(command.expression);
      } else {
        codeToExecute = await this.resolveValue(command.expression);
      }
      
      normalizedCode = String(codeToExecute).replace(/\\n/g, '\n');
      
      // Import parser to compile the Rexx code
      const { parse } = require('./parser');
      const commands = parse(normalizedCode);
      
      if (command.mode === 'classic') {
        // Mode C: Full classic behavior - share all variables and context
        const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
        subInterpreter.address = this.address;
        subInterpreter.builtInFunctions = this.builtInFunctions;
        subInterpreter.errorHandlers = new Map(this.errorHandlers);
        subInterpreter.labels = new Map(this.labels);
        subInterpreter.addressTargets = new Map(this.addressTargets);
        subInterpreter.subroutines = new Map(this.subroutines);
        
        
        // Share all variables
        for (const [key, value] of this.variables) {
          subInterpreter.variables.set(key, value);
        }
        
        // Execute the code with its own source context
        await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);
        
        // Copy back all variables
        for (const [key, value] of subInterpreter.variables) {
          this.variables.set(key, value);
        }
        
      } else if (command.mode === 'isolated') {
        // Mode B: Sandboxed scope - controlled variable sharing
        const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
        subInterpreter.address = this.address;
        subInterpreter.builtInFunctions = this.builtInFunctions;
        subInterpreter.addressTargets = new Map(this.addressTargets);
        subInterpreter.errorHandlers = new Map(this.errorHandlers);
        subInterpreter.labels = new Map(this.labels);
        subInterpreter.subroutines = new Map(this.subroutines);
        
        // Handle IMPORT - share specific variables TO the isolated scope
        if (command.importVars && Array.isArray(command.importVars)) {
          for (const varName of command.importVars) {
            if (this.variables.has(varName)) {
              subInterpreter.variables.set(varName, this.variables.get(varName));
            }
          }
        }
        
        // Execute in isolation with its own source context
        await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);
        
        // Handle EXPORT - copy specific variables FROM the isolated scope
        if (command.exportVars && Array.isArray(command.exportVars)) {
          for (const varName of command.exportVars) {
            if (subInterpreter.variables.has(varName)) {
              this.variables.set(varName, subInterpreter.variables.get(varName));
            }
          }
        }
      } else {
        // Default mode: Share variables and context like classic REXX INTERPRET
        const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
        subInterpreter.address = this.address;
        subInterpreter.builtInFunctions = this.builtInFunctions;
        subInterpreter.errorHandlers = new Map(this.errorHandlers);
        subInterpreter.labels = new Map(this.labels);
        subInterpreter.addressTargets = new Map(this.addressTargets);
        subInterpreter.subroutines = new Map(this.subroutines);
        
        
        // Share all variables (classic Rexx behavior)
        for (const [key, value] of this.variables) {
          subInterpreter.variables.set(key, value);
        }
        
        // Execute the interpreted code with its own source context
        await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);
        
        // Copy back all variables
        for (const [key, value] of subInterpreter.variables) {
          this.variables.set(key, value);
        }
      }
      
      // Pop the INTERPRET context on successful completion
      this.popExecutionContext();
      
    } catch (e) {
      // Get the INTERPRET context from the execution stack
      const interpretCtx = this.getInterpretContext();
      const sourceContext = interpretCtx ? {
        lineNumber: interpretCtx.lineNumber,
        sourceLine: interpretCtx.sourceLine,
        sourceFilename: interpretCtx.sourceFilename,
        interpreter: this
      } : null;
      
      // Pop the INTERPRET context on error
      this.popExecutionContext();
      
      // Try to extract more context about what was being interpreted
      let detailedMessage = `INTERPRET failed: ${e.message}`;
      
      // Add information about what code was being interpreted
      if (typeof codeToExecute === 'string' && codeToExecute.trim()) {
        detailedMessage += `\nInterpreting code: "${codeToExecute.trim()}"`;
        
        // If it's a CALL statement, mention what's being called
        if (codeToExecute.trim().startsWith('CALL ')) {
          const callTarget = codeToExecute.trim().substring(5).trim();
          detailedMessage += `\nCalling subroutine: ${callTarget}`;
        }
      }
      
      // If this is a property access error, try to identify the variable
      if (e.message && e.message.includes("Cannot read properties of undefined")) {
        const propertyMatch = e.message.match(/Cannot read properties of undefined \(reading '(.+?)'\)/);
        if (propertyMatch) {
          detailedMessage += `\nTrying to access property '${propertyMatch[1]}' on undefined variable`;
        }
      }
      
      // Include stack trace from sub-interpreter if available
      if (e.stack) {
        const relevantStack = e.stack.split('\n').slice(0, 3).join('\n');
        detailedMessage += `\nSub-interpreter error: ${relevantStack}`;
        
        // Try to extract more context from the stack trace
        if (e.stack.includes('executeCall')) {
          detailedMessage += `\nLikely error in subroutine call execution`;
        }
        if (e.stack.includes('executeCommands')) {
          detailedMessage += `\nError during command execution (possibly accessing undefined commands array)`;
        }
      }
      
      // Add debug info showing execution stack context
      if (interpretCtx) {
        detailedMessage += `\nINTERPRET statement: line ${interpretCtx.lineNumber} ("${interpretCtx.sourceLine.trim()}")`;
      }
      
      const currentCtx = this.getCurrentExecutionContext();
      if (currentCtx && currentCtx !== interpretCtx) {
        detailedMessage += `\nCurrent execution: line ${currentCtx.lineNumber} ("${currentCtx.sourceLine.trim()}")`;
      }
      
      // Show execution stack
      if (this.executionStack.length > 0) {
        detailedMessage += `\nExecution stack (${this.executionStack.length} levels):`;
        for (let i = this.executionStack.length - 1; i >= 0; i--) {
          const ctx = this.executionStack[i];
          detailedMessage += `\n  [${i}] ${ctx.type} at ${ctx.sourceFilename}:${ctx.lineNumber}`;
        }
      }
      
      // Show what we're trying to interpret
      if (normalizedCode) {
        detailedMessage += `\nCode being interpreted: "${normalizedCode}"`;
      }
      
      throw new RexxError(detailedMessage, 'INTERPRET', sourceContext);
    }
  }


  async evaluateCondition(condition) {
    return await expressionValueUtils.evaluateCondition(
      condition,
      this.resolveValue.bind(this),
      compareValues,
      isTruthy
    );
  }

  isLikelyFunctionName(name) {
    // Check if it's a built-in function
    if (this.builtInFunctions[name.toUpperCase()]) {
      return true;
    }
    
    // Delegate to imported function for pattern matching
    return isLikelyFunctionName(name);
  }

  async evaluateExpression(expr) {
    return await expressionValueUtils.evaluateExpression(
      expr,
      this.resolveValue.bind(this),
      this.variables.get.bind(this.variables),
      this.variables.has.bind(this.variables),
      this.interpolateString.bind(this),
      this.evaluateConcatenation.bind(this),
      this.executeFunctionCall.bind(this),
      this.isLikelyFunctionName.bind(this),
      (method) => !!this.builtInFunctions[method],
      (method) => this.builtInFunctions[method],
      callConvertParamsToArgs,
      isNumericString
    );
  }

  async resolveValue(value) {
    return await expressionValueUtils.resolveValue(
      value,
      this.variables.get.bind(this.variables),
      this.variables.has.bind(this.variables),
      this.evaluateExpression.bind(this),
      this.interpolateString.bind(this),
      this.executeFunctionCall.bind(this),
      this.isLikelyFunctionName.bind(this)
    );
  }
  
  async evaluateConcatenation(expression) {
    // Use the extracted evaluateConcatenation function, passing this.resolveValue as the resolver
    return await evaluateConcatenation(expression, (variableName) => this.resolveValue(variableName));
  }
  
  async interpolateString(template) {
    // Use the extracted interpolateString function, passing variableStack resolver to avoid circular calls
    return await interpolateString(template, async (variableName) => {
      // Use variableStack's resolveVariableValue which handles complex paths without circular calls
      return await variableStackUtils.resolveVariableValue(variableName, this.variables, this.evaluateExpression.bind(this));
    });
  }

  async evaluateRexxCallbackExpression(expr) {
    // Simple REXX expression evaluator for callback expressions
    // Supports logical operators & (AND), | (OR), and comparison operators
    
    // Handle logical AND (&)
    if (expr.includes(' & ')) {
      const parts = expr.split(' & ');
      let result = true;
      for (const part of parts) {
        const partResult = await this.evaluateRexxCallbackExpression(part.trim());
        if (!isTruthy(partResult)) {
          result = false;
          break;
        }
      }
      return result;
    }
    
    // Handle logical OR (|)
    if (expr.includes(' | ')) {
      const parts = expr.split(' | ');
      let result = false;
      for (const part of parts) {
        const partResult = await this.evaluateRexxCallbackExpression(part.trim());
        if (isTruthy(partResult)) {
          result = true;
          break;
        }
      }
      return result;
    }
    
    // Handle comparison operators
    const comparisonOps = [' >= ', ' <= ', ' > ', ' < ', ' = ', ' == ', ' != ', ' <> ', ' ¬= ', ' >< '];
    for (const op of comparisonOps) {
      if (expr.includes(op)) {
        const parts = expr.split(op);
        if (parts.length === 2) {
          const leftVal = await this.evaluateRexxExpressionPart(parts[0].trim());
          const rightVal = await this.evaluateRexxExpressionPart(parts[1].trim());
          
          switch (op.trim()) {
            case '>=':
              return compareValues(leftVal, rightVal) >= 0;
            case '<=':
              return compareValues(leftVal, rightVal) <= 0;
            case '>':
              return compareValues(leftVal, rightVal) > 0;
            case '<':
              return compareValues(leftVal, rightVal) < 0;
            case '=':
            case '==':
              return compareValues(leftVal, rightVal) === 0;
            case '!=':
            case '<>':
            case '¬=':
            case '><':
              return compareValues(leftVal, rightVal) !== 0;
          }
        }
      }
    }
    
    // Simple expression - evaluate as single part
    return await this.evaluateRexxExpressionPart(expr);
  }

  async evaluateRexxExpressionPart(expr) {
    // Evaluate a single part of a REXX expression (function call, variable, literal)
    const trimmed = expr.trim();
    
    // Check if it's a function call with parentheses
    const funcMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*\(([^)]*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1].toUpperCase();
      const argsStr = funcMatch[2];
      
      // Parse arguments
      const args = [];
      if (argsStr.trim()) {
        // Simple argument parsing - split by comma but handle quoted strings
        const argParts = this.parseSimpleArguments(argsStr);
        for (const argPart of argParts) {
          const argValue = await this.evaluateRexxExpressionPart(argPart.trim());
          args.push(argValue);
        }
      }
      
      // Execute built-in function
      if (this.builtInFunctions[funcName]) {
        const func = this.builtInFunctions[funcName];
        return await func(...args);
      }
    }
    
    // Check if it's a quoted string
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.substring(1, trimmed.length - 1);
    }
    
    // Check if it's a number
    if (!isNaN(parseFloat(trimmed)) && isFinite(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // Check if it's a variable
    if (this.variables.has(trimmed)) {
      return this.variables.get(trimmed);
    }
    
    // Return as literal string
    return trimmed;
  }

  parseSimpleArguments(argsStr) {
    // Simple argument parser that handles comma-separated values with quoted strings
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
        current += char;
      } else if (!inQuotes && char === ',') {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }
  
  // UUID/ID Generation helper methods
  

  async handleError(error, currentIndex) {
    return await errorHandlingUtils.handleError(
      error,
      currentIndex,
      this.errorHandlers,
      this.currentCommands,
      this.variables,
      this, // Pass interpreter as context
      this.jumpToLabel.bind(this)
    );
  }

  getCommandText(command) {
    return errorHandlingUtils.getCommandText(command);
  }

  getCurrentFunctionName(command) {
    return errorHandlingUtils.getCurrentFunctionName(command);
  }

  async jumpToLabel(labelName) {
    return await errorHandlingUtils.jumpToLabel(
      labelName,
      this.labels,
      this.currentCommands,
      this.executeCommand.bind(this),
      this.executeCommands.bind(this)
    );
  }

  setNumericSetting(setting, value) {
    return traceFormattingUtils.setNumericSetting(setting, value, this.numericSettings);
  }

  // Execute PUSH statement - add to top of stack (LIFO)
  async executePush(command) {
    await variableStackUtils.executePush(command, this.stack, this.variables, this.evaluateExpression.bind(this));
  }

  // Execute PULL statement - remove from top of stack (LIFO)
  executePull(command) {
    variableStackUtils.executePull(command, this.stack, this.variables);
  }

  // Execute QUEUE statement - add to bottom of stack (FIFO)
  async executeQueue(command) {
    await variableStackUtils.executeQueue(command, this.stack, this.variables, this.evaluateExpression.bind(this));
  }



  // Execute RETURN statement
  async executeReturn(command) {
    let returnValue = '';
    
    if (command.value) {
      // Use resolveValue to handle all types of value resolution consistently
      returnValue = await this.resolveValue(command.value);
    }
    
    this.returnValue = returnValue;
    
    return {
      type: 'RETURN',
      value: returnValue,
      terminated: true
    };
  }

  // Execute TRACE statement
  executeTrace(command) {
    this.traceMode = traceFormattingUtils.executeTrace(command, this.traceOutput, this.addTraceOutput.bind(this));
  }

  // Add trace output based on current mode
  addTraceOutput(message, type = 'instruction', lineNumber = null, result = null) {
    traceFormattingUtils.addTraceOutput(message, type, lineNumber, result, this.traceMode, this.traceOutput);
  }

  // Get trace output as formatted strings
  getTraceOutput() {
    return traceFormattingUtils.getTraceOutput(this.traceOutput);
  }

  // Clear trace output
  clearTraceOutput() {
    return traceFormattingUtils.clearTraceOutput(this.traceOutput);
  }

  
  // Initialize DOM Element Manager if in browser environment
  initializeDOMManager() {
    // Only initialize once
    if (this.domManager) {
      return;
    }
    
    domManagerUtils.initializeDOMManager((manager) => {
      this.domManager = manager;
    });
  }
  
  // Execute RETRY_ON_STALE blocks with automatic retry on stale elements
  async executeRetryOnStale(command) {
    return await domManagerUtils.executeRetryOnStale(
      command,
      this.variables.get.bind(this.variables),
      this.variables.set.bind(this.variables),
      this.variables.has.bind(this.variables),
      this.executeCommands.bind(this)
    );
  }

  // Transitive dependency resolution
  
  async requireWithDependencies(libraryName, asClause = null) {
    return await libraryManagementUtils.requireWithDependencies(
      libraryName,
      this.loadingQueue,
      this.checkLibraryPermissions.bind(this),
      this.isLibraryLoaded.bind(this),
      (libName) => this.detectAndRegisterAddressTargets(libName, asClause),
      this.loadSingleLibrary.bind(this),
      this.extractDependencies.bind(this),
      this.dependencyGraph,
      (libName) => this.registerLibraryFunctions(libName, asClause)
    );
  }

  async loadSingleLibrary(libraryName) {
    // Check if it's a registry: prefixed library
    if (libraryName.startsWith('registry:')) {
      return await this.requireRegistryLibrary(libraryName.substring(9)); // Remove 'registry:' prefix
    }
    
    // SCRO: Check if we're in remote orchestrated context and should request via CHECKPOINT
    if (this.isRemoteOrchestrated() && !this.isBuiltinLibrary(libraryName)) {
      return await this.requireViaCheckpoint(libraryName);
    }

    // Original single library loading logic
    const env = this.detectEnvironment();
    switch (env) {
      case 'nodejs': 
        return await this.requireNodeJS(libraryName);
      case 'web-standalone': 
        return await this.requireWebStandalone(libraryName);
      case 'web-controlbus': 
        return await this.requireControlBus(libraryName);
      default: 
        throw new Error(`REQUIRE not supported in environment: ${env}`);
    }
  }

  async requireNodeJS(libraryName) {
    // Check if it's a local file or npm package (Node.js style)
    if (this.isLocalOrNpmModule(libraryName)) {
      return await this.requireNodeJSModule(libraryName);
    }
    
    // Otherwise use GitHub-based loading
    return await this.requireGitHubLibrary(libraryName);
  }

  isLocalOrNpmModule(libraryName) {
    return libraryUrlUtils.isLocalOrNpmModule(libraryName);
  }

  async requireNodeJSModule(libraryName) {
    try {
      // First try Node.js native require() for proper modules
      try {
        const nodeModule = require(libraryName);
        
        // Check if it's already a RexxJS-compatible library
        const libNamespace = this.getLibraryNamespace(libraryName);
        const detectionFunction = this.getLibraryDetectionFunction(libraryName);
        
        if (nodeModule[detectionFunction]) {
          // It's already a RexxJS library, register it normally
          global[libNamespace] = nodeModule;
          this.registerLibraryFunctions(libraryName);
          return true;
        }
        
        // Auto-wrap Node.js module as RexxJS library
        const rexxjsWrapper = this.wrapNodeJSModule(nodeModule, libraryName);
        global[libNamespace] = rexxjsWrapper;
        this.registerLibraryFunctions(libraryName);
        
        console.log(`✓ ${libraryName} loaded and wrapped from Node.js module`);
        return true;
        
      } catch (requireError) {
        // If require() fails, try to load as a plain JavaScript file
        console.log(`Standard require() failed for ${libraryName}, trying as plain JS file...`);
        
        // For local files, try reading and executing as script
        if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
          const path = require('path');
          const fs = require('fs');
          
          // Resolve the file path
          const filePath = path.resolve(libraryName);
          
          // Read the file content
          const libraryCode = fs.readFileSync(filePath, 'utf8');
          
          // Execute the code in the global context
          await this.executeLibraryCode(libraryCode, libraryName);
          
          console.log(`✓ ${libraryName} loaded as plain JavaScript file`);
          return true;
        } else {
          // For non-local modules, re-throw the original error
          throw requireError;
        }
      }
      
    } catch (error) {
      throw new Error(`Failed to load Node.js module ${libraryName}: ${error.message}`);
    }
  }

  wrapNodeJSModule(nodeModule, libraryName) {
    const libName = libraryName.split('/').pop().split('.')[0]; // Get base name
    const detectionFunction = `${libName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_MAIN`;
    
    const wrapper = {
      // Add detection function
      [detectionFunction]: () => ({
        type: 'library_info',
        name: `${libName} (Node.js module)`,
        version: 'unknown',
        source: 'nodejs-require',
        loaded: true
      })
    };
    
    // Convert Node.js exports to RexxJS-style functions
    if (typeof nodeModule === 'object' && nodeModule !== null) {
      Object.entries(nodeModule).forEach(([name, func]) => {
        if (typeof func === 'function') {
          // Convert camelCase to UPPER_CASE for RexxJS conventions
          const rexxjsName = name.replace(/([A-Z])/g, '_$1').toUpperCase();
          wrapper[rexxjsName] = func;
        } else {
          // For non-functions, just preserve as-is
          wrapper[name.toUpperCase()] = func;
        }
      });
    } else if (typeof nodeModule === 'function') {
      // Single function export
      wrapper[libName.toUpperCase()] = nodeModule;
    }
    
    return wrapper;
  }

  async requireGitHubLibrary(libraryName) {
    // Use the existing GitHub-based loading logic
    const libraryCode = await this.fetchLibraryCode(libraryName);
    
    // Store in cache
    this.libraryCache.set(libraryName, {
      code: libraryCode,
      loaded: true,
      timestamp: Date.now()
    });
    
    // Execute the code
    await this.executeLibraryCode(libraryCode, libraryName);
    
    // Register functions
    this.registerLibraryFunctions(libraryName);
    
    console.log(`✓ ${libraryName} loaded from local, GitHub or other`);
    return true;
  }

  async extractDependencies(libraryName) {
    // Extract dependencies from loaded library code
    const dependencies = [];
    
    // PRIORITY 1: Runtime metadata (works with minified code)
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    const func = this.getGlobalFunction(detectionFunction, libraryName);
    if (func) {
      try {
        const info = func();
        if (info && info.dependencies) {
          //console.log(`✓ Found runtime dependencies for ${libraryName}`);
          return Array.isArray(info.dependencies) ? info.dependencies : [];
        }
      } catch (error) {
        console.warn(`Failed to get runtime dependencies for ${libraryName}: ${error.message}`);
      }
    }
    
    // PRIORITY 2: Parse comment metadata from source code
    let libraryCode = '';
    try {
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const response = await fetch(libraryName);
        if (response.ok) {
          libraryCode = await response.text();
          const commentMetadata = this.parseCommentMetadata(libraryCode);
          if (commentMetadata && commentMetadata.dependencies) {
            //console.log(`✓ Found comment metadata dependencies for ${libraryName}`);
            return commentMetadata.dependencies;
          }
        }
      }
    } catch (error) {
      // Continue to next method
    }

    // PRIORITY 3: Parse from source code (only works if not minified)
    const cached = this.libraryCache.get(libraryName);
    if (cached && cached.code) {
      libraryCode = cached.code;
    }
    
    // Parse dependencies from library code comments or metadata
    if (libraryCode) {
      // 1. Look for preserved comment dependencies (survive minification, jQuery-style)
      const preservedCommentPattern = /\/\*!\s*[\s\S]*?@rexxjs-meta\s+(\{[\s\S]*?\})/i;
      const preservedMatch = preservedCommentPattern.exec(libraryCode);
      
      if (preservedMatch) {
        try {
          const depData = JSON.parse(preservedMatch[1]);
          if (depData.dependencies) {
            console.log(`✓ Found preserved comment dependencies for ${libraryName}`);
            return Object.keys(depData.dependencies);
          }
        } catch (error) {
          console.warn(`Failed to parse preserved comment dependencies for ${libraryName}: ${error.message}`);
        }
      }
      
      // 2. Look for standardized JSON format (comment-based)
      const jsonDepPattern = /@rexxjs-meta-start\s*\*\s*([\s\S]*?)\s*\*\s*@rexxjs-meta-end/i;
      const jsonMatch = jsonDepPattern.exec(libraryCode);
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1].replace(/\*\s*/g, '').trim();
          const depData = JSON.parse(jsonStr);
          console.log(`✓ Found JSON dependencies for ${libraryName}`);
          return Object.keys(depData.dependencies || {});
        } catch (error) {
          console.warn(`Failed to parse JSON dependencies for ${libraryName}: ${error.message}`);
        }
      }
      
      
      // 3. Final fallback: Legacy comment format
      const depPattern = /\/\*\s*@dependencies?\s+(.*?)\s*\*\//gi;
      const requirePattern = /\/\*\s*@require\s+(.*?)\s*\*\//gi;
      
      let match;
      while ((match = depPattern.exec(libraryCode)) !== null) {
        const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
        console.log(`✓ Found legacy @dependencies for ${libraryName}: ${deps.join(', ')}`);
        return deps;
      }
      
      while ((match = requirePattern.exec(libraryCode)) !== null) {
        const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
        console.log(`✓ Found legacy @require for ${libraryName}: ${deps.join(', ')}`);
        return deps;
      }
    }
    
    // No dependencies found
    return [];
  }

  parseCommentMetadata(sourceCode) {
    // Parse @REXX_LIBRARY_METADATA comment blocks
    const metadataRegex = /@REXX_LIBRARY_METADATA[\s\S]*?(?=\*\/|\*\s*@|\*\s*Copyright|\*\s*$)/;
    const match = sourceCode.match(metadataRegex);
    
    if (!match) return null;
    
    const metadataBlock = match[0];
    const metadata = {};
    
    // Parse individual metadata fields
    const fields = {
      name: /@name:\s*(.+)$/m,
      version: /@version:\s*(.+)$/m,
      description: /@description:\s*(.+)$/m,
      type: /@type:\s*(.+)$/m,
      detection_function: /@detection_function:\s*(.+)$/m,
      functions: /@functions:\s*(.+)$/m,
      dependencies: /@dependencies:\s*(.+)$/m
    };
    
    for (const [key, regex] of Object.entries(fields)) {
      const fieldMatch = metadataBlock.match(regex);
      if (fieldMatch) {
        let value = fieldMatch[1].trim();
        
        // Parse arrays (comma-separated values)
        if (key === 'functions' || key === 'dependencies') {
          value = value === '[]' ? [] : value.split(',').map(s => s.trim()).filter(s => s);
        }
        
        metadata[key] = value;
      }
    }
    
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  // REQUIRE system helper methods
  
  isLibraryLoaded(libraryName) {
    // Check the modern registry first
    if (typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
      const found = window.REXX_FUNCTION_LIBS.find(lib => 
        lib.path === libraryName || 
        lib.name === libraryName ||
        lib.path.endsWith('/' + libraryName) ||
        libraryName.endsWith('/' + lib.name)
      );
      if (found) {
        return true;
      }
    }
    
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    
    // Check cache first in Node.js environment (but don't return false if not cached)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const cached = this.libraryCache.get(libraryName);
      if (cached && cached.loaded) {
        return true;
      }
      // Continue to function-based detection if not in cache
    }
    
    let globalScope;
    if (typeof window !== 'undefined') {
      globalScope = window;
    } else if (typeof global !== 'undefined') {
      globalScope = global;
    } else {
      return false;
    }
    
    // Check for built-in R libraries first (namespaced or global)
    // Extract basename for pattern matching: "../src/r-graphics-functions.js" -> "r-graphics-functions"
    const basename = libraryName.split('/').pop().replace(/\.(js|rexx)$/, '');
    if (basename.startsWith('r-') && basename.endsWith('-functions')) {
      const namespaceName = this.getLibraryNamespace(basename);
      
      // Check if detection function is in namespace object
      if (typeof globalScope[namespaceName] === 'object' && 
          typeof globalScope[namespaceName][detectionFunction] === 'function') {
        return true;
      }
      
      // Also check if detection function is directly on global scope (fallback)
      if (typeof globalScope[detectionFunction] === 'function') {
        return true;
      }
      
      return false;
    }
    
    // Check for external libraries (detection function on global scope)
    if (typeof globalScope[detectionFunction] === 'function') {
      try {
        // Try calling the detection function to verify it works
        const result = globalScope[detectionFunction]();
        
        // Handle new metadata format (object with type/loaded info)
        if (typeof result === 'object' && result !== null) {
          return result.loaded === true || result.type !== undefined;
        }
        
        // Handle legacy format (string return indicates loaded)
        if (typeof result === 'string') {
          return true;
        }
        
        // Handle boolean return
        if (typeof result === 'boolean') {
          return result;
        }
        
        // Any other truthy result indicates loaded
        return !!result;
        
      } catch (error) {
        // If detection function throws, library is not properly loaded
        console.warn(`Detection function ${detectionFunction} failed:`, error.message);
        return false;
      }
    }
    
    return false;
  }

  getLibraryNamespace(libraryName) {
    // Map library names to their actual namespace names
    const namespaceMap = {
      // R function mappings removed - they now use proper exports from extras
    };
    
    return namespaceMap[libraryName];
  }

  getLibraryDetectionFunction(libraryName) {
    // Check the global registry first (for self-registered libraries)
    if (LIBRARY_DETECTION_REGISTRY.has(libraryName)) {
      return LIBRARY_DETECTION_REGISTRY.get(libraryName);
    }
    
    // For local files (./path/to/file.js), extract just the base filename
    if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
      const basename = libraryName.split('/').pop().replace(/\.(js|rexx)$/, '');
      return `${basename.toUpperCase().replace(/[\/\-\.]/g, '_')}_MAIN`;
    }
    
    // Auto-generate detection function name from fully qualified library name
    // "github.com/username/my-rexx-lib" -> "GITHUB_COM_USERNAME_MY_REXX_LIB_MAIN"
    // "gitlab.com/username/my-rexx-lib" -> "GITLAB_COM_USERNAME_MY_REXX_LIB_MAIN"
    // "scipy-interpolation" -> "SCIPY_INTERPOLATION_MAIN"
    return `${libraryName.toUpperCase().replace(/[\/\-\.]/g, '_')}_MAIN`;
  }

  detectAndRegisterAddressTargets(libraryName, asClause = null) {
    // Look for ADDRESS target registration in loaded library
    let globalScope;
    if (typeof window !== 'undefined') {
      globalScope = window;
    } else if (typeof global !== 'undefined') {
      globalScope = global;
    } else {
      return; // No global scope available
    }
    
    // PRIORITY 1: Check library metadata for declared ADDRESS targets
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    if (globalScope[detectionFunction] && typeof globalScope[detectionFunction] === 'function') {
      try {
        const metadata = globalScope[detectionFunction]();
        if (metadata && typeof metadata === 'object' && 
            (metadata.type === 'address-target' || metadata.type === 'hybrid') &&
            metadata.provides && metadata.provides.addressTarget) {
          
          const originalTargetName = metadata.provides.addressTarget;
          // Apply AS clause transformation for ADDRESS target
          const targetName = this.applyAsClauseToAddressTarget(originalTargetName, asClause, metadata);
          const handlerFunctionName = `ADDRESS_${originalTargetName.toUpperCase()}_HANDLER`;
          const methodsObjectName = `ADDRESS_${originalTargetName.toUpperCase()}_METHODS`;
          
          const handlerFunction = globalScope[handlerFunctionName];
          const methodsObject = globalScope[methodsObjectName] || {};
          
          if (typeof handlerFunction === 'function') {
            this.addressTargets.set(targetName, {
              handler: handlerFunction,
              methods: Object.keys(methodsObject),
              metadata: {
                libraryName: libraryName,
                libraryMetadata: metadata,
                exportName: handlerFunctionName
              }
            });
            
            return; // Successfully registered via metadata, no need for pattern detection
          }
        }
      } catch (error) {
        console.warn(`Failed to read metadata from ${libraryName}:`, error.message);
        // Continue to pattern-based detection
      }
    }
    
    // PRIORITY 2: Fallback to pattern-based detection for backward compatibility
    for (const exportName in globalScope) {
      if (exportName.startsWith('ADDRESS_') && exportName.endsWith('_HANDLER')) {
        // Extract target name: ADDRESS_CALCULATOR_HANDLER -> calculator
        const targetName = exportName.slice(8, -8).toLowerCase();
        const handlerFunction = globalScope[exportName];
        const methodsObjectName = `ADDRESS_${exportName.slice(8, -8)}_METHODS`;
        const methodsObject = globalScope[methodsObjectName] || {};
        
        if (typeof handlerFunction === 'function') {
          this.addressTargets.set(targetName, {
            handler: handlerFunction,
            methods: Object.keys(methodsObject),
            metadata: {
              libraryName: libraryName,
              exportName: exportName
            }
          });
          
        }
      }
    }
  }

  detectEnvironment() {
    return utils.detectEnvironment();
  }

  // SCRO: Remote REQUIRE functionality using CHECKPOINT communication
  isRemoteOrchestrated() {
    // Check if we're in a remote orchestrated context
    // This is indicated by specific environment variables or context flags
    return (
      // Check for SCRO_REMOTE environment variable
      (typeof process !== 'undefined' && process.env && process.env.SCRO_REMOTE === 'true') ||
      // Check for remote orchestration context variable
      this.variables.has('SCRO_REMOTE') ||
      // Check for CHECKPOINT callback indicating remote orchestration
      (this.streamingProgressCallback && this.variables.has('SCRO_ORCHESTRATION_ID'))
    );
  }

  isBuiltinLibrary(libraryName) {
    // Built-in libraries that should never be requested remotely
    const builtinLibraries = [
      'string-functions', 'math-functions', 'json-functions', 'array-functions',
      'date-time-functions', 'url-functions', 'random-functions', 'regex-functions',
      'validation-functions', 'file-functions', 'statistics-functions', 'logic-functions',
      'cryptography-functions', 'dom-functions', 'data-functions', 'probability-functions'
    ];
    
    // Check for built-in libraries
    if (builtinLibraries.includes(libraryName)) {
      return true;
    }
    
    // Check for local file paths (relative paths)
    if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
      return true;
    }
    
    return false;
  }

  async requireViaCheckpoint(libraryName) {
    // Send REQUIRE request via CHECKPOINT communication channel
    const requireId = `require_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Send CHECKPOINT request for library
    const requestData = {
      type: 'require_request',
      libraryName: libraryName,
      requireId: requireId,
      timestamp: Date.now()
    };
    
    // Use CHECKPOINT to request the library from orchestrator
    const checkpointResult = this.sendCheckpointMessage('require_request', requestData);
    
    // Wait for library response via CHECKPOINT
    const libraryResponse = await this.waitForCheckpointResponse(requireId, 30000); // 30 second timeout
    
    if (!libraryResponse || !libraryResponse.success) {
      throw new Error(`Remote REQUIRE failed for ${libraryName}: ${libraryResponse?.error || 'timeout'}`);
    }
    
    // Execute the library code received from orchestrator
    await this.executeRemoteLibraryCode(libraryName, libraryResponse.libraryCode);
    
    return true;
  }

  sendCheckpointMessage(type, data) {
    // Send message via existing CHECKPOINT mechanism
    const messageData = {
      type: 'rexx-require',
      subtype: type,
      timestamp: Date.now(),
      data: data,
      line: this.currentLineNumber || 0
    };
    
    // Use existing CHECKPOINT communication channels
    if (this.streamingProgressCallback) {
      this.streamingProgressCallback(messageData);
    } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(messageData, '*');
    }
    
    return messageData;
  }

  async waitForCheckpointResponse(requireId, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, error: 'timeout' });
      }, timeoutMs);
      
      const messageHandler = (event) => {
        if (event.data && 
            event.data.type === 'rexx-require-response' && 
            event.data.requireId === requireId) {
          cleanup();
          resolve(event.data);
        }
      };
      
      const cleanup = () => {
        clearTimeout(timeout);
        if (typeof window !== 'undefined') {
          window.removeEventListener('message', messageHandler);
        }
      };
      
      // Check if we have any communication channels available
      const hasWindowChannel = typeof window !== 'undefined' && window.parent && window.parent !== window;
      const hasStreamingChannel = this.streamingProgressCallback != null;
      
      if (!hasWindowChannel && !hasStreamingChannel) {
        cleanup();
        resolve({ success: false, error: 'no_communication_channel' });
        return;
      }
      
      // Listen for response via window messaging
      if (hasWindowChannel) {
        window.addEventListener('message', messageHandler);
      }
      
      // For streaming callback, we need a different mechanism
      // For now, just rely on timeout since full orchestration setup isn't implemented
    });
  }

  async executeRemoteLibraryCode(libraryName, libraryCode) {
    // Execute the library code received from the orchestrator
    const env = this.detectEnvironment();
    
    try {
      if (env === 'nodejs') {
        // Use VM for safe execution in Node.js
        const vm = require('vm');
        const context = {
          module: { exports: {} },
          exports: {},
          require: require,
          console: console,
          Buffer: Buffer,
          process: process,
          global: global,
          __dirname: __dirname,
          __filename: __filename
        };
        
        vm.createContext(context);
        vm.runInContext(libraryCode, context);
        
        // Register any exported functions
        this.registerRemoteLibraryExports(libraryName, context.module.exports);
        
      } else {
        // Browser environment - use eval with isolated scope
        const context = {
          window: typeof window !== 'undefined' ? window : {},
          document: typeof document !== 'undefined' ? document : {},
          console: console
        };
        
        // Create isolated execution context
        const wrappedCode = `
          (function(window, document, console) {
            ${libraryCode}
          })(context.window, context.document, context.console);
        `;
        
        eval(wrappedCode);
        
        // Register any global exports that were created
        this.registerRemoteLibraryExports(libraryName, context.window);
      }
      
      // Cache as loaded
      this.libraryCache.set(libraryName, { loaded: true, code: libraryCode });
      
    } catch (error) {
      throw new Error(`Failed to execute remote library ${libraryName}: ${error.message}`);
    }
  }

  registerRemoteLibraryExports(libraryName, exports) {
    // Register functions and ADDRESS handlers from remotely loaded library
    if (exports && typeof exports === 'object') {
      // Initialize functions registry if not already done
      if (!this.functions) {
        this.functions = {};
      }
      
      // Register regular functions
      for (const [name, func] of Object.entries(exports)) {
        if (typeof func === 'function' && !name.startsWith('_')) {
          this.functions[name] = func;
          // Also add to built-in functions for global access
          if (this.builtInFunctions && typeof this.builtInFunctions === 'object') {
            this.builtInFunctions[name] = func;
          }
        }
      }
      
      // Detect and register ADDRESS targets
      this.detectAndRegisterAddressTargets(libraryName);
    }
  }

  async requireNodeJS(libraryName) {
    // Check cache first
    const cached = this.libraryCache.get(libraryName);
    if (cached && cached.loaded) {
      console.log(`✓ Using cached ${libraryName}`);
      return true;
    }
    
    // Dynamic import for Node.js environment
    try {
      const vm = require('vm');
      const https = require('https');
      
      let libraryCode;
      
      // Use cached code if available but not yet loaded
      if (cached && cached.code) {
        libraryCode = cached.code;
        console.log(`✓ Using cached code for ${libraryName}`);
      } else {
        // Handle local files first (relative paths starting with ./ or ../)
        if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
          try {
            const path = require('path');
            const fs = require('fs');
            
            // Resolve the file path
            const filePath = path.resolve(libraryName);
            //console.log(`Loading local file: ${filePath}`);
            
            // Read the file content
            libraryCode = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            throw new Error(`Failed to load local file ${libraryName}: ${error.message}`);
          }
        }
        // Handle built-in libraries
        else if (this.isBuiltinLibrary(libraryName)) {
          libraryCode = await this.loadBuiltinLibrary(libraryName);
        } 
        // Handle remote libraries
        else {
          libraryCode = await this.fetchLibraryCode(libraryName);
        }
        
        // Cache the code
        this.libraryCache.set(libraryName, {
          loaded: false,
          code: libraryCode,
          timestamp: Date.now()
        });
      }
      
      // Execute in a controlled context with proper global access
      const contextGlobals = {
        global: global,
        require: require,
        console: console,
        Buffer: Buffer,
        process: process,
        // Provide window as undefined for Node.js
        window: undefined
      };
      
      // Merge context with current global
      const context = Object.assign({}, global, contextGlobals);
      vm.createContext(context);
      vm.runInContext(libraryCode, context);
      
      // Copy any new globals back to the main global and window (if available)
      Object.keys(context).forEach(key => {
        if (key !== 'global' && key !== 'require' && key !== 'console' && 
            key !== 'Buffer' && key !== 'process' && key !== 'window' &&
            typeof context[key] === 'function') {
          
          // Always update global with the function from context
          global[key] = context[key];
          
          // Also set on window if it exists (Jest environment)
          if (typeof window !== 'undefined') {
            window[key] = context[key];
          }
        }
      });
      
      if (!this.isLibraryLoaded(libraryName)) {
        throw new Error(`Library ${libraryName} loaded but detection function not found`);
      }
      
      // Mark as loaded in cache
      const cacheEntry = this.libraryCache.get(libraryName) || {};
      cacheEntry.loaded = true;
      cacheEntry.timestamp = Date.now();
      this.libraryCache.set(libraryName, cacheEntry);
      
      // Register loaded functions as built-ins
      this.registerLibraryFunctions(libraryName);
      
      console.log(`✓ Loaded ${libraryName} from local, GitHub, or other`);
      return true;
      
    } catch (error) {
      throw new Error(`Failed to load ${libraryName} in Node.js: ${error.message}`);
    }
  }

  async requireRegistryLibrary(namespacedLibrary) {
    // Parse namespace/library format: "rexxjs/system-address" or "com.google--ai/gemini-pro-address"
    const parts = namespacedLibrary.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid registry library format: ${namespacedLibrary}. Expected: namespace/library-name`);
    }
    
    const [namespace, libraryName] = parts;
    
    // Split namespace on -- to get domain and subdomain
    const [domain, subdomain] = namespace.split('--');
    
    // Load the publisher registry
    const registryUrl = 'https://raw.githubusercontent.com/RexxJS/RexxJS/refs/heads/main/.list-of-public-lib-publishers.csv';
    const publisherInfo = await this.lookupPublisher(domain, registryUrl);
    
    if (!publisherInfo) {
      throw new Error(`Unknown namespace '${domain}' not found in registry. Publishers must be registered in .list-of-public-lib-publishers.csv`);
    }
    
    // Construct the library URL based on the publisher info
    const libraryUrl = this.constructRegistryLibraryUrl(publisherInfo, libraryName, subdomain);
    
    // Load the library using existing GitHub-style loading
    console.log(`📦 Loading registry library: ${namespacedLibrary} from ${libraryUrl}`);
    return await this.loadLibraryFromUrl(libraryUrl, namespacedLibrary);
  }

  async lookupPublisher(domain, registryUrl) {
    try {
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.status}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      // Find the organization column
      const orgIndex = headers.findIndex(h => h.toLowerCase().includes('organization'));
      if (orgIndex === -1) {
        throw new Error('Registry CSV missing organization column');
      }
      
      // Look for matching domain
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values[orgIndex] === domain) {
          // Return publisher info object
          const publisherInfo = {};
          headers.forEach((header, index) => {
            publisherInfo[header.toLowerCase().trim()] = values[index]?.trim() || '';
          });
          return publisherInfo;
        }
      }
      
      return null; // Domain not found
    } catch (error) {
      throw new Error(`Failed to lookup publisher registry: ${error.message}`);
    }
  }

  constructRegistryLibraryUrl(publisherInfo, libraryName, subdomain) {
    // For now, assume libraries are in RexxJS repo under extras/
    // Later this could be enhanced to support external repos
    const baseUrl = 'https://raw.githubusercontent.com/RexxJS/RexxJS/refs/heads/main/extras';
    
    // Determine library type and path
    let libraryPath;
    if (libraryName.includes('-address')) {
      // ADDRESS library
      const addressName = libraryName.replace('-address', '');
      libraryPath = `addresses/${addressName}/${addressName}-address.js`;
    } else if (libraryName.includes('-functions')) {
      // Functions library  
      const functionType = libraryName.replace('-functions', '');
      libraryPath = `functions/${functionType}/${functionType}-functions.js`;
    } else {
      // Generic library path
      libraryPath = `libraries/${libraryName}/${libraryName}.js`;
    }
    
    return `${baseUrl}/${libraryPath}`;
  }

  async loadLibraryFromUrl(url, libraryName) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.status} ${response.statusText}`);
      }
      
      const libraryCode = await response.text();
      
      // Execute the library code in global scope
      eval(libraryCode);
      
      // Register the library functions
      this.registerLibraryFunctions(libraryName);
      
      console.log(`✓ Loaded registry library: ${libraryName}`);
      return true;
      
    } catch (error) {
      throw new Error(`Failed to load registry library ${libraryName}: ${error.message}`);
    }
  }

  async requireWebStandalone(libraryName) {
    const scriptUrl = this.resolveWebLibraryUrl(libraryName);
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      
      script.onload = () => {
        // Give the library a moment to register itself globally
        setTimeout(() => {
          if (this.isLibraryLoaded(libraryName)) {
            // Register loaded functions as built-ins
            this.registerLibraryFunctions(libraryName);
            console.log(`✓ Loaded ${libraryName} from ${scriptUrl}`);
            resolve(true);
          } else {
            reject(new Error(`Library loaded but detection function not found`));
          }
        }, 10); // Small delay to allow library registration
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load library from ${scriptUrl}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async requireControlBus(libraryName) {
    const requestId = this.generateRequestId();
    
    // Worker requests library from director
    const request = {
      type: 'library-request',
      library: libraryName,
      timestamp: Date.now(),
      requestId: requestId
    };
    
    // Send request to director
    window.parent.postMessage(request, '*');
    
    // Wait for director response
    const response = await this.waitForLibraryResponse(requestId);
    
    if (response.approved) {
      if (response.libraryCode) {
        // Director provided the library code directly
        await this.executeLibraryCode(response.libraryCode, libraryName);
      } else if (response.libraryUrl) {
        // Director provided URL to load from
        await this.loadLibraryFromUrl(response.libraryUrl, libraryName);
      }
      
      // Register loaded functions as built-ins
      this.registerLibraryFunctions(libraryName);
      
      console.log(`✓ Loaded ${libraryName} via control bus`);
      return true;
      
    } else {
      throw new Error(`Library request denied: ${response.reason || 'Permission denied'}`);
    }
  }

  resolveGitHubRawUrl(libraryName) {
    return libraryUrlUtils.resolveGitHubRawUrl(libraryName, this.isBuiltinLibrary.bind(this));
  }

  shouldUseGitHubRelease(libraryName, tag) {
    return libraryUrlUtils.shouldUseGitHubRelease(libraryName, tag);
  }

  async resolveGitHubReleaseUrl(libraryName, libraryRepo, tag) {
    // GitHub releases URL format
    const libName = libraryName.split('/').pop().split('@')[0]; // Extract library name without version
    
    // Try different common release asset naming patterns in order of preference
    const assetPatterns = [
      `${libName}.js`,           // simple-lib.js (preferred)
      `${libName}.min.js`,       // simple-lib.min.js
      `${libName}-${tag}.js`,    // simple-lib-v1.2.3.js
      `dist/${libName}.js`,      // dist/simple-lib.js (if GitHub auto-extracts)
      `lib/${libName}.js`,       // lib/simple-lib.js
      `bundle.js`,               // Generic bundle
      `index.js`,                // Generic entry point
      `${libName}-bundle.js`     // Bundled version
    ];
    
    // Try to find which asset exists
    for (const assetName of assetPatterns) {
      const url = `https://github.com/${libraryRepo}/releases/download/${tag}/${assetName}`;
      
      // For now, return first pattern (in production, we'd check if URL exists)
      // TODO: Add HEAD request to check if asset exists before trying to download
      return url;
    }
    
    // Fallback: try the raw file approach instead of releases
    console.warn(`No suitable release asset found for ${libraryName}@${tag}, falling back to raw file`);
    return `https://raw.githubusercontent.com/${libraryRepo}/${tag}/dist/${libName}.js`;
  }

  getLibraryType(libraryName) {
    return libraryUrlUtils.getLibraryType(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryRepository(libraryName) {
    return libraryUrlUtils.getLibraryRepository(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryTag(libraryName) {
    return libraryUrlUtils.getLibraryTag(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryPath(libraryName) {
    return libraryUrlUtils.getLibraryPath(libraryName, this.isBuiltinLibrary.bind(this));
  }

  resolveWebLibraryUrl(libraryName) {
    return libraryUrlUtils.resolveWebLibraryUrl(libraryName);
  }

  async fetchLibraryCode(libraryName) {
    // Try multiple sources in order of preference
    const sources = this.getLibrarySources(libraryName);
    
    for (const source of sources) {
      try {
        console.log(`Trying ${source.type}: ${source.url}`);
        return await this.fetchFromUrl(source.url);
      } catch (error) {
        console.warn(`${source.type} failed for ${libraryName}: ${error.message}`);
        // Continue to next source
      }
    }
    
    throw new Error(`All sources failed for ${libraryName}`);
  }

  getLibrarySources(libraryName) {
    return libraryUrlUtils.getLibrarySources(libraryName, this.isBuiltinLibrary.bind(this));
  }

  shouldTryCDN(libraryName) {
    return libraryUrlUtils.shouldTryCDN(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getCDNSources(libraryName, libName, tag) {
    return libraryUrlUtils.getCDNSources(libraryName, libName, tag, this.isBuiltinLibrary.bind(this));
  }

  getGitHubReleaseSources(libraryName, libName, tag) {
    return libraryUrlUtils.getGitHubReleaseSources(libraryName, libName, tag, this.isBuiltinLibrary.bind(this));
  }

  async fetchFromReleaseWithFallbacks(libraryName) {
    const libraryRepo = this.getLibraryRepository(libraryName);
    const tag = this.getLibraryTag(libraryName);
    const libName = libraryName.split('/').pop().split('@')[0];
    
    // Strategy 1: Try common individual file patterns
    const filePatterns = [
      `${libName}.js`,
      `${libName}.min.js`, 
      `${libName}-${tag}.js`,
      `bundle.js`,
      `index.js`
    ];
    
    for (const filename of filePatterns) {
      try {
        const url = `https://github.com/${libraryRepo}/releases/download/${tag}/${filename}`;
        console.log(`Trying release asset: ${filename}`);
        return await this.fetchFromUrl(url);
      } catch (error) {
        // Continue to next pattern
      }
    }
    
    // Strategy 2: Try common zip patterns and extract
    const zipPatterns = [
      'dist.zip',
      `${libName}.zip`,
      `${libName}-${tag}.zip`,
      'release.zip'
    ];
    
    for (const zipName of zipPatterns) {
      try {
        const zipUrl = `https://github.com/${libraryRepo}/releases/download/${tag}/${zipName}`;
        console.log(`Trying ZIP release asset: ${zipName}`);
        return await this.fetchFromZipRelease(zipUrl, libName);
      } catch (error) {
        // Continue to next pattern
      }
    }
    
    // Strategy 3: Fallback to raw file at the release tag
    console.log(`All release strategies failed, falling back to raw file at tag ${tag}`);
    const fallbackUrl = `https://raw.githubusercontent.com/${libraryRepo}/${tag}/dist/${libName}.js`;
    return await this.fetchFromUrl(fallbackUrl);
  }

  async fetchFromZipRelease(zipUrl, libName) {
    // This would require a ZIP extraction library in Node.js
    // For now, throw an error indicating ZIP support needed
    throw new Error(`ZIP release extraction not yet implemented for ${zipUrl}`);
    
    // TODO: Implement ZIP extraction
    // const zip = await this.fetchFromUrl(zipUrl);
    // const jsContent = extractJavaScriptFromZip(zip, libName);
    // return jsContent;
  }

  async fetchFromUrl(url) {
    if (typeof window !== 'undefined') {
      // Browser environment
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } else {
      // Node.js environment
      const https = require('https');
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          });
        }).on('error', reject);
      });
    }
  }

  async waitForLibraryResponse(requestId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Library request timeout (30s)'));
      }, 30000);
      
      const handler = (event) => {
        if (event.data.type === 'library-response' && 
            event.data.requestId === requestId) {
          cleanup();
          resolve(event.data);
        }
      };
      
      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
      };
      
      window.addEventListener('message', handler);
    });
  }

  async executeLibraryCode(libraryCode, libraryName) {
    try {
      // Execute in current context
      const func = new Function(libraryCode);
      func();
      
      // Verify loading succeeded
      if (!this.isLibraryLoaded(libraryName)) {
        throw new Error(`Library executed but detection function not found`);
      }
      
      // Register library functions with the interpreter
      this.registerLibraryFunctions(libraryName);
    } catch (error) {
      throw new Error(`Failed to execute library code: ${error.message}`);
    }
  }

  async loadLibraryFromUrl(url, libraryName) {
    const libraryCode = await this.fetchFromUrl(url);
    await this.executeLibraryCode(libraryCode, libraryName);
  }

  generateRequestId() {
    return utils.generateRequestId();
  }

  registerLibraryFunctions(libraryName, asClause = null) {
    // Get list of functions that should be registered for this library
    const libraryFunctions = this.getLibraryFunctionList(libraryName);
    
    for (const functionName of libraryFunctions) {
      // Get the function from global scope (with library context)
      const func = this.getGlobalFunction(functionName, libraryName);
      if (func) {
        // Apply AS clause transformation if provided
        const registeredName = this.applyAsClauseToFunction(functionName, asClause);
        
        // Register as built-in function with potentially modified name
        this.builtInFunctions[registeredName] = (...args) => {
          return func(...args);
        };
      }
    }
  }

  applyAsClauseToFunction(functionName, asClause) {
    if (!asClause) {
      return functionName; // No transformation
    }

    // Check if AS clause contains regex pattern with capture group
    if (asClause.includes('(.*)')  ) {
      // Extract prefix from pattern: "math_(.*)" -> "math_"
      const prefix = asClause.replace('(.*)', '');
      return prefix + functionName;
    }

    // Simple prefix (no regex)
    if (!asClause.endsWith('_')) {
      asClause += '_'; // Auto-add underscore for readability
    }
    return asClause + functionName;
  }

  applyAsClauseToAddressTarget(originalTargetName, asClause, metadata) {
    if (!asClause) {
      return originalTargetName; // No transformation
    }

    // Validate: ADDRESS targets cannot use regex patterns
    if (asClause.includes('(.*)')) {
      throw new Error(`Cannot use regex patterns in AS clause for ADDRESS modules (${metadata.type})`);
    }

    // For ADDRESS targets, AS clause is the exact new name
    return asClause;
  }

  getLibraryFunctionList(libraryName) {
    // Check the modern registry first
    if (typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
      const found = window.REXX_FUNCTION_LIBS.find(lib => 
        lib.path === libraryName || 
        lib.name === libraryName ||
        lib.path.endsWith('/' + libraryName) ||
        libraryName.endsWith('/' + lib.name)
      );
      if (found && found.functions) {
        return Object.keys(found.functions);
      }
    }
    
    // Check if this is a built-in library first
    if (this.isBuiltinLibrary(libraryName)) {
      return this.discoverBuiltinLibraryFunctions(libraryName);
    }
    
    // Auto-discover functions for third-party libraries
    return this.discoverLibraryFunctions(libraryName);
  }

  isBuiltinLibrary(libraryName) {
    return utils.isBuiltinLibrary(libraryName);
  }

  discoverBuiltinLibraryFunctions(libraryName) {
    // For built-in libraries, we don't need to pre-enumerate functions
    // They will be discovered when the library is loaded
    // Return empty array - functions will be available after REQUIRE loads the library
    return [];
  }

  async loadBuiltinLibrary(libraryName) {
    // Load built-in library from local src/ directory
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Construct path to built-in library file
      const libraryPath = path.join(__dirname, `${libraryName}.js`);
      
      if (!fs.existsSync(libraryPath)) {
        throw new Error(`Built-in library file not found: ${libraryPath}`);
      }
      
      const libraryCode = fs.readFileSync(libraryPath, 'utf8');
      console.log(`✓ Loaded built-in library ${libraryName} from ${libraryPath}`);
      
      return libraryCode;
      
    } catch (error) {
      throw new Error(`Failed to load built-in library ${libraryName}: ${error.message}`);
    }
  }

  discoverLibraryFunctions(libraryName) {
    // First try namespace approach (clean, modern)
    const namespaceFunctions = this.extractFunctionsFromNamespace(libraryName);
    if (namespaceFunctions.length > 0) {
      return namespaceFunctions;
    }
    
    // For module-style libraries, check the extracted lib name namespace
    const libraryType = this.getLibraryType(libraryName);
    if (libraryType === 'module') {
      const libName = libraryName.split('/').pop();
      const libNamespaceFunctions = this.extractFunctionsFromNamespace(libName);
      if (libNamespaceFunctions.length > 0) {
        return libNamespaceFunctions;
      }
    }
    
    // Try global scope extraction (fallback for older libraries)
    const globalFunctions = this.extractGlobalFunctions(libraryName);
    if (globalFunctions.length > 0) {
      return globalFunctions;
    }
    
    // Final fallback: just the detection function
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    return [detectionFunction];
  }

  getThirdPartyNamespace(libName) {
    // Use library name directly as namespace
    // "my-rexx-lib" -> "my-rexx-lib"
    return libName;
  }

  extractFunctionsFromNamespace(namespaceName) {
    const functions = [];
    let namespaceObj = null;
    
    if (typeof window !== 'undefined' && window[namespaceName]) {
      namespaceObj = window[namespaceName];
    } else if (typeof global !== 'undefined' && global[namespaceName]) {
      namespaceObj = global[namespaceName];
    }
    
    if (namespaceObj && typeof namespaceObj === 'object') {
      for (const key in namespaceObj) {
        if (typeof namespaceObj[key] === 'function') {
          functions.push(key);
        }
      }
    }
    
    return functions;
  }

  extractGlobalFunctions(libraryName) {
    // For legacy libraries that put functions directly in global scope
    const functions = [];
    const globalScope = (typeof window !== 'undefined') ? window : global;
    
    // Get the detection function as a starting point
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    
    if (globalScope && globalScope[detectionFunction] && typeof globalScope[detectionFunction] === 'function') {
      functions.push(detectionFunction);
      
      // First, try to get function list from library metadata
      try {
        const metadata = globalScope[detectionFunction]();
        if (metadata && metadata.provides && metadata.provides.functions && Array.isArray(metadata.provides.functions)) {
          for (const funcName of metadata.provides.functions) {
            if (globalScope[funcName] && typeof globalScope[funcName] === 'function') {
              functions.push(funcName);
            }
          }
          return functions; // Return early if metadata-driven discovery worked
        }
      } catch (error) {
        // If detection function fails, continue with prefix-based discovery
      }
      
      // For R libraries, look for other functions with similar prefixes
      if (libraryName.includes('r-') || libraryName.includes('R_')) {
        const prefix = detectionFunction.split('_')[0] + '_'; // e.g., "R_"
        
        for (const key in globalScope) {
          if (key !== detectionFunction && 
              key.startsWith(prefix) && 
              typeof globalScope[key] === 'function') {
            functions.push(key);
          }
        }
      }
      
      // For other libraries, look for common patterns
      else {
        // Look for functions that might be related to this library
        const libPrefixes = [
          libraryName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          libraryName.replace(/[^a-zA-Z0-9]/g, '_'),
        ];
        
        for (const key in globalScope) {
          if (key !== detectionFunction && typeof globalScope[key] === 'function') {
            for (const prefix of libPrefixes) {
              if (key.startsWith(prefix)) {
                functions.push(key);
                break;
              }
            }
          }
        }
      }
    }
    
    return functions;
  }

  // Dependency management utilities
  
  getDependencyInfo() {
    return libraryManagementUtils.getDependencyInfo(this.dependencyGraph);
  }

  getLoadOrder() {
    return libraryManagementUtils.getLoadOrder(this.dependencyGraph);
  }

  validateNoCycles() {
    return libraryManagementUtils.validateNoCycles(this.dependencyGraph);
  }

  // Library cache management
  clearLibraryCache(libraryName = null) {
    if (libraryName) {
      this.libraryCache.delete(libraryName);
      console.log(`✓ Cleared cache for ${libraryName}`);
    } else {
      this.libraryCache.clear();
      console.log('✓ Cleared all library cache');
    }
  }

  getCacheInfo() {
    const info = {};
    for (const [libraryName, cacheEntry] of this.libraryCache.entries()) {
      info[libraryName] = {
        loaded: cacheEntry.loaded,
        codeSize: cacheEntry.code ? cacheEntry.code.length : 0,
        timestamp: new Date(cacheEntry.timestamp).toISOString()
      };
    }
    return info;
  }

  getGlobalFunction(functionName, libraryName = null) {
    // Check the modern registry first
    if (libraryName && typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
      const found = window.REXX_FUNCTION_LIBS.find(lib => 
        lib.path === libraryName || 
        lib.name === libraryName ||
        lib.path.endsWith('/' + libraryName) ||
        libraryName.endsWith('/' + lib.name)
      );
      if (found && found.functions && found.functions[functionName]) {
        return found.functions[functionName];
      }
    }
    
    // Check namespaced libraries first
    if (libraryName) {
      const libraryType = this.getLibraryType(libraryName);
      let namespaceName;
      
      if (libraryType === 'builtin') {
        namespaceName = this.getLibraryNamespace(libraryName);
      } else if (libraryType === 'module' || libraryType === 'simple-third-party') {
        const libName = libraryName.split('/').pop();
        namespaceName = this.getThirdPartyNamespace(libName);
      }
      
      if (namespaceName) {
        if (typeof window !== 'undefined' && window[namespaceName]) {
          return window[namespaceName][functionName];
        } else if (typeof global !== 'undefined' && global[namespaceName]) {
          return global[namespaceName][functionName];
        }
      }
    }
    
    // Check global scope for legacy libraries
    if (typeof window !== 'undefined') {
      return window[functionName];
    } else if (typeof global !== 'undefined') {
      return global[functionName];
    }
    return undefined;
  }

  // Security and Permission Control Methods

  initializeSecurityHandlers() {
    // Set up global message handler for library permission responses
    if (typeof window !== 'undefined' && window.addEventListener) {
      // Browser environment - listen for permission responses
      const securityHandler = (event) => {
        if (event.data && event.data.type === 'LIBRARY_PERMISSION_RESPONSE') {
          this.handleLibraryPermissionResponse(event.data);
        }
      };
      
      window.addEventListener('message', securityHandler);
      
      // Store handler reference for cleanup if needed
      this.securityMessageHandler = securityHandler;
    }
  }

  async checkLibraryPermissions(libraryName) {
    const env = this.detectEnvironment();
    const libraryType = this.getLibraryType(libraryName);
    
    // Apply different security policies based on environment
    switch (env) {
      case 'nodejs':
        return await this.checkNodeJSPermissions(libraryName, libraryType);
      case 'web-standalone':
        return await this.checkWebPermissions(libraryName, libraryType);
      case 'web-controlbus':
        return await this.checkControlBusPermissions(libraryName, libraryType);
      default:
        throw new Error(`REQUIRE not supported in environment: ${env}`);
    }
  }

  async checkNodeJSPermissions(libraryName, libraryType) {
    // Node.js environment - more permissive for local development
    if (libraryType === 'local' || libraryType === 'npm') {
      // Local and npm modules are trusted in Node.js
      return true;
    }
    
    // Central registry libraries are pre-approved
    if (libraryName.startsWith('central:')) {
      return true;
    }
    
    // Third-party libraries: validate GitHub format if they contain a slash (username/repo)
    if (libraryType === 'third-party') {
      if (libraryName.includes('/')) {
        return await this.validateGitHubLibrary(libraryName);
      }
      // Simple third-party libraries (like discworld-science) are allowed in Node.js
      return true;
    }
    
    // Module libraries always require GitHub validation
    if (libraryType === 'module') {
      return await this.validateGitHubLibrary(libraryName);
    }
    
    // Built-in libraries are always allowed
    if (libraryType === 'builtin') {
      return true;
    }
    
    throw new Error(`Unknown library type for permissions check: ${libraryName}`);
  }

  async checkWebPermissions(libraryName, libraryType) {
    // Web standalone - medium security
    const policy = this.securityPolicy || 'default';
    
    switch (policy) {
      case 'strict':
        // Only allow central registry and built-ins
        if (libraryName.startsWith('central:') || libraryType === 'builtin') {
          return true;
        }
        throw new Error(`Library ${libraryName} blocked by strict security policy`);
        
      case 'moderate':
        // Allow central registry and known GitHub sources
        if (libraryName.startsWith('central:') || libraryType === 'builtin') {
          return true;
        }
        if (libraryType === 'module') {
          return await this.validateGitHubLibrary(libraryName);
        }
        if (libraryType === 'third-party') {
          // Only validate GitHub format if it contains a slash (username/repo)
          if (libraryName.includes('/')) {
            return await this.validateGitHubLibrary(libraryName);
          }
          // Simple third-party libraries (like r-graphing) are allowed
          return true;
        }
        throw new Error(`Library ${libraryName} blocked by moderate security policy`);
        
      case 'default':
      case 'permissive':
        // Allow all with basic validation
        if (libraryType === 'module') {
          return await this.validateGitHubLibrary(libraryName);
        }
        if (libraryType === 'third-party') {
          // Only validate GitHub format if it contains a slash (username/repo)
          if (libraryName.includes('/')) {
            return await this.validateGitHubLibrary(libraryName);
          }
          // Simple third-party libraries (like r-graphing) are allowed
          return true;
        }
        return true;
        
      default:
        throw new Error(`Unknown security policy: ${policy}`);
    }
  }

  async checkControlBusPermissions(libraryName, libraryType) {
    // Control-bus environment - require director approval
    if (libraryType === 'builtin') {
      return true; // Built-ins are always allowed
    }
    
    // Check if already approved in this session
    if (this.approvedLibraries && this.approvedLibraries.has(libraryName)) {
      return true;
    }
    
    // Request permission from director
    return await this.requestDirectorApproval(libraryName);
  }

  async validateGitHubLibrary(libraryName) {
    return await security.validateGitHubLibrary(libraryName, this.getBlockedRepositories.bind(this));
  }

  getBlockedRepositories() {
    return security.getBlockedRepositories();
  }

  async requestDirectorApproval(libraryName) {
    if (!window.parent || window.parent === window) {
      throw new Error('Control-bus mode requires iframe with parent director');
    }
    
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const timeoutId = setTimeout(() => {
        this.pendingPermissionRequests.delete(requestId);
        reject(new Error(`Library permission request timed out for ${libraryName}`));
      }, 30000); // 30 second timeout
      
      // Store the resolver
      this.pendingPermissionRequests.set(requestId, { resolve, reject, timeoutId });
      
      // Send permission request to director
      window.parent.postMessage({
        type: 'LIBRARY_PERMISSION_REQUEST',
        requestId: requestId,
        libraryName: libraryName,
        metadata: this.getLibraryMetadata(libraryName)
      }, '*');
      
      console.log(`📋 Requesting permission to load library: ${libraryName}`);
    });
  }

  handleLibraryPermissionResponse(response) {
    const { requestId, approved, reason } = response;
    const request = this.pendingPermissionRequests.get(requestId);
    
    if (!request) {
      console.warn(`Received permission response for unknown request: ${requestId}`);
      return;
    }
    
    clearTimeout(request.timeoutId);
    this.pendingPermissionRequests.delete(requestId);
    
    if (approved) {
      // Mark as approved for this session
      if (!this.approvedLibraries) {
        this.approvedLibraries = new Set();
      }
      this.approvedLibraries.add(response.libraryName);
      
      console.log(`✅ Library approved by director: ${response.libraryName}`);
      request.resolve(true);
    } else {
      console.log(`❌ Library denied by director: ${response.libraryName} - ${reason}`);
      request.reject(new Error(`Library permission denied: ${reason}`));
    }
  }

  getLibraryMetadata(libraryName) {
    return {
      type: this.getLibraryType(libraryName),
      source: libraryName.startsWith('central:') ? 'central-registry' : 'github-direct',
      riskLevel: this.assessRiskLevel(libraryName)
    };
  }

  assessRiskLevel(libraryName) {
    return security.assessRiskLevel(libraryName);
  }

  setSecurityPolicy(policy) {
    const validPolicies = ['strict', 'moderate', 'default', 'permissive'];
    if (!validPolicies.includes(policy)) {
      throw new Error(`Invalid security policy: ${policy}. Valid options: ${validPolicies.join(', ')}`);
    }
    
    this.securityPolicy = policy;
    console.log(`🔒 Security policy set to: ${policy}`);
  }

  executeLibraryCodeSandboxed(libraryCode, libraryName) {
    // Create a sandboxed execution environment
    const sandbox = this.createSandbox(libraryName);
    
    try {
      // Execute in sandbox with restricted access
      const func = new Function('sandbox', `
        with (sandbox) {
          ${libraryCode}
        }
      `);
      
      func(sandbox);
      
      // Verify sandbox integrity after execution
      this.validateSandboxIntegrity(sandbox, libraryName);
      
      console.log(`🔒 Library ${libraryName} executed in sandbox successfully`);
      
    } catch (error) {
      throw new Error(`Sandboxed execution failed for ${libraryName}: ${error.message}`);
    }
  }

  createSandbox(libraryName) {
    // Create restricted execution environment
    const sandbox = {
      // Allow safe globals
      Math: Math,
      JSON: JSON,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      
      // Restricted console (log only)
      console: {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
      },
      
      // Library-specific namespace
      [this.getThirdPartyNamespace(libraryName.split('/').pop())]: {}
    };
    
    // Block dangerous globals
    sandbox.eval = undefined;
    sandbox.Function = undefined;
    sandbox.require = undefined;
    sandbox.process = undefined;
    sandbox.global = undefined;
    sandbox.window = undefined;
    
    return sandbox;
  }

  validateSandboxIntegrity(sandbox, libraryName) {
    // Check that sandbox wasn't compromised
    const dangerous = ['eval', 'Function', 'require', 'process'];
    
    for (const prop of dangerous) {
      if (sandbox[prop] !== undefined) {
        throw new Error(`Sandbox integrity violation: ${prop} was defined by ${libraryName}`);
      }
    }
    
    // Verify expected functions were defined
    const namespace = this.getThirdPartyNamespace(libraryName.split('/').pop());
    if (!sandbox[namespace]) {
      throw new Error(`Library ${libraryName} did not define expected namespace: ${namespace}`);
    }
  }

  // External REXX script calling support

  async executeExternalScript(scriptPath, args) {
    const fs = require('fs');
    const path = require('path');
    const { parse } = require('./parser');

    try {
      // Resolve the script path
      let resolvedPath = scriptPath;
      if (!path.isAbsolute(scriptPath)) {
        resolvedPath = path.resolve(process.cwd(), scriptPath);
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`External REXX script not found: ${resolvedPath}`);
      }

      // Read the external script
      const scriptContent = fs.readFileSync(resolvedPath, 'utf8');

      // Parse the external script
      const commands = parse(scriptContent);

      // Create a new interpreter instance for the external script
      const externalInterpreter = new RexxInterpreter(this.addressSender);

      // Copy relevant configuration from parent interpreter
      externalInterpreter.traceEnabled = this.traceEnabled;
      externalInterpreter.variables.set('__PARENT_SCRIPT__', true);

      // Pass arguments to the external script as ARG.1, ARG.2, etc.
      for (let i = 0; i < args.length; i++) {
        let argValue;
        
        // Evaluate argument value in parent context
        if (typeof args[i] === 'string') {
          if ((args[i].startsWith('"') && args[i].endsWith('"')) ||
              (args[i].startsWith("'") && args[i].endsWith("'"))) {
            argValue = args[i].slice(1, -1); // Remove quotes
          } else {
            argValue = this.variables.get(args[i]) || args[i];
          }
        } else {
          argValue = this.evaluateExpression(args[i]);
        }

        // Set arguments in external script context
        externalInterpreter.variables.set(`ARG.${i + 1}`, argValue);
      }

      // Set ARG.0 to argument count
      externalInterpreter.variables.set('ARG.0', args.length);

      // Execute the external script
      const result = await externalInterpreter.run(commands);

      // Handle return values from external script
      if (result && result.type === 'RETURN') {
        return { success: true, type: 'EXTERNAL_SCRIPT_COMPLETE', returnValue: result.value };
      }

      // Return success indicator with null value
      return { success: true, type: 'EXTERNAL_SCRIPT_COMPLETE', returnValue: null };

    } catch (error) {
      throw new Error(`Error executing external REXX script '${scriptPath}': ${error.message}`);
    }
  }

}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Interpreter: RexxInterpreter, RexxInterpreter, RexxInterpreter: RexxInterpreter }; // Keep legacy name for backwards compat
} else {
  // Browser environment - attach to window
  window.Interpreter = RexxInterpreter; // Keep Interpreter for backwards compat
  window.RexxInterpreter = RexxInterpreter;
  window.RexxInterpreter = RexxInterpreter; // Legacy alias
}