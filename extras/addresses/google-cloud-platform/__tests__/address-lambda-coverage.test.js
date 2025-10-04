const { createLambdaTestHandler } = require('./test-helper');

describe('ADDRESS LAMBDA Handler - Coverage Tests', () => {

  test('should handle initialize with existing configuration', async () => {
    const handler = await createLambdaTestHandler();

    // Re-initialize with different config
    const initResult = await handler.initialize({
      environment: 'localstack',
      region: 'us-west-1',
      localStackEndpoint: 'http://192.168.1.100:4566'
    });

    expect(initResult.success).toBe(true);
    expect(handler.environment).toBe('localstack');
    expect(handler.region).toBe('us-west-1');
    expect(handler.localStackEndpoint).toBe('http://192.168.1.100:4566');
  });

  test('should handle environment detection with auto mode', async () => {
    const handler = await createLambdaTestHandler({ environment: 'auto' });

    await handler.detectEnvironment();
    expect(['local', 'aws', 'localstack'].includes(handler.environment)).toBe(true);
  });

  test('should handle command parsing with complex parameters', async () => {
    const handler = await createLambdaTestHandler();

    const parsed = handler.parseCommand('create name="complex name" runtime=python3.11 environment_vars="KEY=value with spaces"');
    expect(parsed.operation).toBe('create');
    expect(parsed.params.name).toBe('complex name');
    expect(parsed.params.environment_vars).toBe('KEY=value with spaces');
  });

  test('should handle function list parsing with environment filters', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('list runtime=nodejs18.x');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.functions)).toBe(true);

    // Should only return Node.js functions
    result.functions.forEach(fn => {
      expect(fn.Runtime || fn.runtime).toBe('nodejs18.x');
    });
  });

  test('should handle deploy_rexx function creation with different runtimes', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    const result = await handler.handleAddressCommand('deploy_rexx name=rexx-func rexx_script="SAY \'Hello from RexxJS!\'" runtime=python3.10');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy_rexx');
    expect(result.runtime).toBe('python3.10');
  });

  test('should handle invoke_rexx as alias', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('rexx-func', {
      name: 'rexx-func',
      runtime: 'python3.11',
      handler: 'lambda_function.lambda_handler'
    });

    const result = await handler.handleAddressCommand('invoke_rexx name=rexx-func data={"test": "data"}');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('invoke');
  });

  test('should handle missing operation', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No operation specified');
  });

  test('should handle unknown operation', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('unknown_command param=value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown operation');
  });

  test('should handle execCommand errors', async () => {
    const handler = await createLambdaTestHandler();

    // Mock spawn to return error
    handler.spawn = jest.fn().mockImplementation(() => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn()
      };

      setTimeout(() => {
        mockProcess.on.mock.calls.forEach(([event, callback]) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        });
      }, 10);

      return mockProcess;
    });

    await expect(handler.execCommand('nonexistent-command', ['--help'])).rejects.toThrow('Command not found');
  });

  test('should handle function update with partial parameters', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('update-func', {
      name: 'update-func',
      runtime: 'python3.11',
      timeout: 30,
      memorySize: 128
    });

    const result = await handler.handleAddressCommand('update name=update-func timeout=60');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('update');

    const fn = handler.activeFunctions.get('update-func');
    expect(fn.timeout).toBe(60);
    expect(fn.lastModified).toBeDefined();
  });

  test('should handle local function operations', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    // Test local function creation
    const createResult = await handler.handleAddressCommand('create name=local-func runtime=python3.11 handler=index.handler');
    expect(createResult.success).toBe(true);
    expect(createResult.arn).toContain('local:function:local-func');

    // Test local function invocation
    const invokeResult = await handler.handleAddressCommand('invoke name=local-func payload={"test": "local"}');
    expect(invokeResult.success).toBe(true);
  });

  test('should handle LocalStack function operations', async () => {
    const handler = await createLambdaTestHandler({ environment: 'localstack' });

    const createResult = await handler.handleAddressCommand('create name=localstack-func runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(createResult.success).toBe(true);
    expect(createResult.arn).toContain('000000000000'); // LocalStack account ID
  });

  test('should handle layer operations comprehensively', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Create layer with all parameters
    const createResult = await handler.handleAddressCommand('create_layer name=comprehensive-layer content=/tmp/layer.zip compatible_runtimes=python3.11,nodejs18.x description="Comprehensive test layer"');
    expect(createResult.success).toBe(true);
    expect(createResult.layer).toBe('comprehensive-layer');

    // Verify layer was added to internal state
    expect(handler.layers.has('comprehensive-layer')).toBe(true);
    const layer = handler.layers.get('comprehensive-layer');
    expect(layer.description).toBe('Comprehensive test layer');

    // List layers
    const listResult = await handler.handleAddressCommand('list_layers');
    expect(listResult.success).toBe(true);
    expect(Array.isArray(listResult.layers)).toBe(true);

    // Delete layer
    const deleteResult = await handler.handleAddressCommand('delete_layer name=comprehensive-layer version=1');
    expect(deleteResult.success).toBe(true);
    expect(handler.layers.has('comprehensive-layer')).toBe(false);
  });

  test('should handle alias operations', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Create alias
    const createResult = await handler.handleAddressCommand('create_alias name=test-function alias_name=staging version=1 description="Staging environment"');
    expect(createResult.success).toBe(true);
    expect(createResult.alias).toBe('staging');

    // List aliases
    const listResult = await handler.handleAddressCommand('list_aliases name=test-function');
    expect(listResult.success).toBe(true);
    expect(Array.isArray(listResult.aliases)).toBe(true);
  });

  test('should handle version publishing', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('publish_version name=test-function description="Production version"');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('publish_version');
    expect(result.version).toBe('1');
  });

  test('should handle local operations with custom ports', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    // Start API with custom port
    const apiResult = await handler.handleAddressCommand('local_start_api port=8000 host=0.0.0.0');
    expect(apiResult.success).toBe(true);
    expect(apiResult.port).toBe('8000');
    expect(apiResult.host).toBe('0.0.0.0');

    // Start Lambda service with custom port
    const lambdaResult = await handler.handleAddressCommand('local_start_lambda port=8001 host=0.0.0.0');
    expect(lambdaResult.success).toBe(true);
    expect(lambdaResult.port).toBe('8001');
  });

  test('should handle function invocation with different log types', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('log-func', {
      name: 'log-func',
      runtime: 'python3.11'
    });

    // Invoke with Tail log type
    const result = await handler.handleAddressCommand('invoke name=log-func payload={"test": "logs"} log_type=Tail');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('invoke');
  });

  test('should handle destroy method', async () => {
    const handler = await createLambdaTestHandler();

    handler.activeFunctions.set('temp-func', { name: 'temp-func' });
    handler.layers.set('temp-layer', { name: 'temp-layer' });
    expect(handler.activeFunctions.size).toBe(1);
    expect(handler.layers.size).toBe(1);

    await handler.destroy();
    expect(handler.activeFunctions.size).toBe(0);
    expect(handler.layers.size).toBe(0);
    expect(handler.processMonitoring.enabled).toBe(false);
  });

  test('should handle interpolateMessage', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.interpolateMessage('test message', {});
    expect(result).toBe('test message');
  });

  test('should handle auditSecurityEvent', async () => {
    const handler = await createLambdaTestHandler();

    handler.auditSecurityEvent('test_violation', { severity: 'high' });

    const auditResult = await handler.handleAddressCommand('security_audit');
    const securityEvent = auditResult.auditLog.find(log =>
      log.event === 'security_event' && log.test_violation
    );

    expect(securityEvent).toBeDefined();
  });

  test('should handle audit log size limit', async () => {
    const handler = await createLambdaTestHandler();

    // Fill audit log beyond limit
    for (let i = 0; i < 600; i++) {
      handler.log('test_event', { index: i });
    }

    expect(handler.auditLog.length).toBeLessThanOrEqual(500);
  });

  test('should handle AWS credential detection', async () => {
    const handler = await createLambdaTestHandler({ environment: 'auto' });

    // Mock successful AWS credential detection
    handler.spawn = jest.fn().mockImplementation((command, args) => {
      if (command === 'aws' && args.includes('get-caller-identity')) {
        return {
          stdout: { on: jest.fn((event, callback) => callback(JSON.stringify({ Account: '123456789012' }))) },
          stderr: { on: jest.fn() },
          on: jest.fn((event, callback) => callback(0))
        };
      }
      return {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => callback(1))
      };
    });

    await handler.detectEnvironment();
    expect(handler.environment).toBe('aws');
  });

  test('should handle command parsing with equals in value', async () => {
    const handler = await createLambdaTestHandler();

    const parsed = handler.parseCommand('create name=test environment_vars="KEY=value=with=equals"');
    expect(parsed.params.environment_vars).toBe('KEY=value=with=equals');
  });

  test('should handle empty command parameters', async () => {
    const handler = await createLambdaTestHandler();

    const parsed = handler.parseCommand('create');
    expect(parsed.operation).toBe('create');
    expect(Object.keys(parsed.params)).toHaveLength(0);
  });

  test('should handle function tracking after invocation', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('tracked', {
      name: 'tracked',
      runtime: 'python3.11',
      invocations: 0
    });

    const fn = handler.activeFunctions.get('tracked');
    const initialCount = fn.invocations || 0;

    await handler.handleAddressCommand('invoke name=tracked');

    expect(fn.invocations).toBe(initialCount + 1);
    expect(fn.lastInvoked).toBeDefined();
  });

  test('should handle validation with all parameter types', async () => {
    const handler = await createLambdaTestHandler({ securityMode: 'strict' });

    // Test with multiple validation issues
    const result = await handler.handleAddressCommand('validate_function name=invalid runtime=fake-runtime timeout=-5 memory=50');
    expect(result.success).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(1);
    expect(result.issues.some(issue => issue.includes('runtime'))).toBe(true);
    expect(result.issues.some(issue => issue.includes('timeout'))).toBe(true);
    expect(result.issues.some(issue => issue.includes('memory'))).toBe(true);
  });

  test('should handle LocalStack health check failure', async () => {
    const handler = await createLambdaTestHandler({ environment: 'auto' });

    // Mock failed LocalStack health check and all other commands
    handler.spawn = jest.fn().mockImplementation((command, args) => {
      return {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => callback(1)) // All commands fail
      };
    });

    // Reset environment to auto to force re-detection
    handler.environment = 'auto';
    await handler.detectEnvironment();
    expect(handler.environment).toBe('local'); // Should fall back to local
  });

  test('should handle trigger management placeholders', async () => {
    const handler = await createLambdaTestHandler();

    // Create trigger (placeholder implementation)
    const createResult = await handler.handleAddressCommand('create_trigger name=test-func source=s3 source_arn=arn:aws:s3:::my-bucket');
    expect(createResult.success).toBe(true);
    expect(createResult.operation).toBe('create_trigger');
    expect(createResult.message).toContain('not yet implemented');

    // List triggers (placeholder implementation)
    const listResult = await handler.handleAddressCommand('list_triggers name=test-func');
    expect(listResult.success).toBe(true);
    expect(listResult.operation).toBe('list_triggers');

    // Delete trigger (placeholder implementation)
    const deleteResult = await handler.handleAddressCommand('delete_trigger name=test-func trigger_id=123');
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.operation).toBe('delete_trigger');
  });

  test('should handle metrics and monitoring placeholders', async () => {
    const handler = await createLambdaTestHandler();

    // Get metrics (placeholder implementation)
    const metricsResult = await handler.handleAddressCommand('get_metrics name=test-func start_time=2025-01-01T00:00:00Z end_time=2025-01-01T23:59:59Z');
    expect(metricsResult.success).toBe(true);
    expect(metricsResult.operation).toBe('get_metrics');
    expect(metricsResult.message).toContain('not yet implemented');

    // Tail logs (placeholder implementation)
    const tailResult = await handler.handleAddressCommand('tail_logs name=test-func follow=true');
    expect(tailResult.success).toBe(true);
    expect(tailResult.operation).toBe('tail_logs');
    expect(tailResult.message).toContain('not yet implemented');
  });

  test('should handle AWS invocation with response file', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('file-func', {
      name: 'file-func',
      runtime: 'python3.11'
    });

    // Mock response file handling
    global.mockFS = {
      '/tmp/lambda-response.json': JSON.stringify({ message: 'File response' })
    };

    const result = await handler.handleAddressCommand('invoke name=file-func payload={"test": "file"}');
    expect(result.success).toBe(true);
    expect(result.response).toBeDefined();
  });

  test('should handle package creation with ZIP command', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('package name=zip-func code_dir=/tmp/function output_dir=/tmp/packages');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('package');
    expect(result.package_path).toContain('.zip');
  });

  test('should handle RexxJS deployment with file system errors', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Mock file system error during cleanup
    handler.fs.rmSync = jest.fn(() => {
      throw new Error('Permission denied');
    });

    const result = await handler.handleAddressCommand('deploy_rexx name=rexx-error rexx_script="SAY \'test\'"');
    // Should still succeed even if cleanup fails
    expect(result.success).toBe(true);
  });

});