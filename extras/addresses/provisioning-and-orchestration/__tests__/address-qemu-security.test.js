/**
 * ADDRESS QEMU Handler Security Tests
 * Focus on security validation and audit functionality
 */

const { createQemuTestHandler } = require('./test-helper');

describe('ADDRESS QEMU Handler - Security Tests', () => {

  test('should enforce security policies in strict mode', async () => {
    const handler = await createQemuTestHandler({
      securityMode: 'strict',
      allowedImages: ['debian.qcow2']
    });

    // Try to create VM with unauthorized image
    const result = await handler.handleAddressCommand('create image=ubuntu.qcow2 name=test-vm');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Image not allowed in strict mode: ubuntu.qcow2');
  });

  test('should validate memory limits', async () => {
    const handler = await createQemuTestHandler({
      securityMode: 'strict'
    });

    // Try to create VM with excessive memory
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm memory=16G');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('Memory limit 16G exceeds maximum allowed 8g');
  });

  test('should validate CPU limits', async () => {
    const handler = await createQemuTestHandler({
      securityMode: 'strict'
    });

    // Try to create VM with excessive CPUs
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm cpus=16');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('CPU limit 16 exceeds maximum allowed 8');
  });

  test('should validate disk paths', async () => {
    const handler = await createQemuTestHandler({
      securityMode: 'strict'
    });

    // Try to create VM with unauthorized disk path
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm disk=/root/secret.qcow2');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('Disk path /root/secret.qcow2 not allowed');
  });

  test('should block dangerous commands', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Try to execute dangerous command
    const result = await handler.handleAddressCommand('execute vm=test-vm command="rm -rf /"');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Command blocked by security policy');
  });

  test('should maintain audit log', async () => {
    const handler = await createQemuTestHandler();

    // Create VM with security violation
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm memory=16G');

    // Check audit log
    const auditResult = await handler.handleAddressCommand('security_audit');

    expect(auditResult.success).toBe(true);
    expect(auditResult.operation).toBe('security_audit');
    expect(Array.isArray(auditResult.events)).toBe(true);
    expect(auditResult.securityMode).toBeDefined();
    expect(auditResult.policies).toBeDefined();
  });

  test('should validate binary paths for deployment', async () => {
    const handler = await createQemuTestHandler();

    // Create a VM first
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Try to deploy binary from dangerous path
    const result = await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=../../../etc/passwd');

    expect(result.success).toBe(false);
    expect(result.error).toContain('RexxJS binary path ../../../etc/passwd not trusted');
  });

  test('should enforce VM limits', async () => {
    const handler = await createQemuTestHandler({ maxVMs: 2 });

    // Create maximum allowed VMs
    await handler.handleAddressCommand('create image=debian.qcow2 name=vm1');
    await handler.handleAddressCommand('create image=debian.qcow2 name=vm2');

    // Try to create one more
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=vm3');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum VMs reached: 2');
  });

  test('should handle security mode configuration', async () => {
    const strictHandler = await createQemuTestHandler({ securityMode: 'strict' });
    const moderateHandler = await createQemuTestHandler({ securityMode: 'moderate' });

    const strictStatus = await strictHandler.handleAddressCommand('status');
    const moderateStatus = await moderateHandler.handleAddressCommand('status');

    expect(strictStatus.securityMode).toBe('strict');
    expect(moderateStatus.securityMode).toBe('moderate');
  });

  test('should validate trusted binaries configuration', async () => {
    const handler = await createQemuTestHandler({
      trustedBinaries: ['/usr/local/bin/rexx']
    });

    // Create a VM first
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Deploy from trusted path should work (in mock mode)
    const result = await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=/usr/local/bin/rexx');

    expect(result.success).toBe(true);
  });

  test('should prevent name conflicts', async () => {
    const handler = await createQemuTestHandler();

    // Create first VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=duplicate-vm');

    // Try to create another VM with same name
    const result = await handler.handleAddressCommand('create image=ubuntu.qcow2 name=duplicate-vm');

    expect(result.success).toBe(false);
    expect(result.error).toContain('VM name already exists: duplicate-vm');
  });

});