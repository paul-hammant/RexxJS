'use strict';

let security;
if (typeof require !== 'undefined') {
  security = require('./security.js');
} else {
    const registry = window.rexxModuleRegistry;
    if (registry.has('security')) {
        security = registry.get('security');
    } else {
        // Fallback for environments where the module is not in the registry
        security = {
            createMissingFunctionError: window.createMissingFunctionError,
            assessRiskLevel: window.assessRiskLevel,
            getBlockedRepositories: window.getBlockedRepositories,
            validateGitHubLibrary: window.validateGitHubLibrary
        };
    }
}

const securityUtils = {
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
  },

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
  },

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
  },

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
  },

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
  },

  async validateGitHubLibrary(libraryName) {
    return await security.validateGitHubLibrary(libraryName, this.getBlockedRepositories.bind(this));
  },

  getBlockedRepositories() {
    return security.getBlockedRepositories();
  },

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
  },

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
  },

  getLibraryMetadata(libraryName) {
    return {
      type: this.getLibraryType(libraryName),
      source: libraryName.startsWith('central:') ? 'central-registry' : 'github-direct',
      riskLevel: this.assessRiskLevel(libraryName)
    };
  },

  assessRiskLevel(libraryName) {
    return security.assessRiskLevel(libraryName);
  },

  setSecurityPolicy(policy) {
    const validPolicies = ['strict', 'moderate', 'default', 'permissive'];
    if (!validPolicies.includes(policy)) {
      throw new Error(`Invalid security policy: ${policy}. Valid options: ${validPolicies.join(', ')}`);
    }

    this.securityPolicy = policy;
    console.log(`🔒 Security policy set to: ${policy}`);
  },

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
  },

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
  },

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
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = securityUtils;
}

if (typeof window !== 'undefined' && window.rexxModuleRegistry) {
  window.rexxModuleRegistry.set('interpreterSecurity', securityUtils);
}