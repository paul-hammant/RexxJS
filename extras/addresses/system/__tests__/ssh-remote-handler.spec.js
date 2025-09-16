/**
 * SSH Remote Handler Tests
 * 
 * Tests for the EFS2-inspired SSH remote management handler
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const SshRemoteHandler = require("../ssh-remote-handler");

describe('SSH Remote Handler', () => {
  let handler;
  let originalConsoleLog;
  let originalConsoleError;
  let logOutput;
  let errorOutput;

  beforeEach(() => {
    handler = new SshRemoteHandler();
    
    // Capture console output for testing progress reporting
    logOutput = [];
    errorOutput = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = (msg) => logOutput.push(msg);
    console.error = (msg) => errorOutput.push(msg);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('initialization', () => {
    test('should initialize with default configuration', async () => {
      await handler.initialize();
      
      expect(handler.sshUser).toBeDefined();
      expect(handler.sshPort).toBe(22);
      expect(handler.maxHosts).toBe(50);
      expect(handler.securityMode).toBe('moderate');
    });

    test('should initialize with custom configuration', async () => {
      const config = {
        user: 'deploy',
        port: 2222,
        maxHosts: 25,
        securityMode: 'strict',
        keyFile: '/path/to/key',
        allowedCommands: ['systemctl status', 'ps aux'],
        trustedHosts: ['server1', 'server2']
      };

      await handler.initialize(config);

      expect(handler.sshUser).toBe('deploy');
      expect(handler.sshPort).toBe(2222);
      expect(handler.maxHosts).toBe(25);
      expect(handler.securityMode).toBe('strict');
      expect(handler.sshKey).toBe('/path/to/key');
      expect(handler.allowedCommands.has('systemctl status')).toBe(true);
      expect(handler.trustedHosts.has('server1')).toBe(true);
    });
  });

  describe('command parsing', () => {
    test('should parse run command correctly', () => {
      const args = handler.parseCommand('run hosts="server1,server2" command="systemctl status nginx" parallel=true timeout=5000');
      
      expect(args).toEqual({
        operation: 'run',
        hosts: 'server1,server2',
        command: 'systemctl status nginx',
        parallel: 'true',
        timeout: '5000'
      });
    });

    test('should parse put command correctly', () => {
      const args = handler.parseCommand('put hosts="web01" local="/tmp/config" remote="/etc/nginx/nginx.conf" mode="644"');
      
      expect(args).toEqual({
        operation: 'put',
        hosts: 'web01',
        local: '/tmp/config',
        remote: '/etc/nginx/nginx.conf',
        mode: '644'
      });
    });

    test('should parse deploy_rexx command correctly', () => {
      const args = handler.parseCommand('deploy_rexx hosts="server1,server2" rexx_binary="/path/to/rexx" target_path="/usr/local/bin/rexx"');
      
      expect(args).toEqual({
        operation: 'deploy_rexx',
        hosts: 'server1,server2',
        rexx_binary: '/path/to/rexx',
        target_path: '/usr/local/bin/rexx'
      });
    });

    test('should handle quoted values with spaces', () => {
      const args = handler.parseCommand('run hosts="server 1,server 2" command="echo hello world"');
      
      expect(args.hosts).toBe('server 1,server 2');
      expect(args.command).toBe('echo hello world');
    });
  });

  describe('security validation', () => {
    test('should validate commands in permissive mode', () => {
      handler.securityMode = 'permissive';
      
      expect(handler.validateCommand('rm -rf /')).toBe(true);
      expect(handler.validateCommand('dangerous command')).toBe(true);
    });

    test('should validate commands in strict mode', () => {
      handler.securityMode = 'strict';
      handler.allowedCommands.add('systemctl status');
      
      expect(handler.validateCommand('systemctl status')).toBe(true);
      expect(handler.validateCommand('rm -rf /')).toBe(false);
      expect(handler.validateCommand('unknown command')).toBe(false);
    });

    test('should block dangerous commands in moderate mode', () => {
      handler.securityMode = 'moderate';
      
      // Should allow safe commands
      expect(handler.validateCommand('systemctl status nginx')).toBe(true);
      expect(handler.validateCommand('ps aux')).toBe(true);
      expect(handler.validateCommand('ls -la')).toBe(true);
      
      // Should block dangerous commands
      expect(handler.validateCommand('rm -rf /')).toBe(false);
      expect(handler.validateCommand('dd if=/dev/zero of=/dev/sda')).toBe(false);
      expect(handler.validateCommand('mkfs.ext4 /dev/sda')).toBe(false);
      expect(handler.validateCommand('fdisk /dev/sda')).toBe(false);
    });

    test('should validate hosts', () => {
      handler.securityMode = 'moderate';
      
      expect(handler.validateHost('server1')).toBe(true);
      expect(handler.validateHost('web-01.example.com')).toBe(true);
      expect(handler.validateHost('192.168.1.100')).toBe(true);
      
      // Should reject invalid hostnames
      expect(handler.validateHost('server@evil')).toBe(false);
      expect(handler.validateHost('server; rm -rf /')).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should reject commands without required parameters', async () => {
      await expect(handler.handleMessage('run hosts="server1"', {}))
        .rejects.toThrow('run requires hosts and command parameters');

      await expect(handler.handleMessage('put hosts="server1" local="/tmp/file"', {}))
        .rejects.toThrow('put requires hosts, local, and remote parameters');

      await expect(handler.handleMessage('deploy_rexx hosts="server1"', {}))
        .rejects.toThrow('deploy_rexx requires hosts and rexx_binary parameters');
    });

    test('should reject dangerous commands', async () => {
      handler.securityMode = 'moderate';
      
      await expect(handler.handleMessage('run hosts="server1" command="rm -rf /system"', {}))
        .rejects.toThrow('Command not allowed by security policy');
    });

    test('should reject too many hosts', async () => {
      handler.maxHosts = 2;
      const hosts = 'server1,server2,server3';
      
      await expect(handler.handleMessage(`run hosts="${hosts}" command="echo test"`, {}))
        .rejects.toThrow('Too many hosts (3), maximum allowed: 2');
    });

    test('should handle unknown operations', async () => {
      await expect(handler.handleMessage('unknown_operation param=value', {}))
        .rejects.toThrow('Unknown ssh-remote operation: unknown_operation');
    });
  });

  describe('integration with existing patterns', () => {
    test('should follow RexxJS ADDRESS handler conventions', async () => {
      // Mock SSH execution to avoid real SSH calls in tests
      const originalExecute = handler.executeCommandOnHost;
      handler.executeCommandOnHost = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'success',
        stderr: ''
      });

      const result = await handler.handleMessage('run hosts="test-host" command="echo test"', {});
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('totalHosts');
      expect(result).toHaveProperty('successCount');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(true);

      // Restore original method
      handler.executeCommandOnHost = originalExecute;
    });

    test('should provide EFS2-style progress reporting format', async () => {
      // Mock SSH execution
      handler.executeCommandOnHost = jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'success',
        stderr: ''
      });

      await handler.handleMessage('run hosts="server1,server2" command="echo test" parallel=false', {});
      
      // Check for EFS2-style progress messages in logs
      expect(logOutput.some(msg => msg.includes('server1: Task 1 - Starting executing'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('server2: Task 2 - Starting executing'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('Completed executing'))).toBe(true);
    });
  });
});