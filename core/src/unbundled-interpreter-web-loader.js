/**
 * Unbundled REXX Interpreter Web Loader
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 *
 * DEVELOPMENT/TESTING ONLY - Not included in production bundle
 *
 * This loader is optimized for loading individual source files in development
 * and testing scenarios (e.g., Playwright tests). It loads each module as a
 * separate script in the correct order and ensures proper initialization.
 *
 * For production use, use the webpack-bundled version: rexxjs.bundle.js
 *
 * Usage:
 *   <script src="src/unbundled-interpreter-web-loader.js"></script>
 *   <script>
 *     UnbundledRexxWebLoader.load().then(() => {
 *       const interpreter = new RexxInterpreter();
 *     });
 *   </script>
 */

(function() {
  'use strict';

  // All modules in the correct loading order
  // This is a hard-coded solution specific to unbundled testing
  const MODULES = [
    // Core parsing and utilities
    'function-parsing-strategies.js',
    'parameter-converter.js',
    'parser.js',

    // DOM support
    'dom-element-manager.js',

    // String and interpolation processing
    'interpolation.js',
    'escape-sequence-processor.js',

    // Modular interpreter components
    'interpreter-string-and-expression-processing.js',
    'interpreter-variable-stack.js',
    'interpreter-evaluation-utilities.js',
    'interpreter-execution-context.js',
    'interpreter-control-flow.js',
    'interpreter-expression-value-resolution.js',
    'interpreter-dom-manager.js',
    'interpreter-error-handling.js',
    'interpreter-parse-subroutine.js',
    'interpreter-trace-formatting.js',
    'interpreter-library-management.js',
    'interpreter-library-url.js',
    'interpreter-builtin-functions.js',
    'interpreter-callback-evaluation.js',
    'interpreter-function-execution.js',
    'interpreter-command-address.js',
    'interpreter-array-functions.js',
    'interpreter-exit-unless.js',
    'interpreter-library-require-wrappers.js',
    'interpreter-library-metadata.js',
    'interpreter-security.js',

    // Utility modules
    'utils.js',
    'security.js',
    'string-processing.js',
    'path-resolver.js',

    // Function libraries
    'json-functions.js',
    'url-functions.js',
    'string-functions.js',
    'math-functions.js',
    'date-time-functions.js',
    'array-functions.js',
    'logic-functions.js',
    'data-functions.js',
    'validation-functions.js',
    'cryptography-functions.js',
    'dom-functions.js',
    'file-functions.js',
    'http-functions.js',

    // Special modules
    'require-system.js',
    'address-handler-utils.js',
    'interpolation-functions.js',
    'composite-output-handler.js',

    // Main interpreter (must load last)
    'interpreter.js'
  ];

  /**
   * Load a single script dynamically
   * @param {string} src - Script source path
   * @returns {Promise} Promise that resolves when script loads
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Special handling for interpreter.js - catch runtime errors
      if (src.endsWith('interpreter.js')) {
        const script = document.createElement('script');
        script.src = src;

        script.onload = () => {
          // After loading, check if there were any runtime errors
          try {
            if (typeof window.RexxInterpreter === 'undefined') {
              console.warn('[UnbundledRexxWebLoader] interpreter.js loaded but RexxInterpreter is still undefined');
              console.warn('[UnbundledRexxWebLoader] Checking for error clues...');
              console.warn('[UnbundledRexxWebLoader] window.registry size:', window.rexxModuleRegistry ? window.rexxModuleRegistry.size : 'no registry');
            }
          } catch (e) {
            console.error('[UnbundledRexxWebLoader] Error checking interpreter.js status:', e);
          }
          resolve();
        };

        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      } else {
        // Standard loading for other scripts
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      }
    });
  }

  // Initialize REXX_ENVIRONMENT - before loading any modules
  if (!window.REXX_ENVIRONMENT) {
    window.REXX_ENVIRONMENT = {
      type: typeof window !== 'undefined' ? 'browser' : 'unknown',
      nodeVersion: null,
      isPkg: false,
      hasNodeJsRequire: typeof require !== 'undefined',
      hasWindow: typeof window !== 'undefined',
      hasDOM: typeof window !== 'undefined' && typeof document !== 'undefined'
    };
  }

  // Initialize global REXX function library registry
  if (!window.REXX_FUNCTION_LIBS) {
    window.REXX_FUNCTION_LIBS = [];
  }

  // Initialize module registry for require() shim
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }

  // Set up require() shim for browser environment
  // This is necessary because raw source files contain require() calls
  if (typeof require === 'undefined' && typeof window !== 'undefined') {
    window.require = function(modulePath) {
      // Extract module name from path (handle both './moduleName' and 'moduleName')
      const moduleName = modulePath.replace(/^\.\//, '').replace(/\.js$/, '');
      console.log(`[require() shim] Looking for module: "${modulePath}" (extracted name: "${moduleName}")`);

      // Try to get from registry first
      if (window.rexxModuleRegistry && window.rexxModuleRegistry.has(moduleName)) {
        const module = window.rexxModuleRegistry.get(moduleName);
        if (module && typeof module === 'object') {
          console.log(`[require() shim] ✅ HIT: Found "${moduleName}" in registry`);
          return module;
        }
      }
      console.log(`[require() shim] ❌ MISS: "${moduleName}" not in registry (registry size: ${window.rexxModuleRegistry ? window.rexxModuleRegistry.size : 'no registry'})`);

      // Try to get from window directly (for functions/classes defined on window)
      const possibleNames = [
        moduleName,
        moduleName.charAt(0).toUpperCase() + moduleName.slice(1), // CamelCase
        moduleName.split('-').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('') // kebab-case to camelCase
      ];

      console.log(`[require() shim] Trying window global lookups with names: ${possibleNames.join(', ')}`);

      for (const name of possibleNames) {
        if (typeof window[name] !== 'undefined') {
          const module = window[name];
          console.log(`[require() shim] ✅ HIT: Found "${name}" on window (type: ${typeof module})`);

          // Wrap single functions/values in an object
          if (typeof module === 'function' || typeof module === 'string' || typeof module === 'number') {
            // If it's a function or primitive, wrap it with the name as key
            const wrapper = {};
            wrapper[name] = module;
            console.log(`[require() shim] Wrapped primitive "${name}" in object`);
            return wrapper;
          }
          // If it's already an object, return as-is
          if (typeof module === 'object') {
            console.log(`[require() shim] Returning object "${name}" as-is`);
            return module;
          }
          console.log(`[require() shim] Wrapping "${name}" in default export`);
          return { default: module };
        }
      }

      console.log(`[require() shim] ❌ MISS: "${modulePath}" not found in any lookup (tried: ${possibleNames.join(', ')})`);
      // Return empty object as final fallback with warning
      if (console && console.warn) {
        console.warn(`[require() shim] ⚠️  FALLBACK: require('${modulePath}') returning empty object`);
      }
      return {};
    };
  }

  /**
   * Determine the base path for loading scripts
   * @returns {string} Base path to src directory
   */
  function getBasePath() {
    // Try to determine base path from current script
    const scripts = document.querySelectorAll('script[src*="unbundled-interpreter-web-loader"]');
    if (scripts.length > 0) {
      const loaderSrc = scripts[0].src;
      const basePath = loaderSrc.replace(/\/[^\/]*$/, '/');
      return basePath;
    }

    // Fallback to relative path
    return './src/';
  }

  /**
   * Load all REXX interpreter modules in order
   * @param {Object} options - Loading options
   * @param {string} options.basePath - Base path to src directory (auto-detected if not provided)
   * @param {Function} options.onProgress - Progress callback (loaded, total, filename)
   * @param {boolean} options.verbose - Log loading progress to console
   * @returns {Promise} Promise that resolves when all modules are loaded
   */
  async function loadRexxInterpreter(options = {}) {
    const basePath = options.basePath || getBasePath();
    const verbose = options.verbose || true; // Always verbose for debugging

    console.log(`[UnbundledRexxWebLoader] Loading from: ${basePath}`);
    console.log(`[UnbundledRexxWebLoader] Total modules to load: ${MODULES.length}`);

    try {
      for (let i = 0; i < MODULES.length; i++) {
        const filename = MODULES[i];
        const fullPath = basePath + filename;

        console.log(`[UnbundledRexxWebLoader] Loading ${i + 1}/${MODULES.length}: ${filename}`);

        try {
          await loadScript(fullPath);
          console.log(`[UnbundledRexxWebLoader] ✅ Loaded: ${filename}`);
        } catch (moduleError) {
          console.error(`[UnbundledRexxWebLoader] ❌ Failed to load ${filename}:`, moduleError);
          throw moduleError;
        }

        if (options.onProgress) {
          options.onProgress(i + 1, MODULES.length, filename);
        }
      }

      console.log('[UnbundledRexxWebLoader] ✅ All modules loaded successfully');

      // Give a delay to ensure all module initialization is complete and interpreter.js has executed
      // We need more time because interpreter.js's IIFE and class definition can take time
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`[UnbundledRexxWebLoader] Checking for RexxInterpreter in window...`);
      console.log(`[UnbundledRexxWebLoader] typeof RexxInterpreter = ${typeof RexxInterpreter}`);
      console.log(`[UnbundledRexxWebLoader] typeof window.RexxInterpreter = ${typeof window.RexxInterpreter}`);
      console.log(`[UnbundledRexxWebLoader] window.rexxModuleRegistry size: ${window.rexxModuleRegistry ? window.rexxModuleRegistry.size : 'not found'}`);
      if (window.rexxModuleRegistry) {
        const registryKeys = Array.from(window.rexxModuleRegistry.keys());
        console.log(`[UnbundledRexxWebLoader] Registry contents: ${registryKeys.join(', ')}`);
      }
      console.log(`[UnbundledRexxWebLoader] Available window globals with 'Rexx': ${Object.keys(window).filter(k => k.includes('Rexx') || k.includes('rexx')).join(', ')}`);

      // Verify RexxInterpreter is available
      if (typeof window.RexxInterpreter === 'undefined') {
        console.error('[UnbundledRexxWebLoader] ❌ RexxInterpreter NOT found in window');
        console.error('[UnbundledRexxWebLoader] ❌ This means interpreter.js either failed to load or failed to create the class');
        console.error('[UnbundledRexxWebLoader] ❌ Checking window.RexxInterpreterBuilder:', typeof window.RexxInterpreterBuilder);
        console.error('[UnbundledRexxWebLoader] ❌ Checking window.Interpreter:', typeof window.Interpreter);
        throw new Error('RexxInterpreter not available after loading modules');
      }

      console.log('[UnbundledRexxWebLoader] ✅ SUCCESS: RexxInterpreter is available');
      return true;

    } catch (error) {
      console.error('[UnbundledRexxWebLoader] ❌ Failed to load modules:', error);
      throw error;
    }
  }

  // Global API - exposed as both UnbundledRexxWebLoader and RexxWebLoader
  const api = {
    /**
     * Load all REXX interpreter modules
     * @param {Object} options - Loading options
     * @returns {Promise} Promise that resolves when ready
     */
    load: loadRexxInterpreter,

    /**
     * List of all modules that will be loaded
     */
    modules: MODULES.slice(),

    /**
     * Check if REXX interpreter is already loaded
     * @returns {boolean} True if RexxInterpreter is available
     */
    isLoaded: function() {
      return typeof RexxInterpreter !== 'undefined';
    }
  };

  window.UnbundledRexxWebLoader = api;
  // Always expose as RexxWebLoader for tests
  window.RexxWebLoader = api;

})();
