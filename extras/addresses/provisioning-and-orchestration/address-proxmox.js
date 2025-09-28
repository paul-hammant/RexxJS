/*!
 * rexxjs/address-proxmox v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * Proxmox LXC (pct) first-class ADDRESS target
 */

const { spawn } = require('child_process');
const fs = require('fs');
const { 
  interpolateMessage,
  createLogFunction,
  parseCommandParts,
  parseCommand,
  validateCommand,
  validateBinaryPath,
  validateVolumePath,
  parseKeyValueString,
  parseCheckpointOutput: sharedParseCheckpointOutput,
  parseEnhancedCheckpointOutput: sharedParseEnhancedCheckpointOutput,
  wrapScriptWithCheckpoints: sharedWrapScriptWithCheckpoints,
  formatStatus
} = require('../shared-utils');

const log = createLogFunction('ADDRESS_PROXMOX');

class AddressProxmoxHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 100; // Proxmox VMID convention start
    this.maxContainers = 50;
    this.securityMode = 'moderate';
    this.allowedTemplates = new Set();
    this.allowedStorages = new Set(['local', 'local-lvm']);
    this.defaultTimeout = 60000;
    this.node = 'proxmox';
    this.auditLog = [];
  }

  async initialize(config = {}) {
    this.securityMode = config.securityMode || this.securityMode;
    this.maxContainers = config.maxContainers || this.maxContainers;
    this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;
    this.node = config.node || this.node;

    if (this.securityMode === 'strict') {
      this.allowedTemplates = new Set(config.allowedTemplates || []);
      this.allowedStorages = new Set(config.allowedStorages || ['local-lvm']);
    } else if (this.securityMode === 'moderate') {
      this.allowedTemplates = new Set(config.allowedTemplates || []);
      this.allowedStorages = new Set(config.allowedStorages || ['local', 'local-lvm', 'local-zfs']);
    } else {
      this.allowedTemplates = new Set();
      this.allowedStorages = new Set();
    }

    await this.testPct();
    log('initialize', { node: this.node, mode: this.securityMode, max: this.maxContainers });
  }

  async testPct() {
    return new Promise((resolve, reject) => {
      const p = spawn('pct', ['--version'], { stdio: 'pipe' });
      p.on('close', (code) => code === 0 ? resolve() : reject(new Error('pct unavailable')));
      p.on('error', (e) => reject(new Error(`pct not found: ${e.message}`)));
      setTimeout(() => { try { p.kill('SIGTERM'); } catch {} ; reject(new Error('pct test timeout')); }, 5000);
    });
  }

  async handleAddressCommand(command, context = {}) {
    try {
      const interpolated = await interpolateMessage(command, context);
      log('command', { command: interpolated });
      const parsed = parseCommand(interpolated);
      switch (parsed.operation) {
        case 'status': return this.getStatus();
        case 'list': return this.listContainers();
        case 'create': return this.createContainer(parsed.params, context);
        case 'start': return this.startContainer(parsed.params);
        case 'stop': return this.stopContainer(parsed.params);
        case 'remove':
        case 'destroy': return this.removeContainer(parsed.params);
        case 'execute': return this.execInContainer(parsed.params, context);
        case 'deploy_rexx': return this.deployRexx(parsed.params, context);
        case 'execute_rexx': return this.executeRexx(parsed.params, context);
        default: throw new Error(`Unknown ADDRESS PROXMOX command: ${parsed.operation}`);
      }
    } catch (error) {
      log('error', { error: error.message });
      return { success: false, operation: 'error', error: error.message, output: error.message };
    }
  }

  async getStatus() {
    const n = this.activeContainers.size;
    return {
      success: true,
      operation: 'status',
      runtime: 'proxmox',
      activeContainers: n,
      maxContainers: this.maxContainers,
      securityMode: this.securityMode,
      output: formatStatus('proxmox', n, this.maxContainers, this.securityMode)
    };
  }

  async listContainers() {
    const containers = Array.from(this.activeContainers.entries()).map(([vmid, info]) => ({
      vmid, ...info
    }));
    return { success: true, operation: 'list', containers, count: containers.length, output: `Found ${containers.length} containers` };
  }

  async createContainer(params, context) {
    const { template, storage = 'local', hostname, vmid, memory, cores } = params;
    if (!template) throw new Error('Missing required parameter: template');
    if (this.securityMode === 'strict' && this.allowedTemplates.size && !this.allowedTemplates.has(template)) {
      throw new Error(`Template not allowed in strict mode: ${template}`);
    }
    if (this.allowedStorages.size && !this.allowedStorages.has(storage)) {
      throw new Error(`Storage not allowed: ${storage}`);
    }
    if (this.activeContainers.size >= this.maxContainers) {
      throw new Error(`Maximum containers reached: ${this.maxContainers}`);
    }
    const assignedVmid = vmid ? String(vmid) : String(++this.containerCounter);
    if (this.activeContainers.has(assignedVmid)) throw new Error(`VMID already exists: ${assignedVmid}`);

    const args = ['create', assignedVmid, template, '-storage', storage];
    if (hostname) args.push('-hostname', hostname);
    if (memory) args.push('-memory', String(memory));
    if (cores) args.push('-cores', String(cores));

    const res = await this.execPct(args);
    if (res.exitCode !== 0) throw new Error(`pct create failed: ${res.stderr || res.stdout}`);

    const info = { vmid: assignedVmid, template, storage, status: 'created', created: new Date().toISOString() };
    this.activeContainers.set(assignedVmid, info);
    return { success: true, operation: 'create', vmid: assignedVmid, status: 'created', output: `Container ${assignedVmid} created successfully` };
  }

  async startContainer(params) {
    const { vmid } = params; if (!vmid) throw new Error('Missing required parameter: vmid');
    const info = this.activeContainers.get(String(vmid)); if (!info) throw new Error(`Container not found: ${vmid}`);
    if (info.status === 'running') throw new Error(`Container ${vmid} is already running`);
    const res = await this.execPct(['start', String(vmid)]);
    if (res.exitCode !== 0) throw new Error(`pct start failed: ${res.stderr || res.stdout}`);
    info.status = 'running'; info.started = new Date().toISOString();
    return { success: true, operation: 'start', vmid: String(vmid), status: 'running', output: `Container ${vmid} started successfully` };
  }

  async stopContainer(params) {
    const { vmid } = params; if (!vmid) throw new Error('Missing required parameter: vmid');
    const info = this.activeContainers.get(String(vmid)); if (!info) throw new Error(`Container not found: ${vmid}`);
    if (info.status !== 'running') throw new Error(`Container ${vmid} is not running`);
    const res = await this.execPct(['stop', String(vmid)]);
    if (res.exitCode !== 0) throw new Error(`pct stop failed: ${res.stderr || res.stdout}`);
    info.status = 'stopped'; info.stopped = new Date().toISOString();
    return { success: true, operation: 'stop', vmid: String(vmid), status: 'stopped', output: `Container ${vmid} stopped successfully` };
  }

  async removeContainer(params) {
    const { vmid } = params; if (!vmid) throw new Error('Missing required parameter: vmid');
    if (!this.activeContainers.has(String(vmid))) throw new Error(`Container not found: ${vmid}`);
    const res = await this.execPct(['destroy', String(vmid)]);
    if (res.exitCode !== 0) throw new Error(`pct destroy failed: ${res.stderr || res.stdout}`);
    this.activeContainers.delete(String(vmid));
    return { success: true, operation: 'remove', vmid: String(vmid), output: `Container ${vmid} removed successfully` };
  }

  async deployRexx(params, context) {
    const { vmid, rexx_binary, target = '/usr/local/bin/rexx' } = params;
    if (!vmid || !rexx_binary) throw new Error('Missing required parameters: vmid and rexx_binary');
    const info = this.activeContainers.get(String(vmid)); if (!info) throw new Error(`Container not found: ${vmid}`);
    if (info.status !== 'running') throw new Error(`Container ${vmid} must be running to deploy RexxJS binary`);
    const bin = await interpolateMessage(rexx_binary, context);
    const tgt = await interpolateMessage(target, context);
    if (!fs.existsSync(bin)) throw new Error(`RexxJS binary not found: ${bin}`);
    // Use pct push to copy into container
    const cp = await this.execPct(['push', String(vmid), bin, tgt]);
    if (cp.exitCode !== 0) throw new Error(`pct push failed: ${cp.stderr || cp.stdout}`);
    await this.execPct(['exec', String(vmid), 'chmod', '+x', tgt]);
    info.rexxDeployed = true; info.rexxPath = tgt;
    return { success: true, operation: 'deploy_rexx', vmid: String(vmid), target: tgt, output: `RexxJS binary deployed to ${vmid} at ${tgt}` };
  }

  async execInContainer(params, context) {
    const { vmid, command, timeout } = params;
    if (!vmid || !command) throw new Error('Missing required parameters: vmid and command');
    const info = this.activeContainers.get(String(vmid)); if (!info) throw new Error(`Container not found: ${vmid}`);
    if (info.status !== 'running') throw new Error(`Container ${vmid} must be running to execute commands`);
    const cmd = await interpolateMessage(command, context);
    const res = await this.execPct(['exec', String(vmid), 'sh', '-c', cmd], { timeout: timeout ? parseInt(timeout) : this.defaultTimeout });
    return { success: res.exitCode === 0, operation: 'execute', vmid: String(vmid), exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr, output: res.exitCode === 0 ? res.stdout : `Command failed: ${res.stderr}` };
  }

  async executeRexx(params, context) {
    const { vmid, script, script_file, timeout, progress_callback = 'false' } = params;
    if (!vmid || (!script && !script_file)) throw new Error('Missing required parameters: vmid and (script or script_file)');
    const info = this.activeContainers.get(String(vmid)); if (!info) throw new Error(`Container not found: ${vmid}`);
    if (info.status !== 'running') throw new Error(`Container ${vmid} must be running to execute RexxJS scripts`);
    if (!info.rexxDeployed) throw new Error(`RexxJS binary not deployed to container ${vmid}. Use deploy_rexx first.`);
    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;
    let rexxScript;
    if (script_file) {
      const f = await interpolateMessage(script_file, context); rexxScript = fs.readFileSync(f, 'utf8');
    } else { rexxScript = await interpolateMessage(script, context); }

    // Stream with checkpoints if requested
    if (String(progress_callback).toLowerCase() === 'true') {
      const temp = `/tmp/rexx_script_progress_${Date.now()}.rexx`;
      const wrapped = this.wrapScriptWithCheckpoints(rexxScript, { progressCallback: () => {} });
      await this.execPct(['exec', String(vmid), 'sh', '-c', `cat > ${temp}`], { stdin: wrapped });
      const res = await this.execInContainerWithProgress(String(vmid), `${info.rexxPath} ${temp}`, { timeout: execTimeout, progressCallback: () => {} });
      await this.execPct(['exec', String(vmid), 'rm', '-f', temp]);
      return { success: res.exitCode === 0, operation: 'execute_rexx', vmid: String(vmid), exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr, output: res.exitCode === 0 ? res.stdout : `RexxJS execution failed: ${res.stderr}` };
    }

    const temp = `/tmp/rexx_script_${Date.now()}.rexx`;
    await this.execPct(['exec', String(vmid), 'sh', '-c', `cat > ${temp}`], { stdin: rexxScript });
    const res = await this.execPct(['exec', String(vmid), info.rexxPath, temp], { timeout: execTimeout });
    await this.execPct(['exec', String(vmid), 'rm', '-f', temp]);
    return { success: res.exitCode === 0, operation: 'execute_rexx', vmid: String(vmid), exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr, output: res.exitCode === 0 ? res.stdout : `RexxJS execution failed: ${res.stderr}` };
  }

  // Delegated helpers to shared
  parseCheckpointOutput(output, cb) { return sharedParseCheckpointOutput(output, cb); }
  parseEnhancedCheckpointOutput(containerName, output, cb) {
    return sharedParseEnhancedCheckpointOutput(output, (rec) => {
      if (typeof cb === 'function') cb(rec.checkpoint, rec.params);
    });
  }
  wrapScriptWithCheckpoints(script, options = {}) { return sharedWrapScriptWithCheckpoints(script, options); }

  // pct exec wrapper
  async execPct(args, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    return new Promise((resolve, reject) => {
      const child = spawn('pct', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = ''; let stderr = '';
      if (options.stdin) { child.stdin.write(options.stdin); child.stdin.end(); }
      child.stdout.on('data', d => stdout += d.toString());
      child.stderr.on('data', d => stderr += d.toString());
      child.on('close', code => resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() }));
      child.on('error', err => reject(new Error(`pct failed: ${err.message}`)));
      if (timeout > 0) setTimeout(() => { try { child.kill('SIGKILL'); } catch {} ; reject(new Error(`pct timeout after ${timeout}ms`)); }, timeout);
    });
  }

  // Progress-capable exec using checkpoint parsing
  async execInContainerWithProgress(vmid, command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('pct', ['exec', String(vmid), 'sh', '-c', command], { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = ''; let stderr = '';
      const start = Date.now();
      child.stdout.on('data', data => {
        const out = data.toString(); stdout += out;
        if (options.progressCallback && out.includes('CHECKPOINT')) {
          this.parseEnhancedCheckpointOutput(vmid, out, options.progressCallback);
        }
      });
      child.stderr.on('data', data => {
        const err = data.toString(); stderr += err;
        if (options.progressCallback && err.includes('CHECKPOINT')) {
          this.parseEnhancedCheckpointOutput(vmid, err, options.progressCallback);
        }
      });
      child.on('close', code => resolve({ exitCode: code, stdout, stderr, duration: Date.now() - start }));
      child.on('error', err => reject(new Error(`pct exec error: ${err.message}`)));
      if (options.timeout > 0) setTimeout(() => { try { child.kill('SIGKILL'); } catch {} ; reject(new Error(`pct exec timeout after ${options.timeout}ms`)); }, options.timeout);
    });
  }
}

// First-class ADDRESS metadata and handler
function ADDRESS_PROXMOX_MAIN() {
  return {
    type: 'address-target',
    name: 'ADDRESS PROXMOX LXC Service',
    version: '1.0.0',
    description: 'Proxmox pct operations via ADDRESS interface',
    provides: { addressTarget: 'proxmox', handlerFunction: 'ADDRESS_PROXMOX_HANDLER', commandSupport: true, methodSupport: true },
    dependencies: [],
    loaded: true,
    requirements: { environment: 'nodejs', modules: ['child_process'] }
  };
}

let proxmoxInstance = null;
async function ADDRESS_PROXMOX_HANDLER(commandOrMethod, params, sourceContext) {
  if (!proxmoxInstance) { proxmoxInstance = new AddressProxmoxHandler(); await proxmoxInstance.initialize(); }
  let cmd = commandOrMethod; let context = sourceContext ? Object.fromEntries(sourceContext.variables) : {};
  if (params) {
    const parts = Object.entries(params).map(([k, v]) => typeof v === 'string' && v.includes(' ') ? `${k}="${v}"` : `${k}=${v}`).join(' ');
    cmd = `${commandOrMethod} ${parts}`; context = { ...context, ...params };
  }
  try {
    const result = await proxmoxInstance.handleAddressCommand(cmd, context);
    return {
      success: result.success,
      errorCode: result.success ? 0 : 1,
      errorMessage: result.error || null,
      output: result.output || '',
      result,
      rexxVariables: {
        'PROXMOX_OPERATION': result.operation || '',
        'PROXMOX_VMID': result.vmid || '',
        'PROXMOX_STATUS': result.status || '',
        'PROXMOX_COUNT': result.count || 0,
        'PROXMOX_EXIT_CODE': result.exitCode || 0,
        'PROXMOX_STDOUT': result.stdout || '',
        'PROXMOX_STDERR': result.stderr || ''
      }
    };
  } catch (error) {
    return { success: false, errorCode: 1, errorMessage: error.message, output: error.message, result: { error: error.message }, rexxVariables: { 'PROXMOX_ERROR': error.message } };
  }
}

const ADDRESS_PROXMOX_METHODS = {
  'status': 'Get PROXMOX handler status',
  'list': 'List containers',
  'create': 'Create LXC from template [template=] [storage=local] [hostname=name] [vmid=auto] [memory=] [cores=] ',
  'start': 'Start container [vmid=]',
  'stop': 'Stop container [vmid=]',
  'remove': 'Destroy container [vmid=]',
  'deploy_rexx': 'Deploy RexxJS binary into container [vmid=] [rexx_binary=] [target=/usr/local/bin/rexx]',
  'execute': 'Execute command in container [vmid=] [command=] [timeout=]',
  'execute_rexx': 'Execute RexxJS in container [vmid=] [script|script_file] [progress_callback=true|false] [timeout=]'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ADDRESS_PROXMOX_MAIN, ADDRESS_PROXMOX_HANDLER, ADDRESS_PROXMOX_METHODS, AddressProxmoxHandler };
} else if (typeof window !== 'undefined') {
  window.ADDRESS_PROXMOX_MAIN = ADDRESS_PROXMOX_MAIN;
  window.ADDRESS_PROXMOX_HANDLER = ADDRESS_PROXMOX_HANDLER;
  window.ADDRESS_PROXMOX_METHODS = ADDRESS_PROXMOX_METHODS;
}

