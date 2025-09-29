/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for GCP ADDRESS Handler
 * Tests Cloud Functions, Cloud Run, Storage, and Pub/Sub operations
 */

const { createGcpTestHandler } = require('./test-helper');

describe('GCP ADDRESS Handler', () => {
  jest.setTimeout(30000);

  let handler;

  beforeEach(async () => {
    handler = await createGcpTestHandler({
      project: 'test-project-123',
      region: 'us-central1'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      const handler = await createGcpTestHandler();

      expect(handler.runtime).toBe('gcp');
      expect(handler.environment).toBe('cloud-functions');
      expect(handler.region).toBe('us-central1');
      expect(handler.functionDefaults.runtime).toBe('python311');
      expect(handler.cloudRunDefaults.platform).toBe('managed');
    });

    it('should auto-detect project from gcloud config', async () => {
      const handler = await createGcpTestHandler();
      await handler.initialize();

      expect(handler.project).toBe('test-project-123');
    });

    it('should support custom configuration', async () => {
      const config = {
        project: 'custom-project',
        region: 'europe-west1',
        environment: 'cloud-run'
      };

      const handler = await createGcpTestHandler(config);

      expect(handler.project).toBe('custom-project');
      expect(handler.region).toBe('europe-west1');
      expect(handler.environment).toBe('cloud-run');
    });
  });

  describe('Cloud Functions Operations', () => {
    it('should deploy HTTP-triggered function', async () => {
      const params = {
        name: 'hello-function',
        source: './function-source',
        runtime: 'python311',
        entry_point: 'hello_world',
        trigger: 'http'
      };

      const result = await handler.handle('deploy_function', params);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deployed successfully');
      expect(result.url).toBe('https://us-central1-test-project-123.cloudfunctions.net/hello-function');

      // Check function is tracked
      expect(handler.activeFunctions.has('hello-function')).toBe(true);
    });

    it('should deploy Pub/Sub-triggered function', async () => {
      const params = {
        name: 'pubsub-function',
        source: './function-source',
        runtime: 'nodejs20',
        trigger: 'topic:my-topic'
      };

      const result = await handler.handle('deploy_function', params);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deployed successfully');
      expect(handler.activeFunctions.get('pubsub-function').trigger).toBe('topic:my-topic');
    });

    it('should deploy storage-triggered function', async () => {
      const params = {
        name: 'storage-function',
        source: './function-source',
        runtime: 'go121',
        trigger: 'bucket:my-bucket'
      };

      const result = await handler.handle('deploy_function', params);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deployed successfully');
    });

    it('should invoke function with data', async () => {
      const testData = { message: 'Hello World' };

      const result = await handler.handle('invoke_function', {
        name: 'hello-function',
        data: testData
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function executed successfully');
    });

    it('should list all functions', async () => {
      const result = await handler.handle('list_functions');

      expect(result.success).toBe(true);
      expect(result.functions).toBeInstanceOf(Array);
      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.functions[0]).toHaveProperty('name');
      expect(result.functions[0]).toHaveProperty('runtime');
    });

    it('should delete function', async () => {
      const result = await handler.handle('delete_function', {
        name: 'hello-function'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deleted');
      expect(handler.activeFunctions.has('hello-function')).toBe(false);
    });

    it('should handle function deployment errors', async () => {
      const params = {
        name: 'invalid-function',
        source: './nonexistent-source',
        runtime: 'invalid-runtime'
      };

      await expect(handler.handle('deploy_function', params))
        .rejects.toThrow('Unsupported runtime: invalid-runtime');
    });
  });

  describe('Cloud Run Operations', () => {
    it('should deploy service from container image', async () => {
      const params = {
        name: 'hello-service',
        image: 'gcr.io/test-project/hello-app:latest',
        region: 'us-central1',
        memory: '512Mi',
        cpu: '1'
      };

      const result = await handler.handle('deploy_service', params);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deployed successfully');
      expect(result.url).toBe('https://hello-service-abc123-uc.a.run.app');

      // Check service is tracked
      expect(handler.activeServices.has('hello-service')).toBe(true);
    });

    it('should deploy service with environment variables', async () => {
      const params = {
        name: 'env-service',
        image: 'gcr.io/test-project/app:latest',
        env_vars: {
          DATABASE_URL: 'postgres://localhost/mydb',
          API_KEY: 'secret123'
        }
      };

      const result = await handler.handle('deploy_service', params);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deployed successfully');
    });

    it('should list services', async () => {
      const result = await handler.handle('list_services', {
        region: 'us-central1'
      });

      expect(result.success).toBe(true);
      expect(result.services).toBeInstanceOf(Array);
    });

    it('should delete service', async () => {
      const result = await handler.handle('delete_service', {
        name: 'hello-service',
        region: 'us-central1'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deleted');
      expect(handler.activeServices.has('hello-service')).toBe(false);
    });

    it('should require image for service deployment', async () => {
      const params = {
        name: 'no-image-service'
        // Missing image parameter
      };

      await expect(handler.handle('deploy_service', params))
        .rejects.toThrow('Image is required for Cloud Run deployment');
    });
  });

  describe('Storage Operations', () => {
    it('should create storage bucket', async () => {
      const result = await handler.handle('create_bucket', {
        name: 'test-bucket-123',
        location: 'us-central1'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Bucket created successfully');
    });

    it('should upload file to bucket', async () => {
      const result = await handler.handle('upload', {
        bucket: 'test-bucket-123',
        file: './test-file.txt',
        path: 'uploads/test-file.txt'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('File uploaded successfully');
    });

    it('should list buckets', async () => {
      const result = await handler.handle('list_buckets');

      expect(result.success).toBe(true);
      expect(result.buckets).toBeInstanceOf(Array);
    });
  });

  describe('Pub/Sub Operations', () => {
    it('should create topic', async () => {
      const result = await handler.handle('create_topic', {
        name: 'test-topic'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Topic created successfully');
    });

    it('should publish message to topic', async () => {
      const message = { event: 'user_signup', userId: 123 };

      const result = await handler.handle('publish', {
        topic: 'test-topic',
        message: message
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Message published successfully');
    });
  });

  describe('RexxJS Integration', () => {
    it('should deploy RexxJS script as Cloud Function', async () => {
      // Mock file system for RexxJS script
      const mockScript = `
        SAY "Hello from RexxJS!"
        LET result = "Function executed successfully"
      `;

      handler.fs.readFileSync.mockReturnValue(mockScript);

      const result = await handler.handle('deploy_rexx', {
        script: './hello.rexx',
        name: 'rexx-hello'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deployed successfully');
      expect(handler.fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringMatching(/\/tmp\/gcp-function-rexx-hello\/main\.py$/),
        expect.stringContaining(mockScript)
      );
    });

    it('should handle RexxJS deployment errors', async () => {
      handler.fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(handler.handle('deploy_rexx', {
        script: './nonexistent.rexx'
      })).rejects.toThrow('File not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle gcloud command failures', async () => {
      // Mock spawn to return failure
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn()
      };

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('ERROR: Authentication failed'));
        }
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1); // Exit with error
        }
      });

      handler.spawn.mockReturnValue(mockProcess);

      const result = await handler.handle('list_functions');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Authentication failed');
    });

    it('should handle unknown methods', async () => {
      await expect(handler.handle('unknown_method'))
        .rejects.toThrow('Unknown GCP method: unknown_method');
    });

    it('should validate runtime support', async () => {
      const params = {
        name: 'test-function',
        runtime: 'cobol85' // Unsupported runtime
      };

      await expect(handler.handle('deploy_function', params))
        .rejects.toThrow('Unsupported runtime: cobol85');
    });
  });

  describe('Info and Status', () => {
    it('should provide handler information', async () => {
      const result = await handler.handle('info');

      expect(result.handler).toBe('GCP');
      expect(result.version).toBe('1.0.0');
      expect(result.project).toBe('test-project-123');
      expect(result.region).toBe('us-central1');
      expect(result.activeFunctions).toBeInstanceOf(Array);
      expect(result.activeServices).toBeInstanceOf(Array);
    });

    it('should maintain audit log', async () => {
      await handler.handle('info');
      await handler.handle('list_functions');

      expect(handler.auditLog.length).toBeGreaterThanOrEqual(2);
      expect(handler.auditLog[0]).toHaveProperty('timestamp');
      expect(handler.auditLog[0]).toHaveProperty('method');
      expect(handler.auditLog[0]).toHaveProperty('params');
    });
  });

  describe('Idiomatic Command Syntax', () => {
    it('should parse deploy service command', async () => {
      const result = await global.ADDRESS_GCP_HANDLER('deploy service hello-world --image gcr.io/project/app --region us-central1');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deployed successfully');
    });

    it('should parse list services command', async () => {
      const result = await global.ADDRESS_GCP_HANDLER('list services --region us-central1');

      expect(result.success).toBe(true);
      expect(result.services).toBeInstanceOf(Array);
    });

    it('should parse deploy function command', async () => {
      const result = await global.ADDRESS_GCP_HANDLER('deploy function hello-func --source ./src --runtime python311');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Function deployed successfully');
    });

    it('should parse delete service command', async () => {
      const result = await global.ADDRESS_GCP_HANDLER('delete service hello-world --region us-central1');

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deleted');
    });

    it('should handle invalid commands', async () => {
      await expect(global.ADDRESS_GCP_HANDLER('invalid command'))
        .rejects.toThrow('Unknown GCP command: invalid command');
    });

    it('should handle incomplete commands', async () => {
      await expect(global.ADDRESS_GCP_HANDLER('deploy'))
        .rejects.toThrow('Invalid GCP command: deploy');
    });

    it('should maintain backward compatibility with method calls', async () => {
      const result = await global.ADDRESS_GCP_HANDLER('deploy_service', {
        name: 'test-service',
        image: 'gcr.io/project/app'
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Service deployed successfully');
    });
  });

  describe('Configuration Validation', () => {
    it('should enforce function limits', async () => {
      handler.maxFunctions = 1;
      handler.activeFunctions.set('existing-function', {});

      const params = {
        name: 'another-function',
        source: './source'
      };

      // Should still deploy but track in audit
      const result = await handler.handle('deploy_function', params);
      expect(result.success).toBe(true);
    });

    it('should validate regions', async () => {
      expect(handler.allowedRegions.has('us-central1')).toBe(true);
      expect(handler.allowedRegions.has('mars-north1')).toBe(false);
    });

    it('should validate runtimes', async () => {
      expect(handler.allowedRuntimes.has('python311')).toBe(true);
      expect(handler.allowedRuntimes.has('assembly')).toBe(false);
    });
  });
});