/*!
 * rexxjs/address-nspawn v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=NSPAWN_ADDRESS_META
 */
/**
 * ADDRESS NSPAWN Handler
 * Provides systemd-nspawn container operations with CoW cloning
 *
 * systemd-nspawn offers lightweight OS containers with:
 * - Built into systemd (no installation needed)
 * - Works on any filesystem (directory, btrfs, ZFS)
 * - Fast boot times (<1s)
 * - Simple directory-based containers
 * - CoW cloning via btrfs snapshots or rsync hardlinks
 *
 * CoW strategies:
 * 1. btrfs subvolume snapshot (instant, <100ms)
 * 2. rsync with --link-dest (fast hardlinks, <1s)
 * 3. cp -al (hardlink copy fallback, <2s)
 *
 * Usage:
 *   REQUIRE "cwd:extras/addresses/nspawn-address/nspawn-address.js"
 *   ADDRESS NSPAWN
 *   "create name=test-container distro=ubuntu"
 *   "start name=test-container"
 *   "execute name=test-container command='apt update'"
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Will be loaded in initialize()
let execAsync = null;

class AddressNspawnHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 0;
    this.defaultTimeout = 60000;
    this.maxContainers = 200; // Higher than VMs
    this.runtime = 'systemd-nspawn';
    this.machinesDir = '/var/lib/machines';
    this.baseImageRegistry = new Map();
    this.initialized = false;
    this.cowMethod = null; // Will be detected: 'btrfs', 'rsync', or 'cp'

    // Pre-load Node.js modules
    this.spawn = null;
    this.exec = null;
    this.fs = null;
    this.path = null;
  }

  async initialize(config = {}) {
    if (this.initialized) return;

    // Load Node.js modules once
    const { exec, spawn } = require('child_process');
    const { promisify } = require('util');
    const fs = require('fs');
    const path = require('path');

    this.exec = exec;
    this.spawn = spawn;
    this.fs = fs;
    this.path = path;

    // Set global execAsync
    execAsync = promisify(exec);

    // Detect best CoW method
    await this.detectCowMethod();

    this.initialized = true;
  }

  /**
   * Detect best CoW cloning method for this system
   */
  async detectCowMethod() {
    try {
      // Check if /var/lib/machines is on ZFS or btrfs
      const { stdout } = await execAsync('findmnt -n -o FSTYPE /var/lib/machines 2>/dev/null || findmnt -n -o FSTYPE / 2>/dev/null', {
        timeout: 5000
      });

      const fstype = stdout.trim();

      if (fstype === 'zfs') {
        this.cowMethod = 'zfs';
        // Get the ZFS dataset name
        const { stdout: source } = await execAsync('findmnt -n -o SOURCE /var/lib/machines', { timeout: 2000 });
        this.zfsDataset = source.trim(); // e.g., lxd-pool/nspawn
        return;
      }

      if (fstype === 'btrfs') {
        this.cowMethod = 'btrfs';
        return;
      }
    } catch (error) {
      // Fall through to rsync
    }

    // Check for rsync
    try {
      await execAsync('which rsync', { timeout: 2000 });
      this.cowMethod = 'rsync';
      return;
    } catch (error) {
      // Fall through to cp
    }

    // Fallback to cp
    this.cowMethod = 'cp';
  }

  /**
   * Execute machinectl command
   */
  async execMachinectl(args, options = {}) {
    const timeout = options.timeout || 10000;
    const cmd = `sudo machinectl ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        maxBuffer: 10 * 1024 * 1024
      });
      return { exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      return { exitCode: error.code || 1, stdout: '', stderr: error.message };
    }
  }

  /**
   * Execute systemd-nspawn command
   */
  async execNspawn(args, options = {}) {
    const timeout = options.timeout || 10000;
    const cmd = `sudo systemd-nspawn ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        maxBuffer: 10 * 1024 * 1024
      });
      return { exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      return { exitCode: error.code || 1, stdout: '', stderr: error.message };
    }
  }

  /**
   * List containers using machinectl
   */
  async listContainers() {
    const result = await this.execMachinectl(['list', '--no-legend']);
    if (result.exitCode === 0 && result.stdout) {
      const containers = [];
      const lines = result.stdout.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const name = parts[0];
          const info = this.activeContainers.get(name) || {};
          containers.push({
            name: parts[0],
            class: parts[1],
            service: parts[2],
            status: 'Running',
            ...info
          });
        }
      }
      return containers;
    }
    return [];
  }

  /**
   * Create minimal container directory structure
   */
  async createContainer(params) {
    const { name, distro = 'ubuntu', release = '22.04' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Check if container already exists
    const containerPath = this.path.join(this.machinesDir, name);
    if (this.fs.existsSync(containerPath)) {
      throw new Error(`Container ${name} already exists at ${containerPath}`);
    }

    // Create container based on filesystem type
    try {
      if (this.cowMethod === 'zfs') {
        // Create ZFS dataset for container
        const dataset = `${this.zfsDataset}/${name}`;
        await execAsync(`sudo zfs create ${dataset}`, { timeout: 5000 });
        // Path will be automatically mounted at /var/lib/machines/${name}
        // Create directory structure (use bash -c for brace expansion)
        await execAsync(`sudo bash -c "mkdir -p ${containerPath}/{etc,root,tmp,var,usr/bin,usr/lib}"`, { timeout: 5000 });
      } else {
        // Create regular directory structure
        await execAsync(`sudo bash -c "mkdir -p ${containerPath}/{etc,root,tmp,var,usr/bin,usr/lib}"`, { timeout: 5000 });
        await execAsync(`sudo chmod 755 ${containerPath}`, { timeout: 2000 });
      }

      // Create minimal /etc/os-release
      const osRelease = `NAME="${distro}"\nVERSION="${release}"\nID=${distro}\n`;
      await execAsync(`echo '${osRelease}' | sudo tee ${containerPath}/etc/os-release > /dev/null`, { timeout: 2000 });

      // Store container info
      this.activeContainers.set(name, {
        name,
        distro,
        release,
        status: 'Stopped',
        created: new Date().toISOString(),
        path: containerPath
      });

      return {
        success: true,
        operation: 'create',
        container: name,
        distro,
        release,
        path: containerPath,
        cowMethod: this.cowMethod,
        output: `Container ${name} created at ${containerPath} (${this.cowMethod})`
      };
    } catch (error) {
      throw new Error(`Failed to create container: ${error.message}`);
    }
  }

  /**
   * Start container using machinectl
   */
  async startContainer(params) {
    const { name } = params;
    if (!name) throw new Error('Missing required parameter: name');

    const result = await this.execMachinectl(['start', name]);
    if (result.exitCode === 0) {
      const info = this.activeContainers.get(name);
      if (info) {
        info.status = 'Running';
        info.started = new Date().toISOString();
      }
      return {
        success: true,
        operation: 'start',
        container: name,
        status: 'Running',
        output: `Started ${name}`
      };
    }
    throw new Error(`Failed to start: ${result.stderr}`);
  }

  /**
   * Stop container using machinectl
   */
  async stopContainer(params) {
    const { name } = params;
    if (!name) throw new Error('Missing required parameter: name');

    const result = await this.execMachinectl(['stop', name]);
    if (result.exitCode === 0) {
      const info = this.activeContainers.get(name);
      if (info) {
        info.status = 'Stopped';
        info.stopped = new Date().toISOString();
      }
      return {
        success: true,
        operation: 'stop',
        container: name,
        status: 'Stopped',
        output: `Stopped ${name}`
      };
    }
    throw new Error(`Failed to stop: ${result.stderr}`);
  }

  /**
   * Delete container
   */
  async deleteContainer(params) {
    const { name } = params;
    if (!name) throw new Error('Missing required parameter: name');

    // Stop if running
    try {
      await this.stopContainer({ name });
    } catch (error) {
      // Ignore if already stopped
    }

    // Remove container directory
    const containerPath = this.path.join(this.machinesDir, name);
    try {
      await execAsync(`sudo rm -rf ${containerPath}`, { timeout: 30000 });
      this.activeContainers.delete(name);

      return {
        success: true,
        operation: 'delete',
        container: name,
        output: `Deleted ${name}`
      };
    } catch (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  }

  /**
   * Execute command in container
   */
  async executeInContainer(params) {
    const { name, command } = params;

    if (!name || !command) {
      throw new Error('Missing required parameters: name and command');
    }

    // Use machinectl shell for command execution
    const result = await this.execMachinectl(['shell', name, '/bin/bash', '-c', `"${command}"`], { timeout: 60000 });

    return {
      success: result.exitCode === 0,
      operation: 'execute',
      container: name,
      command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      output: result.exitCode === 0 ? result.stdout : `Command failed: ${result.stderr}`
    };
  }

  /**
   * Clone container using detected CoW method
   */
  async cloneContainer(params) {
    const { source, destination } = params;

    if (!source || !destination) {
      throw new Error('Missing required parameters: source and destination');
    }

    const sourcePath = this.path.join(this.machinesDir, source);
    const destPath = this.path.join(this.machinesDir, destination);

    // Check source exists
    if (!this.fs.existsSync(sourcePath)) {
      throw new Error(`Source container not found: ${source}`);
    }

    // Check destination doesn't exist
    if (this.fs.existsSync(destPath)) {
      throw new Error(`Destination container already exists: ${destination}`);
    }

    const cloneStart = Date.now();

    try {
      let cloneCmd;

      switch (this.cowMethod) {
        case 'zfs':
          // ZFS snapshot + clone (instant CoW)
          // 1. Create snapshot of source
          const snapshotName = `${this.zfsDataset}/${source}@clone-${Date.now()}`;
          await execAsync(`sudo zfs snapshot ${snapshotName}`, { timeout: 5000 });

          // 2. Clone from snapshot
          const destDataset = `${this.zfsDataset}/${destination}`;
          cloneCmd = `sudo zfs clone ${snapshotName} ${destDataset}`;
          break;

        case 'btrfs':
          // Instant btrfs snapshot
          cloneCmd = `sudo btrfs subvolume snapshot ${sourcePath} ${destPath}`;
          break;

        case 'rsync':
          // rsync with hardlinks (pseudo-CoW)
          cloneCmd = `sudo mkdir -p ${destPath} && sudo rsync -a --link-dest=${sourcePath} ${sourcePath}/ ${destPath}/`;
          break;

        case 'cp':
          // cp with hardlinks fallback
          cloneCmd = `sudo cp -al ${sourcePath} ${destPath}`;
          break;

        default:
          throw new Error(`Unknown CoW method: ${this.cowMethod}`);
      }

      await execAsync(cloneCmd, { timeout: 30000 });

      const cloneTime = Date.now() - cloneStart;

      // Store container info
      const sourceInfo = this.activeContainers.get(source);
      this.activeContainers.set(destination, {
        name: destination,
        distro: sourceInfo?.distro || 'unknown',
        release: sourceInfo?.release || 'unknown',
        status: 'Stopped',
        created: new Date().toISOString(),
        clonedFrom: source,
        path: destPath
      });

      return {
        success: true,
        operation: 'clone',
        source,
        destination,
        cloneTimeMs: cloneTime,
        method: this.cowMethod,
        status: 'Stopped',
        output: `Cloned ${source} to ${destination} in ${cloneTime}ms using ${this.cowMethod}`
      };
    } catch (error) {
      throw new Error(`Clone failed: ${error.message}`);
    }
  }

  /**
   * Register base container
   */
  async registerBaseImage(params) {
    const { name, distro = 'ubuntu', release = '22.04' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Check if container exists
    const containerPath = this.path.join(this.machinesDir, name);
    if (!this.fs.existsSync(containerPath)) {
      // Create it
      await this.createContainer({ name, distro, release });
    }

    // Register it
    this.baseImageRegistry.set(name, {
      name,
      distro,
      release,
      registered: new Date().toISOString()
    });

    return {
      success: true,
      operation: 'register_base',
      baseName: name,
      distro,
      release,
      output: `Base image ${name} registered (${distro} ${release})`
    };
  }

  /**
   * Clone from base
   */
  async cloneFromBase(params) {
    const { base, name } = params;

    if (!base || !name) {
      throw new Error('Missing required parameters: base and name');
    }

    const baseInfo = this.baseImageRegistry.get(base);
    if (!baseInfo) {
      throw new Error(`Base image not found: ${base}. Register it first with register_base.`);
    }

    return await this.cloneContainer({ source: base, destination: name });
  }

  /**
   * List base images
   */
  async listBaseImages() {
    const bases = Array.from(this.baseImageRegistry.values());

    return {
      success: true,
      operation: 'list_bases',
      bases,
      count: bases.length,
      output: `Found ${bases.length} base images`
    };
  }

  /**
   * Main command handler
   */
  async handleAddressCommand(command, context = {}) {
    try {
      const parts = command.trim().split(/\s+/);
      const operation = parts[0].toLowerCase();

      // Parse key=value parameters
      const params = {};
      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          params[key.toLowerCase()] = value;
        }
      }

      switch (operation) {
        case 'create':
          return await this.createContainer(params);
        case 'start':
          return await this.startContainer(params);
        case 'stop':
          return await this.stopContainer(params);
        case 'delete':
        case 'remove':
          return await this.deleteContainer(params);
        case 'execute':
        case 'exec':
          return await this.executeInContainer(params);
        case 'clone':
        case 'copy':
          return await this.cloneContainer(params);
        case 'register_base':
          return await this.registerBaseImage(params);
        case 'clone_from_base':
          return await this.cloneFromBase(params);
        case 'list_bases':
          return await this.listBaseImages();
        case 'list':
          const containers = await this.listContainers();
          return {
            success: true,
            operation: 'list',
            containers,
            count: containers.length,
            output: `Found ${containers.length} containers`
          };
        case 'status':
          return {
            success: true,
            operation: 'status',
            runtime: this.runtime,
            cowMethod: this.cowMethod,
            activeContainers: this.activeContainers.size,
            maxContainers: this.maxContainers,
            output: `nspawn handler active (CoW: ${this.cowMethod}), ${this.activeContainers.size} tracked containers`
          };
        default:
          throw new Error(`Unknown command: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        operation: 'error',
        error: error.message,
        output: error.message
      };
    }
  }
}

// RexxJS detection metadata
function NSPAWN_ADDRESS_META() {
  return {
    type: 'address',
    name: 'NSPAWN',
    version: '1.0.0',
    description: 'systemd-nspawn lightweight containers with CoW cloning',
    methods: {
      handlerFunction: 'ADDRESS_NSPAWN_HANDLER',
      methodsObject: 'ADDRESS_NSPAWN_METHODS'
    },
    capabilities: {
      cow_cloning: true,
      btrfs_snapshots: 'detected',
      rsync_hardlinks: true,
      builtin: true // Part of systemd
    },
    requirements: {
      systemd: 'required'
    }
  };
}

// Create singleton handler instance
const nspawnHandlerInstance = new AddressNspawnHandler();

// Main ADDRESS handler function
async function ADDRESS_NSPAWN_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize if needed
  if (!nspawnHandlerInstance.initialized) {
    await nspawnHandlerInstance.initialize();
  }

  // Handle as string command
  if (typeof commandOrMethod === 'string') {
    return await nspawnHandlerInstance.handleAddressCommand(commandOrMethod, sourceContext || {});
  }

  // Handle as method call
  if (typeof commandOrMethod === 'object' && commandOrMethod.method) {
    const { method, ...methodParams } = commandOrMethod;
    const command = `${method} ${Object.entries(methodParams).map(([k, v]) => `${k}=${v}`).join(' ')}`;
    return await nspawnHandlerInstance.handleAddressCommand(command, sourceContext || {});
  }

  throw new Error('Invalid NSPAWN command format');
}

// Methods documentation
const ADDRESS_NSPAWN_METHODS = {
  'status': 'Get nspawn handler status and CoW method',
  'list': 'List all containers',
  'create': 'Create container [distro=ubuntu] [release=22.04]',
  'start': 'Start container',
  'stop': 'Stop container',
  'delete': 'Delete container',
  'remove': 'Delete container (alias)',
  'execute': 'Execute command in container',
  'exec': 'Execute command in container (alias)',
  'clone': 'Clone container [source] [destination]',
  'copy': 'Clone container (alias)',
  'register_base': 'Register container as base image [distro=ubuntu] [release=22.04]',
  'clone_from_base': 'Clone from registered base image [base] [name]',
  'list_bases': 'List registered base images'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    NSPAWN_ADDRESS_META,
    ADDRESS_NSPAWN_HANDLER,
    ADDRESS_NSPAWN_METHODS,
    AddressNspawnHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.NSPAWN_ADDRESS_META = NSPAWN_ADDRESS_META;
  window.ADDRESS_NSPAWN_HANDLER = ADDRESS_NSPAWN_HANDLER;
  window.ADDRESS_NSPAWN_METHODS = ADDRESS_NSPAWN_METHODS;
}
