/**
 * systemd-nspawn Container Handler Tests
 * 
 * Tests for the systemd-nspawn container management handler with heavy mocking
 * to simulate systemd-nspawn and machinectl infrastructure on any system
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const NspawnHandler = require("../nspawn-handler");

// Mock child_process and fs heavily
jest.mock('child_process');
jest.mock('fs');

describe('systemd-nspawn Container Handler', () => {
  let handler;
  let mockSpawn;
  let mockFs;
  let originalConsoleLog;
  let logOutput;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup child_process mocking
    const { spawn } = require('child_process');
    mockSpawn = spawn;
    
    // Setup fs mocking
    mockFs = require('fs');
    mockFs.existsSync = jest.fn();
    mockFs.mkdirSync = jest.fn();
    mockFs.writeFileSync = jest.fn();
    mockFs.readFileSync = jest.fn();
    mockFs.statSync = jest.fn();
    
    // Create handler
    handler = new NspawnHandler();
    
    // Capture console output for testing progress reporting
    logOutput = [];
    originalConsoleLog = console.log;
    console.log = (msg) => logOutput.push(msg);
    
    // Mock successful systemd-nspawn infrastructure
    mockSystemdInfrastructure();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  function mockSystemdInfrastructure() {
    // Mock /var/lib/machines directory exists
    mockFs.existsSync.mockImplementation((path) => {
      if (path === '/var/lib/machines') return true;
      if (path.includes('/var/lib/machines/')) return true;
      if (path.includes('rexx-linux-x64')) return true;
      return false;
    });
    
    // Mock file stats
    mockFs.statSync.mockReturnValue({ 
      isDirectory: () => true,
      size: 1024 
    });
    
    // Mock successful process execution
    const mockProcess = {
      stdout: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            // Simulate systemd-nspawn/machinectl output
            setTimeout(() => callback('Container created successfully\n'), 10);
          }
        })
      },
      stderr: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(''), 10);
          }
        })
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20); // Success exit code
        } else if (event === 'error') {
          // Don't call error callback for successful operations
        }
      }),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess);
  }

  function mockFailedProcess(exitCode = 1, errorMsg = 'Command failed') {
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(errorMsg + '\n'), 10);
          }
        })
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(exitCode), 20);
        }
      }),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess);
  }

  describe('initialization', () => {
    test('should initialize with default configuration', async () => {
      await handler.initialize();
      
      expect(handler.maxMachines).toBe(50);
      expect(handler.securityMode).toBe('moderate');
      expect(handler.machinesPath).toBe('/var/lib/machines');
      expect(handler.defaultTimeout).toBe(60000);
      expect(handler.activeMachines).toBeDefined();
    });

    test('should initialize with custom configuration', async () => {
      const config = {
        maxMachines: 25,
        securityMode: 'strict',
        machinesPath: '/custom/machines',
        timeout: 120000,
        allowedImages: ['debian:stable', 'ubuntu:focal'],
        allowedDirectories: ['/custom/machines', '/backup/machines']
      };

      await handler.initialize(config);

      expect(handler.maxMachines).toBe(25);
      expect(handler.securityMode).toBe('strict');
      expect(handler.machinesPath).toBe('/custom/machines');
      expect(handler.defaultTimeout).toBe(120000);
      expect(handler.allowedImages.has('debian:stable')).toBe(true);
      expect(handler.allowedDirectories.has('/custom/machines')).toBe(true);
    });

    test('should create machines directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await handler.initialize();
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/var/lib/machines', { recursive: true });
    });
  });

  describe('command parsing', () => {
    test('should parse create command correctly', () => {
      const args = handler.parseCommand('create image="debian:stable" name="test-container" cpus=2 memory=1024');
      
      expect(args).toEqual({
        command: 'create',
        subcommand: '',
        params: {
          image: 'debian:stable',
          name: 'test-container',
          cpus: '2',
          memory: '1024'
        }
      });
    });

    test('should parse start command correctly', () => {
      const args = handler.parseCommand('start name="test-container" network=true');
      
      expect(args).toEqual({
        operation: 'start',
        name: 'test-container',
        network: 'true'
      });
    });

    test('should parse deploy_rexx command correctly', () => {
      const args = handler.parseCommand('deploy_rexx container="worker1" rexx_binary="/path/to/rexx" target="/usr/local/bin/rexx"');
      
      expect(args).toEqual({
        operation: 'deploy_rexx',
        container: 'worker1',
        rexx_binary: '/path/to/rexx',
        target: '/usr/local/bin/rexx'
      });
    });

    test('should handle quoted values with spaces', () => {
      const args = handler.parseCommand('execute container="my container" command="echo hello world"');
      
      expect(args.container).toBe('my container');
      expect(args.command).toBe('echo hello world');
    });
  });

  describe('security validation', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should validate images in permissive mode', () => {
      handler.securityMode = 'permissive';
      
      expect(handler.validateImage('any:image')).toBe(true);
      expect(handler.validateImage('malicious/image')).toBe(true);
    });

    test('should validate images in strict mode', () => {
      handler.securityMode = 'strict';
      handler.allowedImages.add('debian:stable');
      
      expect(handler.validateImage('debian:stable')).toBe(true);
      expect(handler.validateImage('unknown:image')).toBe(false);
    });

    test('should validate directories in moderate mode', () => {
      handler.securityMode = 'moderate';
      
      // Should allow machines directories
      expect(handler.validateDirectory('/var/lib/machines/test')).toBe(true);
      expect(handler.validateDirectory('/opt/containers/test')).toBe(true);
      
      // Should block system directories
      expect(handler.validateDirectory('/etc')).toBe(false);
      expect(handler.validateDirectory('/root')).toBe(false);
      expect(handler.validateDirectory('/sys')).toBe(false);
    });

    test('should validate container names', () => {
      expect(handler.validateContainerName('valid-container-1')).toBe(true);
      expect(handler.validateContainerName('test_container')).toBe(true);
      
      // Should reject invalid names
      expect(handler.validateContainerName('container with spaces')).toBe(false);
      expect(handler.validateContainerName('container;rm -rf /')).toBe(false);
      expect(handler.validateContainerName('')).toBe(false);
    });

    test('should enforce resource limits', () => {
      expect(handler.validateResourceLimits({ cpus: '2', memory: '1024' })).toBe(true);
      expect(handler.validateResourceLimits({ cpus: '1', memory: '512' })).toBe(true);
      
      // Should block excessive resources
      expect(handler.validateResourceLimits({ cpus: '32', memory: '32768' })).toBe(false);
      expect(handler.validateResourceLimits({ memory: '16384' })).toBe(false);
    });
  });

  describe('container lifecycle operations', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should create container successfully', async () => {
      const result = await handler.handleMessage('create image="debian:stable" name="test-container" memory=1024', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-container');
      expect(result.image).toBe('debian:stable');
      expect(result.machineId).toBeDefined();
      
      // Verify systemd-nspawn was called correctly
      expect(mockSpawn).toHaveBeenCalledWith('systemd-nspawn', 
        expect.arrayContaining(['--directory', expect.stringContaining('/var/lib/machines/test-container')]),
        expect.any(Object)
      );
    });

    test('should start container successfully', async () => {
      // First create a container
      await handler.handleMessage('create image="debian:stable" name="test-container"', {});
      
      // Then start it
      const result = await handler.handleMessage('start name="test-container" network=true', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-container');
      expect(result.networkEnabled).toBe(true);
      
      // Verify machinectl was called
      expect(mockSpawn).toHaveBeenCalledWith('machinectl', 
        expect.arrayContaining(['start', 'test-container']),
        expect.any(Object)
      );
    });

    test('should stop container successfully', async () => {
      // Setup container as running
      handler.activeMachines.set('test-container', {
        status: 'running',
        machineId: 'test-1'
      });
      
      const result = await handler.handleMessage('stop name="test-container"', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-container');
      
      expect(mockSpawn).toHaveBeenCalledWith('machinectl', 
        expect.arrayContaining(['stop', 'test-container']),
        expect.any(Object)
      );
    });

    test('should destroy container and cleanup', async () => {
      // Setup container
      handler.activeMachines.set('test-container', {
        status: 'stopped',
        machineId: 'test-1',
        directory: '/var/lib/machines/test-container'
      });
      
      const result = await handler.handleMessage('destroy name="test-container" cleanup=true', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-container');
      expect(result.cleanedUp).toBe(true);
      
      // Should remove from active machines
      expect(handler.activeMachines.has('test-container')).toBe(false);
    });

    test('should list containers', async () => {
      // Setup some containers
      handler.activeMachines.set('container1', { status: 'running' });
      handler.activeMachines.set('container2', { status: 'stopped' });
      
      const result = await handler.handleMessage('list', {});
      
      expect(result.success).toBe(true);
      expect(result.containers).toHaveLength(2);
      expect(result.containers.some(c => c.name === 'container1')).toBe(true);
      expect(result.containers.some(c => c.name === 'container2')).toBe(true);
    });
  });

  describe('RexxJS deployment', () => {
    beforeEach(async () => {
      await handler.initialize();
      // Setup a running container
      handler.activeMachines.set('worker1', { 
        status: 'running',
        directory: '/var/lib/machines/worker1'
      });
    });

    test('should deploy RexxJS binary to container', async () => {
      const result = await handler.handleMessage('deploy_rexx container="worker1" rexx_binary="/path/to/rexx-linux-x64"', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('worker1');
      expect(result.binaryPath).toBe('/path/to/rexx-linux-x64');
      expect(result.targetPath).toBe('/usr/local/bin/rexx');
      
      // Should have copied binary and made it executable
      expect(mockSpawn).toHaveBeenCalledWith('cp', 
        expect.arrayContaining(['/path/to/rexx-linux-x64', expect.stringContaining('worker1')]),
        expect.any(Object)
      );
    });

    test('should execute RexxJS script in container', async () => {
      const result = await handler.handleMessage('execute container="worker1" script="SAY \\"Hello from nspawn\\""', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('worker1');
      expect(result.script).toBe('SAY "Hello from nspawn"');
      
      // Should execute via systemd-nspawn
      expect(mockSpawn).toHaveBeenCalledWith('systemd-nspawn', 
        expect.arrayContaining(['--directory', expect.stringContaining('worker1')]),
        expect.any(Object)
      );
    });

    test('should execute RexxJS script file in container', async () => {
      mockFs.readFileSync.mockReturnValue('SAY "Script content"');
      
      const result = await handler.handleMessage('execute_file container="worker1" script_file="/path/to/script.rexx"', {});
      
      expect(result.success).toBe(true);
      expect(result.containerName).toBe('worker1');
      expect(result.scriptFile).toBe('/path/to/script.rexx');
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/script.rexx', 'utf8');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should reject commands without required parameters', async () => {
      await expect(handler.handleMessage('create name="test"', {}))
        .rejects.toThrow('create requires image and name parameters');

      await expect(handler.handleMessage('start', {}))
        .rejects.toThrow('start requires name parameter');

      await expect(handler.handleMessage('deploy_rexx container="test"', {}))
        .rejects.toThrow('deploy_rexx requires container and rexx_binary parameters');
    });

    test('should reject invalid container names', async () => {
      await expect(handler.handleMessage('create image="debian:stable" name="invalid name"', {}))
        .rejects.toThrow('Invalid container name');
    });

    test('should reject too many containers', async () => {
      handler.maxMachines = 1;
      handler.activeMachines.set('existing', { status: 'running' });
      
      await expect(handler.handleMessage('create image="debian:stable" name="new-container"', {}))
        .rejects.toThrow('Maximum number of machines (1) reached');
    });

    test('should handle systemd-nspawn command failures', async () => {
      mockFailedProcess(1, 'systemd-nspawn: failed to create container');
      
      await expect(handler.handleMessage('create image="debian:stable" name="test"', {}))
        .rejects.toThrow('Container creation failed');
    });

    test('should handle missing RexxJS binary', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('rexx-linux-x64')) return false;
        return true;
      });
      
      await expect(handler.handleMessage('deploy_rexx container="worker1" rexx_binary="/missing/rexx"', {}))
        .rejects.toThrow('RexxJS binary not found: /missing/rexx');
    });

    test('should handle unknown operations', async () => {
      await expect(handler.handleMessage('unknown_operation param=value', {}))
        .rejects.toThrow('Unknown nspawn operation: unknown_operation');
    });

    test('should timeout long-running operations', async () => {
      // Mock a process that never completes
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(), // Never call the close callback
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      // Use short timeout for test
      handler.defaultTimeout = 100;
      
      await expect(handler.handleMessage('create image="debian:stable" name="test"', {}))
        .rejects.toThrow('Operation timed out');
    });
  });

  describe('integration with RexxJS patterns', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should follow RexxJS ADDRESS handler conventions', async () => {
      const result = await handler.handleMessage('create image="debian:stable" name="test"', {});
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('containerName');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(true);
    });

    test('should provide EFS2-style progress reporting', async () => {
      await handler.handleMessage('create image="debian:stable" name="test-progress"', {});
      
      // Check for progress messages in logs
      expect(logOutput.some(msg => msg.includes('NSPAWN'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('create'))).toBe(true);
    });

    test('should support variable interpolation', async () => {
      const context = {
        containerImage: 'debian:stable',
        containerName: 'dynamic-test'
      };
      
      const result = await handler.handleMessage('create image="{containerImage}" name="{containerName}"', context);
      
      expect(result.success).toBe(true);
      expect(result.image).toBe('debian:stable');
      expect(result.containerName).toBe('dynamic-test');
    });

    test('should integrate with address handler utilities', async () => {
      // Test that it uses the shared utility functions
      const result = await handler.handleMessage('create image="debian:stable" name="utils-test"', {});
      
      expect(result.success).toBe(true);
      // Verify logging through address-handler-utils
      expect(logOutput.some(msg => msg.includes('[ADDRESS:NSPAWN]'))).toBe(true);
    });
  });

  describe('container status and monitoring', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should get container status', async () => {
      handler.activeMachines.set('test-container', {
        status: 'running',
        machineId: 'test-1',
        created: new Date().toISOString(),
        image: 'debian:stable'
      });
      
      const result = await handler.handleMessage('status name="test-container"', {});
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('running');
      expect(result.machineId).toBe('test-1');
      expect(result.image).toBe('debian:stable');
    });

    test('should get system statistics', async () => {
      handler.activeMachines.set('container1', { status: 'running' });
      handler.activeMachines.set('container2', { status: 'stopped' });
      handler.activeMachines.set('container3', { status: 'running' });
      
      const result = await handler.handleMessage('stats', {});
      
      expect(result.success).toBe(true);
      expect(result.totalContainers).toBe(3);
      expect(result.runningContainers).toBe(2);
      expect(result.stoppedContainers).toBe(1);
      expect(result.maxMachines).toBe(50);
    });
  });
});