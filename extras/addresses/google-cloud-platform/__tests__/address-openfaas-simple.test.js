const { createOpenFaaSTestHandler } = require('./test-helper');

describe('ADDRESS OPENFAAS Handler - Simple Tests', () => {

  test('should work with Jest mocking', async () => {
    const handler = await createOpenFaaSTestHandler();
    expect(handler).toBeDefined();
    expect(handler.runtime).toBe('openfaas');
  });

  test('should handle status command', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('status');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('status');
    expect(result.runtime).toBe('openfaas');
    expect(result.backend).toBeDefined();
  });

  test('should handle list command', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('list');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(result.functions).toBeDefined();
    expect(Array.isArray(result.functions)).toBe(true);
  });

  test('should deploy a function', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('deploy name=test-func image=test:latest');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy');
    expect(result.function).toBe('test-func');
    expect(result.image).toBe('test:latest');
  });

  test('should invoke a function', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=hello-python image=python:latest');

    const result = await handler.handleAddressCommand('invoke name=hello-python');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('invoke');
    expect(result.function).toBe('hello-python');
  });

  test('should remove a function', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=test-func image=test:latest');

    const result = await handler.handleAddressCommand('remove name=test-func');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('remove');
    expect(result.function).toBe('test-func');
  });

  test('should scale a function', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=test-func image=test:latest');

    const result = await handler.handleAddressCommand('scale name=test-func replicas=3');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('scale');
    expect(result.replicas).toBe('3');
  });

  test('should get function logs', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=test-func image=test:latest');

    const result = await handler.handleAddressCommand('logs name=test-func');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('logs');
    expect(result.output).toBeDefined();
  });

  test('should describe a function', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=test-func image=test:latest');

    const result = await handler.handleAddressCommand('describe name=test-func');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('describe');
  });

  test('should validate required parameters', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result1 = await handler.handleAddressCommand('deploy image=test:latest');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('deploy name=test-func');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('image');
  });

  test('should enforce function limits', async () => {
    const handler = await createOpenFaaSTestHandler({ maxFunctions: 2 });

    await handler.handleAddressCommand('deploy name=func1 image=test:latest');
    await handler.handleAddressCommand('deploy name=func2 image=test:latest');

    const result = await handler.handleAddressCommand('deploy name=func3 image=test:latest');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum functions');
  });

  test('should handle cleanup command', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=func1 image=test:latest');
    await handler.handleAddressCommand('deploy name=func2 image=test:latest');

    const result = await handler.handleAddressCommand('cleanup all=true');
    expect(result.success).toBe(true);
    expect(result.cleaned).toBe(2);
    expect(result.remaining).toBe(0);
  });

});