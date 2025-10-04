const { createOpenFaaSTestHandler } = require('./test-helper');

describe('ADDRESS OPENFAAS Handler - Coverage Tests', () => {

  test('should handle initialize with existing instance', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Re-initialize with different config
    const initResult = await handler.initialize({
      gatewayUrl: 'http://192.168.1.100:8080',
      backend: 'kubernetes'
    });

    expect(initResult.success).toBe(true);
    expect(handler.gatewayUrl).toBe('http://192.168.1.100:8080');
    expect(handler.backend).toBe('kubernetes');
  });

  test('should handle backend detection with auto mode', async () => {
    const handler = await createOpenFaaSTestHandler({ backend: 'auto' });

    await handler.detectBackend();
    expect(['kubernetes', 'swarm']).toContain(handler.detectedBackend);
  });

  test('should handle command parsing with complex parameters', async () => {
    const handler = await createOpenFaaSTestHandler();

    const parsed = handler.parseCommand('deploy name="complex name" image=test:latest env="KEY=value with spaces"');
    expect(parsed.operation).toBe('deploy');
    expect(parsed.params.name).toBe('complex name');
    expect(parsed.params.env).toBe('KEY=value with spaces');
  });

  test('should handle function list parsing with various formats', async () => {
    const handler = await createOpenFaaSTestHandler();

    const mockOutput = `Function                Invocations    Replicas   Image
hello-world             0              1          functions/hello-world:latest
figlet                  15             2          functions/figlet:latest
empty-line
invalid-format`;

    const functions = handler.parseFunctionList(mockOutput);
    expect(functions.length).toBe(2);
    expect(functions[0].name).toBe('hello-world');
    expect(functions[1].name).toBe('figlet');
    expect(functions[1].invocations).toBe(15);
  });

  test('should handle deploy_rexx function creation', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('deploy_rexx name=rexx-func rexx_script="SAY \'Hello from RexxJS!\'"');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy_rexx');
  });

  test('should handle invoke_rexx as alias', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=rexx-func image=rexx:latest');

    const result = await handler.handleAddressCommand('invoke_rexx name=rexx-func data="test"');
    expect(result.success).toBe(true);
  });

  test('should handle missing operation', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No operation specified');
  });

  test('should handle unknown operation', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('unknown_command param=value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown operation');
  });

  test('should handle execCommand errors', async () => {
    const handler = await createOpenFaaSTestHandler();

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

  test('should handle logs with kubernetes backend', async () => {
    const handler = await createOpenFaaSTestHandler();
    handler.detectedBackend = 'kubernetes';

    await handler.handleAddressCommand('deploy name=k8s-func image=test:latest');

    const result = await handler.handleAddressCommand('logs name=k8s-func lines=100');
    expect(result.success).toBe(true);
  });

  test('should handle logs with swarm backend', async () => {
    const handler = await createOpenFaaSTestHandler();
    handler.detectedBackend = 'swarm';

    await handler.handleAddressCommand('deploy name=swarm-func image=test:latest');

    const result = await handler.handleAddressCommand('logs name=swarm-func');
    expect(result.success).toBe(true);
  });

  test('should handle scale without replicas or min/max', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=test-func image=test:latest');

    const result = await handler.handleAddressCommand('scale name=test-func');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Must specify either replicas or min/max');
  });

  test('should handle install with kubernetes backend', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('install backend=kubernetes');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not yet implemented');
  });

  test('should handle process monitoring lifecycle', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Start monitoring
    handler.startProcessMonitoring();
    expect(handler.processMonitoring.enabled).toBe(true);

    // Collect stats
    await handler.collectProcessStats();

    // Stop monitoring
    handler.stopProcessMonitoring();
    expect(handler.processMonitoring.enabled).toBe(false);
  });

  test('should handle destroy method', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=temp-func image=test:latest');
    expect(handler.activeFunctions.size).toBe(1);

    await handler.destroy();
    expect(handler.activeFunctions.size).toBe(0);
    expect(handler.processMonitoring.enabled).toBe(false);
  });

  test('should handle interpolateMessage', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.interpolateMessage('test message', {});
    expect(result).toBe('test message');
  });

  test('should handle auditSecurityEvent', async () => {
    const handler = await createOpenFaaSTestHandler();

    handler.auditSecurityEvent('test_violation', { severity: 'high' });

    const auditResult = await handler.handleAddressCommand('security_audit');
    const securityEvent = auditResult.auditLog.find(log =>
      log.event === 'security_event' && log.test_violation
    );

    expect(securityEvent).toBeDefined();
  });

  test('should handle audit log size limit', async () => {
    const handler = await createOpenFaaSTestHandler();

    // Fill audit log beyond limit
    for (let i = 0; i < 1100; i++) {
      handler.log('test_event', { index: i });
    }

    expect(handler.auditLog.length).toBeLessThanOrEqual(500);
  });

  test('should handle execFaasCommandWithInput', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=input-func image=test:latest');

    const result = await handler.handleAddressCommand('invoke name=input-func data="test input"');
    expect(result.success).toBe(true);
  });

  test('should handle validateImage in permissive mode', async () => {
    const handler = await createOpenFaaSTestHandler({ securityMode: 'permissive' });

    const isValid = handler.validateImage('any-registry.com/image:latest');
    expect(isValid).toBe(true);
  });

  test('should handle validateImage with registry validation', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'strict',
      trustedRegistries: new Set(['docker.io'])
    });

    const valid = handler.validateImage('docker.io/python:latest');
    expect(valid).toBe(true);

    const invalid = handler.validateImage('malicious.registry/bad:latest');
    expect(invalid).toBe(false);
  });

  test('should handle function tracking after invocation', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=tracked image=test:latest');

    const fn = handler.activeFunctions.get('tracked');
    const initialCount = fn.invocations || 0;

    await handler.handleAddressCommand('invoke name=tracked');

    expect(fn.invocations).toBe(initialCount + 1);
  });

  test('should handle empty command parameters', async () => {
    const handler = await createOpenFaaSTestHandler();

    const parsed = handler.parseCommand('deploy');
    expect(parsed.operation).toBe('deploy');
    expect(Object.keys(parsed.params)).toHaveLength(0);
  });

  test('should handle parameters with equals in value', async () => {
    const handler = await createOpenFaaSTestHandler();

    const parsed = handler.parseCommand('deploy name=test env="KEY=value=with=equals"');
    expect(parsed.params.env).toBe('KEY=value=with=equals');
  });

});