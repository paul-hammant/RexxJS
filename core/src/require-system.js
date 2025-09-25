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

module.exports = {
  requireWithDependencies,
  loadSingleLibrary,
  requireNodeJS,
  requireRemoteLibrary,
  isLocalOrNpmModule,
  isRegistryStyleLibrary,
  requireRegistryStyleLibrary,
  parseRegistryLibraryName
};