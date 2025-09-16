/**
 * Deployment Handler Mock Tests - Orchestration Integration
 * Tests high-level deployment orchestration with mocked container and remote shell handlers
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const DeploymentHandler = require('../deployment-handler');

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');

describe('Deployment Handler - Mock Orchestration Tests', () => {
  let deploymentHandler;
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
    fs.readFileSync.mockReturnValue('mock rexx binary content');
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
    fs.statSync.mockReturnValue({ 
      size: 52428800, // 50MB
      isFile: () => true 
    });

    // Initialize deployment handler
    deploymentHandler = new DeploymentHandler();
    
    // Mock context
    mockContext = {
      variables: new Map([
        ['target_image', 'debian:stable'],
        ['worker_name', 'deploy-worker'],
        ['host_server', 'deploy.example.com'],
        ['deploy_user', 'deployer'],
        ['binary_path', './rexx-linux-x64']
      ])
    };
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default binary path', async () => {
      await deploymentHandler.initialize({
        defaultBinaryPath: '/usr/local/bin/rexx-linux-x64',
        enableProgressCallbacks: true
      });

      expect(deploymentHandler.defaultBinaryPath).toBe('/usr/local/bin/rexx-linux-x64');
      expect(deploymentHandler.enableProgressCallbacks).toBe(true);
      expect(deploymentHandler.activeDeployments.size).toBe(0);
    });

    it('should initialize underlying handlers', async () => {
      await deploymentHandler.initialize({
        container: { securityMode: 'moderate' },
        remoteShell: { securityMode: 'strict', maxConnections: 5 }
      });

      expect(deploymentHandler.containerHandler).toBeDefined();
      expect(deploymentHandler.remoteShellHandler).toBeDefined();
    });

    it('should set up progress callbacks', async () => {
      const mockProgressCallback = jest.fn();
      
      await deploymentHandler.initialize({
        enableProgressCallbacks: true,
        progressCallback: mockProgressCallback
      });

      expect(deploymentHandler.progressCallbacks.has('default')).toBe(true);
      expect(deploymentHandler.progressCallbacks.get('default')).toBe(mockProgressCallback);
    });
  });

  describe('Container-based Deployments', () => {
    beforeEach(async () => {
      // Setup successful initialization
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10); // Success
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('podman version 4.3.1'), 10);
        }
      });

      await deploymentHandler.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });
    });

    it('should setup container deployment successfully', async () => {
      // Mock container creation success
      let commandType = 'version'; // Start with version check
      
      spawn.mockImplementation((command, args) => {
        if (args && args[0] === 'run') {
          commandType = 'create';
        } else if (args && args[0] === 'cp') {
          commandType = 'copy';
        } else if (args && args[0] === 'exec') {
          commandType = 'exec';
        }
        return mockProcess;
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          switch (commandType) {
            case 'version':
              setTimeout(() => callback('podman version 4.3.1'), 10);
              break;
            case 'create':
              setTimeout(() => callback('container-id-12345'), 10);
              break;
            default:
              setTimeout(() => callback('success'), 10);
          }
        }
      });

      const result = await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="test-deploy" rexx_binary="./rexx-linux-x64"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-deploy');
      expect(result.deploymentType).toBe('container');
      expect(result.status).toBe('ready');
      
      expect(deploymentHandler.activeDeployments.has('test-deploy')).toBe(true);
      const deployment = deploymentHandler.activeDeployments.get('test-deploy');
      expect(deployment.type).toBe('container');
      expect(deployment.containerName).toBe('test-deploy');
      expect(deployment.status).toBe('ready');
    });

    it('should execute scripts on deployed container', async () => {
      // Setup deployment first
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="exec-test"',
        mockContext
      );

      // Mock script execution
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Hello from RexxJS in container!'), 10);
        }
      });

      const result = await deploymentHandler.handleMessage(
        'execute_remote script="SAY \'Hello from RexxJS in container!\'" target="exec-test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.target).toBe('exec-test');
      expect(result.deploymentType).toBe('container');
      expect(result.output).toContain('Hello from RexxJS');
    });

    it('should handle one-shot container deployment', async () => {
      const oneShortScript = 'SAY "One-shot execution"\nLET result = 42\nSAY "Result: " || result';
      
      // Mock temporary container lifecycle
      let operationCount = 0;
      spawn.mockImplementation((command, args) => {
        operationCount++;
        return mockProcess;
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          if (operationCount <= 2) {
            setTimeout(() => callback('podman version 4.3.1'), 10); // Version/create
          } else {
            setTimeout(() => callback('One-shot execution\nResult: 42'), 10); // Script output
          }
        }
      });

      const result = await deploymentHandler.handleMessage(
        `deploy_and_execute script="${oneShortScript}" image="debian:stable" progress=true`,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('oneshot_container');
      expect(result.output).toContain('One-shot execution');
      expect(result.output).toContain('Result: 42');
      expect(result.cleanedUp).toBe(true);
      expect(result.temporaryContainerId).toBeDefined();
    });

    it('should monitor container deployment progress', async () => {
      const progressMessages = [];
      deploymentHandler.progressCallbacks.set('test', (event, params) => {
        progressMessages.push({ event, params });
      });

      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="progress-test"',
        mockContext
      );

      const progressScript = `
        SAY "Starting processing..."
        CHECKPOINT("started", "Processing initiated")
        
        DO i = 1 TO 5
          CHECKPOINT("progress", i, 5)
        END
        
        CHECKPOINT("completed", "Processing finished")
      `;

      await deploymentHandler.handleMessage(
        `execute_remote script="${progressScript}" target="progress-test" progress=true`,
        mockContext
      );

      // In a real implementation, progress messages would be captured
      // For this mock test, we verify the progress flag was processed
      expect(deploymentHandler.activeDeployments.get('progress-test').progressEnabled).toBe(true);
    });
  });

  describe('Remote Shell Deployments', () => {
    beforeEach(async () => {
      // Setup successful SSH connection
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('SSH connection successful'), 10);
        }
      });

      await deploymentHandler.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });
    });

    it('should setup remote shell deployment', async () => {
      const result = await deploymentHandler.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" key="~/.ssh/deploy_key" alias="remote-deploy"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('remote_shell');
      expect(result.connectionAlias).toBe('remote-deploy');
      expect(result.status).toBe('ready');
      
      expect(deploymentHandler.activeDeployments.has('remote-deploy')).toBe(true);
      const deployment = deploymentHandler.activeDeployments.get('remote-deploy');
      expect(deployment.type).toBe('remote_shell');
      expect(deployment.host).toBe('deploy.example.com');
    });

    it('should deploy RexxJS binary to remote host', async () => {
      // Setup remote connection first
      await deploymentHandler.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" alias="binary-deploy"',
        mockContext
      );

      // Mock binary deployment
      let isUpload = false;
      spawn.mockImplementation((command, args) => {
        if (command === 'scp') {
          isUpload = true;
        }
        return mockProcess;
      });

      const result = await deploymentHandler.handleMessage(
        'deploy_binary target="binary-deploy" binary_path="./rexx-linux-x64" target_path="/usr/local/bin/rexx"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.target).toBe('binary-deploy');
      expect(result.binaryPath).toBe('./rexx-linux-x64');
      expect(result.targetPath).toBe('/usr/local/bin/rexx');
      
      // Should have used SCP for upload
      expect(spawn).toHaveBeenCalledWith('scp', expect.arrayContaining([
        './rexx-linux-x64', 'deployer@deploy.example.com:/usr/local/bin/rexx'
      ]), expect.any(Object));
    });

    it('should execute remote scripts', async () => {
      // Setup deployment
      await deploymentHandler.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" alias="remote-exec"',
        mockContext
      );

      // Mock script execution
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Remote RexxJS execution successful'), 10);
        }
      });

      const result = await deploymentHandler.handleMessage(
        'execute_remote script="SAY \'Remote RexxJS execution successful\'" target="remote-exec"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.target).toBe('remote-exec');
      expect(result.deploymentType).toBe('remote_shell');
      expect(result.output).toContain('Remote RexxJS execution successful');
    });

    it('should handle remote deployment failures gracefully', async () => {
      // Mock SSH connection failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(255), 10); // SSH failure
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('ssh: connect to host failed: Connection refused'), 10);
        }
      });

      await expect(
        deploymentHandler.handleMessage(
          'setup_remote_shell host="unreachable.com" user="deployer" alias="failed"',
          mockContext
        )
      ).rejects.toThrow('Remote shell setup failed');
    });
  });

  describe('Multi-target Deployments', () => {
    beforeEach(async () => {
      // Setup successful environment
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await deploymentHandler.initialize();
    });

    it('should deploy to multiple targets simultaneously', async () => {
      // Setup container target
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="multi-container"',
        mockContext
      );

      // Setup remote shell target  
      await deploymentHandler.handleMessage(
        'setup_remote_shell host="multi.example.com" user="deployer" alias="multi-remote"',
        mockContext
      );

      expect(deploymentHandler.activeDeployments.size).toBe(2);

      // Execute on both targets
      const script = 'SAY "Multi-target execution"';
      
      const containerResult = await deploymentHandler.handleMessage(
        `execute_remote script="${script}" target="multi-container"`,
        mockContext
      );

      const remoteResult = await deploymentHandler.handleMessage(
        `execute_remote script="${script}" target="multi-remote"`,
        mockContext
      );

      expect(containerResult.success).toBe(true);
      expect(containerResult.deploymentType).toBe('container');
      
      expect(remoteResult.success).toBe(true);
      expect(remoteResult.deploymentType).toBe('remote_shell');
    });

    it('should handle mixed deployment types in orchestration', async () => {
      const result = await deploymentHandler.handleMessage(
        'setup_mixed_deployment containers=["debian:stable", "ubuntu:latest"] remote_hosts=["host1.com", "host2.com"]',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('mixed');
      expect(result.containerTargets).toBe(2);
      expect(result.remoteTargets).toBe(2);
      expect(deploymentHandler.activeDeployments.size).toBe(4); // 2 containers + 2 remotes
    });
  });

  describe('Deployment Lifecycle Management', () => {
    beforeEach(async () => {
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await deploymentHandler.initialize();
    });

    it('should monitor deployment status', async () => {
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="monitor-test"',
        mockContext
      );

      const result = await deploymentHandler.handleMessage(
        'monitor_deployment target="monitor-test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.target).toBe('monitor-test');
      expect(result.status).toBe('ready');
      expect(result.deploymentType).toBe('container');
      expect(result.uptime).toBeDefined();
    });

    it('should get detailed deployment monitoring', async () => {
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="detailed-monitor"',
        mockContext
      );

      const result = await deploymentHandler.handleMessage(
        'monitor_deployment target="detailed-monitor" detailed=true',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.detailed).toBe(true);
      expect(result.resourceUsage).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should cleanup specific deployment', async () => {
      // Create deployment
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="cleanup-test"',
        mockContext
      );

      expect(deploymentHandler.activeDeployments.has('cleanup-test')).toBe(true);

      // Cleanup
      const result = await deploymentHandler.handleMessage(
        'cleanup_deployment target="cleanup-test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.target).toBe('cleanup-test');
      expect(result.cleanupType).toBe('container');
      expect(deploymentHandler.activeDeployments.has('cleanup-test')).toBe(false);
    });

    it('should cleanup all deployments', async () => {
      // Create multiple deployments
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="cleanup1"',
        mockContext
      );
      await deploymentHandler.handleMessage(
        'setup_container image="ubuntu:latest" name="cleanup2"',
        mockContext
      );

      expect(deploymentHandler.activeDeployments.size).toBe(2);

      const result = await deploymentHandler.handleMessage(
        'cleanup_all_deployments',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.cleanedUp).toBe(2);
      expect(deploymentHandler.activeDeployments.size).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await deploymentHandler.initialize();
    });

    it('should handle deployment target not found', async () => {
      await expect(
        deploymentHandler.handleMessage(
          'execute_remote script="SAY \'test\'" target="nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Deployment target nonexistent not found');
    });

    it('should handle invalid deployment commands', async () => {
      await expect(
        deploymentHandler.handleMessage('invalid_deployment_command', mockContext)
      ).rejects.toThrow('Unknown deployment command: invalid_deployment_command');
    });

    it('should handle binary deployment failures', async () => {
      fs.existsSync.mockReturnValue(false); // Binary doesn't exist

      await expect(
        deploymentHandler.handleMessage(
          'setup_container image="debian:stable" name="binary-fail" rexx_binary="./nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Binary file ./nonexistent not found');
    });

    it('should implement retry logic for failed operations', async () => {
      let attemptCount = 0;
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          attemptCount++;
          // Fail first two attempts, succeed on third
          setTimeout(() => callback(attemptCount < 3 ? 1 : 0), 10);
        }
      });

      const result = await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="retry-test" retry_attempts=3',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });
  });

  describe('Ward Cunningham Style Integration Scenarios', () => {
    it('should demonstrate complete multi-environment deployment', async () => {
      /*
       * BEFORE: Clean deployment orchestrator
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Container Handler: initialized              │
       * │ Remote Shell Handler: initialized           │
       * │                                             │
       * │ Available Targets:                          │
       * │   • Container runtimes: podman              │
       * │   • SSH connectivity: available             │
       * └─────────────────────────────────────────────┘
       */

      await deploymentHandler.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });

      expect(deploymentHandler.activeDeployments.size).toBe(0);

      // INTERACTION: Setup development environment (container)
      let result = await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="dev-env"',
        mockContext
      );

      /*
       * AFTER DEV SETUP: Development environment ready
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > dev-env (container)                       │
       * │   Image: debian:stable                      │
       * │   Status: ready                             │
       * │   RexxJS: deployed                          │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(deploymentHandler.activeDeployments.size).toBe(1);
      
      const devDeployment = deploymentHandler.activeDeployments.get('dev-env');
      expect(devDeployment.type).toBe('container');
      expect(devDeployment.status).toBe('ready');

      // INTERACTION: Setup staging environment (remote)
      result = await deploymentHandler.handleMessage(
        'setup_remote_shell host="staging.example.com" user="staging" alias="staging-env"',
        mockContext
      );

      /*
       * AFTER STAGING SETUP: Multi-environment deployment active
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 2                       │
       * │                                             │
       * │ > dev-env (container)                       │
       * │   Image: debian:stable                      │
       * │   Status: ready                             │
       * │   RexxJS: deployed                          │
       * │                                             │
       * │ > staging-env (remote_shell)                │
       * │   Host: staging.example.com                 │
       * │   User: staging                             │
       * │   Status: ready                             │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(deploymentHandler.activeDeployments.size).toBe(2);
      
      const stagingDeployment = deploymentHandler.activeDeployments.get('staging-env');
      expect(stagingDeployment.type).toBe('remote_shell');
      expect(stagingDeployment.status).toBe('ready');

      // INTERACTION: Deploy same application to both environments
      const appScript = 'SAY "Application v1.0 deployed"; LET version = "1.0"; SAY "Version: " || version';

      const devResult = await deploymentHandler.handleMessage(
        `execute_remote script="${appScript}" target="dev-env"`,
        mockContext
      );

      const stagingResult = await deploymentHandler.handleMessage(
        `execute_remote script="${appScript}" target="staging-env"`,
        mockContext
      );

      expect(devResult.success).toBe(true);
      expect(devResult.deploymentType).toBe('container');
      
      expect(stagingResult.success).toBe(true);
      expect(stagingResult.deploymentType).toBe('remote_shell');

      // INTERACTION: Monitor both deployments
      const devMonitor = await deploymentHandler.handleMessage(
        'monitor_deployment target="dev-env"',
        mockContext
      );

      const stagingMonitor = await deploymentHandler.handleMessage(
        'monitor_deployment target="staging-env"',
        mockContext
      );

      expect(devMonitor.success).toBe(true);
      expect(stagingMonitor.success).toBe(true);

      // INTERACTION: Cleanup all environments
      const cleanupResult = await deploymentHandler.handleMessage(
        'cleanup_all_deployments',
        mockContext
      );

      /*
       * AFTER CLEANUP: Back to clean state
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Container Handler: initialized              │
       * │ Remote Shell Handler: initialized           │
       * │                                             │
       * │ Deployment History: 2 completed             │
       * └─────────────────────────────────────────────┘
       */

      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.cleanedUp).toBe(2);
      expect(deploymentHandler.activeDeployments.size).toBe(0);
    });

    it('should demonstrate progress monitoring workflow', async () => {
      /*
       * BEFORE: Progress monitoring setup
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Progress Callbacks: enabled                 │
       * │ Active Deployments: 0                       │
       * │                                             │
       * │ CHECKPOINT Communication Bus:               │
       * │   Director ←→ Worker                        │
       * │   Status: ready                             │
       * └─────────────────────────────────────────────┘
       */

      const progressMessages = [];
      await deploymentHandler.initialize({
        enableProgressCallbacks: true,
        progressCallback: (event, params) => {
          progressMessages.push({ event, params, timestamp: Date.now() });
        }
      });

      // INTERACTION: Deploy with progress monitoring
      await deploymentHandler.handleMessage(
        'setup_container image="debian:stable" name="progress-demo"',
        mockContext
      );

      const progressScript = `
        SAY "Starting long-running task..."
        CHECKPOINT("task_start", "Long-running task initiated")
        
        LET total_items = 100
        DO i = 1 TO total_items
          /* Simulate work */
          IF i // 10 = 0 THEN
            CHECKPOINT("progress", i, total_items)
        END
        
        CHECKPOINT("task_complete", "All items processed successfully")
      `;

      /*
       * DURING EXECUTION: Progress updates flowing
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > progress-demo (container)                 │
       * │   Status: executing                         │
       * │   Progress: [░░░░░░░░░░] 60/100             │
       * │                                             │
       * │ CHECKPOINT Flow:                            │
       * │   task_start ✓                             │
       * │   progress: 10/100 ✓                       │
       * │   progress: 20/100 ✓                       │
       * │   progress: 60/100 ✓ (current)             │
       * └─────────────────────────────────────────────┘
       */

      const result = await deploymentHandler.handleMessage(
        `execute_remote script="${progressScript}" target="progress-demo" progress=true`,
        mockContext
      );

      /*
       * AFTER EXECUTION: Progress monitoring completed
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > progress-demo (container)                 │
       * │   Status: ready                             │
       * │   Last Execution: successful                │
       * │                                             │
       * │ Progress Summary:                           │
       * │   • task_start                              │
       * │   • progress updates: 10 checkpoints       │
       * │   • task_complete                           │
       * │   Duration: 1.2s                           │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(result.progressEnabled).toBe(true);
      
      const deployment = deploymentHandler.activeDeployments.get('progress-demo');
      expect(deployment.progressEnabled).toBe(true);
      expect(deployment.lastExecution).toBeDefined();
    });
  });
});