/*!
 * rexxjs/address-ssh v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=ADDRESS_SSH_META
 * First-class ADDRESS target for remote shell over SSH (transport layer)
 */

// SSH ADDRESS metadata function
function ADDRESS_SSH_META() {
  return {
    type: 'address-target',
    name: 'ADDRESS SSH Transport',
    version: '1.0.0',
    description: 'Remote shell via SSH',
    provides: {
      addressTarget: 'ssh',
      handlerFunction: 'ADDRESS_SSH_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: {},
    envVars: [],
    requirements: {
      environment: 'nodejs',
      modules: ['child_process']
    }
  };
}

class AddressSSHHandler {
  constructor() {
    this.sessions = new Map(); // id -> { host, user, options }
    this.defaultTimeout = 60000;
    this.counter = 0;
    this.initialized = false;
    // Pluggable runner for testability
    this.run = this._spawn.bind(this);
  }

  async initialize(config = {}) {
    if (this.initialized) return;
    
    try {
      // Check global environment info provided by RexxJS interpreter
      const globalScope = typeof window !== 'undefined' ? window : global;
      const env = globalScope.REXX_ENVIRONMENT;
      
      if (!env || (env.type !== 'nodejs' && env.type !== 'pkg')) {
        throw new Error(`SSH handler requires Node.js environment. Current environment: ${env ? env.type : 'unknown'}`);
      }
      
      if (env.type === 'pkg' && !env.hasNodeJsRequire) {
        throw new Error('SSH handler cannot load Node.js modules in pkg environment without Node.js require() support');
      }
      
      // Import Node.js modules when needed - handle pkg environment
      try {
        if (env.type === 'pkg') {
          // In pkg environment, use pre-loaded modules from global scope
          const globalScope = typeof global !== 'undefined' ? global : {};
          const pkgModules = globalScope.PKG_NODEJS_MODULES;
          
          if (pkgModules) {
            this.spawn = pkgModules.child_process.spawn;
            this.path = pkgModules.path;
            this.fs = pkgModules.fs;
          } else {
            throw new Error('Node.js modules not pre-loaded in pkg environment. Check CLI initialization.');
          }
        } else {
          // Normal Node.js environment
          this.spawn = require('child_process').spawn;
          this.path = require('path');
          this.fs = require('fs');
        }
      } catch (requireError) {
        throw new Error(`Failed to load Node.js modules (child_process, path, fs): ${requireError.message}. Environment: ${env.type}.`);
      }
      
      // Resolve shared utils via shared module - handle pkg environment
      let sharedUtils;
      try {
        sharedUtils = require('../shared-utils/index.js');
      } catch (requireError) {
        // In pkg environment, require might not be available, provide fallbacks
        sharedUtils = {
          interpolateMessage: async (template, context = {}) => {
            if (!template || typeof template !== 'string') return template;
            return template.replace(/\{([^}]+)\}/g, (m, v) => (context[v] !== undefined ? String(context[v]) : m));
          },
          createLogFunction: (handlerName) => {
            return function log(operation, details) {
              if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
                try { console.log(`[${handlerName}] ${operation}`, details); } catch {}
              }
            };
          }
        };
      }
      this.interpolateMessage = sharedUtils.interpolateMessage;
      this.createLogFunction = sharedUtils.createLogFunction;
      this.log = this.createLogFunction('ADDRESS_SSH');
      
      this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;
      this.log('initialize', { defaultTimeout: this.defaultTimeout });
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize SSH handler: ${error.message}`);
    }
  }

  // Dynamic resolver removed; using shared module path above

  async handleAddressCommand(command, context = {}) {
    try {
      const interpolated = await this.interpolateMessage(command, context);
      
      // Better parsing that handles quoted values with spaces
      const trimmed = interpolated.trim();
      const spaceIndex = trimmed.indexOf(' ');
      const op = spaceIndex === -1 ? trimmed : trimmed.substring(0, spaceIndex);
      const paramsStr = spaceIndex === -1 ? '' : trimmed.substring(spaceIndex + 1);
      
      const params = {};
      if (paramsStr) {
        // Parse key=value pairs, handling quoted values
        const regex = /(\w+)=('[^']*'|"[^"]*"|[^\s]+)/g;
        let match;
        while ((match = regex.exec(paramsStr)) !== null) {
          const [, key, value] = match;
          // Remove surrounding quotes if present
          params[key] = value.replace(/^['"]|['"]$/g, '');
        }
      }
      
      
      switch (op) {
        case 'connect': return formatSSHResultForREXX(await this.connect(params));
        case 'exec': return formatSSHResultForREXX(await this.exec(params));
        case 'copy_to': 
        case 'put': return formatSSHResultForREXX(await this.copyTo(params));
        case 'copy_from': 
        case 'get': return formatSSHResultForREXX(await this.copyFrom(params));
        case 'close': return formatSSHResultForREXX(await this.close(params));
        case 'status': return formatSSHResultForREXX(await this.status());
        default: throw new Error(`Unknown ADDRESS SSH command: ${op}`);
      }
    } catch (error) {
      this.log('error', { error: error.message });
      return formatSSHErrForREXX(error);
    }
  }

  async connect({ host, user, port = '22', identity, id }) {
    if (!host) throw new Error('Missing required parameter: host');
    const sessionId = id || `ssh-${++this.counter}`;
    this.sessions.set(sessionId, { host, user, port, identity });
    return { success: true, operation: 'connect', id: sessionId, host, user, port };
  }

  async exec({ id, host, user, command, timeout }) {
    const sess = id ? this.sessions.get(id) : { host, user };
    if (!sess || !sess.host) throw new Error('Missing session or host');
    if (!command) throw new Error('Missing required parameter: command');
    const args = [];
    if (sess.user) args.push(`${sess.user}@${sess.host}`); else args.push(sess.host);
    const full = ['ssh', args[0], command];
    return this.run(full[0], full.slice(1), timeout);
  }

  async copyTo({ id, host, user, local, remote, timeout }) {
    const sess = id ? this.sessions.get(id) : { host, user };
    if (!sess || !sess.host) throw new Error('Missing session or host');
    if (!local || !remote) throw new Error('copy_to requires local and remote');
    const target = sess.user ? `${sess.user}@${sess.host}:${remote}` : `${sess.host}:${remote}`;
    return this.run('scp', [local, target], timeout);
  }

  async copyFrom({ id, host, user, remote, local, timeout }) {
    const sess = id ? this.sessions.get(id) : { host, user };
    if (!sess || !sess.host) throw new Error('Missing session or host');
    if (!local || !remote) throw new Error('copy_from requires remote and local');
    const source = sess.user ? `${sess.user}@${sess.host}:${remote}` : `${sess.host}:${remote}`;
    return this.run('scp', [source, local], timeout);
  }

  async close({ id }) {
    if (id) this.sessions.delete(id);
    return { success: true, operation: 'close', id };
  }

  async status() {
    return { success: true, operation: 'status', sessions: Array.from(this.sessions.keys()) };
  }

  _spawn(cmd, args, timeout) {
    const to = timeout ? parseInt(timeout) : this.defaultTimeout;
    return new Promise((resolve, reject) => {
      const child = this.spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.on('data', d => stdout += d.toString());
      child.stderr.on('data', d => stderr += d.toString());
      child.on('close', code => resolve({ success: code === 0, operation: 'exec', exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
      child.on('error', err => reject(new Error(`${cmd} failed: ${err.message}`)));
      if (to > 0) setTimeout(() => { try { child.kill('SIGKILL'); } catch {} ; reject(new Error(`${cmd} timeout after ${to}ms`)); }, to);
    });
  }

  // Execute shell command using current or default connection
  async execShellCommand(command, context = {}) {
    // Try to find an active session to use
    if (this.sessions.size > 0) {
      // Use the first active session
      const sessionId = Array.from(this.sessions.keys())[0];
      return await this.exec({
        id: sessionId,
        command: command,
        timeout: context.timeout
      });
    } else if (context.HOST && context.USER) {
      // Use HOST and USER from context (no session needed)
      return await this.exec({
        host: context.HOST,
        user: context.USER,
        command: command,
        timeout: context.timeout
      });
    } else {
      throw new Error('No active SSH session and no HOST/USER provided in context. Use "connect host=HOST user=USER" first or ensure HOST/USER variables are available.');
    }
  }
}

let sshInstance = null;

async function ADDRESS_SSH_HANDLER(commandOrMethod, params, sourceContext) {
  if (!sshInstance) { 
    sshInstance = new AddressSSHHandler(); 
    await sshInstance.initialize(); 
  }
  
  let cmd = commandOrMethod; 
  let context = {};
  
  try {
    // Get variables from sourceContext if available
    const vars = sourceContext && sourceContext.variables;
    if (vars && typeof vars[Symbol.iterator] === 'function') {
      context = Object.fromEntries(vars);
    }
    
    // Also include variables from params (which contains REXX variables)
    if (params) {
      context = { ...context, ...params };
    }
  } catch {}

  // Handle direct shell commands (HEREDOC or single commands)
  if (typeof commandOrMethod === 'string') {
    // Check if it looks like a method call (starts with known method names)
    const trimmedCmd = commandOrMethod.trim();
    const knownMethods = ['connect', 'exec', 'copy_to', 'put', 'copy_from', 'get', 'close', 'status'];
    const firstLine = trimmedCmd.split('\n')[0].trim();
    const isMethodCall = knownMethods.some(method => firstLine.startsWith(method + ' ') || firstLine === method);
    
    if (!isMethodCall && trimmedCmd.length > 0) {
      // Check if it's multiline (HEREDOC) or single line
      const isMultiline = commandOrMethod.includes('\n');
      
      if (isMultiline) {
        return handleHeredocShellCommand(sshInstance, commandOrMethod, context)
          .then(result => formatSSHResultForREXX(result))
          .catch(error => {
            const e = new Error(`${error.message} | Command: ${commandOrMethod.trim()}`);
            throw e;
          });
      } else {
        return handleDirectShellCommand(sshInstance, commandOrMethod, context)
          .then(result => formatSSHResultForREXX(result))
          .catch(error => {
            const e = new Error(`${error.message} | Command: ${commandOrMethod.trim()}`);
            throw e;
          });
      }
    }
  }

  // Original method call handling - use params directly instead of re-parsing
  if (params) { 
    context = { ...context, ...params };
    
    // Call methods directly with parsed params to avoid double-parsing
    try {
      switch (commandOrMethod) {
        case 'connect': return formatSSHResultForREXX(await sshInstance.connect(params));
        case 'exec': return formatSSHResultForREXX(await sshInstance.exec(params));
        case 'copy_to': 
        case 'put': return formatSSHResultForREXX(await sshInstance.copyTo(params));
        case 'copy_from': 
        case 'get': return formatSSHResultForREXX(await sshInstance.copyFrom(params));
        case 'close': return formatSSHResultForREXX(await sshInstance.close(params));
        case 'status': return formatSSHResultForREXX(await sshInstance.status());
        default: throw new Error(`Unknown ADDRESS SSH command: ${commandOrMethod}`);
      }
    } catch (e) { 
      return formatSSHErrForREXX(e); 
    }
  }
  
  try { 
    return await sshInstance.handleAddressCommand(cmd, context); 
  } catch (e) { 
    return formatSSHErrForREXX(e); 
  }
}

// Handle HEREDOC shell commands
async function handleHeredocShellCommand(sshInstance, multilineCommand, context) {
  try {
    const interpolated = await sshInstance.interpolateMessage(multilineCommand, context);
    const result = await sshInstance.execShellCommand(interpolated, context);
    return {
      operation: 'SHELL_EXEC',
      success: result.success,
      command: interpolated.trim(),
      source: 'heredoc_block',
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`HEREDOC shell execution failed: ${error.message}`);
  }
}

// Handle direct shell command strings  
async function handleDirectShellCommand(sshInstance, command, context) {
  try {
    const interpolated = await sshInstance.interpolateMessage(command, context);
    const result = await sshInstance.execShellCommand(interpolated, context);
    return {
      operation: 'SHELL_EXEC',
      success: result.success,
      command: interpolated.trim(),
      source: 'direct_command',
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Direct shell execution failed: ${error.message}`);
  }
}

const ADDRESS_SSH_METHODS = {
  'connect': 'Connect to host [host=] [user=] [port=22] [id=optional]',
  'exec': 'Execute command on host or session [id|host] [user] [command] [timeout]',
  'copy_to': 'Copy local->remote [id|host] [user] [local] [remote]',
  'copy_from': 'Copy remote->local [id|host] [user] [remote] [local]',
  'close': 'Close session [id]',
  'status': 'List sessions'
};

// Formatters aligned with sqlite address contract so interpreter preserves objects
function formatSSHResultForREXX(result) {
  // If already formatted (has output and not a string), return as-is
  if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'output') && typeof result.output !== 'string') {
    return result;
  }
  const payload = { ...result };
  const exit = typeof payload.exitCode === 'number' ? payload.exitCode : (payload.success === false ? 1 : 0);
  const wrapped = {
    ...payload,
    errorCode: payload && payload.success === false ? 1 : 0,
    output: payload, // ensure RESULT gets the full object, not a string
    timestamp: new Date().toISOString(),
    rexxVariables: {
      RC: exit
    }
  };
  // Provide predictable stringification without affecting enumerable fields
  try {
    Object.defineProperty(wrapped, 'toString', {
      value: function() { return (this && typeof this.stdout === 'string') ? this.stdout : ''; },
      writable: false,
      enumerable: false
    });
  } catch {}
  return wrapped;
}

function formatSSHErrForREXX(error) {
  const message = (error && error.message) || String(error);
  return {
    success: false,
    operation: 'error',
    errorCode: 1,
    errorMessage: message,
    output: message,
    timestamp: new Date().toISOString()
  };
}

// Export for global scope (RexxJS interpreter compatibility)
// Check for Node.js first (more reliable than window check in pkg environments)
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js environment (including pkg-packaged binaries)
  global.ADDRESS_SSH_META = ADDRESS_SSH_META;
  global.ADDRESS_SSH_HANDLER = ADDRESS_SSH_HANDLER;
  global.ADDRESS_SSH_METHODS = ADDRESS_SSH_METHODS;
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.ADDRESS_SSH_META = ADDRESS_SSH_META;
  window.ADDRESS_SSH_HANDLER = ADDRESS_SSH_HANDLER;
  window.ADDRESS_SSH_METHODS = ADDRESS_SSH_METHODS;
} else if (typeof global !== 'undefined') {
  // Fallback: other global environments
  global.ADDRESS_SSH_META = ADDRESS_SSH_META;
  global.ADDRESS_SSH_HANDLER = ADDRESS_SSH_HANDLER;
  global.ADDRESS_SSH_METHODS = ADDRESS_SSH_METHODS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ADDRESS_SSH_META,
    ADDRESS_SSH_HANDLER,
    ADDRESS_SSH_METHODS,
    AddressSSHHandler
  };
}
