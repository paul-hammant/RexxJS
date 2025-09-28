/*!
 * RexxJS Address Shared Utilities
 * Common helpers used by container orchestration and remote address handlers
 * (c) 2025 RexxJS Project | MIT License
 */

// Minimal logging that can be silenced unless DEBUG is set
function logActivity(handlerName, operation, details = {}) {
  if (typeof process !== 'undefined' && process.env && process.env.DEBUG) {
    try { console.log(`[${handlerName}] ${operation}`, details); } catch {}
  }
}

function createLogFunction(handlerName) {
  return function log(operation, details) { logActivity(handlerName, operation, details); };
}

async function interpolateMessage(template, context = {}) {
  if (!template || typeof template !== 'string') return template;
  return template.replace(/\{([^}]+)\}/g, (m, v) => (context[v] !== undefined ? String(context[v]) : m));
}

function parseCommandParts(command) {
  const parts = []; let current = ''; let inQuotes = false; let quoteChar = '';
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (!inQuotes && (ch === '"' || ch === "'")) { inQuotes = true; quoteChar = ch; }
    else if (inQuotes && ch === quoteChar) { inQuotes = false; quoteChar = ''; }
    else if (!inQuotes && /\s/.test(ch)) { if (current) { parts.push(current); current = ''; } }
    else { current += ch; }
  }
  if (current) parts.push(current);
  return parts;
}

function parseCommand(command) {
  const trimmed = (command || '').trim();
  if (!trimmed) return { operation: '', params: {} };
  if (['status', 'list'].includes(trimmed)) return { operation: trimmed, params: {} };
  const parts = parseCommandParts(trimmed);
  const operation = parts[0] || '';
  const params = {};
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('=')) {
      const [key, ...valueParts] = part.split('=');
      params[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    } else {
      params[part] = true;
    }
  }
  return { operation, params };
}

function parseMemoryLimit(memoryStr) {
  if (!memoryStr) return 0;
  const units = { k: 1024, m: 1024 * 1024, g: 1024 ** 3, t: 1024 ** 4 };
  const m = String(memoryStr).toLowerCase().match(/^(\d+)([kmgt]?)$/);
  if (!m) return 0; const value = parseInt(m[1]); const unit = m[2] || '';
  return value * (units[unit] || 1);
}

function validateVolumePath(p) {
  if (typeof p !== 'string' || p.length === 0) return false;
  // Basic policy: disallow root destructive mounts; allow /tmp and /var/tmp
  if (p === '/' || p.startsWith('/root')) return false;
  return true;
}

function validateBinaryPath(p, securityMode, trustedBinaries, auditCallback) {
  if (typeof p !== 'string' || p.length === 0) return false;
  if (p.includes('..')) return false;

  // If trustedBinaries is provided and contains this path, allow it
  if (trustedBinaries && trustedBinaries.has && trustedBinaries.has(p)) {
    return true;
  }

  // Basic validation for typical paths
  if (p.startsWith('/usr/local/bin/') || p.startsWith('/usr/bin/') || p.startsWith('/host/')) {
    return true;
  }

  return false;
}

function parseKeyValueString(s) {
  const out = {}; if (!s) return out;
  for (const part of s.split(',')) { const [k, v] = part.split('='); if (k) out[k.trim()] = (v || '').trim(); }
  return out;
}

function calculateUptime(startMs) { return Math.max(0, Date.now() - (startMs || Date.now())); }

function formatStatus(runtime, count, max, mode) {
  return `${runtime} | containers: ${count}/${max} | security: ${mode}`;
}

function auditSecurityEvent(evt) { /* no-op placeholder for shared auditing hook */ }

function parseCheckpointOutput(s) { return String(s || '').split('\n'); }

function wrapScriptWithCheckpoints(script) { return String(script || ''); }

function parseEnhancedCheckpointOutput(s) { return parseCheckpointOutput(s); }

function testRuntime(command) {
  // Basic runtime test function
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['--version'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} not available: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`${command} execution failed: ${error.message}`));
    });

    // Set timeout
    setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${command} test timeout`));
    }, 5000);
  });
}

function validateCommand(cmd, bannedCommands) {
  if (!cmd || typeof cmd !== 'string') return ['Invalid command'];
  const violations = [];
  for (const banned of bannedCommands || []) {
    if (cmd.includes(banned)) {
      violations.push(`Contains banned command: ${banned}`);
    }
  }
  return violations;
}

module.exports = {
  // logging
  logActivity, createLogFunction,
  // templating
  interpolateMessage,
  // command parsing
  parseCommandParts, parseCommand, parseMemoryLimit,
  // validation
  validateVolumePath, validateBinaryPath, validateCommand,
  // runtime testing
  testRuntime,
  // misc utils
  auditSecurityEvent, calculateUptime, parseKeyValueString,
  parseCheckpointOutput, wrapScriptWithCheckpoints, parseEnhancedCheckpointOutput,
  formatStatus
};

