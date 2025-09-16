/**
 * Proxmox Container Handler Tests
 * 
 * Tests for Proxmox LXC container management with heavy mocking
 * to simulate Proxmox infrastructure on any system
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const ProxmoxHandler = require("../proxmox-handler");

// Mock child_process and fs heavily
jest.mock('child_process');
jest.mock('fs');

describe('Proxmox Container Handler', () => {
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
    handler = new ProxmoxHandler();
    
    // Capture console output
    logOutput = [];
    originalConsoleLog = console.log;
    console.log = (msg) => logOutput.push(msg);
    
    // Mock successful Proxmox infrastructure
    mockProxmoxInfrastructure();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  function mockProxmoxInfrastructure() {
    // Mock file system
    mockFs.existsSync.mockImplementation((path) => {
      if (path.includes('rexx-linux-x64')) return true;
      if (path.includes('/tmp')) return true;
      if (path.includes('/var/lib/vz/template')) return true;
      return false;
    });
    
    // Mock successful pct command execution
    const mockProcess = {
      stdout: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            // Simulate pct command output
            setTimeout(() => callback('Container created successfully\nVMID: 101\n'), 10);
          }
        })
      },
      stderr: { on: jest.fn() },
      stdin: { write: jest.fn(), end: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20); // Success exit code
        }
      }),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess);
  }

  function mockFailedProcess(exitCode = 1, errorMsg = 'pct command failed') {
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(errorMsg + '\n'), 10);
          }
        })
      },
      stdin: { write: jest.fn(), end: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(exitCode), 20);
        }
      }),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess);
  }

  function mockContainerListOutput() {
    const mockProcess = {
      stdout: { 
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            const containerList = `VMID        Name                    Status      IP              
101         rexx-worker-1           running     192.168.1.101
102         rexx-worker-2           stopped     -
103         web-server              running     192.168.1.103
`;
            setTimeout(() => callback(containerList), 10);
          }
        })
      },
      stderr: { on: jest.fn() },
      stdin: { write: jest.fn(), end: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20);
        }
      }),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess);
  }

  describe('initialization', () => {
    test('should initialize with default configuration', async () => {
      await handler.initialize();
      
      expect(handler.maxContainers).toBe(50);
      expect(handler.containerCounter).toBe(100); // VMID starts at 100
      expect(handler.securityMode).toBe('moderate');
      expect(handler.proxmoxNode).toBe('proxmox');
      expect(handler.allowedStorages.has('local')).toBe(true);
      expect(handler.allowedStorages.has('local-lvm')).toBe(true);
    });

    test('should initialize with custom configuration', async () => {
      const config = {
        maxContainers: 25,
        startVMID: 200,
        securityMode: 'strict',
        proxmoxNode: 'pve-node1',
        allowedTemplates: ['debian-11-standard', 'ubuntu-20.04-standard'],
        allowedStorages: ['fast-ssd', 'backup-hdd'],
        networkBridge: 'vmbr1'
      };

      await handler.initialize(config);

      expect(handler.maxContainers).toBe(25);
      expect(handler.containerCounter).toBe(200);
      expect(handler.securityMode).toBe('strict');
      expect(handler.proxmoxNode).toBe('pve-node1');
      expect(handler.allowedTemplates.has('debian-11-standard')).toBe(true);
      expect(handler.allowedStorages.has('fast-ssd')).toBe(true);
      expect(handler.networkBridge).toBe('vmbr1');
    });

    test('should validate Proxmox environment', async () => {
      await handler.initialize();
      
      // Should check for pct command availability
      expect(mockSpawn).toHaveBeenCalledWith('which', ['pct'], expect.any(Object));
    });
  });

  describe('command parsing', () => {
    test('should parse create command correctly', () => {
      const args = handler.parseCommand('create template="debian-11-standard" hostname="rexx-worker" memory=1024 cores=2 storage="local-lvm"');
      
      expect(args).toEqual({
        operation: 'create',
        template: 'debian-11-standard',
        hostname: 'rexx-worker',
        memory: '1024',
        cores: '2',
        storage: 'local-lvm'
      });
    });

    test('should parse configure command correctly', () => {
      const args = handler.parseCommand('configure vmid=101 memory=2048 cores=4 disk="local-lvm:8" network="name=eth0,bridge=vmbr0"');
      
      expect(args).toEqual({
        operation: 'configure',
        vmid: '101',
        memory: '2048',
        cores: '4',
        disk: 'local-lvm:8',
        network: 'name=eth0,bridge=vmbr0'
      });
    });

    test('should parse deploy_rexx command correctly', () => {
      const args = handler.parseCommand('deploy_rexx vmid=101 rexx_binary="/path/to/rexx" target="/usr/local/bin/rexx"');
      
      expect(args).toEqual({
        operation: 'deploy_rexx',
        vmid: '101',
        rexx_binary: '/path/to/rexx',
        target: '/usr/local/bin/rexx'
      });
    });

    test('should handle quoted values with spaces', () => {
      const args = handler.parseCommand('create template="debian 11 standard" hostname="my worker" description="RexxJS container worker"');
      
      expect(args.template).toBe('debian 11 standard');
      expect(args.hostname).toBe('my worker');
      expect(args.description).toBe('RexxJS container worker');
    });
  });

  describe('security validation', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should validate templates in permissive mode', () => {
      handler.securityMode = 'permissive';
      
      expect(handler.validateTemplate('any-template')).toBe(true);
      expect(handler.validateTemplate('untrusted-template')).toBe(true);
    });

    test('should validate templates in strict mode', () => {
      handler.securityMode = 'strict';
      handler.allowedTemplates.add('debian-11-standard');
      handler.allowedTemplates.add('ubuntu-20.04-standard');
      
      expect(handler.validateTemplate('debian-11-standard')).toBe(true);
      expect(handler.validateTemplate('ubuntu-20.04-standard')).toBe(true);
      expect(handler.validateTemplate('unknown-template')).toBe(false);
    });

    test('should validate storage in moderate mode', () => {
      handler.securityMode = 'moderate';
      
      // Should allow standard storage
      expect(handler.validateStorage('local')).toBe(true);
      expect(handler.validateStorage('local-lvm')).toBe(true);
      expect(handler.validateStorage('data-pool')).toBe(true);
      
      // Should block special storage names
      expect(handler.validateStorage('backup')).toBe(false);
      expect(handler.validateStorage('iso')).toBe(false);
    });

    test('should validate resource limits', () => {
      expect(handler.validateResourceLimits({ memory: 1024, cores: 2, disk: 8 })).toBe(true);
      expect(handler.validateResourceLimits({ memory: 2048, cores: 4 })).toBe(true);
      
      // Should block excessive resources
      expect(handler.validateResourceLimits({ memory: 32768 })).toBe(false); // Too much memory
      expect(handler.validateResourceLimits({ cores: 32 })).toBe(false); // Too many cores
      expect(handler.validateResourceLimits({ disk: 1024 })).toBe(false); // Too much disk
    });

    test('should validate VMID ranges', () => {
      expect(handler.validateVMID(100)).toBe(true);
      expect(handler.validateVMID(999)).toBe(true);
      
      // Should reject invalid VMIDs
      expect(handler.validateVMID(1)).toBe(false); // Too low
      expect(handler.validateVMID(99)).toBe(false); // Below minimum
      expect(handler.validateVMID(10000)).toBe(false); // Too high
    });

    test('should validate network configuration', () => {
      expect(handler.validateNetwork('name=eth0,bridge=vmbr0')).toBe(true);
      expect(handler.validateNetwork('name=eth0,bridge=vmbr1,ip=dhcp')).toBe(true);
      
      // Should reject dangerous network configs
      expect(handler.validateNetwork('name=eth0,bridge=../../../etc')).toBe(false);
      expect(handler.validateNetwork('name=eth0;rm -rf /')).toBe(false);
    });
  });

  describe('container lifecycle operations', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should create LXC container successfully', async () => {
      const result = await handler.handleMessage('create template="debian-11-standard" hostname="test-worker" memory=1024', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(100); // First container gets VMID 100
      expect(result.hostname).toBe('test-worker');
      expect(result.template).toBe('debian-11-standard');
      
      // Verify pct create was called correctly
      expect(mockSpawn).toHaveBeenCalledWith('pct', 
        expect.arrayContaining(['create', '100', 'debian-11-standard', '--hostname', 'test-worker', '--memory', '1024']),
        expect.any(Object)
      );
      
      // VMID counter should increment
      expect(handler.containerCounter).toBe(101);
    });

    test('should create container with custom configuration', async () => {
      const result = await handler.handleMessage('create template="ubuntu-20.04-standard" hostname="web-server" memory=2048 cores=4 disk="local-lvm:16" network="name=eth0,bridge=vmbr0,ip=192.168.1.100/24"', {});
      
      expect(result.success).toBe(true);
      expect(result.disk).toBe('local-lvm:16');
      expect(result.network).toBe('name=eth0,bridge=vmbr0,ip=192.168.1.100/24');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining([
          'create', '100', 'ubuntu-20.04-standard',
          '--hostname', 'web-server',
          '--memory', '2048',
          '--cores', '4',
          '--rootfs', 'local-lvm:16',
          '--net0', 'name=eth0,bridge=vmbr0,ip=192.168.1.100/24'
        ]),
        expect.any(Object)
      );
    });

    test('should start container successfully', async () => {
      handler.activeContainers.set(101, {
        hostname: 'test-worker',
        status: 'stopped',
        node: 'proxmox'
      });
      
      const result = await handler.handleMessage('start vmid=101', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['start', '101']),
        expect.any(Object)
      );
    });

    test('should stop container gracefully', async () => {
      handler.activeContainers.set(101, {
        hostname: 'test-worker',
        status: 'running'
      });
      
      const result = await handler.handleMessage('stop vmid=101 timeout=60', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.graceful).toBe(true);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['shutdown', '101', '--timeout', '60']),
        expect.any(Object)
      );
    });

    test('should force stop container when needed', async () => {
      handler.activeContainers.set(101, { status: 'running' });
      
      const result = await handler.handleMessage('stop vmid=101 force=true', {});
      
      expect(result.success).toBe(true);
      expect(result.forced).toBe(true);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['stop', '101']),
        expect.any(Object)
      );
    });

    test('should destroy container and cleanup', async () => {
      handler.activeContainers.set(101, {
        hostname: 'test-worker',
        status: 'stopped'
      });
      
      const result = await handler.handleMessage('destroy vmid=101 purge=true', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.purged).toBe(true);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['destroy', '101', '--purge']),
        expect.any(Object)
      );
      
      // Should remove from tracking
      expect(handler.activeContainers.has(101)).toBe(false);
    });

    test('should list containers', async () => {
      mockContainerListOutput();
      
      const result = await handler.handleMessage('list', {});
      
      expect(result.success).toBe(true);
      expect(result.containers).toHaveLength(3);
      expect(result.containers[0].vmid).toBe('101');
      expect(result.containers[0].name).toBe('rexx-worker-1');
      expect(result.containers[0].status).toBe('running');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct', ['list'], expect.any(Object));
    });
  });

  describe('container configuration', () => {
    beforeEach(async () => {
      await handler.initialize();
      handler.activeContainers.set(101, { status: 'stopped' });
    });

    test('should configure container resources', async () => {
      const result = await handler.handleMessage('configure vmid=101 memory=2048 cores=4', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.memory).toBe(2048);
      expect(result.cores).toBe(4);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['set', '101', '--memory', '2048', '--cores', '4']),
        expect.any(Object)
      );
    });

    test('should resize container disk', async () => {
      const result = await handler.handleMessage('resize vmid=101 disk="+4G"', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.diskChange).toBe('+4G');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['resize', '101', 'rootfs', '+4G']),
        expect.any(Object)
      );
    });

    test('should add network interface', async () => {
      const result = await handler.handleMessage('configure vmid=101 add_network="name=eth1,bridge=vmbr1,ip=10.0.0.100/24"', {});
      
      expect(result.success).toBe(true);
      expect(result.networkAdded).toBe('name=eth1,bridge=vmbr1,ip=10.0.0.100/24');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['set', '101', '--net1', 'name=eth1,bridge=vmbr1,ip=10.0.0.100/24']),
        expect.any(Object)
      );
    });

    test('should configure mount points', async () => {
      const result = await handler.handleMessage('configure vmid=101 mount="local:vm-101-disk-1,mp=/data,size=10G"', {});
      
      expect(result.success).toBe(true);
      expect(result.mountPoint).toBe('local:vm-101-disk-1,mp=/data,size=10G');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['set', '101', '--mp0', 'local:vm-101-disk-1,mp=/data,size=10G']),
        expect.any(Object)
      );
    });
  });

  describe('RexxJS deployment and execution', () => {
    beforeEach(async () => {
      await handler.initialize();
      handler.activeContainers.set(101, {
        hostname: 'rexx-worker',
        status: 'running'
      });
    });

    test('should deploy RexxJS binary to container', async () => {
      const result = await handler.handleMessage('deploy_rexx vmid=101 rexx_binary="/path/to/rexx-linux-x64"', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.binaryPath).toBe('/path/to/rexx-linux-x64');
      expect(result.targetPath).toBe('/usr/local/bin/rexx');
      
      // Should push file to container
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['push', '101', '/path/to/rexx-linux-x64', '/usr/local/bin/rexx']),
        expect.any(Object)
      );
      
      // Should make it executable
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['exec', '101', '--', 'chmod', '+x', '/usr/local/bin/rexx']),
        expect.any(Object)
      );
    });

    test('should execute RexxJS script in container', async () => {
      const result = await handler.handleMessage('execute vmid=101 script="SAY \\"Hello from Proxmox\\""', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.script).toBe('SAY "Hello from Proxmox"');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['exec', '101', '--', '/usr/local/bin/rexx']),
        expect.any(Object)
      );
    });

    test('should execute script file in container', async () => {
      mockFs.readFileSync.mockReturnValue('SAY "Script from file"');
      
      const result = await handler.handleMessage('execute_file vmid=101 script_file="/host/script.rexx"', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.scriptFile).toBe('/host/script.rexx');
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/host/script.rexx', 'utf8');
      
      // Should push script and execute
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['push', '101', expect.stringMatching(/\/tmp\/.*\.rexx/), '/tmp/script.rexx']),
        expect.any(Object)
      );
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['exec', '101', '--', '/usr/local/bin/rexx', '/tmp/script.rexx']),
        expect.any(Object)
      );
    });

    test('should execute with environment variables', async () => {
      const result = await handler.handleMessage('execute vmid=101 script="SAY ENV(\\"TEST_VAR\\")" env="TEST_VAR=hello,DEBUG=true"', {});
      
      expect(result.success).toBe(true);
      expect(result.environmentVariables).toEqual(['TEST_VAR=hello', 'DEBUG=true']);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['exec', '101', '--env', 'TEST_VAR=hello', '--env', 'DEBUG=true']),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should reject commands without required parameters', async () => {
      await expect(handler.handleMessage('create hostname="test"', {}))
        .rejects.toThrow('create requires template and hostname parameters');

      await expect(handler.handleMessage('start', {}))
        .rejects.toThrow('start requires vmid parameter');

      await expect(handler.handleMessage('deploy_rexx vmid=101', {}))
        .rejects.toThrow('deploy_rexx requires vmid and rexx_binary parameters');
    });

    test('should reject invalid templates in strict mode', async () => {
      handler.securityMode = 'strict';
      handler.allowedTemplates.clear();
      
      await expect(handler.handleMessage('create template="evil-template" hostname="test"', {}))
        .rejects.toThrow('Template not allowed by security policy: evil-template');
    });

    test('should reject excessive resource requests', async () => {
      await expect(handler.handleMessage('create template="debian-11-standard" hostname="test" memory=65536', {}))
        .rejects.toThrow('Resource limits exceeded');
    });

    test('should reject invalid VMIDs', async () => {
      await expect(handler.handleMessage('start vmid=1', {}))
        .rejects.toThrow('Invalid VMID: 1');
    });

    test('should handle pct command failures', async () => {
      mockFailedProcess(255, 'pct: template not found');
      
      await expect(handler.handleMessage('create template="nonexistent" hostname="test"', {}))
        .rejects.toThrow('Container operation failed');
    });

    test('should handle missing containers', async () => {
      await expect(handler.handleMessage('start vmid=999', {}))
        .rejects.toThrow('Container not found: VMID 999');
    });

    test('should handle missing RexxJS binary', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await expect(handler.handleMessage('deploy_rexx vmid=101 rexx_binary="/missing/rexx"', {}))
        .rejects.toThrow('RexxJS binary not found: /missing/rexx');
    });

    test('should enforce container limits', async () => {
      handler.maxContainers = 1;
      handler.activeContainers.set(101, { hostname: 'existing' });
      
      await expect(handler.handleMessage('create template="debian-11-standard" hostname="new"', {}))
        .rejects.toThrow('Maximum number of containers (1) reached');
    });

    test('should timeout long operations', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn(), // Never call close
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      handler.defaultTimeout = 100;
      
      await expect(handler.handleMessage('create template="debian-11-standard" hostname="test"', {}))
        .rejects.toThrow('Container operation timed out');
    });
  });

  describe('integration with RexxJS patterns', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should follow RexxJS ADDRESS handler conventions', async () => {
      const result = await handler.handleMessage('create template="debian-11-standard" hostname="test"', {});
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('vmid');
      expect(result).toHaveProperty('hostname');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(true);
    });

    test('should provide progress reporting', async () => {
      await handler.handleMessage('create template="debian-11-standard" hostname="progress-test"', {});
      
      expect(logOutput.some(msg => msg.includes('PROXMOX'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('create'))).toBe(true);
    });

    test('should support variable interpolation', async () => {
      const context = {
        template: 'ubuntu-20.04-standard',
        hostname: 'dynamic-worker',
        memory: '2048'
      };
      
      const result = await handler.handleMessage('create template="{template}" hostname="{hostname}" memory="{memory}"', context);
      
      expect(result.success).toBe(true);
      expect(result.template).toBe('ubuntu-20.04-standard');
      expect(result.hostname).toBe('dynamic-worker');
      expect(result.memory).toBe(2048);
    });

    test('should integrate with address handler utilities', async () => {
      const result = await handler.handleMessage('create template="debian-11-standard" hostname="utils-test"', {});
      
      expect(result.success).toBe(true);
      expect(logOutput.some(msg => msg.includes('[ADDRESS:PROXMOX]'))).toBe(true);
    });
  });

  describe('Proxmox-specific features', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should create container with backup scheduling', async () => {
      const result = await handler.handleMessage('create template="debian-11-standard" hostname="backed-up" backup="weekly"', {});
      
      expect(result.success).toBe(true);
      expect(result.backupSchedule).toBe('weekly');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['--backup', 'weekly']),
        expect.any(Object)
      );
    });

    test('should migrate container between nodes', async () => {
      handler.activeContainers.set(101, { status: 'running', node: 'pve1' });
      
      const result = await handler.handleMessage('migrate vmid=101 target_node="pve2" online=true', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.targetNode).toBe('pve2');
      expect(result.onlineMigration).toBe(true);
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['migrate', '101', 'pve2', '--online']),
        expect.any(Object)
      );
    });

    test('should create container snapshot', async () => {
      handler.activeContainers.set(101, { status: 'running' });
      
      const result = await handler.handleMessage('snapshot vmid=101 name="pre-update" description="Before system update"', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.snapshotName).toBe('pre-update');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['snapshot', '101', 'pre-update', '--description', 'Before system update']),
        expect.any(Object)
      );
    });

    test('should restore from snapshot', async () => {
      handler.activeContainers.set(101, { status: 'stopped' });
      
      const result = await handler.handleMessage('rollback vmid=101 snapshot="pre-update"', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.snapshotName).toBe('pre-update');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['rollback', '101', '--snap', 'pre-update']),
        expect.any(Object)
      );
    });

    test('should clone container', async () => {
      handler.activeContainers.set(101, { status: 'stopped', hostname: 'template-container' });
      
      const result = await handler.handleMessage('clone source_vmid=101 target_vmid=201 hostname="cloned-worker"', {});
      
      expect(result.success).toBe(true);
      expect(result.sourceVmid).toBe(101);
      expect(result.targetVmid).toBe(201);
      expect(result.hostname).toBe('cloned-worker');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['clone', '101', '201', '--hostname', 'cloned-worker']),
        expect.any(Object)
      );
    });
  });

  describe('monitoring and statistics', () => {
    beforeEach(async () => {
      await handler.initialize();
    });

    test('should get container status', async () => {
      const mockProcess = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback('status: running\nlock: \nmaxdisk: 8589934592\n'), 10);
            }
          })
        },
        stderr: { on: jest.fn() },
        stdin: { write: jest.fn(), end: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 20);
          }
        }),
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);
      
      const result = await handler.handleMessage('status vmid=101', {});
      
      expect(result.success).toBe(true);
      expect(result.vmid).toBe(101);
      expect(result.status).toBe('running');
      
      expect(mockSpawn).toHaveBeenCalledWith('pct',
        expect.arrayContaining(['status', '101']),
        expect.any(Object)
      );
    });

    test('should get system statistics', async () => {
      handler.activeContainers.set(101, { status: 'running' });
      handler.activeContainers.set(102, { status: 'stopped' });
      handler.activeContainers.set(103, { status: 'running' });
      
      const result = await handler.handleMessage('stats', {});
      
      expect(result.success).toBe(true);
      expect(result.totalContainers).toBe(3);
      expect(result.runningContainers).toBe(2);
      expect(result.stoppedContainers).toBe(1);
      expect(result.nextVMID).toBe(100); // Current counter value
      expect(result.maxContainers).toBe(50);
    });
  });
});