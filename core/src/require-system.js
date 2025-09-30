'use strict';

/**
 * REQUIRE system module - Centralized helpers for library loading
 * Extracted from interpreter.js to slim down the main interpreter file
 */

/**
 * Orchestrates dependency-aware loading via the existing interpreter-library-management utilities
 * @param {string} libraryName - Name of the library to require
 * @param {string|null} asClause - Optional AS clause for naming
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireWithDependencies(libraryName, asClause, ctx) {
  const libraryManagementUtils = ctx.libraryManagementUtils;
  return await libraryManagementUtils.requireWithDependencies(
    libraryName,
    ctx.loadingQueue,
    ctx.checkLibraryPermissions,
    ctx.isLibraryLoaded,
    (libName) => ctx.detectAndRegisterAddressTargets(libName, asClause),
    (libName) => loadSingleLibrary(libName, ctx),
    ctx.extractDependencies,
    ctx.dependencyGraph,
    (libName) => ctx.registerLibraryFunctions(libName, asClause)
  );
}

/**
 * Chooses environment-specific require path based on ctx.detectEnvironment()
 * @param {string} libraryName - Name of the library to load
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function loadSingleLibrary(libraryName, ctx) {
  // Check if it's a registry: prefixed library
  if (libraryName.startsWith('registry:')) {
    return await ctx.requireRegistryLibrary(libraryName.substring(9)); // Remove 'registry:' prefix
  }
  
  // SCRO: Check if we're in remote orchestrated context and should request via CHECKPOINT
  if (ctx.isRemoteOrchestrated() && !ctx.isBuiltinLibrary(libraryName)) {
    return await ctx.requireViaCheckpoint(libraryName);
  }

  // Original single library loading logic
  const env = ctx.detectEnvironment();
  switch (env) {
    case 'nodejs': 
      return await ctx.requireNodeJS(libraryName);
    case 'web-standalone': 
      return await ctx.requireWebStandalone(libraryName);
    case 'web-controlbus': 
      return await ctx.requireControlBus(libraryName);
    default: 
      throw new Error(`REQUIRE not supported in environment: ${env}`);
  }
}

/**
 * Node environment routing
 * @param {string} libraryName - Name of the library to require
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireNodeJS(libraryName, ctx) {
  // Special handling for built-in libraries - only transform bare names (like 'string-functions')
  // Don't transform paths that are already properly formatted (like './src/expectations-address.js')
  if (ctx.isBuiltinLibrary && ctx.isBuiltinLibrary(libraryName) && 
      !libraryName.startsWith('./') && !libraryName.startsWith('../') &&
      !libraryName.includes('/')) {
    const builtinPath = `./${libraryName}.js`;
    return await ctx.requireNodeJSModule(builtinPath);
  }
  
  // Check if it's a local file or npm package (Node.js style)
  if (ctx.isLocalOrNpmModule && ctx.isLocalOrNpmModule(libraryName)) {
    return await ctx.requireNodeJSModule(libraryName);
  }
  
  // Check if it's a registry-style library (namespace/module@version)
  if (ctx.isRegistryStyleLibrary && ctx.isRegistryStyleLibrary(libraryName)) {
    return await ctx.requireRegistryStyleLibrary(libraryName);
  }
  
  // Otherwise use remote Git platform loading (GitHub, GitLab, Azure DevOps, etc.)
  return await ctx.requireRemoteLibrary(libraryName);
}

/**
 * Thin delegation to ctx.loadAndExecuteLibrary() for Node-side remote URL/library loading
 * @param {string} libraryName - Library name or URL
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRemoteLibrary(libraryName, ctx) {
  return await ctx.loadAndExecuteLibrary(libraryName);
}

/**
 * Delegates to ctx.libraryUrlUtils.isLocalOrNpmModule (interpreter-library-url utilities)
 * @param {string} libraryName - Library name to check
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {boolean} True if local or npm module
 */
function isLocalOrNpmModule(libraryName, ctx) {
  return ctx.libraryUrlUtils.isLocalOrNpmModule(libraryName);
}

/**
 * Pattern check for namespace/module[@version]
 * @param {string} libraryName - Library name to check
 * @returns {boolean} True if registry style
 */
function isRegistryStyleLibrary(libraryName) {
  // Pattern: namespace/module or namespace/module@version
  // Examples: rexxjs/sqlite3-address, rexxjs/sqlite3-address@latest, com.example/my-lib@v1.0.0
  return /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(@[a-zA-Z0-9._-]+)?$/.test(libraryName);
}

/**
 * Parses namespace/module@version via parseRegistryLibraryName
 * Uses ctx.lookupPublisherRegistry and ctx.lookupModuleInRegistry
 * Loads via ctx.loadLibraryFromUrl or ctx.requireRemoteLibrary based on environment
 * @param {string} libraryName - Registry-style library name (namespace/module@version)
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRegistryStyleLibrary(libraryName, ctx) {
  try {
    // Parse namespace/module@version
    const parsed = parseRegistryLibraryName(libraryName);
    
    // Step 1: Fetch publisher registry
    const publisherUrl = await ctx.lookupPublisherRegistry(parsed.namespace);
    
    // Step 2: Fetch module registry
    const moduleUrl = await ctx.lookupModuleInRegistry(publisherUrl, parsed.module, parsed.version);
    
    // Step 3: Load the resolved URL using appropriate method for environment
    const env = ctx.detectEnvironment();
    if (env === 'web-standalone' || env === 'web-controlbus') {
      // Use browser loading for web environments
      return await ctx.loadLibraryFromUrl(moduleUrl, libraryName);
    } else {
      // Use Node.js loading for Node.js environment
      return await requireRemoteLibrary(moduleUrl, ctx);
    }
    
  } catch (error) {
    throw new Error(`Registry resolution failed for ${libraryName}: ${error.message}`);
  }
}

/**
 * Splits namespace/module@version into components { namespace, module, version }
 * @param {string} libraryName - Library name like "namespace/module@version"
 * @returns {Object} Parsed components {namespace, module, version}
 */
function parseRegistryLibraryName(libraryName) {
  const parts = libraryName.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid registry library name format: ${libraryName}. Expected: namespace/module[@version]`);
  }
  
  const namespace = parts[0];
  const moduleAndVersion = parts[1];
  
  // Split module@version
  const versionSplit = moduleAndVersion.split('@');
  const module = versionSplit[0];
  const version = versionSplit[1] || 'latest'; // Default to latest
  
  return { namespace, module, version };
}

/**
 * Loads Node.js modules with RexxJS compatibility handling
 * @param {string} libraryName - Name of the library to require
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if module loaded successfully
 */
async function requireNodeJSModule(libraryName, ctx) {
  try {
    // First try Node.js native require() for proper modules
    try {
      const nodeModule = require(libraryName);
      
      // Check if it's already a RexxJS-compatible library
      const libNamespace = ctx.getLibraryNamespace(libraryName);
      const detectionFunction = getLibraryDetectionFunction(libraryName);
      
      if (nodeModule[detectionFunction]) {
        // It's already a RexxJS library, register it normally
        global[libNamespace] = nodeModule;
        ctx.registerLibraryFunctions(libraryName);
        return true;
      }
      
      // Auto-wrap Node.js module as RexxJS library
      const rexxjsWrapper = wrapNodeJSModule(nodeModule, libraryName);
      global[libNamespace] = rexxjsWrapper;
      ctx.registerLibraryFunctions(libraryName);
      
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
        
        // Create a mock module context for execution
        const mockModule = { exports: {} };
        const originalModule = global.module;
        const originalExports = global.exports;
        
        try {
          // Set up module context
          global.module = mockModule;
          global.exports = mockModule.exports;

          // Create a scoped require function that resolves relative to the loaded file
          const Module = require('module');
          const scopedRequire = Module.createRequire(filePath);

          // Execute the code with module support - pass scoped require, module, exports
          const func = new Function('require', 'module', 'exports', '__filename', '__dirname', libraryCode);
          func(scopedRequire, mockModule, mockModule.exports, filePath, path.dirname(filePath));
          
          // If the library exported functions via module.exports, make them globally available
          if (mockModule.exports && typeof mockModule.exports === 'object') {
            Object.assign(global, mockModule.exports);
          }
          
          // Verify loading succeeded - use new @rexxjs-meta pattern
          const extractedFunctionName = extractMetadataFunctionName(libraryCode);
          const detectionFunction = extractedFunctionName || getLibraryDetectionFunction(libraryName);
          
          const globalScope = typeof window !== 'undefined' ? window : global;
          
          if (!globalScope[detectionFunction] || typeof globalScope[detectionFunction] !== 'function') {
            console.log(`Looking for detection function: ${detectionFunction}`);
            console.log(`Available global functions:`, Object.keys(globalScope).filter(k => k.includes('META') || k.includes('MAIN')));
            throw new Error(`Library executed but detection function not found: ${detectionFunction}`);
          }
          
          // Register the library functions
          ctx.registerLibraryFunctions(libraryName);
        } finally {
          // Restore original module context
          if (originalModule !== undefined) {
            global.module = originalModule;
          } else {
            delete global.module;
          }
          if (originalExports !== undefined) {
            global.exports = originalExports;
          } else {
            delete global.exports;
          }
        }
        
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

/**
 * Wraps Node.js modules as RexxJS-compatible libraries
 * @param {Object} nodeModule - The Node.js module to wrap
 * @param {string} libraryName - Name of the library
 * @returns {Object} RexxJS-compatible wrapper object
 */
function wrapNodeJSModule(nodeModule, libraryName) {
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

/**
 * Extracts dependencies from library metadata
 * @param {string} libraryName - Name of the library
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<Array>} Array of dependency names
 */
async function extractDependencies(libraryName, ctx) {
  // Extract dependencies from loaded library code
  const dependencies = [];
  
  // PRIORITY 1: Runtime metadata (works with minified code)
  const detectionFunction = getLibraryDetectionFunction(libraryName);
  const func = ctx.getGlobalFunction(detectionFunction, libraryName);
  if (func) {
    try {
      const info = func();
      if (info && info.dependencies) {
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
        const commentMetadata = ctx.parseCommentMetadata(libraryCode);
        if (commentMetadata && commentMetadata.dependencies) {
          return commentMetadata.dependencies;
        }
      }
    }
  } catch (error) {
    // Continue to next method
  }

  // PRIORITY 3: Parse from source code (only works if not minified)
  const cached = ctx.libraryCache.get(libraryName);
  if (cached && cached.code) {
    libraryCode = cached.code;
  }
  
  // Parse dependencies from library code comments or metadata
  if (libraryCode) {
    // 1. NEW: Look for function-based metadata provider (@rexxjs-meta=FUNCTION_NAME)
    const metaFunctionPattern = /\/\*!\s*[\s\S]*?@rexxjs-meta=([A-Z_]+)/i;
    const metaFunctionMatch = metaFunctionPattern.exec(libraryCode);
    
    if (metaFunctionMatch) {
      const functionName = metaFunctionMatch[1];
      console.log(`✓ Found metadata function ${functionName} for ${libraryName}`);
      
      // The function will be available after library execution, dependency extraction happens later
      // For now, mark it as having function-based metadata
      ctx.libraryMetadataProviders = ctx.libraryMetadataProviders || new Map();
      ctx.libraryMetadataProviders.set(libraryName, functionName);
      
      // Return empty dependencies for now - we'll get them from the function after execution
      return [];
    }
    
    // 2. Look for preserved comment dependencies (survive minification, jQuery-style)
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
    
    // 3. Look for standardized JSON format (comment-based)
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
    
    
    // 4. Final fallback: Legacy comment format
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

/**
 * Generates detection function name for library
 * @param {string} libraryName - Name of the library
 * @returns {string} Detection function name
 */
function getLibraryDetectionFunction(libraryName) {
  // Check the global registry first (for self-registered libraries)
  if (typeof window !== 'undefined' && window.LIBRARY_DETECTION_REGISTRY && window.LIBRARY_DETECTION_REGISTRY.has(libraryName)) {
    return window.LIBRARY_DETECTION_REGISTRY.get(libraryName);
  }
  if (typeof global !== 'undefined' && global.LIBRARY_DETECTION_REGISTRY && global.LIBRARY_DETECTION_REGISTRY.has(libraryName)) {
    return global.LIBRARY_DETECTION_REGISTRY.get(libraryName);
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

/**
 * Extracts metadata function name from library code
 * @param {string} libraryCode - The library source code
 * @returns {string|null} Metadata function name or null if not found
 */
function extractMetadataFunctionName(libraryCode) {
  // Extract metadata function name from @rexxjs-meta comment
  const metaMatch = libraryCode.match(/@rexxjs-meta=([A-Z_][A-Z0-9_]*)/);
  return metaMatch ? metaMatch[1] : null;
}

/**
 * Registry-style library loading with namespace/library format
 * @param {string} namespacedLibrary - Library name in namespace/library format
 * @param {Object} ctx - Context object containing interpreter methods and state
 * @returns {Promise<boolean>} True if library loaded successfully
 */
async function requireRegistryLibrary(namespacedLibrary, ctx) {
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
  const publisherInfo = await lookupPublisher(domain, registryUrl);
  
  if (!publisherInfo) {
    throw new Error(`Unknown namespace '${domain}' not found in registry. Publishers must be registered in .list-of-public-lib-publishers.csv`);
  }
  
  // Construct the library URL based on the publisher info
  const libraryUrl = constructRegistryLibraryUrl(publisherInfo, libraryName, subdomain);
  
  // Load the library using existing GitHub-style loading
  console.log(`📦 Loading registry library: ${namespacedLibrary} from ${libraryUrl}`);
  return await ctx.loadLibraryFromUrl(libraryUrl, namespacedLibrary);
}

/**
 * Looks up publisher information from registry
 * @param {string} domain - Publisher domain
 * @param {string} registryUrl - URL of the publisher registry
 * @returns {Promise<Object|null>} Publisher info or null if not found
 */
async function lookupPublisher(domain, registryUrl) {
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

/**
 * Constructs library URL from publisher info
 * @param {Object} publisherInfo - Publisher information
 * @param {string} libraryName - Name of the library
 * @param {string} subdomain - Optional subdomain
 * @returns {string} Constructed library URL
 */
function constructRegistryLibraryUrl(publisherInfo, libraryName, subdomain) {
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

module.exports = {
  requireWithDependencies,
  loadSingleLibrary,
  requireNodeJS,
  requireRemoteLibrary,
  isLocalOrNpmModule,
  isRegistryStyleLibrary,
  requireRegistryStyleLibrary,
  parseRegistryLibraryName,
  requireNodeJSModule,
  extractDependencies,
  getLibraryDetectionFunction,
  extractMetadataFunctionName,
  requireRegistryLibrary,
  lookupPublisher,
  constructRegistryLibraryUrl
};