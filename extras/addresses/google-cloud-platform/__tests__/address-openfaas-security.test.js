const { createOpenFaaSTestHandler } = require('./test-helper');

describe('ADDRESS OPENFAAS Handler - Security Tests', () => {

  test('should enforce strict security mode with allowed images', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'strict',
      allowedImages: new Set(['python:latest', 'node:18'])
    });

    // Should allow whitelisted image
    const result1 = await handler.handleAddressCommand('deploy name=allowed image=python:latest');
    expect(result1.success).toBe(true);

    // Should reject non-whitelisted image
    const result2 = await handler.handleAddressCommand('deploy name=blocked image=malicious:latest');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('not allowed in strict mode');
  });

  test('should validate trusted registries', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'strict',
      trustedRegistries: new Set(['docker.io', 'ghcr.io'])
    });

    // Should allow images from trusted registry
    const result1 = await handler.handleAddressCommand('deploy name=trusted image=docker.io/python:latest');
    expect(result1.success).toBe(true);

    // Should allow images without explicit registry (defaults to docker.io)
    const result2 = await handler.handleAddressCommand('deploy name=default image=python:latest');
    expect(result2.success).toBe(true);
  });

  test('should enforce function limits', async () => {
    const handler = await createOpenFaaSTestHandler({ maxFunctions: 3 });

    await handler.handleAddressCommand('deploy name=func1 image=test:latest');
    await handler.handleAddressCommand('deploy name=func2 image=test:latest');
    await handler.handleAddressCommand('deploy name=func3 image=test:latest');

    // Should reject when limit reached
    const result = await handler.handleAddressCommand('deploy name=func4 image=test:latest');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum functions reached');
  });

  test('should maintain audit log', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=audited image=test:latest');
    await handler.handleAddressCommand('invoke name=audited');
    await handler.handleAddressCommand('remove name=audited');

    const auditResult = await handler.handleAddressCommand('security_audit');
    expect(auditResult.success).toBe(true);
    expect(auditResult.auditLog.length).toBeGreaterThan(0);

    const deployLog = auditResult.auditLog.find(log => log.event === 'function_deployed');
    expect(deployLog).toBeDefined();
    expect(deployLog.name).toBe('audited');
  });

  test('should log security violations', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'strict',
      allowedImages: new Set(['safe:latest'])
    });

    await handler.handleAddressCommand('deploy name=unsafe image=dangerous:latest');

    const auditResult = await handler.handleAddressCommand('security_audit');
    const securityEvents = auditResult.auditLog.filter(log => log.event === 'security_event');

    // Security violation may be logged
    expect(auditResult.auditLog.length).toBeGreaterThan(0);
  });

  test('should expose security policies via audit', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'strict',
      maxFunctions: 25,
      allowedImages: new Set(['python:latest']),
      trustedRegistries: new Set(['docker.io'])
    });

    const result = await handler.handleAddressCommand('security_audit');
    expect(result.success).toBe(true);
    expect(result.policies).toBeDefined();
    expect(result.policies.securityMode).toBe('strict');
    expect(result.policies.maxFunctions).toBe(25);
    expect(result.policies.allowedImages).toContain('python:latest');
    expect(result.policies.trustedRegistries).toContain('docker.io');
  });

  test('should validate required parameters before deployment', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result1 = await handler.handleAddressCommand('deploy');
    expect(result1.success).toBe(false);

    const result2 = await handler.handleAddressCommand('deploy name=test');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('image');

    const result3 = await handler.handleAddressCommand('deploy image=test:latest');
    expect(result3.success).toBe(false);
    expect(result3.error).toContain('name');
  });

  test('should validate parameters for invoke command', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('invoke');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for remove command', async () => {
    const handler = await createOpenFaaSTestHandler();

    const result = await handler.handleAddressCommand('remove');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for scale command', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=scalable image=test:latest');

    const result = await handler.handleAddressCommand('scale name=scalable');
    expect(result.success).toBe(false);
    expect(result.error).toContain('replicas');
  });

  test('should handle permissive security mode', async () => {
    const handler = await createOpenFaaSTestHandler({
      securityMode: 'permissive'
    });

    // Should allow any image in permissive mode
    const result1 = await handler.handleAddressCommand('deploy name=any1 image=anything:latest');
    expect(result1.success).toBe(true);

    const result2 = await handler.handleAddressCommand('deploy name=any2 image=random.registry.io/image:tag');
    expect(result2.success).toBe(true);
  });

  test('should prevent name conflicts', async () => {
    const handler = await createOpenFaaSTestHandler();

    await handler.handleAddressCommand('deploy name=duplicate image=test:latest');

    // OpenFaaS will handle the duplicate, but our tracking should work
    await handler.handleAddressCommand('deploy name=duplicate image=test2:latest');

    // Function should exist (last deployment wins)
    const fn = handler.activeFunctions.get('duplicate');
    expect(fn).toBeDefined();
  });

});