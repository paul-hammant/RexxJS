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
let requireSystem;
let utils;
let security;
let securityUtils;
let stringUtils;
let pathResolver;
let interpolation;

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
  requireSystem = require('./require-system.js');
  utils = require('./utils.js');
  security = require('./security.js');
  securityUtils = require('./interpreter-security.js');
  stringUtils = require('./string-processing.js');
  pathResolver = require('./path-resolver.js');
  interpolation = require('./interpolation.js');
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
  
  // Require system utilities
  if (registry.has('requireSystem')) {
    requireSystem = registry.get('requireSystem');
  } else {
    // Browser environment fallback for require system
    requireSystem = {
      requireWithDependencies: window.requireWithDependencies,
      loadSingleLibrary: window.loadSingleLibrary,
      requireNodeJS: window.requireNodeJS,
      requireRemoteLibrary: window.requireRemoteLibrary,
      isLocalOrNpmModule: window.isLocalOrNpmModule,
      isRegistryStyleLibrary: window.isRegistryStyleLibrary,
      requireRegistryStyleLibrary: window.requireRegistryStyleLibrary,
      parseRegistryLibraryName: window.parseRegistryLibraryName
    };
  }
  
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

  // Interpolation utilities
  interpolation = window.InterpolationConfig;
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

// Make registration function and registry globally available
if (typeof window !== 'undefined') {
  window.LIBRARY_DETECTION_REGISTRY = LIBRARY_DETECTION_REGISTRY;
  window.registerLibraryDetectionFunction = registerLibraryDetectionFunction;
} else if (typeof global !== 'undefined') {
  global.LIBRARY_DETECTION_REGISTRY = LIBRARY_DETECTION_REGISTRY;
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
  
  // Provide a toJSON method to prevent circular references during serialization
  toJSON() {
    const result = {
      name: this.name,
      message: this.message,
      type: this.type,
      stack: this.stack
    };
    
    // Include sourceContext but remove any circular references
    if (this.sourceContext) {
      result.sourceContext = {
        lineNumber: this.sourceContext.lineNumber,
        sourceLine: this.sourceContext.sourceLine,
        sourceFilename: this.sourceContext.sourceFilename
        // Exclude interpreter and any other potentially circular references
      };
    }
    
    return result;
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
      // Default inline output handler with standard interface
      this.outputHandler = {
        write: (text) => process.stdout ? process.stdout.write(text) : console.log(text),
        writeLine: (text) => console.log(text),
        writeError: (text) => console.error(text),
        output: (text) => console.log(text) // Legacy compatibility
      };
    }
    
    this.address = 'default';  // Default namespace
    this.variables = new Map();
    this.builtInFunctions = this.initializeBuiltInFunctions();
    this.externalFunctions = {}; // Functions from REQUIRE'd libraries

    // Initialize scriptPath for path resolution
    // Will be set to actual script path when run() is called with a sourceFilename
    this.scriptPath = pathResolver ? pathResolver.NO_SCRIPT_PATH : '<inline>';

    // Detect and expose execution environment globally
    this.detectAndExposeEnvironment();
    
    // ADDRESS LINES functionality  
    this.addressLinesCount = 0;
    this.addressLinesBuffer = [];
    this.addressLinesStartLine = 0;
    
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
    let importedPathFunctions = {};
    let importedHttpFunctions = {};
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
        const { pathFunctions } = require('./path-functions');
        const { httpFunctions } = require('./http-functions');
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
        importedPathFunctions = pathFunctions;
        importedHttpFunctions = httpFunctions;
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
        importedPathFunctions = window.pathFunctions || {};
        importedHttpFunctions = window.httpFunctions || {};
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

    // Create interpreter-aware PATH_RESOLVE that uses the current script path
    const interpreterAwarePathFunctions = {
      'PATH_RESOLVE': (pathStr, contextScriptPath) => {
        // Use provided context path, or fall back to interpreter's script path
        const scriptPath = contextScriptPath || this.scriptPath || null;
        return importedPathFunctions['PATH_RESOLVE'](pathStr, scriptPath);
      }
    };

    // Create interpreter-aware FILE functions that automatically resolve paths
    const interpreterAwareFileFunctions = {};
    const fileFunctionsToWrap = [
      'FILE_READ', 'FILE_WRITE', 'FILE_APPEND', 'FILE_COPY', 'FILE_MOVE',
      'FILE_DELETE', 'FILE_EXISTS', 'FILE_SIZE', 'FILE_LIST', 'FILE_BACKUP'
    ];

    for (const funcName of fileFunctionsToWrap) {
      if (importedFileFunctions[funcName]) {
        const originalFunc = importedFileFunctions[funcName];

        interpreterAwareFileFunctions[funcName] = async (...args) => {
          // Resolve path arguments (first argument is always a path, some functions have 2 paths)
          const resolvedArgs = [...args];

          // Helper to check if a path needs resolution
          // Only resolve root: and cwd: prefixes for FILE_* functions
          // Let ./  and ../ be handled by file-functions.js as before
          const needsResolution = (path) => {
            if (typeof path !== 'string') return false;
            return path.startsWith('root:') || path.startsWith('cwd:');
          };

          // Resolve first path argument
          if (args.length > 0 && needsResolution(args[0])) {
            try {
              const { resolvePath } = require('./path-resolver');
              resolvedArgs[0] = resolvePath(args[0], this.scriptPath);
            } catch (error) {
              throw new Error(`${funcName} path resolution failed: ${error.message}`);
            }
          }

          // For FILE_COPY and FILE_MOVE, also resolve second path (destination)
          if ((funcName === 'FILE_COPY' || funcName === 'FILE_MOVE') && args.length > 1 && needsResolution(args[1])) {
            try {
              const { resolvePath } = require('./path-resolver');
              resolvedArgs[1] = resolvePath(args[1], this.scriptPath);
            } catch (error) {
              throw new Error(`${funcName} destination path resolution failed: ${error.message}`);
            }
          }

          return await originalFunc(...resolvedArgs);
        };
      }
    }

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
      ...interpreterAwareFileFunctions,
      ...interpreterAwarePathFunctions,
      ...importedHttpFunctions,
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

      // Environment variable access
      'GETENV': (varName) => {
        // Access OS environment variables from process.env
        // Returns empty string if not found (REXX convention)
        if (typeof process !== 'undefined' && process.env) {
          return process.env[varName] || '';
        }
        // In browser environment, no process.env access
        return '';
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
              result = exprFunc.call(this, ...varValues);
              break;
              
            case 'statement':
              // Force statement mode - execute as-is
              const stmtFunc = new Function(...varNames, jsCode);
              result = stmtFunc.call(this, ...varValues);
              break;
              
            case 'auto':
            default:
              // Try expression first, fall back to statement
              try {
                const func = new Function(...varNames, `return (${jsCode})`);
                result = func.call(this, ...varValues);
              } catch (e) {
                // If expression fails, try as function body (for statements)
                try {
                  const func = new Function(...varNames, jsCode);
                  result = func.call(this, ...varValues);
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
        let cleanLibraryName = libraryName.replace(/^['"]|['"]$/g, '');
        let cleanAsClause = null;

        if (asClause !== null) {
          if (typeof asClause !== 'string') {
            throw new Error('AS clause must be a string');
          }
          cleanAsClause = asClause.replace(/^['"]|['"]$/g, '');
        }

        // Resolve path using path-resolver for local file paths
        // Only resolve if it looks like a file path (not a registry/npm module name)
        if (cleanLibraryName.startsWith('./') ||
            cleanLibraryName.startsWith('../') ||
            cleanLibraryName.startsWith('root:') ||
            cleanLibraryName.startsWith('cwd:') ||
            cleanLibraryName.startsWith('/') ||
            /^[A-Za-z]:[\\/]/.test(cleanLibraryName)) {
          // Use PATH_RESOLVE to get absolute path
          try {
            const { resolvePath } = require('./path-resolver');
            cleanLibraryName = resolvePath(cleanLibraryName, this.scriptPath);
          } catch (error) {
            throw new Error(`REQUIRE path resolution failed: ${error.message}`);
          }
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

    // Set scriptPath for path resolution in PATH_RESOLVE and FILE_* functions
    // Override NO_SCRIPT_PATH default if actual source file is provided
    if (sourceFilename) {
      this.scriptPath = sourceFilename;
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
    let lastProcessedLine = 0; // Track the last processed source line number
    
    for (let i = startIndex; i < commands.length; i++) {
      const command = commands[i];
      
      
      // Track current line number for error reporting and push execution context
      if (command && command.lineNumber) {
        lastProcessedLine = command.lineNumber;
        
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
      
      if (command.type === 'LABEL' && this.callStack.length === 0) {
        
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
    
    
    return null;
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
          this.address = command.target.toLowerCase();
          // Clear lines state when switching to default
          if (this.address === 'default') {
            this.addressLinesCount = 0;
            this.addressLinesBuffer = [];
            this.addressLinesStartLine = 0;
          }
          break;
          
        case 'ADDRESS_WITH_STRING':
          // Set the address target and execute the command string immediately
          this.address = command.target.toLowerCase();
          await this.executeQuotedString({ type: 'QUOTED_STRING', value: command.commandString });
          break;
          
        // ADDRESS_WITH_MATCHING case removed - use HEREDOC instead

          
        // ADDRESS_WITH_LINES case removed - use HEREDOC instead
        
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
                  const sourceContext = this.currentLineNumber ? {
                    lineNumber: this.currentLineNumber,
                    sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                    sourceFilename: this.sourceFilename || '',
                    interpreter: this,
                    interpolation: interpolation
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
                    const sourceContext = this.currentLineNumber ? {
                      lineNumber: this.currentLineNumber,
                      sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                      sourceFilename: this.sourceFilename || '',
                      interpreter: this,
                    interpolation: interpolation
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
            interpreter: this,
                    interpolation: interpolation
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

    // Check if this is a built-in REXX function FIRST
    // Built-in functions like LENGTH, SUBSTR, POS should ALWAYS work regardless of ADDRESS context
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

    // Check if this is an external function from REQUIRE'd library (case-sensitive check first, then uppercase)
    if (this.externalFunctions[funcCall.command] || this.externalFunctions[method]) {
      const resolvedParams = {};
      for (const [key, value] of Object.entries(funcCall.params || {})) {
        resolvedParams[key] = await this.resolveValue(value);
      }

      const externalFunc = this.externalFunctions[funcCall.command] || this.externalFunctions[method];
      const args = callConvertParamsToArgs(funcCall.command, resolvedParams);

      return await externalFunc(...args);
    }

    // Check if current ADDRESS target has a handler for custom methods
    // This allows ADDRESS targets to define their own methods while still preserving built-in functions
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
        interpreter: this,
                    interpolation: interpolation
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
      interpreter: this,
                    interpolation: interpolation
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
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this,
                    interpolation: interpolation
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
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this,
                    interpolation: interpolation
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
        interpreter: this,
                    interpolation: interpolation
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
    const ctx = {
      libraryManagementUtils,
      loadingQueue: this.loadingQueue,
      checkLibraryPermissions: this.checkLibraryPermissions.bind(this),
      isLibraryLoaded: this.isLibraryLoaded.bind(this),
      detectAndRegisterAddressTargets: (libName, asClause) => this.detectAndRegisterAddressTargets(libName, asClause),
      extractDependencies: this.extractDependencies.bind(this),
      dependencyGraph: this.dependencyGraph,
      registerLibraryFunctions: (libName, asClause) => this.registerLibraryFunctions(libName, asClause),
      requireRegistryLibrary: this.requireRegistryLibrary.bind(this),
      isRemoteOrchestrated: this.isRemoteOrchestrated.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      requireViaCheckpoint: this.requireViaCheckpoint.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      requireWebStandalone: this.requireWebStandalone.bind(this),
      requireControlBus: this.requireControlBus.bind(this),
      requireNodeJS: this.requireNodeJS.bind(this),
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      isLocalOrNpmModule: this.isLocalOrNpmModule.bind(this),
      isRegistryStyleLibrary: this.isRegistryStyleLibrary.bind(this),
      requireRegistryStyleLibrary: this.requireRegistryStyleLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireWithDependencies(libraryName, asClause, ctx);
  }

  async loadSingleLibrary(libraryName) {
    const ctx = {
      requireRegistryLibrary: this.requireRegistryLibrary.bind(this),
      isRemoteOrchestrated: this.isRemoteOrchestrated.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      requireViaCheckpoint: this.requireViaCheckpoint.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      requireWebStandalone: this.requireWebStandalone.bind(this),
      requireControlBus: this.requireControlBus.bind(this),
      requireNodeJS: this.requireNodeJS.bind(this),
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this)
    };
    return await requireSystem.loadSingleLibrary(libraryName, ctx);
  }

  async requireNodeJS(libraryName) {
    const ctx = {
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      isLocalOrNpmModule: this.isLocalOrNpmModule.bind(this),
      isRegistryStyleLibrary: this.isRegistryStyleLibrary.bind(this),
      requireRegistryStyleLibrary: this.requireRegistryStyleLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireNodeJS(libraryName, ctx);
  }

  /**
   * Load library from remote Git platforms (GitHub, GitLab, Azure DevOps, etc.)
   * @param {string} libraryName - Library name or URL
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRemoteLibrary(libraryName) {
    const ctx = {
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this)
    };
    return await requireSystem.requireRemoteLibrary(libraryName, ctx);
  }

  isLocalOrNpmModule(libraryName) {
    const ctx = {
      libraryUrlUtils
    };
    return requireSystem.isLocalOrNpmModule(libraryName, ctx);
  }

  /**
   * Check if library name follows registry style (namespace/module@version)
   * @param {string} libraryName - Library name to check
   * @returns {boolean} True if registry style
   */
  isRegistryStyleLibrary(libraryName) {
    return requireSystem.isRegistryStyleLibrary(libraryName);
  }

  /**
   * Resolve library through registry system
   * @param {string} libraryName - Registry-style library name (namespace/module@version)
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRegistryStyleLibrary(libraryName) {
    const ctx = {
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireRegistryStyleLibrary(libraryName, ctx);
  }

  /**
   * Parse registry library name into components
   * @param {string} libraryName - Library name like "namespace/module@version"
   * @returns {Object} Parsed components {namespace, module, version}
   */
  parseRegistryLibraryName(libraryName) {
    return requireSystem.parseRegistryLibraryName(libraryName);
  }

  /**
   * Look up publisher registry URL
   * @param {string} namespace - Publisher namespace
   * @returns {Promise<string>} Registry URL for the publisher
   */
  async lookupPublisherRegistry(namespace) {
    const publisherRegistryUrl = 'https://rexxjs.org/.list-of-public-lib-publishers.txt';
    
    try {
      // Fetch publisher registry
      const response = await fetch(publisherRegistryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch publisher registry: ${response.status}`);
      }
      
      const registryText = await response.text();
      const lines = registryText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Parse CSV: namespace,registry_url
      for (const line of lines) {
        const [lineNamespace, registryUrl] = line.split(',').map(s => s.trim());
        if (lineNamespace === namespace) {
          return registryUrl;
        }
      }
      
      throw new Error(`Namespace '${namespace}' not found in publisher registry`);
      
    } catch (error) {
      throw new Error(`Publisher registry lookup failed: ${error.message}`);
    }
  }

  /**
   * Look up module URL in publisher's registry
   * @param {string} registryUrl - Publisher's registry URL
   * @param {string} module - Module name
   * @param {string} version - Version tag
   * @returns {Promise<string>} Final download URL for the module
   */
  async lookupModuleInRegistry(registryUrl, module, version) {
    try {
      // Fetch module registry
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch module registry: ${response.status}`);
      }
      
      const registryText = await response.text();
      const lines = registryText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Parse CSV: module_name,type,url_template
      for (const line of lines) {
        const [moduleName, moduleType, urlTemplate] = line.split(',').map(s => s.trim());
        if (moduleName === module) {
          // Substitute {tag} in URL template
          const finalUrl = urlTemplate.replace('{tag}', version);
          return finalUrl;
        }
      }
      
      throw new Error(`Module '${module}' not found in registry`);
      
    } catch (error) {
      throw new Error(`Module registry lookup failed: ${error.message}`);
    }
  }

  async requireNodeJSModule(libraryName) {
    return await requireSystem.requireNodeJSModule(libraryName, this);
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
    return await requireSystem.extractDependencies(libraryName, this);
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
      } catch (error) {
        // Detection function exists but failed to execute
        return false;
      }
    }
    
    
    // If no detection function found, library is not loaded
    return false;
  }

  getLibraryNamespace(libraryName) {
    // Generate namespace from library name
    // Extract base name: "./tests/mock-address.js" -> "mock-address"
    const basename = libraryName.split('/').pop().replace(/\.(js|rexx)$/, '');
    // Convert to valid identifier: "mock-address" -> "mock_address"
    const namespace = basename.replace(/[^a-zA-Z0-9_]/g, '_');
    return namespace;
  }

  getLibraryDetectionFunction(libraryName) {
    return requireSystem.getLibraryDetectionFunction(libraryName);
  }

  extractMetadataFunctionName(libraryCode) {
    return requireSystem.extractMetadataFunctionName(libraryCode);
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

  async loadAndExecuteLibrary(libraryName) {
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
    return await requireSystem.requireRegistryLibrary(namespacedLibrary, this);
  }

  async loadLibraryFromUrl(url, libraryName) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch library from ${url}: ${response.status} ${response.statusText}`);
      }

      const libraryCode = await response.text();

      // Execute the library code in global scope
      if (url.endsWith('.bundle.js')) {
        // Webpack bundle - use Function constructor
        const globalScope = typeof global !== 'undefined' ? global : window;
        const executeInGlobalScope = new Function('global', 'window', libraryCode);
        executeInGlobalScope(globalScope, globalScope);
      } else {
        // Unbundled module - temporarily make require global, then eval
        const globalScope = typeof global !== 'undefined' ? global : window;

        // Create a require that can load from real filesystem (outside pkg snapshot)
        // Set it globally and keep it - don't restore it
        if (typeof require !== 'undefined' && !globalScope.require) {
          // Use Module.createRequire with a path that can find node_modules
          // Try parent directory first, then cwd
          const Module = require('module');
          const path = require('path');
          const fs = require('fs');

          let requirePath = process.cwd();
          // Check if node_modules exists in parent directory
          const parentNodeModules = path.join(requirePath, '..', 'node_modules');
          if (fs.existsSync(parentNodeModules)) {
            requirePath = path.join(requirePath, '..');
          }

          const realFsRequire = Module.createRequire(path.join(requirePath, 'package.json'));

          // Set global.require so functions can access it
          globalScope.require = realFsRequire;

          // Use Function constructor with require parameter to give eval'd code access
          const func = new Function('require', 'module', 'exports', `
            ${libraryCode}
          `);

          // Call with our real filesystem require
          const mockModule = { exports: {} };
          func(realFsRequire, mockModule, mockModule.exports);

          // Make exports globally available
          if (mockModule.exports && typeof mockModule.exports === 'object') {
            for (const [key, value] of Object.entries(mockModule.exports)) {
              if (key && key !== 'undefined' && value !== undefined) {
                globalScope[key] = value;
              }
            }
          }
        } else {
          // If already set or no require available, just eval
          eval(libraryCode);
        }
      }

      // Detect and register ADDRESS handlers
      this.detectAndRegisterAddressTargets(libraryName);

      // Register the library functions
      this.registerLibraryFunctions(libraryName);

      // Register the detection function for dependency extraction
      // Extract metadata function name from the loaded code
      const metadataFunctionName = this.extractMetadataFunctionName(libraryCode);
      if (metadataFunctionName) {
        registerLibraryDetectionFunction(libraryName, metadataFunctionName);
        console.log(`✓ Registered detection function ${metadataFunctionName} for ${libraryName}`);
      }

      console.log(`✓ Loaded registry library: ${libraryName}`);
      return true;

    } catch (error) {
      throw new Error(`Failed to load registry library ${libraryName}: ${error.message}`);
    }
  }

  async requireWebStandalone(libraryName) {
    // Check if it's a registry-style library (namespace/module@version)
    if (this.isRegistryStyleLibrary(libraryName)) {
      return await this.requireRegistryStyleLibrary(libraryName);
    }
    
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
      
      // Verify loading succeeded - use new @rexxjs-meta pattern
      const extractedFunctionName = this.extractMetadataFunctionName(libraryCode);
      const detectionFunction = extractedFunctionName || this.getLibraryDetectionFunction(libraryName);
      
      const globalScope = typeof window !== 'undefined' ? window : global;
      if (!globalScope[detectionFunction] || typeof globalScope[detectionFunction] !== 'function') {
        console.log(`Looking for detection function: ${detectionFunction}`);
        console.log(`Available global functions:`, Object.keys(globalScope).filter(k => k.includes('META') || k.includes('MAIN')));
        throw new Error(`Library executed but detection function not found: ${detectionFunction}`);
      }
      
      // Register library functions with the interpreter
      this.registerLibraryFunctions(libraryName);
    } catch (error) {
      throw new Error(`Failed to execute library code: ${error.message}`);
    }
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

        // Register as external function (from REQUIRE'd library) with potentially modified name
        this.externalFunctions[registeredName] = (...args) => {
          return func(...args);
        };
      }
    }
    
    // NEW: Check if this library has a metadata provider function
    if (this.libraryMetadataProviders && this.libraryMetadataProviders.has(libraryName)) {
      const metadataFunctionName = this.libraryMetadataProviders.get(libraryName);
      
      try {
        // Call the metadata provider function to get full metadata
        const metadataFunc = this.getGlobalFunction(metadataFunctionName, libraryName);
        if (metadataFunc) {
          const metadata = metadataFunc();
          console.log(`✓ Retrieved metadata from ${metadataFunctionName} for ${libraryName}:`, metadata);
          
          // Store metadata for later use by require system
          this.libraryMetadata = this.libraryMetadata || new Map();
          this.libraryMetadata.set(libraryName, metadata);
          
          // Extract and validate dependencies if they exist
          if (metadata.dependencies) {
            const depKeys = Object.keys(metadata.dependencies);
            if (depKeys.length > 0) {
              console.log(`✓ Library ${libraryName} declares dependencies: ${depKeys.join(', ')}`);
            }
          }
        } else {
          console.warn(`Metadata function ${metadataFunctionName} not found for ${libraryName}`);
        }
      } catch (error) {
        console.error(`Failed to call metadata function ${metadataFunctionName} for ${libraryName}:`, error);
        throw new Error(`Metadata provider function ${metadataFunctionName} failed: ${error.message}`);
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

    // Try the computed namespace (e.g., "./tests/test-libs/discworld-science.js" -> "discworld_science")
    const libNamespace = this.getLibraryNamespace(libraryName);
    const libNamespaceFunctions = this.extractFunctionsFromNamespace(libNamespace);
    if (libNamespaceFunctions.length > 0) {
      return libNamespaceFunctions;
    }

    // For module-style libraries, check the extracted lib name namespace
    const libraryType = this.getLibraryType(libraryName);
    if (libraryType === 'module') {
      const libName = libraryName.split('/').pop();
      const moduleNamespaceFunctions = this.extractFunctionsFromNamespace(libName);
      if (moduleNamespaceFunctions.length > 0) {
        return moduleNamespaceFunctions;
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
        // Check for functions list in metadata (supports two formats)
        const functionsList = (metadata && metadata.provides && metadata.provides.functions) || 
                             (metadata && metadata.functions);
        
        if (functionsList && Array.isArray(functionsList)) {
          for (const funcName of functionsList) {
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
    return securityUtils.initializeSecurityHandlers.call(this);
  }

  async checkLibraryPermissions(libraryName) {
    return await securityUtils.checkLibraryPermissions.call(this, libraryName);
  }

  async checkNodeJSPermissions(libraryName, libraryType) {
    return await securityUtils.checkNodeJSPermissions.call(this, libraryName, libraryType);
  }

  async checkWebPermissions(libraryName, libraryType) {
    return await securityUtils.checkWebPermissions.call(this, libraryName, libraryType);
  }

  async checkControlBusPermissions(libraryName, libraryType) {
    return await securityUtils.checkControlBusPermissions.call(this, libraryName, libraryType);
  }

  async validateGitHubLibrary(libraryName) {
    return await securityUtils.validateGitHubLibrary.call(this, libraryName);
  }

  getBlockedRepositories() {
    return securityUtils.getBlockedRepositories.call(this);
  }

  async requestDirectorApproval(libraryName) {
    return await securityUtils.requestDirectorApproval.call(this, libraryName);
  }

  handleLibraryPermissionResponse(response) {
    return securityUtils.handleLibraryPermissionResponse.call(this, response);
  }

  getLibraryMetadata(libraryName) {
    return securityUtils.getLibraryMetadata.call(this, libraryName);
  }

  assessRiskLevel(libraryName) {
    return securityUtils.assessRiskLevel.call(this, libraryName);
  }

  setSecurityPolicy(policy) {
    return securityUtils.setSecurityPolicy.call(this, policy);
  }

  executeLibraryCodeSandboxed(libraryCode, libraryName) {
    return securityUtils.executeLibraryCodeSandboxed.call(this, libraryCode, libraryName);
  }

  createSandbox(libraryName) {
    return securityUtils.createSandbox.call(this, libraryName);
  }

  validateSandboxIntegrity(sandbox, libraryName) {
    return securityUtils.validateSandboxIntegrity.call(this, sandbox, libraryName);
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
      // Note: args are already evaluated by the caller (interpreter-parse-subroutine.js)
      for (let i = 0; i < args.length; i++) {
        // Arguments are already evaluated, just use them directly
        externalInterpreter.variables.set(`ARG.${i + 1}`, args[i]);
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

  detectAndExposeEnvironment() {
    const env = {
      type: 'unknown',
      nodeVersion: null,
      isPkg: false,
      hasNodeJsRequire: false,
      hasWindow: false,
      hasDOM: false
    };

    // Detect Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      env.type = 'nodejs';
      env.nodeVersion = process.versions.node;
      
      // Detect pkg environment
      if (typeof process.pkg !== 'undefined' || process.versions.pkg) {
        env.type = 'pkg';
        env.isPkg = true;
      }
    }
    
    // Detect browser
    else if (typeof window !== 'undefined') {
      env.type = 'browser';
      env.hasWindow = true;
      
      // Detect DOM availability
      if (typeof document !== 'undefined') {
        env.hasDOM = true;
      }
    }
    
    // Check for Node.js require() availability (not REXX REQUIRE)
    env.hasNodeJsRequire = typeof require !== 'undefined';
    
    // Expose globally for all libraries to use
    const globalScope = typeof window !== 'undefined' ? window : global;
    globalScope.REXX_ENVIRONMENT = env;
    
    // Also set as interpreter variable for REXX scripts
    this.variables.set('RUNTIME.TYPE', env.type);
    this.variables.set('RUNTIME.NODE_VERSION', env.nodeVersion || '');
    this.variables.set('RUNTIME.IS_PKG', env.isPkg ? '1' : '0');
    this.variables.set('RUNTIME.HAS_NODEJS_REQUIRE', env.hasNodeJsRequire ? '1' : '0');
    this.variables.set('RUNTIME.HAS_WINDOW', env.hasWindow ? '1' : '0');
    this.variables.set('RUNTIME.HAS_DOM', env.hasDOM ? '1' : '0');
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