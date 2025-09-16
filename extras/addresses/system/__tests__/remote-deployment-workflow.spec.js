/**
 * Remote Deployment Workflow Tests
 * Tests the complete remote shell and container deployment system
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const RemoteShellHandler = require('../../extras/addresses/system/remote-shell-handler');
const PodmanHandler = require('../../extras/addresses/system/podman-handler');
const DeploymentOrchestrator = require('../../extras/addresses/system/deployment-orchestrator');

// Mock child_process for testing
jest.mock('child_process');
jest.mock('fs');

describe('Remote Deployment Workflow', () => {
  let orchestrator;
  let remoteShellHandler;
  let containerHandler;
  let mockContext;

  beforeEach(() => {
    // Setup mocks
    const { spawn } = require('child_process');
    const mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      stdin: { write: jest.fn(), end: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockProcess);

    // Mock successful process completion
    setTimeout(() => {
      mockProcess.on.mock.calls.forEach(([event, callback]) => {
        if (event === 'close') {
          callback(0); // Success exit code
        }
      });
    }, 0);

    // Mock fs
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mocked file content');
    fs.statSync.mockReturnValue({ size: 1024 });

    // Initialize handlers
    orchestrator = new DeploymentOrchestrator();
    remoteShellHandler = new RemoteShellHandler();
    containerHandler = new PodmanHandler();

    mockContext = {
      variables: new Map([
        ['host_server', 'test.example.com'],
        ['username', 'testuser'],
        ['container_name', 'test-worker']
      ])
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Container Deployment Workflow', () => {
    it('should create container and deploy RexxJS binary', async () => {
      await containerHandler.initialize({
        securityMode: 'permissive',
        allowedImages: ['debian:stable']
      });

      // Mock container runtime detection
      containerHandler.runtime = 'podman';

      const createResult = await containerHandler.handleMessage(
        'create image="debian:stable" name="test-worker" interactive=false',
        mockContext
      );

      expect(createResult.success).toBe(true);
      expect(createResult.containerId).toBe('test-worker');
      expect(createResult.image).toBe('debian:stable');

      const deployResult = await containerHandler.handleMessage(
        'deploy_rexx container="test-worker" rexx_binary="/path/to/rexx-linux-x64"',
        mockContext
      );

      expect(deployResult.success).toBe(true);
      expect(deployResult.containerId).toBe('test-worker');
      expect(deployResult.targetPath).toBe('/usr/local/bin/rexx');
    });

    it('should execute RexxJS script in container', async () => {
      await containerHandler.initialize({ securityMode: 'permissive' });
      containerHandler.runtime = 'podman';

      // Setup container with RexxJS
      await containerHandler.handleMessage(
        'create image="debian:stable" name="script-runner" interactive=false',
        mockContext
      );

      await containerHandler.handleMessage(
        'deploy_rexx container="script-runner" rexx_binary="/path/to/rexx-linux-x64"',
        mockContext
      );

      const executeResult = await containerHandler.handleMessage(
        'execute_rexx container="script-runner" script="SAY \'Hello from container\'"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.containerId).toBe('script-runner');
    });

    it('should demonstrate Ward Cunningham style container workflow', () => {
      /*
       * BEFORE: No containers running
       * ┌─────────────────────────────────────────────┐
       * │ Container Runtime: podman                   │
       * │ Active Containers: 0                        │
       * │                                             │
       * │ Available Images:                           │
       * │   • debian:stable                           │
       * │   • ubuntu:latest                           │
       * └─────────────────────────────────────────────┘
       */

      expect(containerHandler.activeContainers.size).toBe(0);

      // INTERACTION: Create and setup container
      return containerHandler.handleMessage(
        'create image="debian:stable" name="rexx-worker"',
        mockContext
      ).then(() => {
        /*
         * AFTER: Container created and RexxJS deployed
         * ┌─────────────────────────────────────────────┐
         * │ Container Runtime: podman                   │
         * │ Active Containers: 1                        │
         * │                                             │
         * │ > rexx-worker (debian:stable)               │
         * │   Status: running                           │
         * │   RexxJS: deployed (/usr/local/bin/rexx)    │
         * │   Created: 2025-01-15T10:00:00Z             │
         * └─────────────────────────────────────────────┘
         */

        expect(containerHandler.activeContainers.size).toBe(1);
        expect(containerHandler.activeContainers.has('rexx-worker')).toBe(true);
        
        const container = containerHandler.activeContainers.get('rexx-worker');
        expect(container.image).toBe('debian:stable');
        expect(container.status).toBe('running');
      });
    });
  });

  describe('Remote Shell Deployment Workflow', () => {
    it('should establish secure shell connection', async () => {
      await remoteShellHandler.initialize({
        securityMode: 'permissive',
        allowedHosts: ['test.example.com']
      });

      const connectResult = await remoteShellHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="/path/to/key"',
        mockContext
      );

      expect(connectResult.success).toBe(true);
      expect(connectResult.host).toBe('test.example.com');
      expect(connectResult.user).toBe('testuser');
    });

    it('should execute commands on remote host', async () => {
      await remoteShellHandler.initialize({ securityMode: 'permissive' });

      await remoteShellHandler.handleMessage(
        'connect host="test.example.com" user="testuser"',
        mockContext
      );

      const executeResult = await remoteShellHandler.handleMessage(
        'execute command="ls -la /tmp"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.command).toBe('ls -la /tmp');
    });

    it('should demonstrate Ward Cunningham style remote workflow', () => {
      /*
       * BEFORE: No remote connections
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Active Connections: 0                       │
       * │ Security Mode: permissive                   │
       * │                                             │
       * │ Allowed Hosts:                              │
       * │   • test.example.com                        │
       * │   • staging.example.com                     │
       * └─────────────────────────────────────────────┘
       */

      expect(remoteShellHandler.activeConnections.size).toBe(0);

      // INTERACTION: Connect to remote server
      return remoteShellHandler.handleMessage(
        'connect host="{host_server}" user="{username}" alias="main"',
        mockContext
      ).then(() => {
        /*
         * AFTER: Connected to remote server
         * ┌─────────────────────────────────────────────┐
         * │ Remote Shell Handler                        │
         * │ Active Connections: 1                       │
         * │ Security Mode: permissive                   │
         * │                                             │
         * │ > main (test.example.com)                   │
         * │   User: testuser                            │
         * │   Status: connected                         │
         * │   Connected: 2025-01-15T10:00:00Z           │
         * └─────────────────────────────────────────────┘
         */

        expect(remoteShellHandler.activeConnections.size).toBe(1);
        expect(remoteShellHandler.activeConnections.has('main')).toBe(true);
        
        const connection = remoteShellHandler.activeConnections.get('main');
        expect(connection.host).toBe('test.example.com');
        expect(connection.user).toBe('testuser');
      });
    });
  });

  describe('Unified Deployment Handler Workflow', () => {
    it('should orchestrate complete container deployment', async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64'
      });

      const setupResult = await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="orchestrated-worker"',
        mockContext
      );

      expect(setupResult.success).toBe(true);
      expect(setupResult.containerName).toBe('orchestrated-worker');
      expect(setupResult.status).toBe('ready');

      const executeResult = await orchestrator.handleMessage(
        'execute_remote script="SAY \'Hello from orchestrated container\'" target="orchestrated-worker"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.target).toBe('orchestrated-worker');
    });

    it('should demonstrate one-shot deployment and execution', async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64'
      });

      const result = await orchestrator.handleMessage(
        'deploy_and_execute script="SAY \'One-shot execution\'" image="debian:stable"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('oneshot_container');
      expect(result.cleanedUp).toBe(true);
    });

    it('should demonstrate Ward Cunningham style orchestration workflow', () => {
      /*
       * BEFORE: Clean deployment environment
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Default Binary: /path/to/rexx-linux-x64     │
       * │                                             │
       * │ Available Runtimes:                         │
       * │   • Container: podman                       │
       * │   • Remote Shell: ssh/scp                   │
       * └─────────────────────────────────────────────┘
       */

      expect(orchestrator.activeDeployments.size).toBe(0);

      // INTERACTION: Setup multiple deployment targets
      return orchestrator.handleMessage(
        'setup_container image="debian:stable" name="worker1"',
        mockContext
      ).then(() => {
        return orchestrator.handleMessage(
          'setup_remote_shell host="server.example.com" user="admin" alias="server1"',
          mockContext
        );
      }).then(() => {
        /*
         * AFTER: Multiple deployment targets ready
         * ┌─────────────────────────────────────────────┐
         * │ Deployment Orchestrator                     │
         * │ Active Deployments: 2                       │
         * │ Default Binary: /path/to/rexx-linux-x64     │
         * │                                             │
         * │ > worker1 (container)                       │
         * │   Image: debian:stable                      │
         * │   Status: ready                             │
         * │   RexxJS: deployed                          │
         * │                                             │
         * │ > server1 (remote_shell)                    │
         * │   Host: server.example.com                  │
         * │   User: admin                               │
         * │   Status: ready                             │
         * └─────────────────────────────────────────────┘
         */

        expect(orchestrator.activeDeployments.size).toBe(2);
        
        const deployments = Array.from(orchestrator.activeDeployments.values());
        expect(deployments.some(d => d.type === 'container')).toBe(true);
        expect(deployments.some(d => d.type === 'remote_shell')).toBe(true);
      });
    });
  });

  describe('CHECKPOINT Communication Pattern', () => {
    it('should demonstrate progress callback workflow', async () => {
      /*
       * CHECKPOINT Communication Flow:
       * ┌─────────────┐    EXECUTE    ┌─────────────┐
       * │   Director  │──────────────►│   Worker    │
       * │ (Main RexxJS│               │(Container/  │
       * │  Process)   │               │ Remote)     │
       * │             │◄──────────────│             │
       * └─────────────┘   CHECKPOINT  └─────────────┘
       *                   PROGRESS
       * 
       * Worker sends:
       * - CHECKPOINT("started", "Processing begins...")
       * - CHECKPOINT("progress", 50, 100)  
       * - CHECKPOINT("completed", "Finished processing")
       */

      await orchestrator.initialize({
        enableProgressCallbacks: true,
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64'
      });

      const progressMessages = [];
      orchestrator.progressCallbacks.set('test-callback', (checkpoint, params) => {
        progressMessages.push({ checkpoint, params });
      });

      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="progress-worker"',
        mockContext
      );

      const progressScript = `
        SAY "Starting data processing..."
        CHECKPOINT("started", "Data processing initiated")
        
        DO i = 1 TO 100
          /* Process data item */
          IF i // 10 = 0 THEN
            CHECKPOINT("progress", i, 100)
        END
        
        CHECKPOINT("completed", "Processing finished successfully")
        SAY "All done!"
      `;

      const result = await orchestrator.handleMessage(
        `execute_remote script="${progressScript}" target="progress-worker" progress=true`,
        mockContext
      );

      expect(result.success).toBe(true);
      // In a real implementation, progressMessages would contain CHECKPOINT calls
    });
  });

  describe('Security and Error Handling', () => {
    it('should enforce security policies', async () => {
      await remoteShellHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.example.com']
      });

      await expect(
        remoteShellHandler.handleMessage(
          'connect host="untrusted.example.com" user="user"',
          mockContext
        )
      ).rejects.toThrow('Host untrusted.example.com not allowed by security policy');
    });

    it('should handle deployment failures gracefully', async () => {
      // Mock failed process
      const { spawn } = require('child_process');
      const mockFailedProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };

      spawn.mockReturnValueOnce(mockFailedProcess);

      setTimeout(() => {
        mockFailedProcess.on.mock.calls.forEach(([event, callback]) => {
          if (event === 'close') {
            callback(1); // Failure exit code
          }
        });
      }, 0);

      await containerHandler.initialize({ securityMode: 'permissive' });
      containerHandler.runtime = 'podman';

      await expect(
        containerHandler.handleMessage(
          'create image="nonexistent:image" name="failed-container"',
          mockContext
        )
      ).rejects.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should enforce container limits', async () => {
      await containerHandler.initialize({
        maxContainers: 2,
        securityMode: 'permissive'
      });

      containerHandler.runtime = 'podman';

      // Create maximum allowed containers
      await containerHandler.handleMessage(
        'create image="debian:stable" name="container1"',
        mockContext
      );

      await containerHandler.handleMessage(
        'create image="debian:stable" name="container2"', 
        mockContext
      );

      // Try to exceed limit
      await expect(
        containerHandler.handleMessage(
          'create image="debian:stable" name="container3"',
          mockContext
        )
      ).rejects.toThrow('Maximum containers (2) reached');
    });

    it('should cleanup resources properly', async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64'
      });

      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="cleanup-test"',
        mockContext
      );

      expect(orchestrator.activeDeployments.size).toBe(1);

      const cleanupResult = await orchestrator.handleMessage(
        'cleanup_deployment target="cleanup-test"',
        mockContext
      );

      expect(cleanupResult.success).toBe(true);
      expect(orchestrator.activeDeployments.size).toBe(0);
    });
  });
});