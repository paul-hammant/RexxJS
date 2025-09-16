/**
 * SSH Remote Handler - EFS2-Inspired Direct SSH Management
 * Provides direct SSH-based post-provision management of remote hosts
 * 
 * Usage:
 * ADDRESS ssh-remote
 * run hosts="server1,server2" command="apt update && apt install -y nginx" parallel=true
 * put hosts="web01" local="/path/to/config" remote="/etc/nginx/nginx.conf" mode="644"
 * deploy_rexx hosts="server1,server2" rexx_binary="/path/to/rexx-linux-x64"
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity, executeOnHosts, createResource } = require('../../../core/src/address-handler-utils');

// Helper function for logging with EFS2-style progress reporting
function log(operation, details, level = 'info') {
  logActivity('SSH-REMOTE', operation, details, level);
}

class SshRemoteHandler {
  constructor() {
    this.activeConnections = new Map();
    this.defaultTimeout = 30000; // 30 seconds
    this.maxHosts = 50;
    
    // SSH configuration
    this.sshUser = process.env.USER || 'root';
    this.sshPort = 22;
    this.sshKey = `${process.env.HOME}/.ssh/id_rsa`;
    this.sshOptions = [
      '-o', 'ConnectTimeout=10',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'LogLevel=ERROR'
    ];
    
    // Security settings
    this.securityMode = 'moderate';
    this.allowedCommands = new Set();
    this.trustedHosts = new Set();
  }

  /**
   * Initialize handler with SSH configuration
   */
  async initialize(config = {}) {
    this.sshUser = config.user || this.sshUser;
    this.sshPort = config.port || this.sshPort;
    this.sshKey = config.keyFile || this.sshKey;
    this.securityMode = config.securityMode || 'moderate';
    this.maxHosts = config.maxHosts || 50;
    this.defaultTimeout = config.timeout || 30000;
    
    if (config.allowedCommands) {
      this.allowedCommands = new Set(config.allowedCommands);
    }
    if (config.trustedHosts) {
      this.trustedHosts = new Set(config.trustedHosts);
    }
    
    log('initialize', {
      user: this.sshUser,
      port: this.sshPort,
      securityMode: this.securityMode,
      maxHosts: this.maxHosts
    });
  }

  /**
   * Handle ADDRESS ssh-remote commands
   */
  async handleMessage(message, context) {
    try {
      const command = message.trim();
      const args = this.parseCommand(command);
      
      log('command', { command, args });

      switch (args.operation) {
        case 'run':
          return await this.handleRun(args, context);
        case 'put':
          return await this.handlePut(args, context);
        case 'deploy_rexx':
          return await this.handleDeployRexx(args, context);
        case 'parallel_run':
          return await this.handleParallelRun(args, context);
        default:
          throw new Error(`Unknown ssh-remote operation: ${args.operation}`);
      }
    } catch (error) {
      log('error', { error: error.message, command: message }, 'error');
      throw error;
    }
  }

  /**
   * Parse command into operation and parameters
   */
  parseCommand(command) {
    const trimmed = command.trim();
    const spaceIndex = trimmed.indexOf(' ');
    
    if (spaceIndex === -1) {
      return { operation: trimmed.toLowerCase() };
    }
    
    const operation = trimmed.substring(0, spaceIndex).toLowerCase();
    const paramStr = trimmed.substring(spaceIndex + 1);
    const args = { operation };
    
    // Parse parameters with quoted value support
    const paramRegex = /(\w+)=("(?:[^"\\]|\\.)*"|[^\s]+)/g;
    let match;
    
    while ((match = paramRegex.exec(paramStr)) !== null) {
      const [, key, value] = match;
      // Remove surrounding quotes if present
      args[key] = value.replace(/^"(.*)"$/, '$1');
    }

    return args;
  }

  /**
   * Handle run command - execute commands on remote hosts
   * run hosts="server1,server2" command="apt update" parallel=false timeout=30000
   */
  async handleRun(args, context) {
    const { hosts: hostsStr, command: cmd, parallel = 'false', timeout } = args;

    if (!hostsStr || !cmd) {
      throw new Error('run requires hosts and command parameters');
    }

    const hosts = hostsStr.split(',').map(h => h.trim());
    const interpolatedCmd = await interpolateMessage(cmd, context);
    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;
    const isParallel = parallel === 'true';

    // Security validation
    if (!this.validateCommand(interpolatedCmd)) {
      throw new Error(`Command not allowed by security policy: ${interpolatedCmd}`);
    }

    if (hosts.length > this.maxHosts) {
      throw new Error(`Too many hosts (${hosts.length}), maximum allowed: ${this.maxHosts}`);
    }

    // Execute on hosts using EFS2-inspired progress reporting
    const results = await executeOnHosts('SSH-REMOTE', hosts, async (host) => {
      return await this.executeCommandOnHost(host, interpolatedCmd, execTimeout);
    }, { 
      parallel: isParallel, 
      taskDescription: `executing "${interpolatedCmd.substring(0, 50)}..."` 
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: failureCount === 0,
      totalHosts: hosts.length,
      successCount,
      failureCount,
      results,
      command: interpolatedCmd,
      message: failureCount === 0 
        ? `Command executed successfully on all ${hosts.length} hosts`
        : `Command completed with ${failureCount} failures out of ${hosts.length} hosts`
    };
  }

  /**
   * Handle put command - upload files to remote hosts
   * put hosts="server1" local="/path/to/file" remote="/remote/path" mode="644"
   */
  async handlePut(args, context) {
    const { hosts: hostsStr, local, remote, mode = '644' } = args;

    if (!hostsStr || !local || !remote) {
      throw new Error('put requires hosts, local, and remote parameters');
    }

    const hosts = hostsStr.split(',').map(h => h.trim());
    const interpolatedLocal = await interpolateMessage(local, context);
    const interpolatedRemote = await interpolateMessage(remote, context);

    // Check if local file exists
    if (!fs.existsSync(interpolatedLocal)) {
      throw new Error(`Local file not found: ${interpolatedLocal}`);
    }

    // Execute file uploads using EFS2-inspired progress reporting
    const results = await executeOnHosts('SSH-REMOTE', hosts, async (host) => {
      // SCP file upload
      await this.uploadFileToHost(host, interpolatedLocal, interpolatedRemote);
      
      // Set file permissions
      if (mode !== '644') {
        await this.executeCommandOnHost(host, `chmod ${mode} "${interpolatedRemote}"`);
      }
      
      return { localPath: interpolatedLocal, remotePath: interpolatedRemote, mode };
    }, { 
      parallel: false, // File uploads typically better sequential
      taskDescription: `uploading ${path.basename(interpolatedLocal)}`
    });

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount === hosts.length,
      totalHosts: hosts.length,
      successCount,
      localPath: interpolatedLocal,
      remotePath: interpolatedRemote,
      mode,
      results,
      message: `File upload completed: ${successCount}/${hosts.length} hosts successful`
    };
  }

  /**
   * Handle deploy_rexx command - deploy RexxJS binary to remote hosts
   * deploy_rexx hosts="server1,server2" rexx_binary="/path/to/rexx-linux-x64" target_path="/usr/local/bin/rexx"
   */
  async handleDeployRexx(args, context) {
    const { hosts: hostsStr, rexx_binary, target_path = '/usr/local/bin/rexx' } = args;

    if (!hostsStr || !rexx_binary) {
      throw new Error('deploy_rexx requires hosts and rexx_binary parameters');
    }

    const hosts = hostsStr.split(',').map(h => h.trim());
    const interpolatedBinary = await interpolateMessage(rexx_binary, context);
    const interpolatedTarget = await interpolateMessage(target_path, context);

    // Check if binary exists
    if (!fs.existsSync(interpolatedBinary)) {
      throw new Error(`RexxJS binary not found: ${interpolatedBinary}`);
    }

    // Deploy RexxJS using EFS2-inspired progress reporting
    const results = await executeOnHosts('SSH-REMOTE', hosts, async (host) => {
      // Upload RexxJS binary
      await this.uploadFileToHost(host, interpolatedBinary, interpolatedTarget);
      
      // Make executable
      await this.executeCommandOnHost(host, `chmod +x "${interpolatedTarget}"`);
      
      // Test binary
      const testResult = await this.executeCommandOnHost(host, `"${interpolatedTarget}" --help`);
      
      return { 
        binaryPath: interpolatedBinary, 
        targetPath: interpolatedTarget,
        testOutput: testResult.stdout 
      };
    }, { 
      parallel: false,
      taskDescription: 'deploying RexxJS binary'
    });

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount === hosts.length,
      totalHosts: hosts.length,
      successCount,
      binaryPath: interpolatedBinary,
      targetPath: interpolatedTarget,
      results,
      message: `RexxJS deployment completed: ${successCount}/${hosts.length} hosts successful`
    };
  }

  /**
   * Execute command on a single host via SSH
   */
  async executeCommandOnHost(host, command, timeout = this.defaultTimeout) {
    return new Promise((resolve, reject) => {
      const sshArgs = [
        ...this.sshOptions,
        '-p', this.sshPort.toString(),
        '-i', this.sshKey,
        `${this.sshUser}@${host}`,
        command
      ];

      const ssh = spawn('ssh', sshArgs, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      ssh.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ssh.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ssh.on('close', (code) => {
        if (code === 0) {
          resolve({ exitCode: code, stdout, stderr });
        } else {
          reject(new Error(`SSH command failed (exit ${code}): ${stderr || 'No error message'}`));
        }
      });

      ssh.on('error', (error) => {
        reject(new Error(`SSH connection failed: ${error.message}`));
      });

      // Set timeout
      const timer = setTimeout(() => {
        ssh.kill();
        reject(new Error(`SSH command timed out after ${timeout}ms`));
      }, timeout);

      ssh.on('close', () => clearTimeout(timer));
    });
  }

  /**
   * Upload file to host via SCP
   */
  async uploadFileToHost(host, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      const scpArgs = [
        ...this.sshOptions,
        '-P', this.sshPort.toString(),
        '-i', this.sshKey,
        localPath,
        `${this.sshUser}@${host}:${remotePath}`
      ];

      const scp = spawn('scp', scpArgs, { stdio: 'pipe' });

      let stderr = '';

      scp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      scp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`SCP upload failed (exit ${code}): ${stderr}`));
        }
      });

      scp.on('error', (error) => {
        reject(new Error(`SCP connection failed: ${error.message}`));
      });
    });
  }

  /**
   * Validate command against security policy
   */
  validateCommand(command) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.allowedCommands.has(command);
    }
    
    // Moderate mode: block dangerous commands
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,        // rm -rf / or /something
      /dd\s+.*of=\/dev/,      // dd to device
      /mkfs\./,               // filesystem creation
      /fdisk/,                // disk partitioning
      /crontab\s+-r/,         // crontab removal
      />\s*\/dev\/sd[a-z]/    // redirect to disk device
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(command));
  }

  /**
   * Validate host against security policy
   */
  validateHost(host) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.trustedHosts.has(host);
    }
    
    // Moderate mode: basic validation
    return /^[a-zA-Z0-9\.\-]+$/.test(host); // Basic hostname validation
  }
}

module.exports = SshRemoteHandler;