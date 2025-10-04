const { createLambdaTestHandler } = require('./test-helper');

describe('ADDRESS LAMBDA Handler - Full Feature Tests', () => {

  test('should initialize with custom configuration', async () => {
    const config = {
      environment: 'aws',
      region: 'us-west-2',
      profile: 'test-profile',
      maxFunctions: 50,
      securityMode: 'strict',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    };

    const handler = await createLambdaTestHandler(config);

    expect(handler.environment).toBe('aws');
    expect(handler.region).toBe('us-west-2');
    expect(handler.profile).toBe('test-profile');
    expect(handler.maxFunctions).toBe(50);
    expect(handler.securityMode).toBe('strict');
    expect(handler.roleArn).toBe('arn:aws:iam::123456789012:role/lambda-role');
  });

  test('should handle complete function lifecycle', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Create function
    const createResult = await handler.handleAddressCommand('create name=lifecycle-func runtime=python3.11 code=/tmp/function.zip handler=lambda_function.lambda_handler timeout=60 memory=256');
    expect(createResult.success).toBe(true);
    expect(createResult.operation).toBe('create');
    expect(createResult.function).toBe('lifecycle-func');

    // Invoke function
    const invokeResult = await handler.handleAddressCommand('invoke name=lifecycle-func payload={"test": "data"}');
    expect(invokeResult.success).toBe(true);
    expect(invokeResult.operation).toBe('invoke');

    // Update function
    const updateResult = await handler.handleAddressCommand('update name=lifecycle-func timeout=120 memory=512');
    expect(updateResult.success).toBe(true);
    expect(updateResult.operation).toBe('update');

    // Publish version
    const versionResult = await handler.handleAddressCommand('publish_version name=lifecycle-func description="Version 1"');
    expect(versionResult.success).toBe(true);
    expect(versionResult.operation).toBe('publish_version');
    expect(versionResult.version).toBe('1');

    // Create alias
    const aliasResult = await handler.handleAddressCommand('create_alias name=lifecycle-func alias_name=prod version=1 description="Production alias"');
    expect(aliasResult.success).toBe(true);
    expect(aliasResult.operation).toBe('create_alias');
    expect(aliasResult.alias).toBe('prod');

    // List aliases
    const listAliasResult = await handler.handleAddressCommand('list_aliases name=lifecycle-func');
    expect(listAliasResult.success).toBe(true);
    expect(listAliasResult.operation).toBe('list_aliases');
    expect(Array.isArray(listAliasResult.aliases)).toBe(true);

    // Delete function
    const deleteResult = await handler.handleAddressCommand('delete name=lifecycle-func');
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.operation).toBe('delete');
  });

  test('should handle layer management', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Create layer
    const createResult = await handler.handleAddressCommand('create_layer name=test-layer content=/tmp/layer.zip compatible_runtimes=python3.11,nodejs18.x description="Test layer"');
    expect(createResult.success).toBe(true);
    expect(createResult.operation).toBe('create_layer');
    expect(createResult.layer).toBe('test-layer');
    expect(createResult.version).toBe(1);

    // List layers
    const listResult = await handler.handleAddressCommand('list_layers');
    expect(listResult.success).toBe(true);
    expect(listResult.operation).toBe('list_layers');
    expect(Array.isArray(listResult.layers)).toBe(true);

    // Delete layer
    const deleteResult = await handler.handleAddressCommand('delete_layer name=test-layer version=1');
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.operation).toBe('delete_layer');
  });

  test('should handle RexxJS function deployment', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    const result = await handler.handleAddressCommand('deploy_rexx name=rexx-hello rexx_script="SAY \'Hello from RexxJS Lambda!\'" runtime=python3.11 timeout=60 memory=256');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy_rexx');
    expect(result.function).toBe('rexx-hello');
    expect(result.runtime).toBe('python3.11');
  });

  test('should handle RexxJS function from file', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Mock the file system to return script content
    handler.fs.existsSync = jest.fn((path) => path.includes('test-script.rexx'));

    const result = await handler.handleAddressCommand('deploy_rexx name=rexx-file rexx_script_file=/tmp/test-script.rexx runtime=python3.11');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy_rexx');
    expect(result.function).toBe('rexx-file');
  });

  test('should invoke RexxJS function', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Add a RexxJS function to the active functions
    handler.activeFunctions.set('rexx-func', {
      name: 'rexx-func',
      runtime: 'python3.11',
      handler: 'lambda_function.lambda_handler'
    });

    const result = await handler.handleAddressCommand('invoke_rexx name=rexx-func data={"input": "test"}');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('invoke');
    expect(result.function).toBe('rexx-func');
  });

  test('should handle local development workflow', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    // Start local API
    const apiResult = await handler.handleAddressCommand('local_start_api port=3000 host=localhost');
    expect(apiResult.success).toBe(true);
    expect(apiResult.operation).toBe('local_start_api');
    expect(apiResult.port).toBe('3000');

    // Start local Lambda service
    const lambdaResult = await handler.handleAddressCommand('local_start_lambda port=3001 host=localhost');
    expect(lambdaResult.success).toBe(true);
    expect(lambdaResult.operation).toBe('local_start_lambda');
    expect(lambdaResult.port).toBe('3001');

    // Local invoke
    const invokeResult = await handler.handleAddressCommand('local_invoke name=test-function event={"test": "data"}');
    expect(invokeResult.success).toBe(true);
    expect(invokeResult.operation).toBe('local_invoke');
    expect(invokeResult.function).toBe('test-function');

    // Stop local services
    const stopResult = await handler.handleAddressCommand('local_stop');
    expect(stopResult.success).toBe(true);
    expect(stopResult.operation).toBe('local_stop');
  });

  test('should handle function filtering by runtime', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('list runtime=python3.11');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(Array.isArray(result.functions)).toBe(true);

    // Check that all returned functions have the specified runtime
    result.functions.forEach(fn => {
      expect(fn.Runtime || fn.runtime).toBe('python3.11');
    });
  });

  test('should handle function filtering by prefix', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('list prefix=hello');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(Array.isArray(result.functions)).toBe(true);

    // Check that all returned functions start with the prefix
    result.functions.forEach(fn => {
      const name = fn.FunctionName || fn.name;
      expect(name.startsWith('hello')).toBe(true);
    });
  });

  test('should handle environment variable deployment', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    const result = await handler.handleAddressCommand('create name=env-func runtime=python3.11 code=/tmp/function.zip handler=index.handler environment_vars=KEY1=value1,KEY2=value2');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.function).toBe('env-func');
  });

  test('should handle different invocation types', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('async-func', {
      name: 'async-func',
      runtime: 'python3.11'
    });

    // Synchronous invocation (default)
    const syncResult = await handler.handleAddressCommand('invoke name=async-func payload={"test": "sync"}');
    expect(syncResult.success).toBe(true);

    // Asynchronous invocation
    const asyncResult = await handler.handleAddressCommand('invoke name=async-func payload={"test": "async"} invocation_type=Event');
    expect(asyncResult.success).toBe(true);
  });

  test('should handle function validation', async () => {
    const handler = await createLambdaTestHandler();

    // Valid function configuration
    const validResult = await handler.handleAddressCommand('validate_function name=valid-func runtime=python3.11 timeout=30 memory=128');
    expect(validResult.success).toBe(true);
    expect(validResult.valid).toBe(true);
    expect(validResult.issues).toHaveLength(0);

    // Invalid timeout
    const invalidTimeoutResult = await handler.handleAddressCommand('validate_function name=invalid-func timeout=1000');
    expect(invalidTimeoutResult.success).toBe(true);
    expect(invalidTimeoutResult.valid).toBe(false);
    expect(invalidTimeoutResult.issues.some(issue => issue.includes('timeout'))).toBe(true);

    // Invalid memory
    const invalidMemoryResult = await handler.handleAddressCommand('validate_function name=invalid-func memory=20000');
    expect(invalidMemoryResult.success).toBe(true);
    expect(invalidMemoryResult.valid).toBe(false);
    expect(invalidMemoryResult.issues.some(issue => issue.includes('memory'))).toBe(true);
  });

  test('should handle process monitoring', async () => {
    const handler = await createLambdaTestHandler();

    // Start monitoring
    const startResult = await handler.handleAddressCommand('start_monitoring');
    expect(startResult.success).toBe(true);
    expect(startResult.enabled).toBe(true);

    // Get process stats
    const statsResult = await handler.handleAddressCommand('process_stats');
    expect(statsResult.success).toBe(true);
    expect(statsResult.operation).toBe('process_stats');

    // Stop monitoring
    const stopResult = await handler.handleAddressCommand('stop_monitoring');
    expect(stopResult.success).toBe(true);
    expect(stopResult.enabled).toBe(false);
  });

  test('should handle checkpoint monitoring', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('checkpoint_status');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('checkpoint_status');
    expect(result.enabled).toBe(true);
    expect(Array.isArray(result.activeFunctions)).toBe(true);
  });

  test('should handle error cases gracefully', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Try to invoke non-existent function
    const invokeResult = await handler.handleAddressCommand('invoke name=non-existent');
    expect(invokeResult.success).toBe(false);
    expect(invokeResult.error).toContain('not found');

    // Try to delete non-existent function
    const deleteResult = await handler.handleAddressCommand('delete name=non-existent');
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error).toContain('not found');

    // Try to describe non-existent function
    const describeResult = await handler.handleAddressCommand('describe name=non-existent');
    expect(describeResult.success).toBe(false);
    expect(describeResult.error).toContain('not found');
  });

  test('should handle function invocation tracking', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    handler.activeFunctions.set('tracked-func', {
      name: 'tracked-func',
      runtime: 'python3.11',
      invocations: 0
    });

    const fn = handler.activeFunctions.get('tracked-func');
    const initialInvocations = fn.invocations || 0;

    await handler.handleAddressCommand('invoke name=tracked-func');
    await handler.handleAddressCommand('invoke name=tracked-func');
    await handler.handleAddressCommand('invoke name=tracked-func');

    expect(fn.invocations).toBe(initialInvocations + 3);
    expect(fn.lastInvoked).toBeDefined();
  });

  test('should handle list functions and update internal state', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('list');
    expect(result.success).toBe(true);

    // Check that mock functions are added to internal state
    expect(handler.activeFunctions.has('hello-python')).toBe(true);
    expect(handler.activeFunctions.has('nodeinfo')).toBe(true);

    const helloPython = handler.activeFunctions.get('hello-python');
    expect(helloPython.runtime).toBe('python3.11');
    expect(helloPython.timeout).toBe(30);
    expect(helloPython.memorySize).toBe(128);
  });

  test('should handle LocalStack environment', async () => {
    const handler = await createLambdaTestHandler({ environment: 'localstack' });

    const createResult = await handler.handleAddressCommand('create name=localstack-func runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(createResult.success).toBe(true);
    expect(createResult.arn).toContain('000000000000'); // LocalStack account ID
  });

  test('should handle cleanup with different filters', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Add test functions
    handler.activeFunctions.set('test-func-1', { name: 'test-func-1', runtime: 'python3.11' });
    handler.activeFunctions.set('test-func-2', { name: 'test-func-2', runtime: 'nodejs18.x' });
    handler.activeFunctions.set('prod-func-1', { name: 'prod-func-1', runtime: 'python3.11' });

    // Cleanup by prefix
    const prefixResult = await handler.handleAddressCommand('cleanup prefix=test-');
    expect(prefixResult.success).toBe(true);
    expect(prefixResult.cleaned).toBe(2);

    // Reset for runtime cleanup test
    handler.activeFunctions.set('python-func', { name: 'python-func', runtime: 'python3.11' });
    handler.activeFunctions.set('node-func', { name: 'node-func', runtime: 'nodejs18.x' });

    const runtimeResult = await handler.handleAddressCommand('cleanup runtime=python3.11');
    expect(runtimeResult.success).toBe(true);
    expect(runtimeResult.cleaned).toBeGreaterThan(0);
  });

  test('should handle function packaging with different options', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    const result = await handler.handleAddressCommand('package name=package-test code_dir=/tmp/function output_dir=/tmp/packages runtime=python3.11');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('package');
    expect(result.package_path).toBeDefined();
  });

});