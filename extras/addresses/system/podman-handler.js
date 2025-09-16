/**
 * Podman Container Management Address Handler
 * Provides podman containerization operations for RexxJS SCRO
 * 
 * Usage:
 * ADDRESS podman
 * create image="debian:stable" name="rexx-worker" interactive=true
 * deploy_rexx container="rexx-worker" rexx_binary="/path/to/rexx-linux-x64"
 * execute container="rexx-worker" script="SAY 'Hello from container'"
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
  logActivity('PODMAN', operation, details);
}

class PodmanHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 0;
    this.defaultTimeout = 60000; // 60 seconds
    this.maxContainers = 20;
    
    // Runtime selection (podman preferred)
    this.runtime = null;
    this.runtimeArgs = {};
    
    // Security settings
    this.allowedImages = new Set();
    this.trustedBinaries = new Set();
    this.securityMode = 'moderate'; // strict, moderate, permissive
    this.resourceLimits = {
      memory: '512m',
      cpus: '1.0',
      maxRuntime: 3600000 // 1 hour max
    };
  }

  /**
   * Initialize handler with container runtime detection and configuration
   */
  async initialize(config = {}) {
    this.securityMode = config.securityMode || 'moderate';
    this.allowedImages = new Set(config.allowedImages || ['debian:stable', 'ubuntu:latest', 'alpine:latest']);
    this.trustedBinaries = new Set(config.trustedBinaries || []);
    this.maxContainers = config.maxContainers || 20;
    this.defaultTimeout = config.defaultTimeout || 60000;
    this.resourceLimits = { ...this.resourceLimits, ...config.resourceLimits };

    // Detect container runtime
    await this.detectRuntime();
    
    log('ADDRESS:CONTAINER', {
      timestamp: new Date().toISOString(),
      action: 'initialize',
      runtime: this.runtime,
      securityMode: this.securityMode,
      allowedImages: Array.from(this.allowedImages),
      maxContainers: this.maxContainers
    });
  }

  /**
   * Initialize podman runtime (podman-specific handler)
   */
  async detectRuntime() {
    try {
      await this.testRuntime('podman');
      this.runtime = 'podman';
      this.runtimeArgs = {
        runArgs: ['--rm', '--interactive'],
        execArgs: ['--interactive']
      };
      return;
    } catch (error) {
      throw new Error('Podman runtime not found or not available');
    }
  }

  /**
   * Test if container runtime is available
   */
  async testRuntime(runtime) {
    return new Promise((resolve, reject) => {
      const test = spawn(runtime, ['--version'], { stdio: 'pipe' });
      
      test.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${runtime} not available`));
        }
      });

      test.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Handle ADDRESS container commands
   */
  async handleMessage(message, context) {
    try {
      if (!this.runtime) {
        await this.detectRuntime();
      }

      const command = message.trim();
      const args = this.parseCommand(command);
      
      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'command',
        command: command,
        args: args
      });

      switch (args.operation) {
        case 'create':
          return await this.handleCreate(args, context);
        case 'deploy_rexx':
          return await this.handleDeployRexx(args, context);
        case 'execute':
          return await this.handleExecute(args, context);
        case 'execute_rexx':
          return await this.handleExecuteRexx(args, context);
        case 'copy_to':
          return await this.handleCopyTo(args, context);
        case 'copy_from':
          return await this.handleCopyFrom(args, context);
        case 'stop':
          return await this.handleStop(args, context);
        case 'remove':
          return await this.handleRemove(args, context);
        case 'list':
          return await this.handleList(args, context);
        case 'logs':
          return await this.handleLogs(args, context);
        case 'cleanup':
          return await this.handleCleanup(args, context);
        default:
          throw new Error(`Unknown container operation: ${args.operation}`);
      }
    } catch (error) {
      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'error',
        error: error.message,
        command: message
      });
      throw error;
    }
  }

  /**
   * Parse command into operation and parameters
   */
  parseCommand(command) {
    const parts = command.split(/\s+/);
    const operation = parts[0].toLowerCase();
    const args = { operation };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        args[key] = valueParts.join('=').replace(/^"(.*)"$/, '$1'); // Remove quotes
      }
    }

    return args;
  }

  /**
   * Handle create command
   * create image="debian:stable" name="rexx-worker" interactive=true [memory="512m"] [cpus="1.0"]
   */
  async handleCreate(args, context) {
    const { image, name, interactive = 'false', memory, cpus, volumes, environment } = args;

    if (!image) {
      throw new Error('create requires image parameter');
    }

    // Security validation
    if (!this.validateImage(image)) {
      throw new Error(`Image ${image} not allowed by security policy`);
    }

    // Check container limits
    if (this.activeContainers.size >= this.maxContainers) {
      throw new Error(`Maximum containers (${this.maxContainers}) reached`);
    }

    // Interpolate variables
    const interpolatedImage = await interpolateMessage(image, context);
    const containerName = name || `rexx-container-${++this.containerCounter}`;
    const interpolatedName = await interpolateMessage(containerName, context);

    const containerInfo = {
      id: interpolatedName,
      image: interpolatedImage,
      name: interpolatedName,
      interactive: interactive === 'true',
      createdAt: new Date(),
      status: 'created',
      runtime: this.runtime,
      process: null,
      rexxDeployed: false
    };

    // Build container run command
    const runArgs = [...this.runtimeArgs.runArgs];
    
    // Add resource limits
    if (memory || this.resourceLimits.memory) {
      runArgs.push('--memory', memory || this.resourceLimits.memory);
    }
    if (cpus || this.resourceLimits.cpus) {
      runArgs.push('--cpus', cpus || this.resourceLimits.cpus);
    }

    // Add name
    runArgs.push('--name', interpolatedName);

    // Add volumes if specified
    if (volumes) {
      const volumeMounts = volumes.split(',');
      for (const mount of volumeMounts) {
        runArgs.push('-v', mount.trim());
      }
    }

    // Add environment variables if specified
    if (environment) {
      const envVars = environment.split(',');
      for (const envVar of envVars) {
        runArgs.push('-e', envVar.trim());
      }
    }

    // Add detach flag if not interactive
    if (!containerInfo.interactive) {
      runArgs.push('-d');
    }

    runArgs.push(interpolatedImage);

    // If interactive, add bash
    if (containerInfo.interactive) {
      runArgs.push('bash');
    }

    try {
      // Create container
      const containerProcess = spawn(this.runtime, ['run', ...runArgs], {
        stdio: containerInfo.interactive ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
      });

      containerInfo.process = containerProcess;
      containerInfo.status = 'running';

      this.activeContainers.set(interpolatedName, containerInfo);

      // Setup process handlers
      this.setupContainerHandlers(containerInfo);

      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'create_success',
        containerId: interpolatedName,
        image: interpolatedImage,
        interactive: containerInfo.interactive
      });

      return {
        success: true,
        containerId: interpolatedName,
        image: interpolatedImage,
        interactive: containerInfo.interactive,
        status: 'running',
        message: `Container ${interpolatedName} created and running`
      };
    } catch (error) {
      throw new Error(`Container creation failed: ${error.message}`);
    }
  }

  /**
   * Handle deploy_rexx command  
   * deploy_rexx container="rexx-worker" rexx_binary="/path/to/rexx-linux-x64" [target_path="/usr/local/bin/rexx"]
   */
  async handleDeployRexx(args, context) {
    const { container, rexx_binary, target_path = '/usr/local/bin/rexx' } = args;

    if (!container || !rexx_binary) {
      throw new Error('deploy_rexx requires container and rexx_binary parameters');
    }

    const containerInfo = this.getContainer(container);
    const interpolatedBinary = await interpolateMessage(rexx_binary, context);
    const interpolatedTarget = await interpolateMessage(target_path, context);

    // Security validation
    if (!this.validateBinaryPath(interpolatedBinary)) {
      throw new Error(`RexxJS binary path ${interpolatedBinary} not trusted by security policy`);
    }

    // Check if binary exists
    if (!fs.existsSync(interpolatedBinary)) {
      throw new Error(`RexxJS binary not found: ${interpolatedBinary}`);
    }

    try {
      // Copy binary to container
      await this.copyToContainer(containerInfo, interpolatedBinary, interpolatedTarget);
      
      // Make executable
      await this.executeInContainer(containerInfo, `chmod +x ${interpolatedTarget}`, { timeout: 5000 });

      // Test binary
      const testResult = await this.executeInContainer(containerInfo, `${interpolatedTarget} --help`, { timeout: 10000 });
      
      if (testResult.exitCode !== 0) {
        throw new Error(`RexxJS binary test failed: ${testResult.stderr}`);
      }

      containerInfo.rexxDeployed = true;
      containerInfo.rexxPath = interpolatedTarget;

      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'deploy_rexx_success',
        containerId: containerInfo.id,
        binaryPath: interpolatedBinary,
        targetPath: interpolatedTarget
      });

      return {
        success: true,
        containerId: containerInfo.id,
        binaryPath: interpolatedBinary,
        targetPath: interpolatedTarget,
        message: `RexxJS deployed to ${containerInfo.id}:${interpolatedTarget}`
      };
    } catch (error) {
      throw new Error(`RexxJS deployment failed: ${error.message}`);
    }
  }

  /**
   * Handle execute command
   * execute container="rexx-worker" command="ls -la" [timeout=30000] [working_dir="/tmp"]
   */
  async handleExecute(args, context) {
    const { container, command: cmd, timeout, working_dir } = args;

    if (!container || !cmd) {
      throw new Error('execute requires container and command parameters');
    }

    const containerInfo = this.getContainer(container);
    const interpolatedCmd = await interpolateMessage(cmd, context);
    const interpolatedDir = working_dir ? await interpolateMessage(working_dir, context) : null;
    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;

    let fullCommand = interpolatedCmd;
    if (interpolatedDir) {
      fullCommand = `cd "${interpolatedDir}" && ${interpolatedCmd}`;
    }

    try {
      const result = await this.executeInContainer(containerInfo, fullCommand, { timeout: execTimeout });

      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'execute_success',
        containerId: containerInfo.id,
        command: interpolatedCmd,
        exitCode: result.exitCode
      });

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        command: interpolatedCmd,
        containerId: containerInfo.id,
        duration: result.duration
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Handle execute_rexx command with CHECKPOINT support
   * execute_rexx container="rexx-worker" script="SAY 'Hello'" [timeout=30000] [progress_callback=true]
   */
  async handleExecuteRexx(args, context) {
    const { container, script, timeout, progress_callback = 'false', script_file } = args;

    if (!container || (!script && !script_file)) {
      throw new Error('execute_rexx requires container and (script or script_file) parameters');
    }

    const containerInfo = this.getContainer(container);
    
    if (!containerInfo.rexxDeployed) {
      throw new Error(`RexxJS not deployed in container ${container}. Use deploy_rexx first.`);
    }

    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;
    const enableProgressCallback = progress_callback === 'true';

    let rexxScript;
    if (script_file) {
      // Read script from file
      const interpolatedFile = await interpolateMessage(script_file, context);
      if (!fs.existsSync(interpolatedFile)) {
        throw new Error(`Script file not found: ${interpolatedFile}`);
      }
      rexxScript = fs.readFileSync(interpolatedFile, 'utf8');
    } else {
      rexxScript = await interpolateMessage(script, context);
    }

    try {
      let result;
      
      if (enableProgressCallback) {
        // Execute with streaming progress updates
        result = await this.executeRexxWithProgress(containerInfo, rexxScript, {
          timeout: execTimeout,
          progressCallback: (checkpoint, params) => {
            log('ADDRESS:CONTAINER', {
              timestamp: new Date().toISOString(),
              action: 'rexx_progress',
              containerId: containerInfo.id,
              checkpoint,
              params
            });
          }
        });
      } else {
        // Simple execution
        const tempScript = `/tmp/rexx_script_${Date.now()}.rexx`;
        await this.writeToContainer(containerInfo, tempScript, rexxScript);
        
        result = await this.executeInContainer(
          containerInfo, 
          `${containerInfo.rexxPath} ${tempScript}`, 
          { timeout: execTimeout }
        );

        // Cleanup temp script
        await this.executeInContainer(containerInfo, `rm -f ${tempScript}`, { timeout: 5000 });
      }

      log('ADDRESS:CONTAINER', {
        timestamp: new Date().toISOString(),
        action: 'execute_rexx_success',
        containerId: containerInfo.id,
        exitCode: result.exitCode,
        scriptLength: rexxScript.length
      });

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        containerId: containerInfo.id,
        duration: result.duration,
        scriptLength: rexxScript.length
      };
    } catch (error) {
      throw new Error(`RexxJS execution failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_to command
   * copy_to container="rexx-worker" local="/path/to/file" remote="/container/path"
   */
  async handleCopyTo(args, context) {
    const { container, local, remote } = args;

    if (!container || !local || !remote) {
      throw new Error('copy_to requires container, local, and remote parameters');
    }

    const containerInfo = this.getContainer(container);
    const interpolatedLocal = await interpolateMessage(local, context);
    const interpolatedRemote = await interpolateMessage(remote, context);

    try {
      await this.copyToContainer(containerInfo, interpolatedLocal, interpolatedRemote);

      return {
        success: true,
        containerId: containerInfo.id,
        localPath: interpolatedLocal,
        remotePath: interpolatedRemote,
        message: `Copied ${interpolatedLocal} to ${containerInfo.id}:${interpolatedRemote}`
      };
    } catch (error) {
      throw new Error(`Copy to container failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_from command
   * copy_from container="rexx-worker" remote="/container/path" local="/path/to/file"
   */
  async handleCopyFrom(args, context) {
    const { container, remote, local } = args;

    if (!container || !remote || !local) {
      throw new Error('copy_from requires container, remote, and local parameters');
    }

    const containerInfo = this.getContainer(container);
    const interpolatedRemote = await interpolateMessage(remote, context);
    const interpolatedLocal = await interpolateMessage(local, context);

    try {
      await this.copyFromContainer(containerInfo, interpolatedRemote, interpolatedLocal);

      return {
        success: true,
        containerId: containerInfo.id,
        remotePath: interpolatedRemote,
        localPath: interpolatedLocal,
        message: `Copied ${containerInfo.id}:${interpolatedRemote} to ${interpolatedLocal}`
      };
    } catch (error) {
      throw new Error(`Copy from container failed: ${error.message}`);
    }
  }

  /**
   * Handle stop command
   * stop container="rexx-worker" [force=false]
   */
  async handleStop(args, context) {
    const { container, force = 'false' } = args;

    if (!container) {
      throw new Error('stop requires container parameter');
    }

    const containerInfo = this.getContainer(container);

    try {
      if (force === 'true') {
        await this.killContainer(containerInfo);
      } else {
        await this.stopContainer(containerInfo);
      }

      containerInfo.status = 'stopped';

      return {
        success: true,
        containerId: containerInfo.id,
        message: `Container ${containerInfo.id} stopped`
      };
    } catch (error) {
      throw new Error(`Container stop failed: ${error.message}`);
    }
  }

  /**
   * Handle remove command
   * remove container="rexx-worker" [force=false]
   */
  async handleRemove(args, context) {
    const { container, force = 'false' } = args;

    if (!container) {
      throw new Error('remove requires container parameter');
    }

    const containerInfo = this.getContainer(container);

    try {
      if (containerInfo.status === 'running' && force === 'true') {
        await this.killContainer(containerInfo);
      }

      await this.removeContainer(containerInfo);
      this.activeContainers.delete(containerInfo.id);

      return {
        success: true,
        containerId: containerInfo.id,
        message: `Container ${containerInfo.id} removed`
      };
    } catch (error) {
      throw new Error(`Container remove failed: ${error.message}`);
    }
  }

  /**
   * Handle list command
   */
  async handleList(args, context) {
    const containers = Array.from(this.activeContainers.values()).map(container => ({
      id: container.id,
      image: container.image,
      status: container.status,
      interactive: container.interactive,
      rexxDeployed: container.rexxDeployed,
      createdAt: container.createdAt.toISOString()
    }));

    return {
      success: true,
      containers,
      count: containers.length,
      runtime: this.runtime
    };
  }

  /**
   * Handle logs command
   * logs container="rexx-worker" [lines=50]
   */
  async handleLogs(args, context) {
    const { container, lines = '50' } = args;

    if (!container) {
      throw new Error('logs requires container parameter');
    }

    const containerInfo = this.getContainer(container);

    try {
      const result = await this.getContainerLogs(containerInfo, parseInt(lines));

      return {
        success: true,
        containerId: containerInfo.id,
        logs: result.stdout,
        lines: parseInt(lines)
      };
    } catch (error) {
      throw new Error(`Get container logs failed: ${error.message}`);
    }
  }

  /**
   * Handle cleanup command
   * cleanup [all=false]
   */
  async handleCleanup(args, context) {
    const { all = 'false' } = args;

    try {
      let cleaned = 0;

      if (all === 'true') {
        // Remove all containers
        for (const [id, container] of this.activeContainers) {
          try {
            if (container.status === 'running') {
              await this.killContainer(container);
            }
            await this.removeContainer(container);
            this.activeContainers.delete(id);
            cleaned++;
          } catch (error) {
            log('ADDRESS:CONTAINER', {
              timestamp: new Date().toISOString(),
              action: 'cleanup_error',
              containerId: id,
              error: error.message
            });
          }
        }
      } else {
        // Remove only stopped containers
        for (const [id, container] of this.activeContainers) {
          if (container.status === 'stopped') {
            try {
              await this.removeContainer(container);
              this.activeContainers.delete(id);
              cleaned++;
            } catch (error) {
              log('ADDRESS:CONTAINER', {
                timestamp: new Date().toISOString(),
                action: 'cleanup_error',
                containerId: id,
                error: error.message
              });
            }
          }
        }
      }

      return {
        success: true,
        cleaned,
        remaining: this.activeContainers.size,
        message: `Cleaned up ${cleaned} containers`
      };
    } catch (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  // Helper methods (implementation details)...

  getContainer(containerId) {
    const container = this.activeContainers.get(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    return container;
  }

  validateImage(image) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.allowedImages.has(image);
    }
    
    // Moderate mode: allow common safe images
    const safeImages = ['debian', 'ubuntu', 'alpine', 'centos', 'fedora'];
    return safeImages.some(safe => image.startsWith(safe + ':')) || this.allowedImages.has(image);
  }

  validateBinaryPath(binaryPath) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.trustedBinaries.has(binaryPath);
    }
    
    // Moderate mode: allow current directory and build outputs
    const cwd = process.cwd();
    return binaryPath.startsWith(cwd) || binaryPath.includes('rexx-linux') || this.trustedBinaries.has(binaryPath);
  }

  setupContainerHandlers(containerInfo) {
    if (containerInfo.process) {
      containerInfo.process.on('close', (code) => {
        containerInfo.status = 'stopped';
        log('ADDRESS:CONTAINER', {
          timestamp: new Date().toISOString(),
          action: 'container_stopped',
          containerId: containerInfo.id,
          exitCode: code
        });
      });

      containerInfo.process.on('error', (error) => {
        containerInfo.status = 'error';
        log('ADDRESS:CONTAINER', {
          timestamp: new Date().toISOString(),
          action: 'container_error',
          containerId: containerInfo.id,
          error: error.message
        });
      });
    }
  }

  async executeInContainer(containerInfo, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const execArgs = [...this.runtimeArgs.execArgs, containerInfo.name, 'sh', '-c', command];

      const exec = spawn(this.runtime, ['exec', ...execArgs], {
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
        const duration = Date.now() - startTime;
        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration
        });
      });

      exec.on('error', (error) => {
        reject(new Error(`Container exec error: ${error.message}`));
      });

      if (options.timeout) {
        setTimeout(() => {
          exec.kill();
          reject(new Error(`Command timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  async copyToContainer(containerInfo, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      const cp = spawn(this.runtime, ['cp', localPath, `${containerInfo.name}:${remotePath}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';

      cp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      cp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Copy to container failed: ${stderr}`));
        }
      });

      cp.on('error', (error) => {
        reject(new Error(`Copy to container error: ${error.message}`));
      });
    });
  }

  async copyFromContainer(containerInfo, remotePath, localPath) {
    return new Promise((resolve, reject) => {
      const cp = spawn(this.runtime, ['cp', `${containerInfo.name}:${remotePath}`, localPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';

      cp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      cp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Copy from container failed: ${stderr}`));
        }
      });

      cp.on('error', (error) => {
        reject(new Error(`Copy from container error: ${error.message}`));
      });
    });
  }

  async writeToContainer(containerInfo, remotePath, content) {
    return new Promise((resolve, reject) => {
      const write = spawn(this.runtime, ['exec', '-i', containerInfo.name, 'sh', '-c', `cat > ${remotePath}`], {
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
          reject(new Error(`Write to container failed: ${stderr}`));
        }
      });

      write.on('error', (error) => {
        reject(new Error(`Write to container error: ${error.message}`));
      });
    });
  }

  async stopContainer(containerInfo) {
    return new Promise((resolve, reject) => {
      const stop = spawn(this.runtime, ['stop', containerInfo.name], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      stop.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Container stop failed'));
        }
      });

      stop.on('error', (error) => {
        reject(error);
      });
    });
  }

  async killContainer(containerInfo) {
    return new Promise((resolve, reject) => {
      const kill = spawn(this.runtime, ['kill', containerInfo.name], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      kill.on('close', (code) => {
        resolve(); // Don't fail if container was already stopped
      });

      kill.on('error', (error) => {
        resolve(); // Don't fail on kill errors
      });
    });
  }

  async removeContainer(containerInfo) {
    return new Promise((resolve, reject) => {
      const rm = spawn(this.runtime, ['rm', containerInfo.name], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      rm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Container remove failed'));
        }
      });

      rm.on('error', (error) => {
        reject(error);
      });
    });
  }

  async getContainerLogs(containerInfo, lines) {
    return new Promise((resolve, reject) => {
      const logs = spawn(this.runtime, ['logs', '--tail', lines.toString(), containerInfo.name], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      logs.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      logs.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      logs.on('close', (code) => {
        resolve({ stdout, stderr });
      });

      logs.on('error', (error) => {
        reject(error);
      });
    });
  }

  async executeRexxWithProgress(containerInfo, script, options = {}) {
    // This would implement CHECKPOINT-based progress monitoring
    // Similar to the streaming control pattern from the test files
    // For now, implement as simple execution
    const tempScript = `/tmp/rexx_script_progress_${Date.now()}.rexx`;
    await this.writeToContainer(containerInfo, tempScript, script);
    
    const result = await this.executeInContainer(
      containerInfo, 
      `${containerInfo.rexxPath} ${tempScript}`, 
      { timeout: options.timeout }
    );

    // Cleanup temp script
    await this.executeInContainer(containerInfo, `rm -f ${tempScript}`, { timeout: 5000 });
    
    return result;
  }
}

module.exports = PodmanHandler;