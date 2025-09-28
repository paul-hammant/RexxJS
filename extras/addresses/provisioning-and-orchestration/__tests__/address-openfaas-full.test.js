const { createOpenFaaSTestHandler } = require('./test-helper');

describe('ADDRESS OPENFAAS Handler - Full Feature Tests', () => {

  test('should initialize with custom configuration', async () => {
    const config = {
      gatewayUrl: 'http://localhost:8080',
      backend: 'swarm',
      maxFunctions: 50,
      securityMode: 'strict'
    };

    const handler = await createOpenFaaSTestHandler(config);

    expect(handler.gatewayUrl).toBe('http://localhost:8080');
    expect(handler.backend).toBe('swarm');
    expect(handler.maxFunctions).toBe(50);
    expect(handler.securityMode).toBe('strict');
  });

  test('should handle complete function lifecycle', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Create new function from template
    const newResult = await handler.handleAddressCommand('new name=myfunction lang=python3');
    expect(newResult.success).toBe(true);
    expect(newResult.operation).toBe('new');

    // Build function
    const buildResult = await handler.handleAddressCommand('build name=myfunction');
    expect(buildResult.success).toBe(true);
    expect(buildResult.operation).toBe('build');

    // Push function
    const pushResult = await handler.handleAddressCommand('push name=myfunction');
    expect(pushResult.success).toBe(true);
    expect(pushResult.operation).toBe('push');

    // Deploy function
    const deployResult = await handler.handleAddressCommand('deploy name=myfunction image=myfunction:latest');
    expect(deployResult.success).toBe(true);
    expect(deployResult.operation).toBe('deploy');

    // Invoke function
    const invokeResult = await handler.handleAddressCommand('invoke name=myfunction data="test"');
    expect(invokeResult.success).toBe(true);

    // Remove function
    const removeResult = await handler.handleAddressCommand('remove name=myfunction');
    expect(removeResult.success).toBe(true);
  });

  test('should deploy function with environment variables', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('deploy name=envtest image=test:latest env=API_KEY=secret,DEBUG=true');
    expect(result.success).toBe(true);
    expect(result.function).toBe('envtest');

    const fn = handler.activeFunctions.get('envtest');
    expect(fn.env).toBe('API_KEY=secret,DEBUG=true');
  });

  test('should deploy function with labels and constraints', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('deploy name=labeled image=test:latest labels=tier=backend,app=api constraints=node.role==worker');
    expect(result.success).toBe(true);
  });

  test('should handle async function invocation', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=async-func image=test:latest');

    const result = await handler.handleAddressCommand('invoke name=async-func data="test" async=true');
    expect(result.success).toBe(true);
  });

  test('should list functions from OpenFaaS store', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('store_list');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('store_list');
    expect(result.output).toContain('figlet');
  });

  test('should deploy function from store', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('store_deploy name=figlet');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('store_deploy');

    const fn = handler.activeFunctions.get('figlet');
    expect(fn.fromStore).toBe(true);
  });

  test('should create and list secrets', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Create secret
    const createResult = await handler.handleAddressCommand('secret_create name=api-key from_literal=myapikey123');
    expect(createResult.success).toBe(true);
    expect(createResult.operation).toBe('secret_create');

    // List secrets
    const listResult = await handler.handleAddressCommand('secret_list');
    expect(listResult.success).toBe(true);
    expect(listResult.operation).toBe('secret_list');
  });

  test('should create and list namespaces', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Create namespace
    const createResult = await handler.handleAddressCommand('namespace_create name=dev');
    expect(createResult.success).toBe(true);
    expect(createResult.operation).toBe('namespace_create');

    // List namespaces
    const listResult = await handler.handleAddressCommand('namespace_list');
    expect(listResult.success).toBe(true);
    expect(listResult.operation).toBe('namespace_list');
  });

  test('should handle process monitoring', async () => {
    const handler = await createOpenFaaSTestHandler();

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
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('checkpoint_status');
    expect(result.success).toBe(true);
    expect(result.enabled).toBe(true);
    expect(Array.isArray(result.activeFunctions)).toBe(true);
  });

  test('should verify backend installation', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('verify_backend');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('verify_backend');
    expect(result.checks).toBeDefined();
    expect(result.checks.faas_cli).toBe(true);
    expect(result.checks.docker).toBe(true);
  });

  test('should scale function with min/max autoscaling', async () => {
    const handler = await createOpenFaaSTestHandler({ backend: 'kubernetes' });

    await handler.handleAddressCommand('deploy name=scalable image=test:latest');

    const result = await handler.handleAddressCommand('scale name=scalable min=1 max=10');
    expect(result.success).toBe(true);
    expect(result.autoscaling).toBe(true);
  });

  test('should handle function invocation tracking', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=tracked image=test:latest');

    const fn = handler.activeFunctions.get('tracked');
    const initialInvocations = fn.invocations || 0;

    await handler.handleAddressCommand('invoke name=tracked');
    await handler.handleAddressCommand('invoke name=tracked');
    await handler.handleAddressCommand('invoke name=tracked');

    expect(fn.invocations).toBe(initialInvocations + 3);
  });

  test('should handle error cases gracefully', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Try to invoke non-existent function
    const invokeResult = await handler.handleAddressCommand('invoke name=non-existent');
    expect(invokeResult.success).toBe(false);
    expect(invokeResult.error).toContain('not found');

    // Try to remove non-deployed function
    const removeResult = await handler.handleAddressCommand('remove name=non-existent');
    expect(removeResult.success).toBe(false);

    // Try to scale non-existent function
    const scaleResult = await handler.handleAddressCommand('scale name=non-existent replicas=3');
    expect(scaleResult.success).toBe(false);
  });

  test('should handle build with custom arguments', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('build name=custom-build image=custom:latest build_arg=VERSION=1.0 no_cache=true');
    expect(result.success).toBe(true);
  });

  test('should list functions and update internal state', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('list');
    expect(result.success).toBe(true);

    // Check that mock functions are added to internal state
    expect(handler.activeFunctions.has('hello-python')).toBe(true);
    expect(handler.activeFunctions.has('nodeinfo')).toBe(true);

    const helloPython = handler.activeFunctions.get('hello-python');
    expect(helloPython.replicas).toBe(2);
    expect(helloPython.invocations).toBe(42);
  });

});