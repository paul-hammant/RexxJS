/**
 * REXX Interpreter Web Loader
 * 
 * Dynamically loads all required interpreter dependencies in the correct order
 * for browser environments. This eliminates the need to manually include 
 * multiple script tags in HTML files.
 * 
 * Usage:
 *   <script src="src/interpreter-web-loader.js"></script>
 *   <script>
 *     RexxWebLoader.load().then(() => {
 *       // All dependencies loaded, can use RexxInterpreter
 *       const interpreter = new RexxInterpreter();
 *     });
 *   </script>
 */

(function() {
  'use strict';

  // Dependencies in the correct loading order
  const DEPENDENCIES = [
    // Core parsing and parameter conversion
    'function-parsing-strategies.js',
    'parameter-converter.js', 
    'parser.js',
    
    // Modular interpreter components (must load before interpreter.js)
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
    
    // Utility modules
    'utils.js',
    'security.js', 
    'string-processing.js',
    
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
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Determine the base path for loading scripts
   * @returns {string} Base path to src directory
   */
  function getBasePath() {
    // Try to determine base path from current script
    const scripts = document.querySelectorAll('script[src*="interpreter-web-loader"]');
    if (scripts.length > 0) {
      const loaderSrc = scripts[0].src;
      const basePath = loaderSrc.replace(/\/[^\/]*$/, '/');
      return basePath;
    }
    
    // Fallback to relative path
    return './src/';
  }

  /**
   * Load all REXX interpreter dependencies in order
   * @param {Object} options - Loading options
   * @param {string} options.basePath - Base path to src directory (auto-detected if not provided)
   * @param {Function} options.onProgress - Progress callback (loaded, total, filename)
   * @param {boolean} options.verbose - Log loading progress to console
   * @returns {Promise} Promise that resolves when all dependencies are loaded
   */
  async function loadRexxInterpreter(options = {}) {
    const basePath = options.basePath || getBasePath();
    const verbose = options.verbose || false;
    
    if (verbose) {
      console.log(`Loading REXX Interpreter from: ${basePath}`);
    }
    
    try {
      for (let i = 0; i < DEPENDENCIES.length; i++) {
        const filename = DEPENDENCIES[i];
        const fullPath = basePath + filename;
        
        if (verbose) {
          console.log(`Loading ${i + 1}/${DEPENDENCIES.length}: ${filename}`);
        }
        
        await loadScript(fullPath);
        
        if (options.onProgress) {
          options.onProgress(i + 1, DEPENDENCIES.length, filename);
        }
      }
      
      if (verbose) {
        console.log('✅ All REXX Interpreter dependencies loaded successfully');
      }
      
      // Verify RexxInterpreter is available
      if (typeof RexxInterpreter === 'undefined') {
        throw new Error('RexxInterpreter not available after loading dependencies');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to load REXX Interpreter dependencies:', error);
      throw error;
    }
  }

  // Global API
  window.RexxWebLoader = {
    /**
     * Load all REXX interpreter dependencies
     * @param {Object} options - Loading options
     * @returns {Promise} Promise that resolves when ready
     */
    load: loadRexxInterpreter,
    
    /**
     * List of dependencies that will be loaded
     */
    dependencies: DEPENDENCIES.slice(), // Return a copy
    
    /**
     * Check if REXX interpreter is already loaded
     * @returns {boolean} True if RexxInterpreter is available
     */
    isLoaded: function() {
      return typeof RexxInterpreter !== 'undefined';
    }
  };

})();