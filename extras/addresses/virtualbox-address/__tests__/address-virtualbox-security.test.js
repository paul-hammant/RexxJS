/**
 * ADDRESS VIRTUALBOX Handler Security Tests
 * Tests security validation, audit logging, and protection mechanisms
 */

const { createVirtualBoxTestHandler } = require('./test-helper');

describe('ADDRESS VIRTUALBOX Handler - Security Tests', () => {

  test('should enforce memory limits in strict mode', async () => {
    const handler = await createVirtualBoxTestHandler({
      securityMode: 'strict',
      maxVMs: 5
    });

    // Test memory limit exceeded (max is 8192MB)
    const result = await handler.handleAddressCommand('create template=Ubuntu name=test-vm memory=16384');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('Memory limit');
  });

  test('should enforce CPU limits in strict mode', async () => {
    const handler = await createVirtualBoxTestHandler({
      securityMode: 'strict',
      maxVMs: 5
    });

    // Test CPU limit exceeded (max is 8)
    const result = await handler.handleAddressCommand('create template=Ubuntu name=test-vm cpus=16');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('CPU limit');
  });

  test('should block banned commands', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start a VM first
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Try to execute a banned command
    const result = await handler.handleAddressCommand('execute vm=test-vm command="rm -rf /"');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Command blocked by security policy');
  });

  test('should enforce maximum VM limits', async () => {
    const handler = await createVirtualBoxTestHandler({
      maxVMs: 2
    });

    // Create maximum number of VMs
    await handler.handleAddressCommand('create template=Ubuntu name=vm1');
    await handler.handleAddressCommand('create template=Ubuntu name=vm2');

    // Try to create one more
    const result = await handler.handleAddressCommand('create template=Ubuntu name=vm3');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum VMs reached');
  });

  test('should validate template in strict mode', async () => {
    const handler = await createVirtualBoxTestHandler({
      securityMode: 'strict',
      allowedTemplates: ['Ubuntu', 'Debian']
    });

    const result = await handler.handleAddressCommand('create template=Windows name=test-vm');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Template not allowed in strict mode');
  });

  test('should provide security audit log', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('security_audit');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('security_audit');
    expect(result.events).toBeDefined();
    expect(result.securityMode).toBeDefined();
    expect(result.policies).toBeDefined();
  });

  test('should audit security violations', async () => {
    const handler = await createVirtualBoxTestHandler({
      securityMode: 'strict'
    });

    // Trigger a security violation
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm memory=16384');

    const auditResult = await handler.handleAddressCommand('security_audit');
    expect(auditResult.success).toBe(true);
    expect(auditResult.events.length).toBeGreaterThan(0);
  });

  test('should reject untrusted binary paths', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Try to deploy from untrusted path
    const result = await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=/tmp/malicious-binary');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not trusted by security policy');
  });

});