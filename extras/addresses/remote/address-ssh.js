/*!
 * rexxjs/address-ssh v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * First-class ADDRESS target for remote shell over SSH (transport layer)
 */

const { spawn } = require('child_process');
const path = require('path');
// Resolve shared utils relative to this module using CommonJS-safe signals
let hereDir;
try { if (typeof __dirname !== 'undefined') { hereDir = __dirname; } } catch {}
if (!hereDir) {
  try { if (typeof module !== 'undefined' && module && module.filename) { hereDir = path.dirname(module.filename); } } catch {}
}
if (!hereDir) {
  try { if (typeof module !== 'undefined' && module && module.parent && module.parent.filename) { hereDir = path.dirname(module.parent.filename); } } catch {}
}
if (!hereDir) { hereDir = process.cwd(); }

const fs = require('fs');
function resolveSharedUtils() {
  const candidates = [];
  const rel = '../container-and-vm-orchestration/shared-utils';
  // Prefer path relative to this file dir if valid
  candidates.push(path.join(hereDir, rel));
  // Repo-root cwd guesses
  candidates.push(path.join(process.cwd(), 'extras/addresses/container-and-vm-orchestration/shared-utils'));
  candidates.push(path.join(process.cwd(), 'core/../extras/addresses/container-and-vm-orchestration/shared-utils'));
  // Based on parent module directory
  try {
    const parentDir = module && module.parent && module.parent.filename ? path.dirname(module.parent.filename) : null;
    if (parentDir) {
      candidates.push(path.join(parentDir, '../extras/addresses/container-and-vm-orchestration/shared-utils'));
    }
  } catch {}
  for (const base of candidates) {
    const asIndex = path.join(base, 'index.js');
    const asJs = base + '.js';
    if (fs.existsSync(asIndex)) return asIndex;
    if (fs.existsSync(asJs)) return asJs;
    if (fs.existsSync(base)) return base; // in case package.json main
  }
  // Fall back to the first candidate; let require error show the attempted path
  return candidates[0];
}
const sharedUtilsPath = resolveSharedUtils();
const { interpolateMessage, createLogFunction } = require(sharedUtilsPath);

const log = createLogFunction('ADDRESS_SSH');

class AddressSSHHandler {
  constructor() {
    this.sessions = new Map(); // id -> { host, user, options }
    this.defaultTimeout = 60000;
    this.counter = 0;
    // Pluggable runner for testability
    this.run = this._spawn.bind(this);
  }

  async initialize(config = {}) {
    this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;
    log('initialize', { defaultTimeout: this.defaultTimeout });
  }

  async handleAddressCommand(command, context = {}) {
    try {
      const interpolated = await interpolateMessage(command, context);
      const [op, ...rest] = interpolated.trim().split(/\s+/);
      const params = {};
      for (const part of rest) {
        if (part.includes('=')) { const [k, v] = part.split('='); params[k] = v.replace(/^"|"$/g, ''); }
      }
      switch (op) {
        case 'connect': return formatSSHResultForREXX(await this.connect(params));
        case 'exec': return formatSSHResultForREXX(await this.exec(params));
        case 'copy_to': return formatSSHResultForREXX(await this.copyTo(params));
        case 'copy_from': return formatSSHResultForREXX(await this.copyFrom(params));
        case 'close': return formatSSHResultForREXX(await this.close(params));
        case 'status': return formatSSHResultForREXX(await this.status());
        default: throw new Error(`Unknown ADDRESS SSH command: ${op}`);
      }
    } catch (error) {
      log('error', { error: error.message });
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
      const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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

function ADDRESS_SSH_MAIN() {
  return { type: 'address-target', name: 'ADDRESS SSH Transport', version: '1.0.0', description: 'Remote shell via SSH', provides: { addressTarget: 'ssh', handlerFunction: 'ADDRESS_SSH_HANDLER', commandSupport: true, methodSupport: true }, requirements: { environment: 'nodejs', modules: ['child_process'] } };
}

let sshInstance = null;
async function ADDRESS_SSH_HANDLER(commandOrMethod, params, sourceContext) {
  if (!sshInstance) { sshInstance = new AddressSSHHandler(); await sshInstance.initialize(); }
  let cmd = commandOrMethod; let context = {};
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
    const knownMethods = ['connect', 'exec', 'copy_to', 'copy_from', 'close', 'status'];
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

  // Original method call handling
  if (params) { const pairs = Object.entries(params).map(([k, v]) => typeof v === 'string' && v.includes(' ') ? `${k}="${v}"` : `${k}=${v}`).join(' '); cmd = `${commandOrMethod} ${pairs}`; context = { ...context, ...params }; }
  try { return await sshInstance.handleAddressCommand(cmd, context); } catch (e) { return formatSSHErrForREXX(e); }
}

// Handle HEREDOC shell commands
async function handleHeredocShellCommand(sshInstance, multilineCommand, context) {
  try {
    const interpolated = await interpolateMessage(multilineCommand, context);
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
    const interpolated = await interpolateMessage(command, context);
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ADDRESS_SSH_MAIN, ADDRESS_SSH_HANDLER, ADDRESS_SSH_METHODS, AddressSSHHandler };
} else if (typeof window !== 'undefined') {
  window.ADDRESS_SSH_MAIN = ADDRESS_SSH_MAIN;
  window.ADDRESS_SSH_HANDLER = ADDRESS_SSH_HANDLER;
  window.ADDRESS_SSH_METHODS = ADDRESS_SSH_METHODS;
}

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
