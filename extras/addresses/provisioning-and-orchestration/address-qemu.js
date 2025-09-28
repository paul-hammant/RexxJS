/*!
 * rexxjs/address-qemu v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=QEMU_ADDRESS_META
 */
/**
 * ADDRESS QEMU Handler
 * Provides explicit ADDRESS QEMU integration for virtual machine operations
 *
 * Usage:
 *   REQUIRE "rexxjs/address-qemu" AS QEMU
 *   ADDRESS QEMU
 *   "create image=debian.qcow2 name=test-vm memory=2G"
 *   "status"
 *   "list"
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Modules will be loaded dynamically in initialize method

class AddressQemuHandler {
  constructor() {
    this.activeVMs = new Map();
    this.vmCounter = 0;
    this.defaultTimeout = 120000; // VMs need more time than containers
    this.maxVMs = 10;
    this.securityMode = 'moderate';
    this.allowedImages = new Set(['debian.qcow2', 'ubuntu.qcow2', 'alpine.qcow2']);
    this.trustedBinaries = new Set();
    this.runtime = 'qemu';

    // Enhanced security settings
    this.securityPolicies = {
      allowPrivileged: false,
      allowHostNetwork: false,
      allowHostPid: false,
      maxMemory: '8g',
      maxCpus: '8',
      allowedDiskPaths: new Set(['/tmp', '/var/tmp', '/home/paul/vm-images']),
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
    this.initialized = false;
  }

  /**
   * Initialize the ADDRESS QEMU handler
   */
  async initialize(config = {}) {
    if (this.initialized) return;

    try {
      // Import Node.js modules when needed
      this.spawn = require('child_process').spawn;
      this.fs = require('fs');
      this.path = require('path');

      // Import shared utilities
      const sharedUtils = require('./shared-utils');
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
      this.log = this.createLogFunction('ADDRESS_QEMU');

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize QEMU handler: ${error.message}`);
    }

    this.securityMode = config.securityMode || this.securityMode;
    this.maxVMs = config.maxVMs || this.maxVMs;
    this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;

    if (config.allowedImages && Array.isArray(config.allowedImages)) {
      this.allowedImages = new Set(config.allowedImages);
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
      allowedImages: Array.from(this.allowedImages)
    });
  }

  /**
   * Detect if qemu runtime is available
   */
  async detectRuntime() {
    try {
      await this.testRuntime('qemu-system-x86_64');
      this.runtime = 'qemu';
      return;
    } catch (error) {
      throw new Error('QEMU runtime not found or not available');
    }
  }


  /**
   * Main handler for ADDRESS QEMU commands
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
        case 'install_guest_agent':
          return await this.installGuestAgent(parsed.params, context);
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
        case 'configure_ssh':
          return await this.configureSSH(parsed.params, context);
        default:
          throw new Error(`Unknown ADDRESS QEMU command: ${parsed.operation}`);
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
      image: info.image,
      status: info.status,
      created: info.created,
      memory: info.memory,
      cpus: info.cpus,
      disk: info.disk,
      network: info.network,
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
    const { image, name, memory = '2G', cpus = '2', disk, network = 'user' } = params;

    if (!image) {
      throw new Error('Missing required parameter: image');
    }

    // Validate image
    if (this.securityMode === 'strict' && !this.allowedImages.has(image)) {
      throw new Error(`Image not allowed in strict mode: ${image}`);
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

    const vmName = (name && name.trim()) || `qemu-vm-${++this.vmCounter}`;

    // Check for name conflicts
    if (name && name.trim() && this.activeVMs.has(name.trim())) {
      throw new Error(`VM name already exists: ${name.trim()}`);
    }

    // Create QEMU VM with enhanced options
    const createArgs = [
      '-name', vmName,
      '-m', memory,
      '-smp', cpus,
      '-netdev', `${network},id=net0`,
      '-device', 'e1000,netdev=net0',
      '-daemonize',
      '-pidfile', `/tmp/${vmName}.pid`,
      '-vnc', `:${this.getNextVNCPort()}`
    ];

    // Add disk
    if (disk) {
      createArgs.push('-drive', `file=${disk},format=qcow2`);
    } else {
      createArgs.push('-drive', `file=${image},format=qcow2`);
    }

    this.log('qemu_create_start', { vmName, image, args: createArgs });
    const result = await this.execQemuCommand(createArgs);
    this.log('qemu_create_result', { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr });

    if (result.exitCode === 0) {
      const vmInfo = {
        name: vmName,
        image,
        status: 'running', // QEMU starts the VM immediately
        created: new Date().toISOString(),
        runtime: this.runtime,
        memory: memory,
        cpus: cpus,
        disk: disk || image,
        network: network,
        pidFile: `/tmp/${vmName}.pid`
      };

      this.activeVMs.set(vmName, vmInfo);

      this.log('vm_created', { name: vmName, image });

      return {
        success: true,
        operation: 'create',
        vm: vmName,
        image,
        status: 'running',
        memory: vmInfo.memory,
        cpus: vmInfo.cpus,
        disk: vmInfo.disk,
        network: vmInfo.network,
        output: `VM ${vmName} created and started successfully`
      };
    } else {
      throw new Error(`Failed to create VM: ${result.stderr}`);
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

    // Start QEMU VM (similar to create but for existing VMs)
    const startArgs = [
      '-name', name,
      '-m', vm.memory,
      '-smp', vm.cpus,
      '-netdev', `${vm.network},id=net0`,
      '-device', 'e1000,netdev=net0',
      '-drive', `file=${vm.disk},format=qcow2`,
      '-daemonize',
      '-pidfile', vm.pidFile,
      '-vnc', `:${this.getNextVNCPort()}`
    ];

    const result = await this.execQemuCommand(startArgs);

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

    // Stop QEMU VM by killing the process
    const result = await this.killQemuVM(name);

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

    const startArgs = [
      '-name', name,
      '-m', vm.memory,
      '-smp', vm.cpus,
      '-netdev', `${vm.network},id=net0`,
      '-device', 'e1000,netdev=net0',
      '-drive', `file=${vm.disk},format=qcow2`,
      '-daemonize',
      '-pidfile', vm.pidFile,
      '-vnc', `:${this.getNextVNCPort()}`
    ];

    const result = await this.execQemuCommand(startArgs);

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

    const result = await this.killQemuVM(name);

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

    const result = await this.execCommand('virsh', ['suspend', name]);

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

    const result = await this.execCommand('virsh', ['resume', name]);

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

    const result = await this.execCommand('virsh', ['managedsave', name]);

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

    const result = await this.execCommand('virsh', ['start', name]);

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
      await this.killQemuVM(name);
    }

    // Remove PID file
    try {
      this.fs.unlinkSync(vm.pidFile);
    } catch (error) {
      // Ignore if file doesn't exist
    }

    this.activeVMs.delete(name);

    this.log('vm_removed', { name });

    return {
      success: true,
      operation: 'remove',
      vm: name,
      output: `VM ${name} removed successfully`
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

    // Use qemu-img to create snapshot
    const result = await this.execCommand('qemu-img', [
      'snapshot', '-c', snapshot_name, vm.disk
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
      await this.killQemuVM(name);
    }

    // Use qemu-img to restore snapshot
    const result = await this.execCommand('qemu-img', [
      'snapshot', '-a', snapshot_name, vm.disk
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
      // Copy binary to VM (using SCP or similar method)
      await this.copyToVM(name, interpolatedBinary, interpolatedTarget);

      // Make executable via SSH
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

    // For VMs, we might need to get logs differently (console logs, etc.)
    // This is a simplified implementation
    return {
      success: true,
      operation: 'logs',
      vm,
      lines: parseInt(lines),
      logs: `VM ${vm} console logs not available`,
      output: `No console logs available for VM ${vm}`
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
              await this.killQemuVM(id);
            }
            try {
              this.fs.unlinkSync(vm.pidFile);
            } catch (error) {
              // Ignore if file doesn't exist
            }
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
              try {
                this.fs.unlinkSync(vm.pidFile);
              } catch (error) {
                // Ignore if file doesn't exist
              }
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
   * Install QEMU Guest Agent in VM
   */
  async installGuestAgent(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    if (vm.status !== 'running') {
      throw new Error(`VM ${name} must be running to install Guest Agent`);
    }

    try {
      // Install qemu-guest-agent package
      const installScript = `
        if command -v apt-get > /dev/null; then
          sudo apt-get update && sudo apt-get install -y qemu-guest-agent
          sudo systemctl enable qemu-guest-agent
          sudo systemctl start qemu-guest-agent
        elif command -v yum > /dev/null; then
          sudo yum install -y qemu-guest-agent
          sudo systemctl enable qemu-guest-agent
          sudo systemctl start qemu-guest-agent
        elif command -v dnf > /dev/null; then
          sudo dnf install -y qemu-guest-agent
          sudo systemctl enable qemu-guest-agent
          sudo systemctl start qemu-guest-agent
        else
          echo "Package manager not supported"
          exit 1
        fi
      `;

      // Try to execute using current method (likely SSH initially)
      const result = await this.execInVMCommand(name, installScript, { timeout: 300000 });

      if (result.exitCode === 0) {
        // Set execution method to guest-agent now that it's installed
        vm.execMethod = 'guest-agent';
        vm.guestAgentInstalled = true;

        this.log('guest_agent_installed', { vm: name });

        return {
          success: true,
          operation: 'install_guest_agent',
          vm: name,
          output: `QEMU Guest Agent installed successfully in ${name}`
        };
      } else {
        throw new Error(`Failed to install guest agent: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to install Guest Agent: ${error.message}`);
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
      const downloadCommand = `wget -O ${destination} ${url}`;
      const result = await this.execCommand('sh', ['-c', downloadCommand], { timeout: 1800000 });

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
      const result = await this.execCommand('virt-install', ['--os-variant', 'list']);

      if (result.exitCode === 0) {
        const osTypes = [];
        const lines = result.stdout.split('\n');

        for (const line of lines) {
          // Parse virt-install output for OS types
          const match = line.match(/^\s*(\S+)\s+\|/);
          if (match) {
            osTypes.push(match[1]);
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
      // Fallback to common OS types
      const commonOSTypes = [
        'generic', 'linux', 'ubuntu20.04', 'ubuntu22.04', 'debian10', 'debian11',
        'centos7', 'centos8', 'rhel8', 'rhel9', 'fedora35', 'fedora36',
        'opensuse15.3', 'archlinux', 'win10', 'win11', 'win2k19', 'win2k22'
      ];

      return {
        success: true,
        operation: 'list_ostypes',
        osTypes: commonOSTypes,
        count: commonOSTypes.length,
        output: `Listed ${commonOSTypes.length} common OS types (virt-install not available)`
      };
    }
  }

  /**
   * Setup QEMU/KVM permissions
   */
  async setupPermissions(params, context) {
    const { username } = params;

    if (!username) {
      throw new Error('Missing required parameter: username');
    }

    try {
      const commands = [
        `sudo usermod -a -G libvirt ${username}`,
        `sudo usermod -a -G kvm ${username}`,
        'sudo chmod 666 /dev/kvm',
        'sudo systemctl enable libvirtd',
        'sudo systemctl start libvirtd'
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
   * Verify host system for QEMU/KVM
   */
  async verifyHost() {
    try {
      const checks = [];

      // Check QEMU installation
      try {
        const qemuResult = await this.execCommand('qemu-system-x86_64', ['--version']);
        checks.push({
          name: 'QEMU Installation',
          status: qemuResult.exitCode === 0 ? 'OK' : 'FAIL',
          details: qemuResult.stdout || qemuResult.stderr
        });
      } catch (error) {
        checks.push({
          name: 'QEMU Installation',
          status: 'FAIL',
          details: error.message
        });
      }

      // Check KVM support
      try {
        const kvmResult = await this.execCommand('test', ['-e', '/dev/kvm']);
        checks.push({
          name: 'KVM Device',
          status: kvmResult.exitCode === 0 ? 'OK' : 'FAIL',
          details: kvmResult.exitCode === 0 ? '/dev/kvm exists' : '/dev/kvm not found'
        });
      } catch (error) {
        checks.push({
          name: 'KVM Device',
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

      // Check libvirt
      try {
        const libvirtResult = await this.execCommand('virsh', ['version']);
        checks.push({
          name: 'libvirt',
          status: libvirtResult.exitCode === 0 ? 'OK' : 'FAIL',
          details: libvirtResult.stdout || 'Not installed'
        });
      } catch (error) {
        checks.push({
          name: 'libvirt',
          status: 'WARN',
          details: 'Not installed (optional but recommended)'
        });
      }

      // Check user permissions
      try {
        const groupResult = await this.execCommand('groups', []);
        const inKvmGroup = groupResult.stdout.includes('kvm') || groupResult.stdout.includes('libvirt');
        checks.push({
          name: 'User Permissions',
          status: inKvmGroup ? 'OK' : 'WARN',
          details: inKvmGroup ? 'User in kvm/libvirt group' : 'User not in kvm/libvirt group'
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
    const { name, type = 'user', bridge_name, tap_name } = params;

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

    // Update VM network configuration
    vm.networkType = type;
    if (bridge_name) vm.bridgeName = bridge_name;
    if (tap_name) vm.tapName = tap_name;

    this.log('network_configured', { vm: name, type, bridgeName: bridge_name, tapName: tap_name });

    return {
      success: true,
      operation: 'configure_network',
      vm: name,
      type: type,
      bridgeName: bridge_name,
      tapName: tap_name,
      output: `Network configured as ${type} for VM ${name}. Changes take effect on next start.`
    };
  }

  /**
   * Attach ISO to VM
   */
  async attachISO(params, context) {
    const { name, iso_path } = params;

    if (!name || !iso_path) {
      throw new Error('Missing required parameters: name and iso_path');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    // Store ISO path in VM config
    vm.attachedISO = iso_path;

    this.log('iso_attached', { vm: name, isoPath: iso_path });

    return {
      success: true,
      operation: 'attach_iso',
      vm: name,
      isoPath: iso_path,
      output: `ISO ${iso_path} attached to VM ${name}. Use on next boot.`
    };
  }

  /**
   * Detach ISO from VM
   */
  async detachISO(params, context) {
    const { name } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    // Remove ISO from VM config
    delete vm.attachedISO;

    this.log('iso_detached', { vm: name });

    return {
      success: true,
      operation: 'detach_iso',
      vm: name,
      output: `ISO detached from VM ${name}`
    };
  }

  /**
   * Configure SSH access for VM
   */
  async configureSSH(params, context) {
    const { name, host, port = '22', user = 'root', key_file } = params;

    if (!name || !host) {
      throw new Error('Missing required parameters: name and host');
    }

    const vm = this.activeVMs.get(name);
    if (!vm) {
      throw new Error(`VM not found: ${name}`);
    }

    // Configure SSH settings for VM
    vm.sshConfig = {
      host: host,
      port: parseInt(port),
      user: user,
      keyFile: key_file
    };

    // Set exec method to SSH
    vm.execMethod = 'ssh';

    this.log('ssh_configured', { vm: name, host, port, user });

    return {
      success: true,
      operation: 'configure_ssh',
      vm: name,
      host: host,
      port: port,
      user: user,
      output: `SSH configured for VM ${name} at ${user}@${host}:${port}`
    };
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
   * Low-level VM execution via QEMU Guest Agent or SSH
   *
   * Three execution methods:
   * 1. QEMU Guest Agent (qemu-ga) - recommended, works without network
   * 2. SSH - fallback, requires network configuration
   * 3. Serial console - low-level fallback
   */
  async execInVMCommand(vmName, command, options = {}) {
    const vm = this.activeVMs.get(vmName);
    if (!vm) {
      throw new Error(`VM not found: ${vmName}`);
    }

    const method = options.method || vm.execMethod || 'guest-agent';
    const timeout = options.timeout || this.defaultTimeout;

    switch (method) {
      case 'guest-agent':
        return await this.execViaGuestAgent(vm, command, { timeout });
      case 'ssh':
        return await this.execViaSsh(vm, command, { timeout });
      case 'serial':
        return await this.execViaSerial(vm, command, { timeout });
      default:
        throw new Error(`Unknown execution method: ${method}`);
    }
  }

  /**
   * Execute command via QEMU Guest Agent (qemu-ga)
   */
  async execViaGuestAgent(vm, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.defaultTimeout;

      // Use virsh qemu-agent-command or direct QMP socket
      const qmpCommand = JSON.stringify({
        execute: 'guest-exec',
        arguments: {
          path: '/bin/sh',
          arg: ['-c', command],
          capture_output: true
        }
      });

      // Try virsh first (if using libvirt)
      const exec = this.spawn('virsh', [
        'qemu-agent-command',
        vm.name,
        qmpCommand
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
        reject(new Error(`Guest agent command timeout after ${timeout}ms`));
      }, timeout);

      exec.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;

        if (code === 0) {
          try {
            // Parse guest-exec response
            const response = JSON.parse(stdout);
            if (response.return && response.return.pid) {
              // Get the result using guest-exec-status
              this.getGuestExecStatus(vm, response.return.pid, timeout - duration)
                .then(result => resolve(result))
                .catch(err => reject(err));
            } else {
              resolve({
                exitCode: 0,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                duration: duration
              });
            }
          } catch (parseError) {
            // If virsh is not available, fall back to SSH
            this.log('guest_agent_unavailable', { vm: vm.name, error: stderr });
            this.execViaSsh(vm, command, options)
              .then(result => resolve(result))
              .catch(err => reject(err));
          }
        } else {
          // Guest agent not available, try SSH fallback
          this.log('guest_agent_failed', { vm: vm.name, code, stderr });
          this.execViaSsh(vm, command, options)
            .then(result => resolve(result))
            .catch(err => reject(err));
        }
      });

      exec.on('error', (error) => {
        clearTimeout(timeoutHandle);
        // Fallback to SSH on error
        this.log('guest_agent_error', { vm: vm.name, error: error.message });
        this.execViaSsh(vm, command, options)
          .then(result => resolve(result))
          .catch(err => reject(err));
      });
    });
  }

  /**
   * Get guest-exec-status from QEMU Guest Agent
   */
  async getGuestExecStatus(vm, pid, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkStatus = () => {
        const qmpCommand = JSON.stringify({
          execute: 'guest-exec-status',
          arguments: { pid: pid }
        });

        const exec = this.spawn('virsh', [
          'qemu-agent-command',
          vm.name,
          qmpCommand
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

        exec.on('close', (code) => {
          if (code === 0) {
            try {
              const response = JSON.parse(stdout);
              if (response.return && response.return.exited) {
                // Process has completed
                const outData = response.return['out-data'] || '';
                const errData = response.return['err-data'] || '';

                resolve({
                  exitCode: response.return.exitcode || 0,
                  stdout: Buffer.from(outData, 'base64').toString('utf8'),
                  stderr: Buffer.from(errData, 'base64').toString('utf8'),
                  duration: Date.now() - startTime
                });
              } else if (Date.now() - startTime < timeout) {
                // Still running, check again
                setTimeout(checkStatus, 1000);
              } else {
                reject(new Error('Guest exec status timeout'));
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse guest-exec-status: ${parseError.message}`));
            }
          } else {
            reject(new Error(`guest-exec-status failed: ${stderr}`));
          }
        });

        exec.on('error', (error) => {
          reject(new Error(`guest-exec-status error: ${error.message}`));
        });
      };

      checkStatus();
    });
  }

  /**
   * Execute command via SSH (fallback method)
   */
  async execViaSsh(vm, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.defaultTimeout;

      if (!vm.sshConfig) {
        reject(new Error('SSH not configured for VM. Use guest-agent method or configure SSH.'));
        return;
      }

      const sshArgs = [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', `ConnectTimeout=${Math.floor(timeout / 1000)}`,
        `${vm.sshConfig.user}@${vm.sshConfig.host}`
      ];

      if (vm.sshConfig.port) {
        sshArgs.unshift('-p', vm.sshConfig.port.toString());
      }

      if (vm.sshConfig.keyFile) {
        sshArgs.unshift('-i', vm.sshConfig.keyFile);
      }

      sshArgs.push(command);

      const exec = this.spawn('ssh', sshArgs, {
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
        reject(new Error(`SSH command timeout after ${timeout}ms`));
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
        reject(new Error(`SSH execution error: ${error.message}`));
      });
    });
  }

  /**
   * Execute command via serial console (low-level fallback)
   */
  async execViaSerial(vm, command, options = {}) {
    return new Promise((resolve, reject) => {
      // This is a placeholder for serial console execution
      // Real implementation would connect to VM's serial console
      // and send commands, then parse output

      reject(new Error('Serial console execution not yet implemented. Use guest-agent or ssh method.'));
    });
  }

  /**
   * Copy file to VM via SCP (simplified)
   */
  async copyToVM(vmName, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      // Simulate SCP copy operation
      const copy = this.spawn('echo', [`Simulated copy ${localPath} to ${vmName}:${remotePath}`], {
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
   * Copy file from VM via SCP (simplified)
   */
  async copyFromVM(vmName, remotePath, localPath) {
    return new Promise((resolve, reject) => {
      // Simulate SCP copy operation
      const copy = this.spawn('echo', [`Simulated copy ${vmName}:${remotePath} to ${localPath}`], {
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
   * Write content to file in VM via SSH (simplified)
   */
  async writeToVM(vmName, remotePath, content) {
    return new Promise((resolve, reject) => {
      // Simulate writing content to VM
      const write = this.spawn('echo', [`Simulated write to ${vmName}:${remotePath}`], {
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
   * Execute QEMU command
   */
  async execQemuCommand(args, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      const child = this.spawn('qemu-system-x86_64', args, {
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
        reject(new Error(`QEMU command failed: ${error.message}`));
      });

      // Set timeout
      if (timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`QEMU command timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Execute generic command
   */
  async execCommand(command, args, options = {}) {
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
        reject(new Error(`Command failed: ${error.message}`));
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
   * Kill QEMU VM by reading PID file
   */
  async killQemuVM(vmName) {
    const vm = this.activeVMs.get(vmName);
    if (!vm || !vm.pidFile) {
      throw new Error(`VM ${vmName} PID file not found`);
    }

    try {
      const pid = this.fs.readFileSync(vm.pidFile, 'utf8').trim();
      return await this.execCommand('kill', [pid]);
    } catch (error) {
      throw new Error(`Failed to kill VM ${vmName}: ${error.message}`);
    }
  }

  /**
   * Get next available VNC port
   */
  getNextVNCPort() {
    const usedPorts = new Set();
    for (const vm of this.activeVMs.values()) {
      if (vm.vncPort) {
        usedPorts.add(vm.vncPort);
      }
    }

    for (let port = 1; port <= 99; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    return 1; // fallback
  }

  /**
   * Enhanced security validation for VM parameters
   */
  validateVMSecurity(params) {
    const violations = [];

    // Validate memory limits
    if (params.memory) {
      const memoryLimit = this.parseMemoryLimit(params.memory);
      const maxMemoryLimit = this.parseMemoryLimit(this.securityPolicies.maxMemory);
      if (memoryLimit > maxMemoryLimit) {
        violations.push(`Memory limit ${params.memory} exceeds maximum allowed ${this.securityPolicies.maxMemory}`);
      }
    }

    // Validate CPU limits
    if (params.cpus) {
      const cpuLimit = parseFloat(params.cpus);
      const maxCpuLimit = parseFloat(this.securityPolicies.maxCpus);
      if (cpuLimit > maxCpuLimit) {
        violations.push(`CPU limit ${params.cpus} exceeds maximum allowed ${this.securityPolicies.maxCpus}`);
      }
    }

    // Validate disk paths
    if (params.disk) {
      if (!this.validateVolumePath(params.disk)) {
        violations.push(`Disk path ${params.disk} not allowed by security policy`);
      }
    }

    return violations;
  }

  /**
   * Audit security events for compliance
   */
  auditSecurityEvent(event, details) {
    this.sharedAuditSecurityEvent(event, details, this.securityMode, this.auditLog, this.log);
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
        if (health.status === 'unhealthy' || health.status === 'exited') {
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
      const vm = this.activeVMs.get(vmName);
      if (!vm || !vm.pidFile) {
        return {
          status: 'unknown',
          running: false,
          pid: 0,
          memory: '0MB',
          cpu: '0%',
          uptime: '0s'
        };
      }

      // Check if PID file exists and process is running
      if (this.fs.existsSync(vm.pidFile)) {
        const pid = this.fs.readFileSync(vm.pidFile, 'utf8').trim();
        const psResult = await this.execCommand('ps', ['-p', pid]);

        if (psResult.exitCode === 0) {
          return {
            status: 'running',
            running: true,
            pid: parseInt(pid),
            memory: '0MB', // Would need more complex logic to get actual stats
            cpu: '0%',
            uptime: this.calculateUptime(new Date(vm.created).getTime())
          };
        }
      }

      return {
        status: 'stopped',
        running: false,
        pid: 0,
        memory: '0MB',
        cpu: '0%',
        uptime: '0s'
      };
    } catch (error) {
      this.log('health_check_failed', { vm: vmName, error: error.message });
      return {
        status: 'unknown',
        running: false,
        pid: 0,
        memory: '0MB',
        cpu: '0%',
        uptime: '0s'
      };
    }
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

      // Simulate execution with progress monitoring
      let stdout = 'Simulated progress execution output';
      let stderr = '';

      // Parse CHECKPOINT outputs for progress monitoring
      if (options.progressCallback && stdout.includes('CHECKPOINT')) {
        this.parseCheckpointOutput(stdout, options.progressCallback);
      }

      const duration = Date.now() - startTime;

      setTimeout(() => {
        resolve({
          exitCode: 0,
          stdout,
          stderr,
          duration
        });
      }, 100);
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
let qemuHandlerInstance = null;

// QEMU ADDRESS metadata function
function QEMU_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    type: 'address-target',
    name: 'ADDRESS QEMU Virtual Machine Service',
    version: '1.0.0',
    description: 'QEMU/KVM virtual machine operations via ADDRESS interface',
    provides: {
      addressTarget: 'qemu',
      handlerFunction: 'ADDRESS_QEMU_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: {
      "child_process": "builtin"
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['child_process']
    }
  };
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_QEMU_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize handler instance if not exists
  if (!qemuHandlerInstance) {
    qemuHandlerInstance = new AddressQemuHandler();
    await qemuHandlerInstance.initialize();
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
    const result = await qemuHandlerInstance.handleAddressCommand(commandString, context);

    // Convert to REXX-style result
    return {
      success: result.success,
      errorCode: result.success ? 0 : 1,
      errorMessage: result.error || null,
      output: result.output || '',
      result: result,
      rexxVariables: {
        'QEMU_OPERATION': result.operation || '',
        'QEMU_VM': result.vm || '',
        'QEMU_STATUS': result.status || '',
        'QEMU_COUNT': result.count || 0,
        'QEMU_EXIT_CODE': result.exitCode || 0,
        'QEMU_STDOUT': result.stdout || '',
        'QEMU_STDERR': result.stderr || '',
        'QEMU_BINARY': result.binary || '',
        'QEMU_TARGET': result.target || '',
        'QEMU_SNAPSHOT': result.snapshot || ''
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
        'QEMU_ERROR': error.message
      }
    };
  }
}

// Method names for RexxJS method detection
const ADDRESS_QEMU_METHODS = {
  'status': 'Get QEMU handler status',
  'list': 'List virtual machines',
  'create': 'Create a new VM [memory=2G] [cpus=2] [disk=path] [network=user]',
  'start': 'Start a virtual machine',
  'stop': 'Stop a virtual machine',
  'start_if_stopped': 'Start VM only if not already running (idempotent)',
  'stop_if_running': 'Stop VM only if running (idempotent)',
  'restart': 'Restart a virtual machine (stop then start)',
  'pause': 'Pause a running virtual machine (via virsh suspend)',
  'resume': 'Resume a paused virtual machine (via virsh resume)',
  'save_state': 'Save VM state and stop (via virsh managedsave)',
  'restore_state': 'Restore VM from saved state (via virsh start)',
  'remove': 'Remove a virtual machine',
  'deploy_rexx': 'Deploy RexxJS binary to VM',
  'execute': 'Execute command in VM [method=guest-agent|ssh|serial]',
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
  'install_guest_agent': 'Install QEMU Guest Agent in VM',
  'download_iso': 'Download OS ISO [os_type]',
  'list_ostypes': 'List available QEMU/KVM OS types',
  'setup_permissions': 'Setup QEMU/KVM permissions for user',
  'verify_host': 'Verify host system QEMU/KVM setup',
  'configure_network': 'Configure VM network [type=user|bridge|tap] [bridge_name] [tap_name]',
  'attach_iso': 'Attach ISO to VM',
  'detach_iso': 'Detach ISO from VM',
  'configure_ssh': 'Configure SSH access for VM [port=22] [user=root] [key_file]'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    QEMU_ADDRESS_META,
    ADDRESS_QEMU_HANDLER,
    ADDRESS_QEMU_METHODS,
    AddressQemuHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.QEMU_ADDRESS_META = QEMU_ADDRESS_META;
  window.ADDRESS_QEMU_HANDLER = ADDRESS_QEMU_HANDLER;
  window.ADDRESS_QEMU_METHODS = ADDRESS_QEMU_METHODS;
}