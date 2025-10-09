/*!
 * rexxjs/address-lxd v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=LXD_ADDRESS_META
 */
/**
 * ADDRESS LXD Handler - FIXED VERSION
 *
 * Key fix: Uses lxc init + poll + lxc start instead of lxc launch
 * This avoids the cloud-init hang that was crashing Claude Code
 */

// Will be loaded in initialize()
let execAsync = null;

class AddressLxdHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 0;
    this.defaultTimeout = 60000;
    this.maxContainers = 100;
    this.securityMode = 'moderate';
    this.runtime = 'lxd';
    this.baseImageRegistry = new Map();
    this.rexxBinaryPath = '/home/paul/scm/RexxJS/bin/rexx';
    this.initialized = false;

    // Pre-load Node.js modules
    this.spawn = null;
    this.exec = null;
  }

  async initialize(config = {}) {
    if (this.initialized) return;

    // Load Node.js modules once
    const { exec, spawn } = require('child_process');
    const { promisify } = require('util');

    this.exec = exec;
    this.spawn = spawn;

    // Set global execAsync for execLxc method
    execAsync = promisify(exec);

    this.initialized = true;
  }

  /**
   * Execute LXC command safely (returns immediately, doesn't wait for cloud-init)
   */
  async execLxc(args, options = {}) {
    const timeout = options.timeout || 10000; // Short timeout for actual command
    const cmd = `sudo lxc ${args.join(' ')}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout,
        maxBuffer: 10 * 1024 * 1024
      });
      return { exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      // Timeout is OK for init commands - container is still created
      if (error.killed && error.signal === 'SIGTERM') {
        return { exitCode: 124, stdout: '', stderr: 'Command timed out (container may still be created)' };
      }
      return { exitCode: error.code || 1, stdout: '', stderr: error.message };
    }
  }

  /**
   * List containers using fast JSON API
   */
  async listContainers() {
    const result = await this.execLxc(['list', '--format=json']);
    if (result.exitCode === 0) {
      return JSON.parse(result.stdout || '[]');
    }
    return [];
  }

  /**
   * Wait for container to reach desired state by polling lxc list
   */
  async waitForContainerState(name, desiredState = 'Running', maxWaitMs = 60000) {
    const startTime = Date.now();
    const pollInterval = 1000; // Check every second

    while (Date.now() - startTime < maxWaitMs) {
      const containers = await this.listContainers();
      const container = containers.find(c => c.name === name);

      if (container && container.status === desiredState) {
        return { success: true, state: container.status, container };
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: `Timeout waiting for ${name} to reach ${desiredState}` };
  }

  /**
   * Create container using init (fast, doesn't wait for cloud-init)
   */
  async createContainer(params) {
    const { image = 'ubuntu:22.04', name, storage = 'zfs-pool' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Check if container already exists
    const containers = await this.listContainers();
    if (containers.find(c => c.name === name)) {
      throw new Error(`Container ${name} already exists`);
    }

    // Run lxc init in background (it hangs waiting for cloud-init)
    // We don't wait for it - we poll for the container to appear
    const initProcess = this.spawn('sudo', ['lxc', 'init', image, name, '--storage', storage], {
      detached: true,
      stdio: 'ignore'
    });
    initProcess.unref(); // Don't wait for it

    // Poll for container to be created
    const maxWait = 60000; // 60 seconds
    const pollInterval = 1000; // Check every second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const checkContainers = await this.listContainers();
      const created = checkContainers.find(c => c.name === name);

      if (created) {
        // Container found!
        break;
      }
    }

    // Final check
    const finalContainers = await this.listContainers();
    const created = finalContainers.find(c => c.name === name);

    if (!created) {
      throw new Error(`Container ${name} was not created after ${maxWait}ms`);
    }

    // Store container info
    const containerInfo = {
      name,
      image,
      status: 'Stopped',
      created: new Date().toISOString()
    };

    this.activeContainers.set(name, containerInfo);

    return {
      success: true,
      operation: 'create',
      container: name,
      image,
      status: 'Stopped',
      output: `Container ${name} created from ${image}`
    };
  }

  /**
   * Start container
   */
  async startContainer(params) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Run lxc start in background (also hangs waiting for cloud-init)
    const startProcess = this.spawn('sudo', ['lxc', 'start', name], {
      detached: true,
      stdio: 'ignore'
    });
    startProcess.unref(); // Don't wait for it

    // TODO: Container starts sometimes timeout waiting for cloud-init to complete
    // This is especially true for fresh containers. Consider:
    // 1. Increasing timeout beyond 60s
    // 2. Using lxc config to disable cloud-init for template containers
    // 3. Pre-warming base images before registration
    // 4. Adding a force_start option that doesn't wait for Running state

    // Wait for Running state by polling
    const waitResult = await this.waitForContainerState(name, 'Running', 60000);

    if (!waitResult.success) {
      throw new Error(waitResult.error);
    }

    // Update internal state
    const containerInfo = this.activeContainers.get(name) || { name, image: 'unknown' };
    containerInfo.status = 'Running';
    containerInfo.started = new Date().toISOString();
    this.activeContainers.set(name, containerInfo);

    return {
      success: true,
      operation: 'start',
      container: name,
      status: 'Running',
      output: `Container ${name} started successfully`
    };
  }

  /**
   * Stop container
   */
  async stopContainer(params) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    await this.execLxc(['stop', name, '--force'], { timeout: 10000 });

    // Wait for Stopped state
    await this.waitForContainerState(name, 'Stopped', 30000);

    // Update internal state
    const containerInfo = this.activeContainers.get(name);
    if (containerInfo) {
      containerInfo.status = 'Stopped';
    }

    return {
      success: true,
      operation: 'stop',
      container: name,
      status: 'Stopped',
      output: `Container ${name} stopped successfully`
    };
  }

  /**
   * Delete container
   */
  async deleteContainer(params) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    await this.execLxc(['delete', name, '--force'], { timeout: 10000 });

    this.activeContainers.delete(name);

    return {
      success: true,
      operation: 'delete',
      container: name,
      output: `Container ${name} deleted successfully`
    };
  }

  /**
   * Execute command in container
   */
  async executeInContainer(params) {
    const { name, command } = params;

    if (!name || !command) {
      throw new Error('Missing required parameters: name and command');
    }

    const result = await this.execLxc(['exec', name, '--', 'bash', '-c', command], { timeout: 60000 });

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
   * Copy container (instant CoW clone!)
   */
  async copyContainer(params) {
    const { source, destination } = params;

    if (!source || !destination) {
      throw new Error('Missing required parameters: source and destination');
    }

    const copyStart = Date.now();

    // LXD copy is instant (uses ZFS/BTRFS CoW under the hood)
    await this.execLxc(['copy', source, destination], { timeout: 15000 });

    const copyTime = Date.now() - copyStart;

    // Wait for new container to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    const containers = await this.listContainers();
    const newContainer = containers.find(c => c.name === destination);

    if (!newContainer) {
      throw new Error(`Failed to create copy ${destination}`);
    }

    // Store container info
    const sourceInfo = this.activeContainers.get(source);
    this.activeContainers.set(destination, {
      name: destination,
      image: sourceInfo?.image || 'unknown',
      status: 'Stopped',
      created: new Date().toISOString(),
      clonedFrom: source
    });

    return {
      success: true,
      operation: 'copy',
      source,
      destination,
      copyTimeMs: copyTime,
      status: 'Stopped',
      output: `Container ${source} copied to ${destination} in ${copyTime}ms`
    };
  }

  /**
   * Register base image
   */
  async registerBaseImage(params) {
    const { name, image = 'ubuntu:22.04', memory = '2GB', cpus = '2', storage = 'zfs-pool' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Check if container already exists
    const containers = await this.listContainers();
    const existing = containers.find(c => c.name === name);

    if (!existing) {
      // Create the base container on ZFS storage
      await this.createContainer({ image, name, storage });
    }

    // Start it to let it initialize
    await this.startContainer({ name });

    // Wait a bit for cloud-init
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop it for use as a template
    await this.stopContainer({ name });

    // Register it
    this.baseImageRegistry.set(name, {
      name,
      image,
      memory,
      cpus,
      registered: new Date().toISOString()
    });

    return {
      success: true,
      operation: 'register_base',
      baseName: name,
      image,
      output: `Base image ${name} registered (from ${image})`
    };
  }

  /**
   * Clone from base (instant!)
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

    return await this.copyContainer({ source: base, destination: name });
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
        case 'copy':
        case 'clone':
          return await this.copyContainer(params);
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
            activeContainers: this.activeContainers.size,
            maxContainers: this.maxContainers,
            output: `LXD handler active with ${this.activeContainers.size} tracked containers`
          };
        default:
          throw new Error(`Unknown LXD command: ${operation}`);
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
function LXD_ADDRESS_META() {
  return {
    type: 'address',
    name: 'LXD',
    version: '1.0.0',
    description: 'LXD system container operations with ZFS CoW cloning',
    methods: {
      handlerFunction: 'ADDRESS_LXD_HANDLER',
      methodsObject: 'ADDRESS_LXD_METHODS'
    },
    capabilities: {
      cow_cloning: true,
      zfs_backend: true,
      instant_snapshots: true
    },
    requirements: {
      lxd: 'required',
      zfs: 'recommended for CoW'
    }
  };
}

// Create singleton handler instance
const lxdHandlerInstance = new AddressLxdHandler();

// Main ADDRESS handler function
async function ADDRESS_LXD_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize if needed
  if (!lxdHandlerInstance.initialized) {
    await lxdHandlerInstance.initialize();
  }

  // Handle as string command
  if (typeof commandOrMethod === 'string') {
    return await lxdHandlerInstance.handleAddressCommand(commandOrMethod, sourceContext || {});
  }

  // Handle as method call
  if (typeof commandOrMethod === 'object' && commandOrMethod.method) {
    const { method, ...methodParams } = commandOrMethod;
    const command = `${method} ${Object.entries(methodParams).map(([k, v]) => `${k}=${v}`).join(' ')}`;
    return await lxdHandlerInstance.handleAddressCommand(command, sourceContext || {});
  }

  throw new Error('Invalid LXD command format');
}

// Methods documentation
const ADDRESS_LXD_METHODS = {
  'status': 'Get LXD handler status',
  'list': 'List all containers',
  'create': 'Create container [image=ubuntu:22.04] [storage=zfs-pool]',
  'start': 'Start container',
  'stop': 'Stop container',
  'delete': 'Delete container',
  'remove': 'Delete container (alias)',
  'execute': 'Execute command in container',
  'exec': 'Execute command in container (alias)',
  'copy': 'Copy/clone container [source] [destination]',
  'clone': 'Copy/clone container (alias)',
  'register_base': 'Register container as base image [image=ubuntu:22.04] [memory=2GB] [cpus=2] [storage=zfs-pool]',
  'clone_from_base': 'Clone from registered base image [base] [name]',
  'list_bases': 'List registered base images'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    LXD_ADDRESS_META,
    ADDRESS_LXD_HANDLER,
    ADDRESS_LXD_METHODS,
    AddressLxdHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.LXD_ADDRESS_META = LXD_ADDRESS_META;
  window.ADDRESS_LXD_HANDLER = ADDRESS_LXD_HANDLER;
  window.ADDRESS_LXD_METHODS = ADDRESS_LXD_METHODS;
}
