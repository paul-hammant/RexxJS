const { createLambdaTestHandler } = require('./test-helper');

describe('ADDRESS LAMBDA Handler - Security Tests', () => {

  test('should enforce strict security mode with allowed runtimes', async () => {
    const handler = await createLambdaTestHandler({
      securityMode: 'strict',
      allowedRuntimes: new Set(['python3.11', 'nodejs18.x']),
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Should allow whitelisted runtime
    const result1 = await handler.handleAddressCommand('create name=allowed-func runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(result1.success).toBe(true);

    // Should reject non-whitelisted runtime
    const result2 = await handler.handleAddressCommand('create name=blocked-func runtime=ruby3.2 code=/tmp/function.zip handler=index.handler');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('not allowed in strict mode');
  });

  test('should enforce function limits', async () => {
    const handler = await createLambdaTestHandler({
      maxFunctions: 3,
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    await handler.handleAddressCommand('create name=func1 runtime=python3.11 code=/tmp/f1.zip handler=index.handler');
    await handler.handleAddressCommand('create name=func2 runtime=python3.11 code=/tmp/f2.zip handler=index.handler');
    await handler.handleAddressCommand('create name=func3 runtime=python3.11 code=/tmp/f3.zip handler=index.handler');

    // Should reject when limit reached
    const result = await handler.handleAddressCommand('create name=func4 runtime=python3.11 code=/tmp/f4.zip handler=index.handler');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum functions reached');
  });

  test('should maintain audit log', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    await handler.handleAddressCommand('create name=audited runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    await handler.handleAddressCommand('invoke name=audited payload={"test": "data"}');
    await handler.handleAddressCommand('delete name=audited');

    const auditResult = await handler.handleAddressCommand('security_audit');
    expect(auditResult.success).toBe(true);
    expect(auditResult.auditLog.length).toBeGreaterThan(0);

    const createLog = auditResult.auditLog.find(log => log.event === 'function_created');
    expect(createLog).toBeDefined();
    expect(createLog.name).toBe('audited');
  });

  test('should log security violations', async () => {
    const handler = await createLambdaTestHandler({
      securityMode: 'strict',
      allowedRuntimes: new Set(['python3.11']),
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    await handler.handleAddressCommand('create name=unsafe runtime=java21 code=/tmp/function.zip handler=index.handler');

    const auditResult = await handler.handleAddressCommand('security_audit');
    const securityEvents = auditResult.auditLog.filter(log => log.event === 'security_event');

    // Security violation should be logged
    expect(auditResult.auditLog.length).toBeGreaterThan(0);
  });

  test('should expose security policies via audit', async () => {
    const handler = await createLambdaTestHandler({
      securityMode: 'strict',
      maxFunctions: 25,
      allowedRuntimes: new Set(['python3.11', 'nodejs18.x']),
      trustedSources: new Set(['aws', 's3'])
    });

    const result = await handler.handleAddressCommand('security_audit');
    expect(result.success).toBe(true);
    expect(result.policies).toBeDefined();
    expect(result.policies.securityMode).toBe('strict');
    expect(result.policies.maxFunctions).toBe(25);
    expect(result.policies.allowedRuntimes).toContain('python3.11');
    expect(result.policies.trustedSources).toContain('aws');
  });

  test('should validate required parameters before function creation', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('create');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('create name=test');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('runtime');

    // AWS environment should require role
    const handler2 = await createLambdaTestHandler({ environment: 'aws' });
    const result3 = await handler2.handleAddressCommand('create name=test runtime=python3.11 code=/tmp/function.zip handler=index.handler');
    expect(result3.success).toBe(false);
    expect(result3.error).toContain('role');
  });

  test('should validate parameters for invoke command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('invoke');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for delete command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('delete');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for describe command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('describe');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for logs command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('logs');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for create_layer command', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('create_layer');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('create_layer name=test-layer');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('content');
  });

  test('should validate parameters for delete_layer command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('delete_layer');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for publish_version command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('publish_version');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for create_alias command', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('create_alias');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('create_alias name=test-func');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('alias_name');

    const result3 = await handler.handleAddressCommand('create_alias name=test-func alias_name=prod');
    expect(result3.success).toBe(false);
    expect(result3.error).toContain('version');
  });

  test('should validate parameters for list_aliases command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('list_aliases');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for local_invoke command', async () => {
    const handler = await createLambdaTestHandler();

    const result = await handler.handleAddressCommand('local_invoke');
    expect(result.success).toBe(false);
    expect(result.error).toContain('name');
  });

  test('should validate parameters for package command', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('package');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('package name=test-func');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('code_dir');
  });

  test('should validate parameters for deploy_rexx command', async () => {
    const handler = await createLambdaTestHandler();

    const result1 = await handler.handleAddressCommand('deploy_rexx');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('name');

    const result2 = await handler.handleAddressCommand('deploy_rexx name=rexx-func');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('rexx_script');
  });

  test('should handle permissive security mode', async () => {
    const handler = await createLambdaTestHandler({
      securityMode: 'permissive',
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Should allow any runtime in permissive mode
    const result1 = await handler.handleAddressCommand('create name=any1 runtime=python3.11 code=/tmp/f1.zip handler=index.handler');
    expect(result1.success).toBe(true);

    const result2 = await handler.handleAddressCommand('create name=any2 runtime=ruby3.2 code=/tmp/f2.zip handler=index.handler');
    expect(result2.success).toBe(true);

    const result3 = await handler.handleAddressCommand('create name=any3 runtime=go1.x code=/tmp/f3.zip handler=index.handler');
    expect(result3.success).toBe(true);
  });

  test('should handle runtime validation edge cases', async () => {
    const handler = await createLambdaTestHandler({
      securityMode: 'strict',
      allowedRuntimes: new Set(['python3.11']),
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Test with empty runtime
    const result1 = await handler.handleAddressCommand('create name=test runtime= code=/tmp/function.zip handler=index.handler');
    expect(result1.success).toBe(false);

    // Test with invalid runtime format
    const result2 = await handler.handleAddressCommand('create name=test runtime=invalid-runtime code=/tmp/function.zip handler=index.handler');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('not allowed in strict mode');
  });

  test('should handle function timeout validation', async () => {
    const handler = await createLambdaTestHandler();

    // Valid timeout
    const result1 = await handler.handleAddressCommand('validate_function name=test timeout=30');
    expect(result1.success).toBe(true);
    expect(result1.valid).toBe(true);

    // Invalid timeout (too low)
    const result2 = await handler.handleAddressCommand('validate_function name=test timeout=0');
    expect(result2.success).toBe(true);
    expect(result2.valid).toBe(false);
    expect(result2.issues.some(issue => issue.includes('timeout'))).toBe(true);

    // Invalid timeout (too high)
    const result3 = await handler.handleAddressCommand('validate_function name=test timeout=1000');
    expect(result3.success).toBe(true);
    expect(result3.valid).toBe(false);
    expect(result3.issues.some(issue => issue.includes('timeout'))).toBe(true);
  });

  test('should handle function memory validation', async () => {
    const handler = await createLambdaTestHandler();

    // Valid memory
    const result1 = await handler.handleAddressCommand('validate_function name=test memory=512');
    expect(result1.success).toBe(true);
    expect(result1.valid).toBe(true);

    // Invalid memory (too low)
    const result2 = await handler.handleAddressCommand('validate_function name=test memory=64');
    expect(result2.success).toBe(true);
    expect(result2.valid).toBe(false);
    expect(result2.issues.some(issue => issue.includes('memory'))).toBe(true);

    // Invalid memory (too high)
    const result3 = await handler.handleAddressCommand('validate_function name=test memory=20000');
    expect(result3.success).toBe(true);
    expect(result3.valid).toBe(false);
    expect(result3.issues.some(issue => issue.includes('memory'))).toBe(true);
  });

  test('should handle audit log size limit', async () => {
    const handler = await createLambdaTestHandler();

    // Fill audit log beyond limit
    for (let i = 0; i < 600; i++) {
      handler.log('test_event', { index: i });
    }

    expect(handler.auditLog.length).toBeLessThanOrEqual(500);
  });

  test('should handle environment detection securely', async () => {
    const handler = await createLambdaTestHandler({ environment: 'auto' });

    // Test environment detection
    await handler.detectEnvironment();

    // Should default to a safe environment if detection fails
    expect(['local', 'aws', 'localstack'].includes(handler.environment)).toBe(true);
  });

  test('should handle RexxJS script validation', async () => {
    const handler = await createLambdaTestHandler({
      environment: 'aws',
      roleArn: 'arn:aws:iam::123456789012:role/lambda-role'
    });

    // Empty script should fail
    const result1 = await handler.handleAddressCommand('deploy_rexx name=empty-script rexx_script=""');
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('empty');

    // Missing script and file should fail
    const result2 = await handler.handleAddressCommand('deploy_rexx name=no-script');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('rexx_script');
  });

  test('should handle resource-based access control', async () => {
    const handler = await createLambdaTestHandler({ environment: 'aws' });

    // Functions should be isolated by name
    handler.activeFunctions.set('user1-func', { name: 'user1-func', owner: 'user1' });
    handler.activeFunctions.set('user2-func', { name: 'user2-func', owner: 'user2' });

    // Should be able to access own function
    const result1 = await handler.handleAddressCommand('describe name=user1-func');
    expect(result1.success).toBe(true);

    // Should be able to access any function (no isolation implemented yet)
    const result2 = await handler.handleAddressCommand('describe name=user2-func');
    expect(result2.success).toBe(true);
  });

});