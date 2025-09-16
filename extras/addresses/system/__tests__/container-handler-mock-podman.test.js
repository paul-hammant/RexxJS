/**
 * Container Handler Mock Tests - Podman/Docker Integration
 * Tests container management functionality with mocked podman/docker processes
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const ContainerHandler = require('../container-handler');

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');

describe('Container Handler - Mock Podman/Docker Tests', () => {
  let containerHandler;
  let mockContext;
  let mockProcess;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock process
    mockProcess = {
      stdout: {
        on: jest.fn(),
        pipe: jest.fn()
      },
      stderr: {
        on: jest.fn(),
        pipe: jest.fn()
      },
      stdin: {
        write: jest.fn(),
        end: jest.fn()
      },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockProcess);

    // Setup fs mocks
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock binary content');
    fs.statSync.mockReturnValue({ size: 52428800 }); // 50MB mock binary
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});

    // Initialize container handler
    containerHandler = new ContainerHandler();
    
    // Mock context
    mockContext = {
      variables: new Map([
        ['image_name', 'debian:stable'],
        ['container_name', 'test-worker'],
        ['rexx_binary', './rexx-linux-x64']
      ])
    };
  });

  describe('Runtime Detection', () => {
    it('should detect podman runtime', async () => {
      // Mock successful podman detection
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10); // Success exit code
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('podman version 4.3.1'), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
      
      expect(containerHandler.runtime).toBe('podman');
      expect(spawn).toHaveBeenCalledWith('podman', ['--version'], expect.any(Object));
    });

    it('should fall back to docker when podman unavailable', async () => {
      let callCount = 0;
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => {
            // First call (podman) fails, second call (docker) succeeds
            callback(callCount === 0 ? 1 : 0);
            callCount++;
          }, 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data' && callCount === 1) {
          setTimeout(() => callback('Docker version 20.10.21'), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
      
      expect(containerHandler.runtime).toBe('docker');
      expect(spawn).toHaveBeenCalledWith('podman', ['--version'], expect.any(Object));
      expect(spawn).toHaveBeenCalledWith('docker', ['--version'], expect.any(Object));
    });

    it('should throw error when no container runtime available', async () => {
      // Mock both podman and docker failing
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // Failure exit code
        }
      });

      await expect(
        containerHandler.initialize({ securityMode: 'permissive' })
      ).rejects.toThrow('No container runtime (podman or docker) available');
    });
  });

  describe('Container Creation', () => {
    beforeEach(async () => {
      // Setup successful podman detection
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('podman version 4.3.1'), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
    });

    it('should create container successfully', async () => {
      // Mock container creation success
      let isCreationCall = false;
      
      spawn.mockImplementation((command, args) => {
        if (args[0] === 'run') {
          isCreationCall = true;
        }
        return mockProcess;
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data' && isCreationCall) {
          setTimeout(() => callback('container-id-12345'), 10);
        }
      });

      const result = await containerHandler.handleMessage(
        'create image="debian:stable" name="test-worker" interactive=false',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      expect(result.image).toBe('debian:stable');
      expect(containerHandler.activeContainers.has('test-worker')).toBe(true);
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'run', '-d', '--name', 'test-worker', 'debian:stable', '/bin/bash', '-c', 'while true; do sleep 3600; done'
      ], expect.any(Object));
    });

    it('should create interactive container', async () => {
      const result = await containerHandler.handleMessage(
        'create image="ubuntu:latest" name="interactive-worker" interactive=true',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(spawn).toHaveBeenCalledWith('podman', [
        'run', '-d', '-it', '--name', 'interactive-worker', 'ubuntu:latest', '/bin/bash'
      ], expect.any(Object));
    });

    it('should enforce container limits', async () => {
      containerHandler.maxContainers = 2;
      
      // Add containers to active list to simulate limit
      containerHandler.activeContainers.set('container1', { name: 'container1', status: 'running' });
      containerHandler.activeContainers.set('container2', { name: 'container2', status: 'running' });

      await expect(
        containerHandler.handleMessage(
          'create image="debian:stable" name="container3"',
          mockContext
        )
      ).rejects.toThrow('Maximum containers (2) reached');
    });

    it('should validate security policy for images', async () => {
      containerHandler.allowedImages = new Set(['debian:stable', 'ubuntu:latest']);
      containerHandler.securityMode = 'strict';

      await expect(
        containerHandler.handleMessage(
          'create image="malicious:latest" name="test-container"',
          mockContext
        )
      ).rejects.toThrow('Image malicious:latest not allowed by security policy');
    });
  });

  describe('RexxJS Deployment', () => {
    beforeEach(async () => {
      // Setup podman and create a container first
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('container output'), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
      
      // Add a mock container
      containerHandler.activeContainers.set('test-worker', {
        name: 'test-worker',
        image: 'debian:stable',
        status: 'running',
        created: new Date()
      });
    });

    it('should deploy RexxJS binary successfully', async () => {
      const result = await containerHandler.handleMessage(
        'deploy_rexx container="test-worker" rexx_binary="./rexx-linux-x64" target_path="/usr/local/bin/rexx"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      expect(result.targetPath).toBe('/usr/local/bin/rexx');
      
      // Verify copy command was called
      expect(spawn).toHaveBeenCalledWith('podman', [
        'cp', './rexx-linux-x64', 'test-worker:/usr/local/bin/rexx'
      ], expect.any(Object));
      
      // Verify chmod command was called
      expect(spawn).toHaveBeenCalledWith('podman', [
        'exec', 'test-worker', 'chmod', '+x', '/usr/local/bin/rexx'
      ], expect.any(Object));
    });

    it('should handle missing binary file', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(
        containerHandler.handleMessage(
          'deploy_rexx container="test-worker" rexx_binary="./missing-binary"',
          mockContext
        )
      ).rejects.toThrow('Binary file ./missing-binary not found');
    });

    it('should handle non-existent container', async () => {
      await expect(
        containerHandler.handleMessage(
          'deploy_rexx container="non-existent" rexx_binary="./rexx-linux-x64"',
          mockContext
        )
      ).rejects.toThrow('Container non-existent not found');
    });
  });

  describe('Script Execution', () => {
    beforeEach(async () => {
      // Setup environment
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
      
      containerHandler.activeContainers.set('test-worker', {
        name: 'test-worker',
        image: 'debian:stable',
        status: 'running',
        hasRexx: true
      });
    });

    it('should execute RexxJS script successfully', async () => {
      // Mock script execution output
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Hello from container!'), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 10);
        }
      });

      const result = await containerHandler.handleMessage(
        'execute_rexx container="test-worker" script="SAY \'Hello from container!\'"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Hello from container!');

      expect(spawn).toHaveBeenCalledWith('podman', [
        'exec', 'test-worker', '/usr/local/bin/rexx', expect.any(String)
      ], expect.objectContaining({
        stdio: ['pipe', 'pipe', 'pipe']
      }));
    });

    it('should handle script execution timeout', async () => {
      // Mock long-running process that needs to be killed
      let timeoutId;
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          // Don't call callback - simulate hanging process
          timeoutId = setTimeout(() => callback(124), 10000); // Very long timeout
        }
      });

      // Override the timeout for this test
      const startTime = Date.now();
      
      await expect(
        containerHandler.executeScript('test-worker', 'SAY "Hang forever"; SYSTEM("sleep 60")', { timeout: 1000 })
      ).rejects.toThrow('Script execution timed out after 1000ms');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should timeout quickly
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      
      if (timeoutId) clearTimeout(timeoutId);
    });

    it('should handle script execution errors', async () => {
      // Mock script execution failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // Non-zero exit code
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Error: Syntax error on line 1'), 10);
        }
      });

      const result = await containerHandler.handleMessage(
        'execute_rexx container="test-worker" script="INVALID REXX SYNTAX"',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Syntax error');
    });

    it('should create temporary script file for execution', async () => {
      const longScript = 'SAY "Line 1"\nSAY "Line 2"\nSAY "Line 3"';
      
      await containerHandler.handleMessage(
        `execute_rexx container="test-worker" script="${longScript}"`,
        mockContext
      );

      // Verify temporary file operations
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/\/tmp\/rexx_script_.*\.rexx$/),
        longScript
      );

      expect(spawn).toHaveBeenCalledWith('podman', [
        'cp', expect.stringMatching(/\/tmp\/rexx_script_.*\.rexx$/), expect.stringMatching(/test-worker:\/tmp\/.*\.rexx$/)
      ], expect.any(Object));

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringMatching(/\/tmp\/rexx_script_.*\.rexx$/)
      );
    });
  });

  describe('Container Management', () => {
    beforeEach(async () => {
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
    });

    it('should list all containers', async () => {
      // Mock container list output
      const mockContainerList = JSON.stringify([
        { Names: ['test-worker-1'], State: 'running', Image: 'debian:stable' },
        { Names: ['test-worker-2'], State: 'stopped', Image: 'ubuntu:latest' }
      ]);

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(mockContainerList), 10);
        }
      });

      const result = await containerHandler.handleMessage('list', mockContext);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.containers).toHaveLength(2);
      expect(result.containers[0].name).toBe('test-worker-1');
      expect(result.containers[0].status).toBe('running');
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'ps', '-a', '--format', 'json'
      ], expect.any(Object));
    });

    it('should get container logs', async () => {
      const mockLogs = 'Log line 1\nLog line 2\nLog line 3';
      
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback(mockLogs), 10);
        }
      });

      const result = await containerHandler.handleMessage(
        'logs container="test-worker" lines=50',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      expect(result.content).toBe(mockLogs);
      expect(result.lines).toBe(50);
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'logs', '--tail', '50', 'test-worker'
      ], expect.any(Object));
    });

    it('should stop container', async () => {
      containerHandler.activeContainers.set('test-worker', {
        name: 'test-worker',
        status: 'running'
      });

      const result = await containerHandler.handleMessage(
        'stop container="test-worker"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'stop', 'test-worker'
      ], expect.any(Object));

      // Should update internal state
      const container = containerHandler.activeContainers.get('test-worker');
      expect(container.status).toBe('stopped');
    });

    it('should remove container with force', async () => {
      containerHandler.activeContainers.set('test-worker', {
        name: 'test-worker',
        status: 'stopped'
      });

      const result = await containerHandler.handleMessage(
        'remove container="test-worker" force=true',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('test-worker');
      expect(result.force).toBe(true);
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'rm', '-f', 'test-worker'
      ], expect.any(Object));

      // Should remove from internal state
      expect(containerHandler.activeContainers.has('test-worker')).toBe(false);
    });

    it('should cleanup all stopped containers', async () => {
      // Mock multiple containers
      containerHandler.activeContainers.set('container1', { name: 'container1', status: 'stopped' });
      containerHandler.activeContainers.set('container2', { name: 'container2', status: 'running' });
      containerHandler.activeContainers.set('container3', { name: 'container3', status: 'stopped' });

      const result = await containerHandler.handleMessage('cleanup all=true', mockContext);

      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(2); // Only stopped containers
      
      expect(spawn).toHaveBeenCalledWith('podman', [
        'container', 'prune', '-f'
      ], expect.any(Object));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await containerHandler.initialize({ securityMode: 'permissive' });
    });

    it('should handle invalid command gracefully', async () => {
      await expect(
        containerHandler.handleMessage('invalid_command', mockContext)
      ).rejects.toThrow('Unknown command: invalid_command');
    });

    it('should handle container runtime errors', async () => {
      // Mock runtime failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(125), 10); // Container runtime error
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Error: Cannot connect to container runtime'), 10);
        }
      });

      await expect(
        containerHandler.handleMessage(
          'create image="debian:stable" name="test-worker"',
          mockContext
        )
      ).rejects.toThrow('Container operation failed');
    });

    it('should validate required parameters', async () => {
      await expect(
        containerHandler.handleMessage('create', mockContext)
      ).rejects.toThrow('Missing required parameter: image');

      await expect(
        containerHandler.handleMessage('deploy_rexx', mockContext)
      ).rejects.toThrow('Missing required parameter: container');
    });

    it('should handle resource constraints', async () => {
      const result = await containerHandler.handleMessage(
        'create image="debian:stable" name="resource-test" memory="512m" cpus="1.0"',
        mockContext
      );

      expect(spawn).toHaveBeenCalledWith('podman', [
        'run', '-d', '--name', 'resource-test', '--memory', '512m', '--cpus', '1.0',
        'debian:stable', '/bin/bash', '-c', 'while true; do sleep 3600; done'
      ], expect.any(Object));
    });
  });

  describe('Ward Cunningham Style Test Scenarios', () => {
    it('should demonstrate complete container lifecycle', async () => {
      /*
       * BEFORE: Clean container environment
       * ┌─────────────────────────────────────────────┐
       * │ Container Handler                           │
       * │ Runtime: podman                             │
       * │ Active Containers: 0                        │
       * │ Security Mode: permissive                   │
       * └─────────────────────────────────────────────┘
       */

      await containerHandler.initialize({ securityMode: 'permissive' });
      expect(containerHandler.activeContainers.size).toBe(0);
      expect(containerHandler.runtime).toBe('podman');

      // INTERACTION: Create container
      let result = await containerHandler.handleMessage(
        'create image="debian:stable" name="lifecycle-test"',
        mockContext
      );

      /*
       * AFTER CREATE: Container created and tracked
       * ┌─────────────────────────────────────────────┐
       * │ Container Handler                           │
       * │ Runtime: podman                             │
       * │ Active Containers: 1                        │
       * │                                             │
       * │ > lifecycle-test                            │
       * │   Image: debian:stable                      │
       * │   Status: running                           │
       * │   RexxJS: not deployed                      │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(containerHandler.activeContainers.size).toBe(1);
      
      const container = containerHandler.activeContainers.get('lifecycle-test');
      expect(container.name).toBe('lifecycle-test');
      expect(container.status).toBe('running');
      expect(container.hasRexx).toBeFalsy();

      // INTERACTION: Deploy RexxJS
      result = await containerHandler.handleMessage(
        'deploy_rexx container="lifecycle-test" rexx_binary="./rexx-linux-x64"',
        mockContext
      );

      /*
       * AFTER DEPLOY: RexxJS binary deployed
       * ┌─────────────────────────────────────────────┐
       * │ Container Handler                           │
       * │ Runtime: podman                             │
       * │ Active Containers: 1                        │
       * │                                             │
       * │ > lifecycle-test                            │
       * │   Image: debian:stable                      │
       * │   Status: running                           │
       * │   RexxJS: ✓ deployed                        │
       * │   Binary: /usr/local/bin/rexx               │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(containerHandler.activeContainers.get('lifecycle-test').hasRexx).toBe(true);

      // INTERACTION: Execute script
      result = await containerHandler.handleMessage(
        'execute_rexx container="lifecycle-test" script="SAY \'Hello from RexxJS!\'"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerId).toBe('lifecycle-test');

      // INTERACTION: Cleanup
      result = await containerHandler.handleMessage(
        'remove container="lifecycle-test" force=true',
        mockContext
      );

      /*
       * AFTER CLEANUP: Back to clean state
       * ┌─────────────────────────────────────────────┐
       * │ Container Handler                           │
       * │ Runtime: podman                             │
       * │ Active Containers: 0                        │
       * │ Security Mode: permissive                   │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(containerHandler.activeContainers.size).toBe(0);
    });
  });
});