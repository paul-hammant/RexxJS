/*!
 * rexxjs/address-virtualbox v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=VIRTUALBOX_ADDRESS_META
 */
/**
 * ADDRESS VIRTUALBOX Handler
 * Provides explicit ADDRESS VIRTUALBOX integration for virtual machine operations
 *
 * Usage:
 *   REQUIRE "rexxjs/address-virtualbox" AS VBOX
 *   ADDRESS VIRTUALBOX
 *   "create image=MyTemplate name=test-vm memory=2048 cpus=2"
 *   "status"
 *   "list"
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Modules will be loaded dynamically in initialize method

class AddressVirtualBoxHandler {
  constructor() {
    this.activeVMs = new Map();
    this.vmCounter = 0;
    this.defaultTimeout = 120000; // VMs need more time than containers
    this.maxVMs = 10;
    this.securityMode = 'moderate';
    this.allowedTemplates = new Set(['Ubuntu', 'Debian', 'Alpine']);
    this.trustedBinaries = new Set();
    this.runtime = 'virtualbox';
    this.initialized = false;

    // Base image registry for CoW cloning
    this.baseImages = new Map(); // baseName -> { vm: vmName, created: timestamp }

    // Enhanced security settings
    this.securityPolicies = {
      allowPrivileged: false,
      allowHostNetwork: false,
      allowHostPid: false,
      maxMemory: '8192', // MB
      maxCpus: '8',
      allowedDiskPaths: new Set(['/tmp', '/var/tmp', '/home/paul/vm-disks']),
      bannedCommands: new Set(['rm -rf /', 'dd if=/dev/zero', 'fork()', ':(){ :|:& };:'])
    };
    this.auditLog = [];

    // VM process management
    this.processMonitor = {
      enabled: true,
      checkInterval: 60000, // 60 seconds for VMs
      healthChecks: new Map(),
      processStats: new Map()
    };
    this.monitoringTimer = null;

    // Enhanced CHECKPOINT progress monitoring
    this.checkpointMonitor = {
      enabled: true,
      activeStreams: new Map(), // vm -> stream info
      callbacks: new Map(),     // vm -> callback function
      realtimeData: new Map()   // vm -> latest checkpoint data
    };
  }

  /**
   * Initialize the ADDRESS VIRTUALBOX handler
   */
  async initialize(config = {}) {
    if (this.initialized) return;

    try {
      // Import Node.js modules when needed
      this.spawn = require('child_process').spawn;
      this.fs = require('fs');
      this.path = require('path');

      // Import shared utilities
      const sharedUtils = require('../_shared/provisioning-shared-utils');
      this.interpolateMessage = sharedUtils.interpolateMessage;
      this.logActivity = sharedUtils.logActivity;
      this.createLogFunction = sharedUtils.createLogFunction;
      this.parseCommandParts = sharedUtils.parseCommandParts;
      this.parseCommand = sharedUtils.parseCommand;
      this.parseMemoryLimit = sharedUtils.parseMemoryLimit;
      this.testRuntime = sharedUtils.testRuntime;
      this.validateCommand = sharedUtils.validateCommand;
      this.validateVolumePath = sharedUtils.validateVolumePath;
      this.validateBinaryPath = sharedUtils.validateBinaryPath;
      this.sharedAuditSecurityEvent = sharedUtils.auditSecurityEvent;
      this.calculateUptime = sharedUtils.calculateUptime;
      this.parseKeyValueString = sharedUtils.parseKeyValueString;
      this.sharedParseCheckpointOutput = sharedUtils.parseCheckpointOutput;
      this.sharedWrapScriptWithCheckpoints = sharedUtils.wrapScriptWithCheckpoints;
      this.sharedParseEnhancedCheckpointOutput = sharedUtils.parseEnhancedCheckpointOutput;
      this.formatStatus = sharedUtils.formatStatus;

      // Set up logger
      this.log = this.createLogFunction('ADDRESS_VIRTUALBOX');

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize VirtualBox handler: ${error.message}`);
    }

    this.securityMode = config.securityMode || this.securityMode;
    this.maxVMs = config.maxVMs || this.maxVMs;
    this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;

    if (config.allowedTemplates && Array.isArray(config.allowedTemplates)) {
      this.allowedTemplates = new Set(config.allowedTemplates);
    }

    if (config.trustedBinaries && Array.isArray(config.trustedBinaries)) {
      this.trustedBinaries = new Set(config.trustedBinaries);
    }

    // Detect runtime availability
    await this.detectRuntime();

    this.log('initialize', {
      securityMode: this.securityMode,
      maxVMs: this.maxVMs,
      runtime: this.runtime,
      allowedTemplates: Array.from(this.allowedTemplates)
    });
  }

  /**
   * Detect if VirtualBox runtime is available
   */
  async detectRuntime() {
    try {
      await this.testRuntime('VBoxManage');
      this.runtime = 'virtualbox';
      return;
    } catch (error) {
      throw new Error('VirtualBox runtime not found or not available');
    }
  }


  /**
   * Main handler for ADDRESS VIRTUALBOX commands
   */
  async handleAddressCommand(command, context = {}) {
    try {
      const interpolatedCommand = await this.interpolateMessage(command, context);
      this.log('command', { command: interpolatedCommand });

      const parsed = this.parseCommand(interpolatedCommand);

      switch (parsed.operation) {
        case 'status':
          return await this.getStatus();
        case 'list':
          return await this.listVMs();
        case 'create':
          return await this.createVM(parsed.params, context);
        case 'start':
          return await this.startVM(parsed.params, context);
        case 'stop':
          return await this.stopVM(parsed.params, context);
        case 'start_if_stopped':
          return await this.startIfStopped(parsed.params, context);
        case 'stop_if_running':
          return await this.stopIfRunning(parsed.params, context);
        case 'restart':
          return await this.restartVM(parsed.params, context);
        case 'pause':
          return await this.pauseVM(parsed.params, context);
        case 'resume':
          return await this.resumeVM(parsed.params, context);
        case 'save_state':
          return await this.saveStateVM(parsed.params, context);
        case 'restore_state':
          return await this.restoreStateVM(parsed.params, context);
        case 'remove':
          return await this.removeVM(parsed.params, context);
        case 'copy_to':
          return await this.handleCopyTo(parsed.params, context);
        case 'copy_from':
          return await this.handleCopyFrom(parsed.params, context);
        case 'logs':
          return await this.handleLogs(parsed.params, context);
        case 'cleanup':
          return await this.handleCleanup(parsed.params, context);
        case 'security_audit':
          return this.getSecurityAuditLog();
        case 'process_stats':
          return this.getProcessStatistics();
        case 'configure_health_check':
          return this.configureHealthCheck(parsed.params);
        case 'start_monitoring':
          this.startProcessMonitoring();
          return { success: true, operation: 'start_monitoring', enabled: true };
        case 'stop_monitoring':
          this.stopProcessMonitoring();
          return { success: true, operation: 'stop_monitoring', enabled: false };
        case 'checkpoint_status':
          return this.getCheckpointMonitoringStatus();
        case 'deploy_rexx':
          return await this.deployRexx(parsed.params, context);
        case 'execute':
          return await this.executeInVM(parsed.params, context);
        case 'execute_rexx':
          return await this.executeRexx(parsed.params, context);
        case 'snapshot':
          return await this.handleSnapshot(parsed.params, context);
        case 'restore':
          return await this.handleRestore(parsed.params, context);
        case 'install_guest_additions':
          return await this.installGuestAdditions(parsed.params, context);
        case 'download_iso':
          return await this.downloadISO(parsed.params, context);
        case 'list_ostypes':
          return await this.listOSTypes();
        case 'setup_permissions':
          return await this.setupPermissions(parsed.params, context);
        case 'verify_host':
          return await this.verifyHost();
        case 'configure_network':
          return await this.configureNetwork(parsed.params, context);
        case 'attach_iso':
          return await this.attachISO(parsed.params, context);
        case 'detach_iso':
          return await this.detachISO(parsed.params, context);
        case 'register_base':
          return await this.registerBase(parsed.params, context);
        case 'clone':
        case 'copy':
          return await this.cloneVM(parsed.params, context);
        case 'clone_from_base':
          return await this.cloneFromBase(parsed.params, context);
        case 'list_bases':
          return await this.listBases();
        default:
          throw new Error(`Unknown ADDRESS VIRTUALBOX command: ${parsed.operation}`);
      }
    } catch (error) {
      this.log('error', { error: error.message, command });
      return {
        success: false,
        operation: 'error',
        error: error.message,
        output: error.message
      };
    }
  }

  /**
   * Get handler status
   */
  async getStatus() {
    const vmCount = this.activeVMs.size;

    return {
      success: true,
      operation: 'status',
      runtime: this.runtime,
      activeVMs: vmCount,
      maxVMs: this.maxVMs,
      securityMode: this.securityMode,
      output: this.formatStatus(this.runtime, vmCount, this.maxVMs, this.securityMode)
    };
  }

  /**
   * List virtual machines
   */
  async listVMs() {
    const vms = Array.from(this.activeVMs.entries()).map(([name, info]) => ({
      name,
      template: info.template,
      status: info.status,
      created: info.created,
      memory: info.memory,
      cpus: info.cpus,
      osType: info.osType,
      rexxDeployed: info.rexxDeployed || false
    }));

    return {
      success: true,
      operation: 'list',
      vms,
      count: vms.length,
      output: `Found ${vms.length} virtual machines`
    };
  }

  /**
   * Create a new virtual machine
   */
  async createVM(params, context) {
    const { template, name, memory = '2048', cpus = '2', ostype = 'Ubuntu_64' } = params;

    if (!template) {
      throw new Error('Missing required parameter: template');
    }

    // Validate template
    if (this.securityMode === 'strict' && !this.allowedTemplates.has(template)) {
      throw new Error(`Template not allowed in strict mode: ${template}`);
    }

    // Check VM limits
    if (this.activeVMs.size >= this.maxVMs) {
      throw new Error(`Maximum VMs reached: ${this.maxVMs}`);
    }

    // Enhanced security validation
    const securityViolations = this.validateVMSecurity(params);
    if (securityViolations.length > 0) {
      this.auditSecurityEvent('security_violation', { violations: securityViolations, operation: 'create' });
      throw new Error(`Security violations: ${securityViolations.join('; ')}`);
    }

    const vmName = (name && name.trim()) || `vbox-vm-${++this.vmCounter}`;

    // Check for name conflicts
    if (name && name.trim() && this.activeVMs.has(name.trim())) {
      throw new Error(`VM name already exists: ${name.trim()}`);
    }

    // Create VirtualBox VM
    const createArgs = [
      'createvm',
      '--name', vmName,
      '--ostype', ostype,
      '--register'
    ];

    this.log('vbox_create_start', { vmName, template, args: createArgs });
    const createResult = await this.execVBoxCommand(createArgs);
    this.log('vbox_create_result', { exitCode: createResult.exitCode, stdout: createResult.stdout, stderr: createResult.stderr });

    if (createResult.exitCode !== 0) {
      throw new Error(`Failed to create VM: ${createResult.stderr}`);
    }

    try {
      // Configure VM memory and CPUs
      await this.execVBoxCommand(['modifyvm', vmName, '--memory', memory]);
      await this.execVBoxCommand(['modifyvm', vmName, '--cpus', cpus]);

      // Configure basic settings
      await this.execVBoxCommand(['modifyvm', vmName, '--ioapic', 'on']);
      await this.execVBoxCommand(['modifyvm', vmName, '--boot1', 'dvd', '--boot2', 'disk', '--boot3', 'none', '--boot4', 'none']);
      await this.execVBoxCommand(['modifyvm', vmName, '--nic1', 'nat']);

      const vmInfo = {
        name: vmName,
        template,
        status: 'created',
        created: new Date().toISOString(),
        runtime: this.runtime,
        memory: memory,
        cpus: cpus,
        osType: ostype
      };

      this.activeVMs.set(vmName, vmInfo);

      this.log('vm_created', { name: vmName, template });

      return {
        success: true,
        operation: 'create',
        vm: vmName,
        template,
        status: 'created',
        memory: vmInfo.memory,
        cpus: vmInfo.cpus,
        osType: vmInfo.osType,
        output: `VM ${vmName} created successfully`
      };
    } catch (error) {
      // Cleanup on failure
      try {
        await this.execVBoxCommand(['unregistervm', vmName, '--delete']);
      } catch (cleanupError) {
        this.log('cleanup_failed', { vm: vmName, error: cleanupError.message });
      }
      throw new Error(`Failed to configure VM: ${error.message}`);
    }
  }

  /**
   * Start a virtual machine
   */
  async startVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }
    if (vm.status === 'running') {
      throw new Error(`VM ${name} is already running`);
    }

    // Start VirtualBox VM
    const result = await this.execVBoxCommand(['startvm', name, '--type', 'headless']);

    if (result.exitCode === 0) {
      // Update VM status
      vm.status = 'running';
      vm.started = new Date().toISOString();

      this.log('vm_started', { name });

      return {
        success: true,
        operation: 'start',
        vm: name,
        status: 'running',
        output: `VM ${name} started successfully`
      };
    } else {
      throw new Error(`Failed to start VM: ${result.stderr}`);
    }
  }

  /**
   * Stop a virtual machine
   */
  async stopVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }
    if (vm.status !== 'running') {
      throw new Error(`VM ${name} is not running`);
    }

    const result = await this.execVBoxCommand(['controlvm', name, 'poweroff']);

    if (result.exitCode === 0) {
      vm.status = 'stopped';
      vm.stopped = new Date().toISOString();

      this.log('vm_stopped', { name });

      return {
        success: true,
        operation: 'stop',
        vm: name,
        status: 'stopped',
        output: `VM ${name} stopped successfully`
      };
    } else {
        throw new Error(`Failed to stop VM: ${result.stderr}`);
    }
  }

  async startIfStopped(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status === 'running') {
      return {
        success: true,
        operation: 'start_if_stopped',
        vm: name,
        status: 'running',
        skipped: true,
        output: `VM ${name} is already running`
      };
    }

    const result = await this.execVBoxCommand(['startvm', name, '--type', 'headless']);

    if (result.exitCode === 0) {
      vm.status = 'running';
      vm.started = new Date().toISOString();

      this.log('vm_started', { name });

      return {
        success: true,
        operation: 'start_if_stopped',
        vm: name,
        status: 'running',
        output: `VM ${name} started successfully`
      };
    } else {
      throw new Error(`Failed to start VM: ${result.stderr}`);
    }
  }

  async stopIfRunning(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      return {
        success: true,
        operation: 'stop_if_running',
        vm: name,
        status: vm.status,
        skipped: true,
        output: `VM ${name} is not running (status: ${vm.status})`
      };
    }

    const result = await this.execVBoxCommand(['controlvm', name, 'poweroff']);

    if (result.exitCode === 0) {
      vm.status = 'stopped';
      vm.stopped = new Date().toISOString();

      this.log('vm_stopped', { name });

      return {
        success: true,
        operation: 'stop_if_running',
        vm: name,
        status: 'stopped',
        output: `VM ${name} stopped successfully`
      };
    } else {
      throw new Error(`Failed to stop VM: ${result.stderr}`);
    }
  }

  async restartVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status === 'running') {
      await this.stopVM({ name }, context);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.startVM({ name }, context);

    return {
      success: true,
      operation: 'restart',
      vm: name,
      status: 'running',
      output: `VM ${name} restarted successfully`
    };
  }

  async pauseVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} is not running (status: ${vm.status})`);
    }

    const result = await this.execVBoxCommand(['controlvm', name, 'pause']);

    if (result.exitCode === 0) {
      vm.status = 'paused';
      vm.paused = new Date().toISOString();

      this.log('vm_paused', { name });

      return {
        success: true,
        operation: 'pause',
        vm: name,
        status: 'paused',
        output: `VM ${name} paused successfully`
      };
    } else {
      throw new Error(`Failed to pause VM: ${result.stderr}`);
    }
  }

  async resumeVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'paused') {
      throw new Error(`VM ${name} is not paused (status: ${vm.status})`);
    }

    const result = await this.execVBoxCommand(['controlvm', name, 'resume']);

    if (result.exitCode === 0) {
      vm.status = 'running';
      vm.resumed = new Date().toISOString();

      this.log('vm_resumed', { name });

      return {
        success: true,
        operation: 'resume',
        vm: name,
        status: 'running',
        output: `VM ${name} resumed successfully`
      };
    } else {
      throw new Error(`Failed to resume VM: ${result.stderr}`);
    }
  }

  async saveStateVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} is not running (status: ${vm.status})`);
    }

    const result = await this.execVBoxCommand(['controlvm', name, 'savestate']);

    if (result.exitCode === 0) {
      vm.status = 'saved';
      vm.saved = new Date().toISOString();

      this.log('vm_saved', { name });

      return {
        success: true,
        operation: 'save_state',
        vm: name,
        status: 'saved',
        output: `VM ${name} state saved successfully`
      };
    } else {
      throw new Error(`Failed to save VM state: ${result.stderr}`);
    }
  }

  async restoreStateVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'saved') {
      throw new Error(`VM ${name} does not have a saved state (status: ${vm.status})`);
    }

    const result = await this.execVBoxCommand(['startvm', name, '--type', 'headless']);

    if (result.exitCode === 0) {
      vm.status = 'running';
      vm.restored = new Date().toISOString();

      this.log('vm_restored', { name });

      return {
        success: true,
        operation: 'restore_state',
        vm: name,
        status: 'running',
        output: `VM ${name} state restored successfully`
      };
    } else {
      throw new Error(`Failed to restore VM state: ${result.stderr}`);
    }
  }

  /**
   * Remove a virtual machine
   */
  async removeVM(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    if (!this.activeVMs.has(name)) {
      throw new Error(`VM not found: ${name}`);
    }

    const vm = this.activeVMs.get(name);

    // Stop VM if running
    if (vm.status === 'running') {
      await this.execVBoxCommand(['controlvm', name, 'poweroff']);
      // Wait a moment for clean shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const result = await this.execVBoxCommand(['unregistervm', name, '--delete']);

    if (result.exitCode === 0) {
        this.activeVMs.delete(name);

        this.log('vm_removed', { name });

        return {
          success: true,
          operation: 'remove',
          vm: name,
          output: `VM ${name} removed successfully`
        };
    } else {
        throw new Error(`Failed to remove VM: ${result.stderr}`);
    }
  }

  /**
   * Register a VM as a base image for CoW cloning
   */
  async registerBase(params, context) {
    const { name, vm } = params;

    if (!name) {
      throw new Error('Missing required parameter: name (base image name)');
    }

    // If vm parameter provided, use it; otherwise use name as both base name and VM name
    const vmName = vm || name;

    if (!this.activeVMs.has(vmName)) {
      throw new Error(`VM not found: ${vmName}`);
    }

    const vmInfo = this.activeVMs.get(vmName);

    // Ensure VM is stopped before registering as base
    if (vmInfo.status === 'running') {
      throw new Error(`VM ${vmName} must be stopped before registering as base image`);
    }

    // Register as base image
    this.baseImages.set(name, {
      vm: vmName,
      created: new Date().toISOString(),
      template: vmInfo.template,
      memory: vmInfo.memory,
      cpus: vmInfo.cpus,
      osType: vmInfo.osType
    });

    this.log('base_registered', { baseName: name, vm: vmName });

    return {
      success: true,
      operation: 'register_base',
      baseName: name,
      vm: vmName,
      output: `VM ${vmName} registered as base image: ${name}`
    };
  }

  /**
   * Clone a VM using VirtualBox linked clones (CoW)
   */
  async cloneVM(params, context) {
    const { source, name } = params;

    if (!source || !name) {
      throw new Error('Missing required parameters: source and name');
    }

    if (!this.activeVMs.has(source)) {
      throw new Error(`Source VM not found: ${source}`);
    }

    if (this.activeVMs.has(name)) {
      throw new Error(`VM name already exists: ${name}`);
    }

    // Check VM limits
    if (this.activeVMs.size >= this.maxVMs) {
      throw new Error(`Maximum VMs reached: ${this.maxVMs}`);
    }

    const sourceVM = this.activeVMs.get(source);

    // Ensure source is stopped
    if (sourceVM.status === 'running') {
      throw new Error(`Source VM ${source} must be stopped before cloning`);
    }

    const startTime = Date.now();

    try {
      // Use VirtualBox linked clone (CoW with differencing disks)
      const cloneArgs = [
        'clonevm', source,
        '--name', name,
        '--mode', 'link',  // This creates a linked clone with differencing disks (CoW)
        '--register'
      ];

      this.log('clone_start', { source, name, method: 'linked-clone' });
      const result = await this.execVBoxCommand(cloneArgs);

      if (result.exitCode !== 0) {
        throw new Error(`Clone failed: ${result.stderr}`);
      }

      const cloneTimeMs = Date.now() - startTime;

      // Register the cloned VM
      const cloneInfo = {
        name: name,
        template: sourceVM.template,
        status: 'created',
        created: new Date().toISOString(),
        runtime: this.runtime,
        memory: sourceVM.memory,
        cpus: sourceVM.cpus,
        osType: sourceVM.osType,
        clonedFrom: source,
        cloneMethod: 'linked-clone'
      };

      this.activeVMs.set(name, cloneInfo);

      this.log('clone_completed', {
        source,
        name,
        cloneTimeMs,
        method: 'linked-clone'
      });

      return {
        success: true,
        operation: 'clone',
        source: source,
        name: name,
        cloneTimeMs: cloneTimeMs,
        method: 'linked-clone',
        output: `VM ${name} cloned from ${source} in ${cloneTimeMs}ms using linked clone`
      };
    } catch (error) {
      throw new Error(`Failed to clone VM: ${error.message}`);
    }
  }

  /**
   * Clone from registered base image
   */
  async cloneFromBase(params, context) {
    const { base, name } = params;

    if (!base || !name) {
      throw new Error('Missing required parameters: base and name');
    }

    const baseImage = this.baseImages.get(base);
    if (!baseImage) {
      throw new Error(`Base image not found: ${base}. Use register_base first.`);
    }

    // Clone from the base VM
    return await this.cloneVM({ source: baseImage.vm, name }, context);
  }

  /**
   * List registered base images
   */
  async listBases() {
    const bases = Array.from(this.baseImages.entries()).map(([name, info]) => ({
      name,
      vm: info.vm,
      created: info.created,
      template: info.template,
      memory: info.memory,
      cpus: info.cpus,
      osType: info.osType
    }));

    return {
      success: true,
      operation: 'list_bases',
      bases,
      count: bases.length,
      output: `Found ${bases.length} registered base images`
    };
  }

  /**
   * Create VM snapshot
   */
  async handleSnapshot(params, context) {
    const { name, snapshot_name } = params;

    if (!name || !snapshot_name) {
      throw new Error('Missing required parameters: name and snapshot_name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    // Create snapshot
    const result = await this.execVBoxCommand([
      'snapshot', name, 'take', snapshot_name
    ]);

    if (result.exitCode === 0) {
      this.log('snapshot_created', { vm: name, snapshot: snapshot_name });

      return {
        success: true,
        operation: 'snapshot',
        vm: name,
        snapshot: snapshot_name,
        output: `Snapshot ${snapshot_name} created for VM ${name}`
      };
    } else {
      throw new Error(`Failed to create snapshot: ${result.stderr}`);
    }
  }

  /**
   * Restore VM from snapshot
   */
  async handleRestore(params, context) {
    const { name, snapshot_name } = params;

    if (!name || !snapshot_name) {
      throw new Error('Missing required parameters: name and snapshot_name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    // Stop VM if running
    if (vm.status === 'running') {
      await this.execVBoxCommand(['controlvm', name, 'poweroff']);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Restore snapshot
    const result = await this.execVBoxCommand([
      'snapshot', name, 'restore', snapshot_name
    ]);

    if (result.exitCode === 0) {
      vm.status = 'stopped'; // VM needs to be restarted after restore

      this.log('snapshot_restored', { vm: name, snapshot: snapshot_name });

      return {
        success: true,
        operation: 'restore',
        vm: name,
        snapshot: snapshot_name,
        output: `VM ${name} restored from snapshot ${snapshot_name}`
      };
    } else {
      throw new Error(`Failed to restore snapshot: ${result.stderr}`);
    }
  }

  /**
   * Deploy RexxJS binary to a VM
   */
  async deployRexx(params, context) {
    const { vm: name, rexx_binary, target = '/usr/local/bin/rexx' } = params;

    if (!name) {
      throw new Error('Missing required parameter: vm');
    }

    if (!rexx_binary) {
      throw new Error('Missing required parameter: rexx_binary');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} must be running to deploy RexxJS binary`);
    }

    // Check if binary exists
    const interpolatedBinary = await this.interpolateMessage(rexx_binary, context);
    const interpolatedTarget = await this.interpolateMessage(target, context);

    // Security validation
    if (!this.validateBinaryPath(interpolatedBinary, this.securityMode, this.trustedBinaries, this.auditSecurityEvent.bind(this))) {
      throw new Error(`RexxJS binary path ${interpolatedBinary} not trusted by security policy`);
    }

    if (!this.fs.existsSync(interpolatedBinary)) {
      throw new Error(`RexxJS binary not found: ${interpolatedBinary}`);
    }

    try {
      // Copy binary to VM using VBoxManage guestcontrol
      await this.copyToVM(name, interpolatedBinary, interpolatedTarget);

      // Make executable
      await this.execInVMCommand(name, `chmod +x ${interpolatedTarget}`, { timeout: 5000 });

      // Test binary
      const testResult = await this.execInVMCommand(name, `${interpolatedTarget} --help`, { timeout: 10000 });

      if (testResult.exitCode !== 0) {
        throw new Error(`RexxJS binary test failed: ${testResult.stderr}`);
      }

      // Mark VM as having RexxJS deployed
      vm.rexxDeployed = true;
      vm.rexxPath = interpolatedTarget;

      this.log('binary_deployed', {
        vm: name,
        binary: interpolatedBinary,
        target: interpolatedTarget
      });

      return {
        success: true,
        operation: 'deploy_rexx',
        vm: name,
        binary: interpolatedBinary,
        target: interpolatedTarget,
        output: `RexxJS binary deployed to ${name} at ${interpolatedTarget}`
      };
    } catch (error) {
      throw new Error(`Failed to deploy RexxJS binary: ${error.message}`);
    }
  }

  /**
   * Execute command in VM
   */
  async executeInVM(params, context) {
    const { vm: name, command: cmd, timeout, working_dir } = params;

    if (!name || !cmd) {
      throw new Error('Missing required parameters: vm and command');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} must be running to execute commands`);
    }

    const interpolatedCmd = await this.interpolateMessage(cmd, context);
    const interpolatedDir = working_dir ? await this.interpolateMessage(working_dir, context) : null;

    // Security validation for command
    const commandViolations = this.validateCommand(interpolatedCmd, this.securityPolicies.bannedCommands);
    if (commandViolations.length > 0) {
      this.auditSecurityEvent('command_blocked', {
        command: interpolatedCmd,
        violations: commandViolations,
        vm: name
      });
      throw new Error(`Command blocked by security policy: ${commandViolations.join('; ')}`);
    }

    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;

    const fullCommand = interpolatedDir
      ? `cd ${interpolatedDir} && ${interpolatedCmd}`
      : interpolatedCmd;

    try {
      const result = await this.execInVMCommand(name, fullCommand, { timeout: execTimeout });

      this.log('command_executed', {
        vm: name,
        command: interpolatedCmd,
        exitCode: result.exitCode
      });

      return {
        success: result.exitCode === 0,
        operation: 'execute',
        vm: name,
        command: interpolatedCmd,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.exitCode === 0 ? result.stdout : `Command failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Execute RexxJS script in VM with CHECKPOINT support
   */
  async executeRexx(params, context) {
    const { vm: name, script, timeout, progress_callback = 'false', script_file } = params;

    if (!name || (!script && !script_file)) {
      throw new Error('Missing required parameters: vm and (script or script_file)');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} must be running to execute RexxJS scripts`);
    }

    if (!vm.rexxDeployed) {
      throw new Error(`RexxJS binary not deployed to VM ${name}. Use deploy_rexx first.`);
    }

    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;
    const enableProgressCallback = progress_callback.toString().toLowerCase() === 'true';

    let rexxScript;
    if (script_file) {
      const interpolatedFile = await this.interpolateMessage(script_file, context);
      rexxScript = this.fs.readFileSync(interpolatedFile, 'utf8');
    } else {
      rexxScript = await this.interpolateMessage(script, context);
    }

    try {
      let result;

      if (enableProgressCallback) {
        // Execute with streaming progress updates
        result = await this.executeRexxWithProgress(vm, rexxScript, {
          timeout: execTimeout,
          progressCallback: (checkpoint, params) => {
            this.log('rexx_progress', {
              vm: name,
              checkpoint: checkpoint,
              progress: params
            });
          }
        });
      } else {
        // Simple execution
        const tempScript = `/tmp/rexx_script_${Date.now()}.rexx`;
        await this.writeToVM(name, tempScript, rexxScript);

        result = await this.execInVMCommand(name, `${vm.rexxPath} ${tempScript}`, {
          timeout: execTimeout
        });

        // Cleanup temp script
        await this.execInVMCommand(name, `rm -f ${tempScript}`, { timeout: 5000 });
      }

      this.log('rexx_executed', {
        vm: name,
        exitCode: result.exitCode,
        progressEnabled: enableProgressCallback
      });

      return {
        success: result.exitCode === 0,
        operation: 'execute_rexx',
        vm: name,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.exitCode === 0 ? result.stdout : `RexxJS execution failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`RexxJS execution failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_to command
   */
  async handleCopyTo(params, context) {
    const { vm, local, remote } = params;

    if (!vm || !local || !remote) {
      throw new Error('copy_to requires vm, local, and remote parameters');
    }

    const vmInfo = this.activeVMs.get(vm);
    if (!vmInfo) {
      throw new Error(`VM not found: ${vm}`);
    }

    try {
      await this.copyToVM(vm, local, remote);

      this.log('copy_to_success', {
        vm,
        local,
        remote
      });

      return {
        success: true,
        operation: 'copy_to',
        vm,
        localPath: local,
        remotePath: remote,
        output: `Copied ${local} to ${vm}:${remote}`
      };
    } catch (error) {
      throw new Error(`Copy to VM failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_from command
   */
  async handleCopyFrom(params, context) {
    const { vm, remote, local } = params;

    if (!vm || !remote || !local) {
      throw new Error('copy_from requires vm, remote, and local parameters');
    }

    const vmInfo = this.activeVMs.get(vm);
    if (!vmInfo) {
      throw new Error(`VM not found: ${vm}`);
    }

    try {
      await this.copyFromVM(vm, remote, local);

      this.log('copy_from_success', {
        vm,
        remote,
        local
      });

      return {
        success: true,
        operation: 'copy_from',
        vm,
        remotePath: remote,
        localPath: local,
        output: `Copied ${vm}:${remote} to ${local}`
      };
    } catch (error) {
      throw new Error(`Copy from VM failed: ${error.message}`);
    }
  }

  /**
   * Handle logs command
   */
  async handleLogs(params, context) {
    const { vm, lines = '50' } = params;

    if (!vm) {
      throw new Error('logs requires vm parameter');
    }

    const vmInfo = this.activeVMs.get(vm);
    if (!vmInfo) {
      throw new Error(`VM not found: ${vm}`);
    }

    // For VMs, console logs are not as easily accessible as container logs
    return {
      success: true,
      operation: 'logs',
      vm,
      lines: parseInt(lines),
      logs: `VM ${vm} console logs not directly available`,
      output: `Console logs for VM ${vm} require guest additions and specific configuration`
    };
  }

  /**
   * Handle cleanup command
   */
  async handleCleanup(params, context) {
    const { all = 'false' } = params;

    let cleaned = 0;
    let errors = [];

    try {
      if (all === 'true') {
        // Remove all VMs
        for (const [id, vm] of this.activeVMs) {
          try {
            if (vm.status === 'running') {
              await this.execVBoxCommand(['controlvm', id, 'poweroff']);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            await this.execVBoxCommand(['unregistervm', id, '--delete']);
            this.activeVMs.delete(id);
            cleaned++;
          } catch (error) {
            this.log('cleanup_error', {
              vmId: id,
              error: error.message
            });
            errors.push(`${id}: ${error.message}`);
          }
        }
      } else {
        // Remove only stopped VMs
        for (const [id, vm] of this.activeVMs) {
          if (vm.status === 'stopped' || vm.status === 'created') {
            try {
              await this.execVBoxCommand(['unregistervm', id, '--delete']);
              this.activeVMs.delete(id);
              cleaned++;
            } catch (error) {
              this.log('cleanup_error', {
                vmId: id,
                error: error.message
              });
              errors.push(`${id}: ${error.message}`);
            }
          }
        }
      }

      this.log('cleanup_completed', {
        cleaned,
        remaining: this.activeVMs.size,
        all: all === 'true'
      });

      return {
        success: true,
        operation: 'cleanup',
        cleaned,
        remaining: this.activeVMs.size,
        all: all === 'true',
        errors: errors.length > 0 ? errors : undefined,
        output: `Cleaned up ${cleaned} VMs, ${this.activeVMs.size} remaining`
      };
    } catch (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Install Guest Additions in VM
   */
  async installGuestAdditions(params, context) {
    const { name, iso_path } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} must be running to install Guest Additions`);
    }

    try {
      // Use default Guest Additions ISO if not specified
      const guestAdditionsISO = iso_path || '/usr/share/virtualbox/VBoxGuestAdditions.iso';

      // Attach Guest Additions ISO
      await this.execVBoxCommand([
        'storageattach', name,
        '--storagectl', 'IDE Controller',
        '--port', '0',
        '--device', '0',
        '--type', 'dvddrive',
        '--medium', guestAdditionsISO
      ]);

      // Mount and install in guest (requires existing SSH access or similar)
      const installScript = `
        sudo mkdir -p /mnt/cdrom
        sudo mount /dev/cdrom /mnt/cdrom
        cd /mnt/cdrom
        sudo ./VBoxLinuxAdditions.run --nox11
        sudo umount /mnt/cdrom
      `;

      const result = await this.execInVMCommand(name, installScript, { timeout: 300000 }); // 5 min timeout

      // Detach ISO
      await this.execVBoxCommand([
        'storageattach', name,
        '--storagectl', 'IDE Controller',
        '--port', '0',
        '--device', '0',
        '--type', 'dvddrive',
        '--medium', 'none'
      ]);

      this.log('guest_additions_installed', { vm: name });

      return {
        success: true,
        operation: 'install_guest_additions',
        vm: name,
        output: `Guest Additions installed successfully in ${name}`
      };
    } catch (error) {
      throw new Error(`Failed to install Guest Additions: ${error.message}`);
    }
  }

  /**
   * Download OS ISO
   */
  async downloadISO(params, context) {
    const { url, destination, os_type = 'Unknown' } = params;

    if (!url || !destination) {
      throw new Error('Missing required parameters: url and destination');
    }

    try {
      // Use wget or curl to download ISO
      const downloadCommand = `wget -O ${destination} ${url}`;
      const result = await this.execCommand('sh', ['-c', downloadCommand], { timeout: 1800000 }); // 30 min

      if (result.exitCode === 0) {
        this.log('iso_downloaded', { url, destination, osType: os_type });

        return {
          success: true,
          operation: 'download_iso',
          url: url,
          destination: destination,
          osType: os_type,
          output: `ISO downloaded successfully to ${destination}`
        };
      } else {
        throw new Error(`Download failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to download ISO: ${error.message}`);
    }
  }

  /**
   * List available OS types
   */
  async listOSTypes() {
    try {
      const result = await this.execVBoxCommand(['list', 'ostypes']);

      if (result.exitCode === 0) {
        const osTypes = [];
        const lines = result.stdout.split('\n');

        for (const line of lines) {
          if (line.startsWith('ID:')) {
            const id = line.replace('ID:', '').trim();
            osTypes.push(id);
          }
        }

        return {
          success: true,
          operation: 'list_ostypes',
          osTypes: osTypes,
          count: osTypes.length,
          output: `Found ${osTypes.length} OS types`
        };
      } else {
        throw new Error(`Failed to list OS types: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to list OS types: ${error.message}`);
    }
  }

  /**
   * Setup VirtualBox permissions
   */
  async setupPermissions(params, context) {
    const { username } = params;

    if (!username) {
      throw new Error('Missing required parameter: username');
    }

    try {
      const commands = [
        `sudo usermod -a -G vboxusers ${username}`,
        'sudo chmod 755 /usr/lib/virtualbox',
        'sudo chmod +s /usr/lib/virtualbox/VirtualBox',
        'sudo chmod +s /usr/lib/virtualbox/VBoxHeadless'
      ];

      const results = [];
      for (const cmd of commands) {
        const result = await this.execCommand('sh', ['-c', cmd]);
        results.push({ command: cmd, exitCode: result.exitCode });
      }

      this.log('permissions_setup', { username, results });

      return {
        success: true,
        operation: 'setup_permissions',
        username: username,
        results: results,
        output: `Permissions configured for user ${username}. Please log out and back in.`
      };
    } catch (error) {
      throw new Error(`Failed to setup permissions: ${error.message}`);
    }
  }

  /**
   * Verify host system for VirtualBox
   */
  async verifyHost() {
    try {
      const checks = [];

      // Check VirtualBox installation
      try {
        const vboxResult = await this.execVBoxCommand(['--version']);
        checks.push({
          name: 'VirtualBox Installation',
          status: vboxResult.exitCode === 0 ? 'OK' : 'FAIL',
          details: vboxResult.stdout || vboxResult.stderr
        });
      } catch (error) {
        checks.push({
          name: 'VirtualBox Installation',
          status: 'FAIL',
          details: error.message
        });
      }

      // Check kernel modules
      try {
        const kernelResult = await this.execCommand('lsmod', []);
        const hasVboxdrv = kernelResult.stdout.includes('vboxdrv');
        checks.push({
          name: 'VirtualBox Kernel Modules',
          status: hasVboxdrv ? 'OK' : 'FAIL',
          details: hasVboxdrv ? 'vboxdrv loaded' : 'vboxdrv not loaded'
        });
      } catch (error) {
        checks.push({
          name: 'VirtualBox Kernel Modules',
          status: 'FAIL',
          details: error.message
        });
      }

      // Check virtualization support
      try {
        const cpuResult = await this.execCommand('grep', ['-E', '(vmx|svm)', '/proc/cpuinfo']);
        const hasVT = cpuResult.exitCode === 0;
        checks.push({
          name: 'Hardware Virtualization',
          status: hasVT ? 'OK' : 'FAIL',
          details: hasVT ? 'VT-x/AMD-V supported' : 'VT-x/AMD-V not detected'
        });
      } catch (error) {
        checks.push({
          name: 'Hardware Virtualization',
          status: 'FAIL',
          details: error.message
        });
      }

      // Check user permissions
      try {
        const groupResult = await this.execCommand('groups', []);
        const inVboxGroup = groupResult.stdout.includes('vboxusers');
        checks.push({
          name: 'User Permissions',
          status: inVboxGroup ? 'OK' : 'WARN',
          details: inVboxGroup ? 'User in vboxusers group' : 'User not in vboxusers group'
        });
      } catch (error) {
        checks.push({
          name: 'User Permissions',
          status: 'FAIL',
          details: error.message
        });
      }

      const allOK = checks.every(check => check.status === 'OK');

      return {
        success: true,
        operation: 'verify_host',
        checks: checks,
        overall: allOK ? 'OK' : 'ISSUES',
        output: `Host verification ${allOK ? 'passed' : 'found issues'}`
      };
    } catch (error) {
      throw new Error(`Failed to verify host: ${error.message}`);
    }
  }

  /**
   * Configure VM network
   */
  async configureNetwork(params, context) {
    const { name, adapter = '1', type = 'nat', network_name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status === 'running') {
      throw new Error(`Cannot modify network of running VM ${name}. Stop it first.`);
    }

    try {
      const args = ['modifyvm', name, `--nic${adapter}`, type];

      // Add network-specific parameters
      if (type === 'bridged' && network_name) {
        args.push(`--bridgeadapter${adapter}`, network_name);
      } else if (type === 'intnet' && network_name) {
        args.push(`--intnet${adapter}`, network_name);
      } else if (type === 'hostonly' && network_name) {
        args.push(`--hostonlyadapter${adapter}`, network_name);
      }

      const result = await this.execVBoxCommand(args);

      if (result.exitCode === 0) {
        this.log('network_configured', { vm: name, adapter, type, networkName: network_name });

        return {
          success: true,
          operation: 'configure_network',
          vm: name,
          adapter: adapter,
          type: type,
          networkName: network_name,
          output: `Network adapter ${adapter} configured as ${type} for VM ${name}`
        };
      } else {
        throw new Error(`Network configuration failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to configure network: ${error.message}`);
    }
  }

  /**
   * Attach ISO to VM
   */
  async attachISO(params, context) {
    const { name, iso_path, port = '0', device = '0' } = params;

    if (!name || !iso_path) {
      throw new Error('Missing required parameters: name and iso_path');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    try {
      const result = await this.execVBoxCommand([
        'storageattach', name,
        '--storagectl', 'IDE Controller',
        '--port', port,
        '--device', device,
        '--type', 'dvddrive',
        '--medium', iso_path
      ]);

      if (result.exitCode === 0) {
        this.log('iso_attached', { vm: name, isoPath: iso_path, port, device });

        return {
          success: true,
          operation: 'attach_iso',
          vm: name,
          isoPath: iso_path,
          port: port,
          device: device,
          output: `ISO ${iso_path} attached to VM ${name}`
        };
      } else {
        throw new Error(`ISO attach failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to attach ISO: ${error.message}`);
    }
  }

  /**
   * Detach ISO from VM
   */
  async detachISO(params, context) {
    const { name, port = '0', device = '0' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    try {
      const result = await this.execVBoxCommand([
        'storageattach', name,
        '--storagectl', 'IDE Controller',
        '--port', port,
        '--device', device,
        '--type', 'dvddrive',
        '--medium', 'none'
      ]);

      if (result.exitCode === 0) {
        this.log('iso_detached', { vm: name, port, device });

        return {
          success: true,
          operation: 'detach_iso',
          vm: name,
          port: port,
          device: device,
          output: `ISO detached from VM ${name}`
        };
      } else {
        throw new Error(`ISO detach failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to detach ISO: ${error.message}`);
    }
  }

  /**
   * Low-level VM execution via VBoxManage guestcontrol
   */
  async execInVMCommand(vmName, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.defaultTimeout;

      // Use VBoxManage guestcontrol to execute commands
      const exec = this.spawn('VBoxManage', [
        'guestcontrol', vmName, 'run',
        '--exe', '/bin/sh',
        '--username', 'root',
        '--password', '', // Assumes passwordless sudo or key-based auth
        '--wait-exit',
        '--wait-stdout',
        '--wait-stderr',
        '--',
        '-c', command
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      exec.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      exec.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        exec.kill('SIGTERM');
        reject(new Error(`Command timeout after ${timeout}ms: ${command}`));
      }, timeout);

      exec.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;

        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: duration
        });
      });

      exec.on('error', (error) => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Execution error: ${error.message}`));
      });
    });
  }

  /**
   * Copy file to VM via VBoxManage guestcontrol
   */
  async copyToVM(vmName, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      const copy = this.spawn('VBoxManage', [
        'guestcontrol', vmName, 'copyto',
        '--username', 'root',
        '--password', '', // Assumes passwordless sudo or key-based auth
        localPath, remotePath
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      copy.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      copy.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File copy failed: ${stderr}`));
        }
      });

      copy.on('error', (error) => {
        reject(new Error(`Copy operation error: ${error.message}`));
      });
    });
  }

  /**
   * Copy file from VM via VBoxManage guestcontrol
   */
  async copyFromVM(vmName, remotePath, localPath) {
    return new Promise((resolve, reject) => {
      const copy = this.spawn('VBoxManage', [
        'guestcontrol', vmName, 'copyfrom',
        '--username', 'root',
        '--password', '', // Assumes passwordless sudo or key-based auth
        remotePath, localPath
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      copy.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      copy.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File copy failed: ${stderr}`));
        }
      });

      copy.on('error', (error) => {
        reject(new Error(`Copy operation error: ${error.message}`));
      });
    });
  }

  /**
   * Write content to file in VM via guestcontrol
   */
  async writeToVM(vmName, remotePath, content) {
    return new Promise((resolve, reject) => {
      const write = this.spawn('VBoxManage', [
        'guestcontrol', vmName, 'run',
        '--exe', '/bin/sh',
        '--username', 'root',
        '--password', '',
        '--wait-exit',
        '--',
        '-c', `cat > ${remotePath}`
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      write.stdin.write(content);
      write.stdin.end();

      let stderr = '';
      write.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      write.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File write failed: ${stderr}`));
        }
      });

      write.on('error', (error) => {
        reject(new Error(`Write operation error: ${error.message}`));
      });
    });
  }

  /**
   * Execute generic system command
   */
  async execCommand(command, args = [], options = {}) {
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      const child = this.spawn(command, args, {
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
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Command execution failed: ${error.message}`));
      });

      // Set timeout
      if (timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Command timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Execute VBoxManage command
   */
  async execVBoxCommand(args, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      const child = this.spawn('VBoxManage', args, {
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
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        reject(new Error(`VBoxManage command failed: ${error.message}`));
      });

      // Set timeout
      if (timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`VBoxManage command timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Enhanced security validation for VM parameters
   */
  validateVMSecurity(params) {
    const violations = [];

    // Validate memory limits
    if (params.memory) {
      const memoryLimit = parseInt(params.memory);
      const maxMemoryLimit = parseInt(this.securityPolicies.maxMemory);
      if (memoryLimit > maxMemoryLimit) {
        violations.push(`Memory limit ${params.memory}MB exceeds maximum allowed ${this.securityPolicies.maxMemory}MB`);
      }
    }

    // Validate CPU limits
    if (params.cpus) {
      const cpuLimit = parseInt(params.cpus);
      const maxCpuLimit = parseInt(this.securityPolicies.maxCpus);
      if (cpuLimit > maxCpuLimit) {
        violations.push(`CPU limit ${params.cpus} exceeds maximum allowed ${this.securityPolicies.maxCpus}`);
      }
    }

    return violations;
  }

  /**
   * Audit security events for compliance
   */
  auditSecurityEvent(event, details) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      details: details,
      securityMode: this.securityMode
    };
    this.auditLog.push(auditEntry);
    this.log('security_event', auditEntry);
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog() {
    return {
      success: true,
      operation: 'security_audit',
      events: this.auditLog.slice(-100), // Return last 100 events
      totalEvents: this.auditLog.length,
      securityMode: this.securityMode,
      policies: this.securityPolicies
    };
  }

  /**
   * VM Process Management Methods
   */

  /**
   * Start process monitoring for VMs
   */
  startProcessMonitoring() {
    if (this.monitoringTimer || !this.processMonitor.enabled) {
      return;
    }

    this.monitoringTimer = setInterval(() => {
      this.checkVMHealth();
    }, this.processMonitor.checkInterval);

    this.log('process_monitoring_started', {
      interval: this.processMonitor.checkInterval,
      vms: this.activeVMs.size
    });
  }

  /**
   * Stop process monitoring
   */
  stopProcessMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      this.log('process_monitoring_stopped');
    }
  }

  /**
   * Check health of all active VMs
   */
  async checkVMHealth() {
    for (const [name, vm] of this.activeVMs) {
      try {
        const health = await this.getVMHealth(name);
        this.processMonitor.processStats.set(name, {
          ...health,
          lastCheck: new Date().toISOString()
        });

        // Check for unhealthy VMs
        if (health.status === 'unhealthy' || health.status === 'aborted') {
          this.handleUnhealthyVM(name, vm, health);
        }
      } catch (error) {
        this.log('health_check_error', { vm: name, error: error.message });
      }
    }
  }

  /**
   * Get VM health and process information
   */
  async getVMHealth(vmName) {
    try {
      // Use VBoxManage to get VM info
      const result = await this.execVBoxCommand(['showvminfo', vmName, '--machinereadable']);

      if (result.exitCode === 0) {
        const info = {};
        result.stdout.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            info[key] = value.replace(/"/g, '');
          }
        });

        const vmState = info.VMState || 'unknown';

        return {
          status: vmState,
          running: vmState === 'running',
          memory: info.memory || '0',
          cpus: info.cpus || '0',
          uptime: vmState === 'running' ? this.calculateUptime(new Date().getTime()) : '0s'
        };
      }
    } catch (error) {
      this.log('health_check_failed', { vm: vmName, error: error.message });
    }

    return {
      status: 'unknown',
      running: false,
      memory: '0',
      cpus: '0',
      uptime: '0s'
    };
  }

  /**
   * Handle unhealthy VMs
   */
  async handleUnhealthyVM(name, vm, health) {
    this.log('unhealthy_vm_detected', {
      vm: name,
      status: health.status,
      lastKnownGood: vm.status
    });

    // Update VM status
    vm.status = health.status;

    // Audit the event
    this.auditSecurityEvent('vm_health_issue', {
      vm: name,
      healthStatus: health.status,
      action: 'monitoring'
    });
  }

  /**
   * Get process statistics for all VMs
   */
  getProcessStatistics() {
    const stats = Array.from(this.processMonitor.processStats.entries()).map(([name, stats]) => ({
      vm: name,
      ...stats,
      vmInfo: this.activeVMs.get(name)
    }));

    return {
      success: true,
      operation: 'process_stats',
      vms: stats,
      monitoringEnabled: this.processMonitor.enabled,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Configure VM health checks
   */
  configureHealthCheck(params) {
    const { vm, enabled = 'true', interval = '60000', command, retries = '3' } = params;
    const enabledBool = enabled.toString().toLowerCase() === 'true';
    const intervalNum = parseInt(interval);
    const retriesNum = parseInt(retries);

    if (!vm) {
      throw new Error('VM name required for health check configuration');
    }

    if (!this.activeVMs.has(vm)) {
      throw new Error(`VM not found: ${vm}`);
    }

    this.processMonitor.healthChecks.set(vm, {
      enabled: enabledBool,
      interval: intervalNum,
      command,
      retries: retriesNum,
      failureCount: 0,
      lastCheck: null
    });

    this.log('health_check_configured', {
      vm,
      enabled: enabledBool,
      interval: intervalNum,
      command: command ? 'custom' : 'default'
    });

    return {
      success: true,
      operation: 'configure_health_check',
      vm,
      configuration: { enabled: enabledBool, interval: intervalNum, command, retries: retriesNum }
    };
  }

  /**
   * Enhanced CHECKPOINT Progress Monitoring Methods
   */

  /**
   * Setup bidirectional CHECKPOINT monitoring for a VM
   */
  setupCheckpointMonitoring(vmName, progressCallback) {
    if (!this.checkpointMonitor.enabled) {
      return;
    }

    // Register the callback for this VM
    this.checkpointMonitor.callbacks.set(vmName, progressCallback);
    this.checkpointMonitor.realtimeData.set(vmName, {
      started: new Date().toISOString(),
      checkpoints: [],
      lastUpdate: null
    });

    this.log('checkpoint_monitoring_setup', {
      vm: vmName,
      bidirectional: true
    });
  }

  /**
   * Process incoming CHECKPOINT data from VM
   */
  processCheckpointData(vmName, checkpointData) {
    const callback = this.checkpointMonitor.callbacks.get(vmName);
    const realtimeData = this.checkpointMonitor.realtimeData.get(vmName);

    if (realtimeData) {
      realtimeData.checkpoints.push({
        timestamp: new Date().toISOString(),
        ...checkpointData
      });
      realtimeData.lastUpdate = new Date().toISOString();
    }

    // Call the progress callback with the new data
    if (callback) {
      callback(checkpointData.checkpoint, checkpointData.params || {});
    }

    // Log the checkpoint for debugging
    this.log('checkpoint_received', {
      vm: vmName,
      checkpoint: checkpointData.checkpoint,
      params: checkpointData.params
    });
  }

  /**
   * Execute RexxJS script with enhanced CHECKPOINT progress monitoring
   */
  async executeRexxWithProgress(vmInfo, script, options = {}) {
    const tempScript = `/tmp/rexx_script_progress_${Date.now()}.rexx`;

    try {
      // Enhanced script with CHECKPOINT monitoring wrapper
      const enhancedScript = this.wrapScriptWithCheckpoints(script, options);

      // Write script to VM
      await this.writeToVM(vmInfo.name, tempScript, enhancedScript);

      // Setup bidirectional CHECKPOINT monitoring
      if (options.progressCallback) {
        this.setupCheckpointMonitoring(vmInfo.name, options.progressCallback);
      }

      const result = await this.execInVMCommandWithProgress(
        vmInfo.name,
        `${vmInfo.rexxPath} ${tempScript}`,
        {
          timeout: options.timeout || this.defaultTimeout,
          progressCallback: options.progressCallback,
          bidirectional: true
        }
      );

      // Cleanup temp script
      await this.execInVMCommand(vmInfo.name, `rm -f ${tempScript}`, { timeout: 5000 });

      return result;
    } catch (error) {
      // Ensure cleanup on error
      try {
        await this.execInVMCommand(vmInfo.name, `rm -f ${tempScript}`, { timeout: 5000 });
      } catch (cleanupError) {
        // Log cleanup failure but don't mask original error
        this.log('cleanup_error', { script: tempScript, error: cleanupError.message });
      }
      throw error;
    }
  }

  /**
   * Wrap RexxJS script with CHECKPOINT monitoring capabilities
   */
  wrapScriptWithCheckpoints(script, options = {}) {
    return this.sharedWrapScriptWithCheckpoints(script, options);
  }

  /**
   * Execute command in VM with progress monitoring
   */
  async execInVMCommandWithProgress(vmName, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Use standard VM execution but parse for checkpoints
      const exec = this.spawn('VBoxManage', [
        'guestcontrol', vmName, 'run',
        '--exe', '/bin/sh',
        '--username', 'root',
        '--password', '',
        '--wait-exit',
        '--wait-stdout',
        '--wait-stderr',
        '--',
        '-c', command
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      exec.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;

        // Parse CHECKPOINT outputs for progress monitoring
        if (options.progressCallback && output.includes('CHECKPOINT')) {
          this.parseCheckpointOutput(output, options.progressCallback);
        }
      });

      exec.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        stderr += errorOutput;

        // Also check stderr for CHECKPOINT outputs
        if (options.progressCallback && errorOutput.includes('CHECKPOINT')) {
          this.parseCheckpointOutput(errorOutput, options.progressCallback);
        }
      });

      exec.on('close', (code) => {
        const duration = Date.now() - startTime;

        // Cleanup checkpoint monitoring for this execution
        this.cleanupCheckpointMonitoring(vmName);

        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration
        });
      });

      exec.on('error', (error) => {
        this.cleanupCheckpointMonitoring(vmName);
        reject(new Error(`VM execution error: ${error.message}`));
      });

      // Set timeout if specified
      if (options.timeout > 0) {
        setTimeout(() => {
          exec.kill('SIGKILL');
          this.cleanupCheckpointMonitoring(vmName);
          reject(new Error(`VM execution timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  /**
   * Parse CHECKPOINT output for progress monitoring
   */
  parseCheckpointOutput(output, progressCallback) {
    return this.sharedParseCheckpointOutput(output, progressCallback);
  }

  /**
   * Parse enhanced CHECKPOINT output with structured data support
   */
  parseEnhancedCheckpointOutput(vmName, output, progressCallback) {
    return this.sharedParseEnhancedCheckpointOutput(output, (rec) => {
      this.processCheckpointData(vmName, rec);
      if (typeof progressCallback === 'function') {
        progressCallback(rec.checkpoint, rec.params);
      }
    });
  }

  /**
   * Cleanup checkpoint monitoring for a VM
   */
  cleanupCheckpointMonitoring(vmName) {
    this.checkpointMonitor.callbacks.delete(vmName);

    // Keep realtime data for a while for inspection
    setTimeout(() => {
      this.checkpointMonitor.realtimeData.delete(vmName);
    }, 60000); // Keep for 1 minute
  }

  /**
   * Get current checkpoint monitoring status
   */
  getCheckpointMonitoringStatus() {
    const activeMonitoring = Array.from(this.checkpointMonitor.callbacks.keys());
    const realtimeData = {};

    for (const [vm, data] of this.checkpointMonitor.realtimeData.entries()) {
      realtimeData[vm] = {
        ...data,
        checkpointCount: data.checkpoints.length,
        latestCheckpoint: data.checkpoints[data.checkpoints.length - 1]
      };
    }

    return {
      success: true,
      operation: 'checkpoint_monitoring_status',
      enabled: this.checkpointMonitor.enabled,
      activeVMs: activeMonitoring,
      realtimeData: realtimeData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup process monitoring on handler destruction
   */
  destroy() {
    this.stopProcessMonitoring();

    // Cleanup checkpoint monitoring
    this.checkpointMonitor.callbacks.clear();
    this.checkpointMonitor.realtimeData.clear();

    this.activeVMs.clear();
    this.processMonitor.processStats.clear();
    this.auditLog.length = 0;
  }
}

// Global handler instance
let virtualboxHandlerInstance = null;

// Consolidated metadata provider function
function VIRTUALBOX_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    dependencies: {"child_process": "builtin"},
    envVars: [],
    type: 'address-target',
    name: 'ADDRESS VIRTUALBOX Virtual Machine Service',
    version: '1.0.0',
    description: 'VirtualBox virtual machine management via ADDRESS interface',
    detectionFunction: 'ADDRESS_VIRTUALBOX_MAIN'
  };
}

// Primary detection function with ADDRESS target metadata
function ADDRESS_VIRTUALBOX_MAIN() {
  return VIRTUALBOX_ADDRESS_META();
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_VIRTUALBOX_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize handler instance if not exists
  if (!virtualboxHandlerInstance) {
    virtualboxHandlerInstance = new AddressVirtualBoxHandler();
    await virtualboxHandlerInstance.initialize();
  }

  let commandString = commandOrMethod;
  let context = sourceContext ? Object.fromEntries(sourceContext.variables) : {};

  if (params) { // Method call style
      const paramsString = Object.entries(params)
          .map(([key, value]) => {
              if (typeof value === 'string' && value.includes(' ')) {
                  return `${key}="${value}"`;
              }
              return `${key}=${value}`;
          })
          .join(' ');
      commandString = `${commandOrMethod} ${paramsString}`;
      context = { ...context, ...params };
  }

  try {
    const result = await virtualboxHandlerInstance.handleAddressCommand(commandString, context);

    // Convert to REXX-style result
    return {
      success: result.success,
      errorCode: result.success ? 0 : 1,
      errorMessage: result.error || null,
      output: result.output || '',
      result: result,
      rexxVariables: {
        'VIRTUALBOX_OPERATION': result.operation || '',
        'VIRTUALBOX_VM': result.vm || '',
        'VIRTUALBOX_STATUS': result.status || '',
        'VIRTUALBOX_COUNT': result.count || 0,
        'VIRTUALBOX_EXIT_CODE': result.exitCode || 0,
        'VIRTUALBOX_STDOUT': result.stdout || '',
        'VIRTUALBOX_STDERR': result.stderr || '',
        'VIRTUALBOX_BINARY': result.binary || '',
        'VIRTUALBOX_TARGET': result.target || '',
        'VIRTUALBOX_SNAPSHOT': result.snapshot || ''
      }
    };
  } catch (error) {
    return {
      success: false,
      errorCode: 1,
      errorMessage: error.message,
      output: error.message,
      result: { error: error.message },
      rexxVariables: {
        'VIRTUALBOX_ERROR': error.message
      }
    };
  }
}

// Method names for RexxJS method detection
const ADDRESS_VIRTUALBOX_METHODS = {
  'status': 'Get VIRTUALBOX handler status',
  'list': 'List virtual machines',
  'create': 'Create a new VM [memory=2048] [cpus=2] [ostype=Ubuntu_64]',
  'start': 'Start a virtual machine',
  'stop': 'Stop a virtual machine',
  'start_if_stopped': 'Start VM only if not already running (idempotent)',
  'stop_if_running': 'Stop VM only if running (idempotent)',
  'restart': 'Restart a virtual machine (stop then start)',
  'pause': 'Pause a running virtual machine',
  'resume': 'Resume a paused virtual machine',
  'save_state': 'Save VM state and stop',
  'restore_state': 'Restore VM from saved state',
  'remove': 'Remove a virtual machine',
  'deploy_rexx': 'Deploy RexxJS binary to VM',
  'execute': 'Execute command in VM',
  'execute_rexx': 'Execute RexxJS script in VM [progress_callback=true] [timeout=120000]',
  'copy_to': 'Copy file to VM',
  'copy_from': 'Copy file from VM',
  'logs': 'Get VM console logs [lines=50]',
  'cleanup': 'Cleanup VMs [all=true]',
  'security_audit': 'Get security audit log and policies',
  'process_stats': 'Get VM process statistics and health',
  'configure_health_check': 'Configure health check for VM [enabled=true] [interval=60000] [command=custom]',
  'start_monitoring': 'Start VM process monitoring',
  'stop_monitoring': 'Stop VM process monitoring',
  'checkpoint_status': 'Get bidirectional CHECKPOINT monitoring status',
  'snapshot': 'Create VM snapshot',
  'restore': 'Restore VM from snapshot',
  'install_guest_additions': 'Install VirtualBox Guest Additions [iso_path=/usr/share/virtualbox/VBoxGuestAdditions.iso]',
  'download_iso': 'Download OS ISO [os_type=Ubuntu]',
  'list_ostypes': 'List available VirtualBox OS types',
  'setup_permissions': 'Setup VirtualBox permissions for user',
  'verify_host': 'Verify host system VirtualBox setup',
  'configure_network': 'Configure VM network [adapter=1] [type=nat|bridged|hostonly|intnet] [network_name]',
  'attach_iso': 'Attach ISO to VM [port=0] [device=0]',
  'detach_iso': 'Detach ISO from VM [port=0] [device=0]',
  'register_base': 'Register VM as base image for CoW cloning [vm=source-vm-name]',
  'clone': 'Clone VM using linked clone (CoW) source= name=',
  'clone_from_base': 'Clone from registered base image base= name=',
  'list_bases': 'List registered base images'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    ADDRESS_VIRTUALBOX_MAIN,
    ADDRESS_VIRTUALBOX_HANDLER,
    ADDRESS_VIRTUALBOX_METHODS,
    AddressVirtualBoxHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.ADDRESS_VIRTUALBOX_MAIN = ADDRESS_VIRTUALBOX_MAIN;
  window.ADDRESS_VIRTUALBOX_HANDLER = ADDRESS_VIRTUALBOX_HANDLER;
  window.ADDRESS_VIRTUALBOX_METHODS = ADDRESS_VIRTUALBOX_METHODS;
}