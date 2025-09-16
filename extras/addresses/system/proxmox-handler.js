/**
 * Proxmox Container Handler - LXC Container Orchestration
 * Provides LXC container management through Proxmox pct commands
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity } = require('../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('PROXMOX', operation, details);
}

class ProxmoxHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 100; // Start VMID at 100 (Proxmox convention)
    this.maxContainers = 50;
    this.securityMode = 'moderate';
    this.allowedTemplates = new Set();
    this.allowedStorages = new Set(['local', 'local-lvm']);
    this.defaultTimeout = 60000; // 60 seconds for container operations
    this.proxmoxNode = 'proxmox'; // Default node name
  }

  async initialize(config = {}) {
    this.securityMode = config.securityMode || 'moderate';
    this.maxContainers = config.maxContainers || 50;
    this.defaultTimeout = config.defaultTimeout || 60000;
    this.proxmoxNode = config.node || 'proxmox';
    
    // Configure allowed templates based on security mode
    if (this.securityMode === 'strict') {
      this.allowedTemplates = new Set(config.allowedTemplates || [
        'local:vztmpl/ubuntu-20.04-standard_20.04-1_amd64.tar.gz',
        'local:vztmpl/debian-11-standard_11.3-1_amd64.tar.gz'
      ]);
      this.allowedStorages = new Set(config.allowedStorages || ['local-lvm']);
    } else if (this.securityMode === 'moderate') {
      this.allowedTemplates = new Set(config.allowedTemplates || [
        'local:vztmpl/ubuntu-20.04-standard_20.04-1_amd64.tar.gz',
        'local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.gz',
        'local:vztmpl/debian-11-standard_11.3-1_amd64.tar.gz',
        'local:vztmpl/debian-12-standard_12.2-1_amd64.tar.gz',
        'local:vztmpl/centos-8-standard_8.5-1_amd64.tar.gz'
      ]);
      this.allowedStorages = new Set(config.allowedStorages || ['local', 'local-lvm', 'local-zfs']);
    } else { // permissive
      this.allowedTemplates = new Set(); // Allow any template
      this.allowedStorages = new Set(); // Allow any storage
    }

    // Test pct command availability
    await this.testPctCommand();
    
    log('initialize', {
      securityMode: this.securityMode,
      maxContainers: this.maxContainers,
      node: this.proxmoxNode,
      allowedTemplates: Array.from(this.allowedTemplates),
      allowedStorages: Array.from(this.allowedStorages)
    });
  }

  async testPctCommand() {
    return new Promise((resolve, reject) => {
      const process = spawn('pct', ['--version'], { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          log('pct_available', { version: output.trim() });
          resolve();
        } else {
          reject(new Error('Proxmox pct command not available. This system may not be a Proxmox node.'));
        }
      });

      setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error('pct command test timed out'));
      }, 5000);
    });
  }

  async handleMessage(message, context) {
    try {
      const interpolatedMessage = await interpolateMessage(message, context.variables || {});
      const { command, subcommand, params } = this.parseCommand(interpolatedMessage);

      log('command', { command, subcommand, params });

      switch (command) {
        case 'create':
          return await this.createContainer(params, context);
        case 'start':
          return await this.startContainer(params, context);
        case 'stop':
          return await this.stopContainer(params, context);
        case 'restart':
          return await this.restartContainer(params, context);
        case 'destroy':
          return await this.destroyContainer(params, context);
        case 'list':
          return await this.listContainers(params, context);
        case 'exec':
          return await this.execInContainer(params, context);
        case 'deploy_rexx':
          return await this.deployRexx(params, context);
        case 'execute_rexx':
          return await this.executeRexx(params, context);
        case 'snapshot':
          return await this.createSnapshot(params, context);
        case 'restore':
          return await this.restoreSnapshot(params, context);
        case 'clone':
          return await this.cloneContainer(params, context);
        case 'migrate':
          return await this.migrateContainer(params, context);
        case 'backup':
          return await this.backupContainer(params, context);
        case 'config':
          return await this.configureContainer(params, context);
        case 'monitor':
          return await this.monitorContainer(params, context);
        case 'cleanup':
          return await this.cleanupContainers(params, context);
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      log('error', { error: error.message, command: message });
      throw error;
    }
  }

  parseCommand(message) {
    const parts = message.trim().split(/\s+/);
    const command = parts[0] || '';
    const subcommand = parts.length > 1 && !parts[1].includes('=') ? parts[1] : '';
    
    const params = {};
    const startIndex = subcommand ? 2 : 1;
    
    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        params[key] = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      }
    }
    
    return { command, subcommand, params };
  }

  async createContainer(params, context) {
    const {
      vmid = this.getNextVMID(),
      template,
      hostname,
      memory = '512',
      cores = '1',
      storage = 'local-lvm',
      rootfs_size = '8G',
      password,
      ssh_key,
      network = 'name=eth0,bridge=vmbr0,ip=dhcp',
      features,
      unprivileged = 'true',
      onboot = 'false'
    } = params;

    // Validate required parameters
    if (!template) {
      throw new Error('Missing required parameter: template');
    }

    // Security validation
    if (this.securityMode === 'strict' && this.allowedTemplates.size > 0) {
      if (!this.allowedTemplates.has(template)) {
        throw new Error(`Template ${template} not allowed by security policy`);
      }
    }

    if (this.securityMode !== 'permissive' && this.allowedStorages.size > 0) {
      if (!this.allowedStorages.has(storage)) {
        throw new Error(`Storage ${storage} not allowed by security policy`);
      }
    }

    // Check container limits
    if (this.activeContainers.size >= this.maxContainers) {
      throw new Error(`Maximum containers (${this.maxContainers}) reached`);
    }

    // Build pct create command
    const pctArgs = [
      'create', vmid.toString(),
      template,
      `--hostname=${hostname || `ct${vmid}`}`,
      `--memory=${memory}`,
      `--cores=${cores}`,
      `--rootfs=${storage}:${rootfs_size}`,
      `--net0=${network}`,
      `--unprivileged=${unprivileged}`,
      `--onboot=${onboot}`
    ];

    if (password) {
      pctArgs.push(`--password=${password}`);
    }

    if (ssh_key) {
      pctArgs.push(`--ssh-public-keys=${ssh_key}`);
    }

    if (features) {
      pctArgs.push(`--features=${features}`);
    }

    log('create_start', { vmid, template, hostname, memory, cores, storage });

    try {
      const result = await this.executePctCommand(pctArgs);
      
      // Store container info
      const containerInfo = {
        vmid: parseInt(vmid),
        hostname: hostname || `ct${vmid}`,
        template,
        memory: parseInt(memory),
        cores: parseInt(cores),
        storage,
        status: 'stopped',
        created: new Date(),
        hasRexx: false
      };

      this.activeContainers.set(vmid.toString(), containerInfo);

      log('create_success', { vmid, hostname: containerInfo.hostname });

      return {
        success: true,
        vmid: parseInt(vmid),
        hostname: containerInfo.hostname,
        template,
        status: 'created',
        message: `Container ${vmid} created successfully`
      };

    } catch (error) {
      log('create_error', { vmid, error: error.message });
      throw new Error(`Container creation failed: ${error.message}`);
    }
  }

  async startContainer(params, context) {
    const { vmid } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    log('start_container', { vmid });

    try {
      await this.executePctCommand(['start', vmid]);
      
      // Update internal state
      const container = this.activeContainers.get(vmid);
      if (container) {
        container.status = 'running';
        container.startTime = new Date();
      }

      return {
        success: true,
        vmid: parseInt(vmid),
        status: 'running',
        message: `Container ${vmid} started successfully`
      };

    } catch (error) {
      throw new Error(`Container start failed: ${error.message}`);
    }
  }

  async stopContainer(params, context) {
    const { vmid, force = 'false' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    const args = ['stop', vmid];
    if (force === 'true') {
      args.push('--force');
    }

    log('stop_container', { vmid, force });

    try {
      await this.executePctCommand(args);
      
      // Update internal state
      const container = this.activeContainers.get(vmid);
      if (container) {
        container.status = 'stopped';
        container.stopTime = new Date();
      }

      return {
        success: true,
        vmid: parseInt(vmid),
        status: 'stopped',
        force: force === 'true',
        message: `Container ${vmid} stopped successfully`
      };

    } catch (error) {
      throw new Error(`Container stop failed: ${error.message}`);
    }
  }

  async destroyContainer(params, context) {
    const { vmid, force = 'false', purge = 'false' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    const args = ['destroy', vmid];
    if (force === 'true') {
      args.push('--force');
    }
    if (purge === 'true') {
      args.push('--purge');
    }

    log('destroy_container', { vmid, force, purge });

    try {
      await this.executePctCommand(args);
      
      // Remove from internal tracking
      this.activeContainers.delete(vmid);

      return {
        success: true,
        vmid: parseInt(vmid),
        status: 'destroyed',
        force: force === 'true',
        purge: purge === 'true',
        message: `Container ${vmid} destroyed successfully`
      };

    } catch (error) {
      throw new Error(`Container destroy failed: ${error.message}`);
    }
  }

  async listContainers(params, context) {
    log('list_containers', {});

    try {
      const output = await this.executePctCommand(['list']);
      const containers = this.parseContainerList(output);

      return {
        success: true,
        containers,
        count: containers.length,
        node: this.proxmoxNode
      };

    } catch (error) {
      throw new Error(`Container list failed: ${error.message}`);
    }
  }

  async execInContainer(params, context) {
    const { vmid, command, timeout = this.defaultTimeout } = params;
    
    if (!vmid || !command) {
      throw new Error('Missing required parameters: vmid, command');
    }

    log('exec_start', { vmid, command, timeout });

    try {
      const output = await this.executePctCommand(['exec', vmid, '--', 'bash', '-c', command], timeout);

      return {
        success: true,
        vmid: parseInt(vmid),
        command,
        output: output.trim(),
        exitCode: 0
      };

    } catch (error) {
      log('exec_error', { vmid, command, error: error.message });
      
      return {
        success: false,
        vmid: parseInt(vmid),
        command,
        error: error.message,
        exitCode: error.code || 1
      };
    }
  }

  async deployRexx(params, context) {
    const { 
      vmid, 
      rexx_binary = './rexx-linux-x64', 
      target_path = '/usr/local/bin/rexx' 
    } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    // Check if binary exists
    if (!fs.existsSync(rexx_binary)) {
      throw new Error(`Binary file ${rexx_binary} not found`);
    }

    log('deploy_rexx_start', { vmid, rexx_binary, target_path });

    try {
      // First, ensure container is running
      await this.startContainer({ vmid }, context);

      // Copy binary to container
      await this.executePctCommand(['push', vmid, rexx_binary, target_path]);
      
      // Make executable
      await this.executePctCommand(['exec', vmid, '--', 'chmod', '+x', target_path]);

      // Test the deployment
      const testOutput = await this.executePctCommand(['exec', vmid, '--', target_path, '--version']);

      // Update container info
      const container = this.activeContainers.get(vmid);
      if (container) {
        container.hasRexx = true;
        container.rexxPath = target_path;
        container.rexxVersion = testOutput.trim();
      }

      log('deploy_rexx_success', { vmid, target_path, version: testOutput.trim() });

      return {
        success: true,
        vmid: parseInt(vmid),
        binaryPath: rexx_binary,
        targetPath: target_path,
        version: testOutput.trim(),
        message: `RexxJS deployed to container ${vmid}`
      };

    } catch (error) {
      log('deploy_rexx_error', { vmid, error: error.message });
      throw new Error(`RexxJS deployment failed: ${error.message}`);
    }
  }

  async executeRexx(params, context) {
    const { vmid, script, timeout = this.defaultTimeout } = params;
    
    if (!vmid || !script) {
      throw new Error('Missing required parameters: vmid, script');
    }

    const container = this.activeContainers.get(vmid);
    if (!container || !container.hasRexx) {
      throw new Error(`Container ${vmid} does not have RexxJS deployed`);
    }

    log('execute_rexx_start', { vmid, script: script.substring(0, 100) });

    try {
      // Create temporary script file in container
      const tempScript = `/tmp/rexx_script_${Date.now()}.rexx`;
      
      // Write script to temporary file
      const writeCmd = `cat > ${tempScript} << 'REXX_SCRIPT_EOF'\n${script}\nREXX_SCRIPT_EOF`;
      await this.executePctCommand(['exec', vmid, '--', 'bash', '-c', writeCmd]);

      // Execute the script
      const output = await this.executePctCommand([
        'exec', vmid, '--', container.rexxPath || '/usr/local/bin/rexx', tempScript
      ], timeout);

      // Cleanup temporary file
      await this.executePctCommand(['exec', vmid, '--', 'rm', '-f', tempScript]);

      log('execute_rexx_success', { vmid, outputLength: output.length });

      return {
        success: true,
        vmid: parseInt(vmid),
        script,
        output: output.trim(),
        exitCode: 0
      };

    } catch (error) {
      log('execute_rexx_error', { vmid, error: error.message });
      
      return {
        success: false,
        vmid: parseInt(vmid),
        script,
        error: error.message,
        exitCode: error.code || 1
      };
    }
  }

  async createSnapshot(params, context) {
    const { vmid, snapname, description } = params;
    
    if (!vmid || !snapname) {
      throw new Error('Missing required parameters: vmid, snapname');
    }

    const args = ['snapshot', vmid, snapname];
    if (description) {
      args.push(`--description=${description}`);
    }

    log('snapshot_create', { vmid, snapname, description });

    try {
      await this.executePctCommand(args);

      return {
        success: true,
        vmid: parseInt(vmid),
        snapname,
        description,
        created: new Date().toISOString(),
        message: `Snapshot ${snapname} created for container ${vmid}`
      };

    } catch (error) {
      throw new Error(`Snapshot creation failed: ${error.message}`);
    }
  }

  async restoreSnapshot(params, context) {
    const { vmid, snapname } = params;
    
    if (!vmid || !snapname) {
      throw new Error('Missing required parameters: vmid, snapname');
    }

    log('snapshot_restore', { vmid, snapname });

    try {
      await this.executePctCommand(['rollback', vmid, snapname]);

      return {
        success: true,
        vmid: parseInt(vmid),
        snapname,
        restored: new Date().toISOString(),
        message: `Container ${vmid} restored to snapshot ${snapname}`
      };

    } catch (error) {
      throw new Error(`Snapshot restore failed: ${error.message}`);
    }
  }

  async cloneContainer(params, context) {
    const { vmid, newid = this.getNextVMID(), hostname, full = 'false' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    const args = ['clone', vmid, newid];
    if (hostname) {
      args.push(`--hostname=${hostname}`);
    }
    if (full === 'true') {
      args.push('--full');
    }

    log('clone_container', { vmid, newid, hostname, full });

    try {
      await this.executePctCommand(args);

      // Clone container info
      const sourceContainer = this.activeContainers.get(vmid);
      if (sourceContainer) {
        const clonedContainer = {
          ...sourceContainer,
          vmid: parseInt(newid),
          hostname: hostname || `${sourceContainer.hostname}-clone`,
          status: 'stopped',
          created: new Date(),
          clonedFrom: parseInt(vmid)
        };
        this.activeContainers.set(newid.toString(), clonedContainer);
      }

      return {
        success: true,
        sourceVMID: parseInt(vmid),
        newVMID: parseInt(newid),
        hostname: hostname || `ct${newid}`,
        full: full === 'true',
        message: `Container ${vmid} cloned to ${newid}`
      };

    } catch (error) {
      throw new Error(`Container clone failed: ${error.message}`);
    }
  }

  async monitorContainer(params, context) {
    const { vmid } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    log('monitor_container', { vmid });

    try {
      // Get container config
      const configOutput = await this.executePctCommand(['config', vmid]);
      const config = this.parseContainerConfig(configOutput);

      // Get container status
      const statusOutput = await this.executePctCommand(['status', vmid]);
      const status = statusOutput.includes('running') ? 'running' : 'stopped';

      // Get resource usage if running
      let resources = {};
      if (status === 'running') {
        try {
          const resourceOutput = await this.executePctCommand(['exec', vmid, '--', 'cat', '/proc/meminfo', '/proc/loadavg']);
          resources = this.parseResourceUsage(resourceOutput);
        } catch (e) {
          // Resource monitoring may fail, continue without it
          resources = { error: 'Resource monitoring unavailable' };
        }
      }

      const container = this.activeContainers.get(vmid) || {};

      return {
        success: true,
        vmid: parseInt(vmid),
        status,
        config,
        resources,
        uptime: status === 'running' && container.startTime ? 
          Date.now() - container.startTime.getTime() : 0,
        hasRexx: container.hasRexx || false,
        rexxVersion: container.rexxVersion || null
      };

    } catch (error) {
      throw new Error(`Container monitoring failed: ${error.message}`);
    }
  }

  async cleanupContainers(params, context) {
    const { all = 'false', stopped_only = 'true' } = params;

    log('cleanup_containers', { all, stopped_only });

    try {
      let cleanedUp = 0;

      if (all === 'true') {
        if (stopped_only === 'true') {
          // Only cleanup stopped containers
          for (const [vmid, container] of this.activeContainers.entries()) {
            if (container.status === 'stopped') {
              await this.destroyContainer({ vmid, force: 'true', purge: 'true' }, context);
              cleanedUp++;
            }
          }
        } else {
          // Cleanup all containers (dangerous!)
          for (const vmid of this.activeContainers.keys()) {
            await this.stopContainer({ vmid, force: 'true' }, context);
            await this.destroyContainer({ vmid, force: 'true', purge: 'true' }, context);
            cleanedUp++;
          }
        }
      }

      return {
        success: true,
        cleanedUp,
        remainingContainers: this.activeContainers.size,
        message: `Cleaned up ${cleanedUp} containers`
      };

    } catch (error) {
      throw new Error(`Container cleanup failed: ${error.message}`);
    }
  }

  // Utility methods

  getNextVMID() {
    // Find next available VMID
    while (this.activeContainers.has(this.containerCounter.toString())) {
      this.containerCounter++;
    }
    return this.containerCounter++;
  }

  parseContainerList(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const containers = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 3) {
        containers.push({
          vmid: parseInt(parts[0]),
          status: parts[1],
          name: parts[2] || `ct${parts[0]}`
        });
      }
    }

    return containers;
  }

  parseContainerConfig(output) {
    const config = {};
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        config[key.trim()] = valueParts.join(':').trim();
      }
    }

    return config;
  }

  parseResourceUsage(output) {
    const resources = {};
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('MemTotal:')) {
        resources.totalMemory = line.split(/\s+/)[1];
      } else if (line.includes('MemFree:')) {
        resources.freeMemory = line.split(/\s+/)[1];
      } else if (line.includes('load average:')) {
        const loadMatch = line.match(/load average: ([\d.]+)/);
        if (loadMatch) {
          resources.loadAverage = parseFloat(loadMatch[1]);
        }
      }
    }

    return resources;
  }

  async executePctCommand(args, timeout = this.defaultTimeout) {
    return new Promise((resolve, reject) => {
      const process = spawn('pct', args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          const error = new Error(`pct command failed: ${stderr || stdout}`);
          error.code = code;
          reject(error);
        }
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`pct command timed out after ${timeout}ms`));
      }, timeout);

      process.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }
}

module.exports = ProxmoxHandler;