/**
 * systemd-nspawn Container Handler - Lightweight Container Management
 * Provides container management through systemd-nspawn and machinectl commands
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity, createResource, updateResourceStatus, executeOnHosts } = require('../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('NSPAWN', operation, details);
}

class NspawnHandler {
  constructor() {
    this.activeMachines = new Map();
    this.machineCounter = 1;
    this.maxMachines = 50;
    this.securityMode = 'moderate';
    this.allowedImages = new Set();
    this.allowedDirectories = new Set(['/var/lib/machines']);
    this.defaultTimeout = 60000; // 60 seconds for container operations
    this.machinesPath = '/var/lib/machines';
  }

  async initialize(config = {}) {
    this.securityMode = config.securityMode || 'moderate';
    this.maxMachines = config.maxMachines || 50;
    this.defaultTimeout = config.defaultTimeout || 60000;
    this.machinesPath = config.machinesPath || '/var/lib/machines';
    
    // Configure allowed images based on security mode
    if (this.securityMode === 'strict') {
      this.allowedImages = new Set(config.allowedImages || [
        'debian:stable',
        'ubuntu:22.04',
        'archlinux:latest'
      ]);
      this.allowedDirectories = new Set(config.allowedDirectories || ['/var/lib/machines']);
    } else if (this.securityMode === 'moderate') {
      this.allowedImages = new Set(config.allowedImages || [
        'debian:stable',
        'debian:bullseye',
        'ubuntu:22.04',
        'ubuntu:20.04',
        'fedora:38',
        'archlinux:latest',
        'centos:stream9'
      ]);
      this.allowedDirectories = new Set(config.allowedDirectories || [
        '/var/lib/machines', '/home/containers', '/opt/containers'
      ]);
    } else { // permissive
      this.allowedImages = new Set(); // Allow any image
      this.allowedDirectories = new Set(); // Allow any directory
    }

    log('initialize', { 
      securityMode: this.securityMode, 
      maxMachines: this.maxMachines,
      machinesPath: this.machinesPath
    });
  }

  async handleMessage(message, context) {
    const interpolatedMessage = interpolateMessage(message, context);
    log('handle_message', { message: interpolatedMessage });

    try {
      const { command, subcommand, params } = this.parseCommand(interpolatedMessage);
      
      switch (command) {
        case 'create':
          return await this.createMachine(params, context);
        case 'start':
          return await this.startMachine(params, context);
        case 'stop':
          return await this.stopMachine(params, context);
        case 'terminate':
        case 'kill':
          return await this.terminateMachine(params, context);
        case 'remove':
        case 'destroy':
          return await this.removeMachine(params, context);
        case 'list':
          return await this.listMachines(params, context);
        case 'status':
          return await this.getMachineStatus(params, context);
        case 'exec':
          return await this.execInMachine(params, context);
        case 'shell':
          return await this.shellIntoMachine(params, context);
        case 'copy':
        case 'cp':
          return await this.copyToMachine(params, context);
        case 'clone':
          return await this.cloneMachine(params, context);
        case 'snapshot':
          return await this.createSnapshot(params, context);
        case 'import':
          return await this.importImage(params, context);
        case 'export':
          return await this.exportMachine(params, context);
        case 'deploy_rexx':
          return await this.deployRexx(params, context);
        case 'execute_rexx':
          return await this.executeRexx(params, context);
        case 'monitor':
          return await this.monitorMachine(params, context);
        case 'cleanup':
          return await this.cleanupMachines(params, context);
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

  async createMachine(params, context) {
    const {
      name = this.getNextMachineName(),
      image,
      directory,
      memory = '512M',
      cpus = '1',
      network = 'host',
      readonly = 'false',
      boot = 'false'
    } = params;

    // Validate required parameters
    if (!image && !directory) {
      throw new Error('Missing required parameter: image or directory');
    }

    // Security validation
    if (image && this.securityMode === 'strict' && this.allowedImages.size > 0) {
      if (!this.allowedImages.has(image)) {
        throw new Error(`Image ${image} not allowed by security policy`);
      }
    }

    if (directory && this.securityMode !== 'permissive' && this.allowedDirectories.size > 0) {
      const dirPath = path.resolve(directory);
      const allowed = Array.from(this.allowedDirectories).some(allowedDir => 
        dirPath.startsWith(path.resolve(allowedDir))
      );
      if (!allowed) {
        throw new Error(`Directory ${directory} not allowed by security policy`);
      }
    }

    // Check machine limits
    if (this.activeMachines.size >= this.maxMachines) {
      throw new Error(`Maximum machines (${this.maxMachines}) reached`);
    }

    log('create_machine', { name, image, directory, memory, cpus });

    try {
      let createCommand;
      if (image) {
        // Pull/import image if needed
        await this.ensureImageAvailable(image);
        createCommand = ['machinectl', 'clone', image, name];
      } else {
        // Create from directory
        const machineDir = path.join(this.machinesPath, name);
        createCommand = ['cp', '-r', directory, machineDir];
        await this.executeCommand(createCommand[0], createCommand.slice(1));
        
        // Register with systemd-machined
        await this.executeCommand('machinectl', ['import-fs', machineDir, name]);
      }

      if (image) {
        await this.executeCommand(createCommand[0], createCommand.slice(1));
      }

      // Configure machine settings
      const machineInfo = {
        name,
        image: image || directory,
        status: 'stopped',
        created: new Date(),
        memory,
        cpus,
        network,
        readonly: readonly === 'true',
        boot: boot === 'true'
      };

      this.activeMachines.set(name, machineInfo);

      return {
        success: true,
        name,
        image: image || directory,
        status: 'created',
        memory,
        cpus,
        message: `Machine ${name} created successfully`
      };

    } catch (error) {
      log('create_error', { name, error: error.message });
      throw new Error(`Machine creation failed: ${error.message}`);
    }
  }

  async startMachine(params, context) {
    const { name, boot = 'false' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('start_machine', { name, boot });

    try {
      const args = boot === 'true' ? ['start', name] : ['start', name, '--network-bridge=host'];
      await this.executeCommand('machinectl', args);
      
      // Update internal state
      const machine = this.activeMachines.get(name);
      if (machine) {
        machine.status = 'running';
        machine.startTime = new Date();
      }

      return {
        success: true,
        name,
        status: 'running',
        boot: boot === 'true',
        message: `Machine ${name} started successfully`
      };

    } catch (error) {
      throw new Error(`Machine start failed: ${error.message}`);
    }
  }

  async stopMachine(params, context) {
    const { name, force = 'false' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const args = force === 'true' ? ['terminate', name] : ['stop', name];
    
    log('stop_machine', { name, force });

    try {
      await this.executeCommand('machinectl', args);
      
      // Update internal state
      const machine = this.activeMachines.get(name);
      if (machine) {
        machine.status = 'stopped';
        machine.stopTime = new Date();
      }

      return {
        success: true,
        name,
        status: 'stopped',
        force: force === 'true',
        message: `Machine ${name} stopped successfully`
      };

    } catch (error) {
      throw new Error(`Machine stop failed: ${error.message}`);
    }
  }

  async terminateMachine(params, context) {
    const { name } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('terminate_machine', { name });

    try {
      await this.executeCommand('machinectl', ['terminate', name]);
      
      // Update internal state
      const machine = this.activeMachines.get(name);
      if (machine) {
        machine.status = 'terminated';
        machine.terminateTime = new Date();
      }

      return {
        success: true,
        name,
        status: 'terminated',
        message: `Machine ${name} terminated successfully`
      };

    } catch (error) {
      throw new Error(`Machine terminate failed: ${error.message}`);
    }
  }

  async removeMachine(params, context) {
    const { name, purge = 'false' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('remove_machine', { name, purge });

    try {
      // Stop machine if running
      try {
        await this.executeCommand('machinectl', ['terminate', name]);
      } catch (error) {
        // Ignore if already stopped
        log('remove_stop_ignore', { name, error: error.message });
      }

      // Remove machine
      await this.executeCommand('machinectl', ['remove', name]);
      
      // Remove from internal tracking
      this.activeMachines.delete(name);

      return {
        success: true,
        name,
        status: 'removed',
        purge: purge === 'true',
        message: `Machine ${name} removed successfully`
      };

    } catch (error) {
      throw new Error(`Machine remove failed: ${error.message}`);
    }
  }

  async listMachines(params, context) {
    log('list_machines', {});

    try {
      const output = await this.executeCommand('machinectl', ['list', '--no-legend']);
      const machines = this.parseMachineList(output);

      return {
        success: true,
        machines,
        count: machines.length
      };

    } catch (error) {
      throw new Error(`Machine list failed: ${error.message}`);
    }
  }

  async getMachineStatus(params, context) {
    const { name } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('machine_status', { name });

    try {
      const output = await this.executeCommand('machinectl', ['status', name]);
      const status = this.parseMachineStatus(output);

      return {
        success: true,
        name,
        ...status
      };

    } catch (error) {
      throw new Error(`Machine status failed: ${error.message}`);
    }
  }

  async execInMachine(params, context) {
    const { name, command, timeout = this.defaultTimeout } = params;
    
    if (!name || !command) {
      throw new Error('Missing required parameters: name, command');
    }

    log('exec_in_machine', { name, command });

    try {
      const args = ['shell', name, '/bin/bash', '-c', command];
      const output = await this.executeCommand('machinectl', args, { timeout });

      return {
        success: true,
        name,
        command,
        output: output.trim(),
        message: `Command executed in machine ${name}`
      };

    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  async deployRexx(params, context) {
    const { name, rexx_binary = '/home/paul/scm/rexxjs/RexxJS/rexx-linux-x64', target_path = '/usr/local/bin/rexx' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Check if binary exists
    if (!fs.existsSync(rexx_binary)) {
      throw new Error(`Binary file ${rexx_binary} not found`);
    }

    log('deploy_rexx', { name, rexx_binary, target_path });

    try {
      // Copy RexxJS binary to machine
      await this.executeCommand('machinectl', ['copy-to', name, rexx_binary, target_path]);
      
      // Make executable
      await this.execInMachine({ name, command: `chmod +x ${target_path}` }, context);
      
      // Update machine info
      const machine = this.activeMachines.get(name);
      if (machine) {
        machine.hasRexx = true;
        machine.rexxPath = target_path;
      }

      return {
        success: true,
        name,
        rexxPath: target_path,
        message: `RexxJS deployed to machine ${name}`
      };

    } catch (error) {
      log('deploy_rexx_error', { name, error: error.message });
      throw new Error(`RexxJS deployment failed: ${error.message}`);
    }
  }

  async executeRexx(params, context) {
    const { name, script, timeout = this.defaultTimeout } = params;
    
    if (!name || !script) {
      throw new Error('Missing required parameters: name, script');
    }

    const machine = this.activeMachines.get(name);
    if (!machine || !machine.hasRexx) {
      throw new Error(`Machine ${name} does not have RexxJS deployed`);
    }

    log('execute_rexx', { name, script: script.substring(0, 100) });

    try {
      // Write script to temporary file in machine
      const scriptPath = `/tmp/rexx_script_${Date.now()}.rexx`;
      const scriptContent = script.replace(/'/g, "'\"'\"'"); // Escape single quotes
      
      await this.execInMachine({ 
        name, 
        command: `echo '${scriptContent}' > ${scriptPath}`
      }, context);

      // Execute RexxJS script
      const result = await this.execInMachine({
        name,
        command: `${machine.rexxPath} ${scriptPath}`,
        timeout
      }, context);

      // Clean up temporary file
      await this.execInMachine({
        name,
        command: `rm -f ${scriptPath}`
      }, context);

      return {
        success: true,
        name,
        scriptOutput: result.output,
        message: `RexxJS script executed in machine ${name}`
      };

    } catch (error) {
      log('execute_rexx_error', { name, error: error.message });
      throw new Error(`RexxJS execution failed: ${error.message}`);
    }
  }

  async cloneMachine(params, context) {
    const { name, newName = this.getNextMachineName(), readonly = 'false' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('clone_machine', { name, newName, readonly });

    try {
      const args = ['clone', name, newName];
      if (readonly === 'true') {
        args.push('--read-only');
      }

      await this.executeCommand('machinectl', args);

      // Clone machine info
      const sourceMachine = this.activeMachines.get(name);
      if (sourceMachine) {
        const clonedMachine = {
          ...sourceMachine,
          name: newName,
          status: 'stopped',
          created: new Date(),
          clonedFrom: name,
          readonly: readonly === 'true'
        };
        this.activeMachines.set(newName, clonedMachine);
      }

      return {
        success: true,
        sourceName: name,
        newName,
        readonly: readonly === 'true',
        message: `Machine ${name} cloned to ${newName}`
      };

    } catch (error) {
      throw new Error(`Machine clone failed: ${error.message}`);
    }
  }

  async importImage(params, context) {
    const { image, url, file } = params;
    
    if (!image || (!url && !file)) {
      throw new Error('Missing required parameters: image and (url or file)');
    }

    log('import_image', { image, url, file });

    try {
      let importCommand;
      if (url) {
        importCommand = ['machinectl', 'pull-tar', url, image];
      } else {
        importCommand = ['machinectl', 'import-tar', file, image];
      }

      await this.executeCommand(importCommand[0], importCommand.slice(1));

      return {
        success: true,
        image,
        source: url || file,
        message: `Image ${image} imported successfully`
      };

    } catch (error) {
      throw new Error(`Image import failed: ${error.message}`);
    }
  }

  async ensureImageAvailable(image) {
    try {
      await this.executeCommand('machinectl', ['show-image', image]);
      return; // Image already available
    } catch (error) {
      log('image_not_available', { image });
    }

    // Try to pull common images
    const imageMap = {
      'debian:stable': 'https://cloud.debian.org/images/cloud/bullseye/latest/debian-11-generic-amd64.tar.xz',
      'ubuntu:22.04': 'https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-amd64-root.tar.xz',
      'archlinux:latest': 'https://gitlab.archlinux.org/archlinux/arch-boxes/-/jobs/artifacts/master/raw/output/Arch-Linux-x86_64-basic.tar.xz?job=build:archlinux'
    };

    const imageUrl = imageMap[image];
    if (imageUrl) {
      log('pulling_image', { image, url: imageUrl });
      await this.executeCommand('machinectl', ['pull-tar', imageUrl, image]);
    } else {
      throw new Error(`Image ${image} not available and no known source`);
    }
  }

  parseMachineList(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const machines = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        machines.push({
          name: parts[0],
          class: parts[1],
          service: parts[2],
          state: parts[3] || 'unknown'
        });
      }
    }

    return machines;
  }

  parseMachineStatus(output) {
    const status = {
      state: 'unknown',
      leader: null,
      memory: null,
      tasks: null
    };

    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('State:')) {
        status.state = line.split(':')[1].trim();
      } else if (line.includes('Leader:')) {
        status.leader = line.split(':')[1].trim();
      } else if (line.includes('Memory:')) {
        status.memory = line.split(':')[1].trim();
      } else if (line.includes('Tasks:')) {
        status.tasks = line.split(':')[1].trim();
      }
    }

    return status;
  }

  getNextMachineName() {
    let name;
    do {
      name = `machine${this.machineCounter++}`;
    } while (this.activeMachines.has(name));
    return name;
  }

  async monitorMachine(params, context) {
    const { name } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('monitor_machine', { name });

    try {
      const status = await this.getMachineStatus({ name }, context);
      const machine = this.activeMachines.get(name);

      return {
        success: true,
        name,
        ...status,
        machineInfo: machine || null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Machine monitoring failed: ${error.message}`);
    }
  }

  async cleanupMachines(params, context) {
    const { all = 'false', stopped = 'true' } = params;

    log('cleanup_machines', { all, stopped });

    try {
      const machines = await this.listMachines({}, context);
      const cleaned = [];

      for (const machine of machines.machines) {
        if (all === 'true' || (stopped === 'true' && machine.state !== 'running')) {
          try {
            await this.removeMachine({ name: machine.name }, context);
            cleaned.push(machine.name);
          } catch (error) {
            log('cleanup_error', { name: machine.name, error: error.message });
          }
        }
      }

      return {
        success: true,
        cleaned,
        count: cleaned.length,
        message: `Cleaned up ${cleaned.length} machines`
      };

    } catch (error) {
      throw new Error(`Machine cleanup failed: ${error.message}`);
    }
  }

  async executeCommand(command, args = [], options = {}) {
    const { timeout = this.defaultTimeout } = options;
    
    log('execute_command', { command, args: args.join(' ') });

    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve(stdout);
        } else {
          const error = new Error(`${command} command failed: ${stderr || stdout}`);
          error.code = code;
          reject(error);
        }
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`${command} command timed out after ${timeout}ms`));
      }, timeout);

      process.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }
}

module.exports = NspawnHandler;