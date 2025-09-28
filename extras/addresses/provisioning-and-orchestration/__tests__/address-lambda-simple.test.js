const { createLambdaTestHandler } = require('./test-helper');

describe('ADDRESS LAMBDA Handler - Simple Tests', () => {

  test('should work with Jest mocking', async () => {
    const handler = await createLambdaTestHandler();
    expect(handler).toBeDefined();
    expect(handler.runtime).toBe('lambda');
  });

  test('should handle status command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('status');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('status');
    expect(result.runtime).toBe('lambda');
    expect(result.environment).toBeDefined();
  });

  test('should handle list command', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('list');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(result.functions).toBeDefined();
    expect(Array.isArray(result.functions)).toBe(true);
  });

  test('should create a function', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    const result = await handler.handleAddressCommand('create name=test-func runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.function).toBe('test-func');
    expect(result.arn).toContain('test-func');
  });

  test('should deploy a function', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    const result = await handler.handleAddressCommand('deploy name=deploy-func runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.function).toBe('deploy-func');
  });

  test('should invoke a function', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // First add a function to the active functions map
    handler.activeFunctions.set('hello-python', {
      name: 'hello-python',
      runtime: 'python3.11',
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:hello-python'
    });

    const result = await handler.handleAddressCommand('invoke name=hello-python payload={"test": "data"}');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('invoke');
    expect(result.function).toBe('hello-python');
    expect(result.response).toBeDefined();
  });

  test('should delete a function', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // First add a function to the active functions map
    handler.activeFunctions.set('test-func', {
      name: 'test-func',
      runtime: 'python3.11'
    });

    const result = await handler.handleAddressCommand('delete name=test-func');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('delete');
    expect(result.function).toBe('test-func');
  });

  test('should describe a function', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('describe name=hello-python');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('describe');
    expect(result.function).toBe('hello-python');
    expect(result.configuration).toBeDefined();
  });

  test('should get function logs', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    const result = await handler.handleAddressCommand('logs name=hello-python lines=10');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('logs');
    expect(result.function).toBe('hello-python');
    expect(result.logs).toBeDefined();
  });

  test('should validate required parameters for create', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('create');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('create name=test-func');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('runtime');
  });

  test('should validate required parameters for invoke', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('invoke');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate required parameters for delete', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('delete');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should enforce function limits', async () => {
    const handler = await createLambdaTestHandler({
      maxFunctions: 2,
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    await handler.handleAddressCommand('create name=func1 runtime=python3.11 code=/tmp/func1.zip handler=index.handler');
    await handler.handleAddressCommand('create name=func2 runtime=python3.11 code=/tmp/func2.zip handler=index.handler');

    const result = await handler.handleAddressCommand('create name=func3 runtime=python3.11 code=/tmp/func3.zip handler=index.handler');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum functions');
  });

  test('should handle cleanup command', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Add some functions
    handler.activeFunctions.set('func1', { name: 'func1' });
    handler.activeFunctions.set('func2', { name: 'func2' });

    const result = await handler.handleAddressCommand('cleanup all=true');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('cleanup');
    expect(result.cleaned).toBe(2);
    expect(result.remaining).toBe(0);
  });

  test('should handle local environment detection', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    const result = await handler.handleAddressCommand('status');
    expect(result.success).toBe(true);
    expect(result.environment).toBe('local');
  });

  test('should verify environment setup', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('verify_environment');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('verify_environment');
    expect(result.checks).toBeDefined();
    expect(typeof result.checks.aws_cli).toBe('boolean');
    expect(typeof result.checks.sam_cli).toBe('boolean');
  });

  test('should handle package command', async () => {
    const handler = await createLambdaTestHandler({ environment: 'local' });

    const result = await handler.handleAddressCommand('package name=test-func code_dir=/tmp/func runtime=python3.11');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('package');
    expect(result.function).toBe('test-func');
  });

});