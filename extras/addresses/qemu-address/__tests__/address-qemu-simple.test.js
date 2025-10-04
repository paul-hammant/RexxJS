/**
 * Simplified ADDRESS QEMU Handler Tests
 * Focus on getting basic functionality working with proper mock mode
 */

const { createQemuTestHandler } = require('./test-helper');

describe('ADDRESS QEMU Handler - Simple Tests', () => {

  test('should work with Jest mocking', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm memory=2G');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.vm).toBe('test-vm');
    expect(result.output).toContain('created and started successfully');
  });

  test('should handle status command', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('status');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('status');
  });

  test('should handle list command', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('list');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(result.vms).toEqual([]);
  });

  test('should create VM with default parameters', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('create image=ubuntu.qcow2');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.vm).toMatch(/qemu-vm-\d+/);
    expect(result.memory).toBe('2G');
    expect(result.cpus).toBe('2');
  });

  test('should start existing VM', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Stop it (simulated)
    const vm = handler.activeVMs.get('test-vm');
    vm.status = 'stopped';

    // Now start it
    const result = await handler.handleAddressCommand('start name=test-vm');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('start');
    expect(result.vm).toBe('test-vm');
    expect(result.status).toBe('running');
  });

  test('should stop running VM', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Now stop it
    const result = await handler.handleAddressCommand('stop name=test-vm');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('stop');
    expect(result.vm).toBe('test-vm');
    expect(result.status).toBe('stopped');
  });

  test('should remove VM', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Now remove it
    const result = await handler.handleAddressCommand('remove name=test-vm');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('remove');
    expect(result.vm).toBe('test-vm');
    expect(handler.activeVMs.has('test-vm')).toBe(false);
  });

  test('should create VM snapshot', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Create snapshot
    const result = await handler.handleAddressCommand('snapshot name=test-vm snapshot_name=backup1');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('snapshot');
    expect(result.vm).toBe('test-vm');
    expect(result.snapshot).toBe('backup1');
  });

  test('should restore VM from snapshot', async () => {
    const handler = await createQemuTestHandler();

    // First create a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Create and restore snapshot
    await handler.handleAddressCommand('snapshot name=test-vm snapshot_name=backup1');
    const result = await handler.handleAddressCommand('restore name=test-vm snapshot_name=backup1');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('restore');
    expect(result.vm).toBe('test-vm');
    expect(result.snapshot).toBe('backup1');
  });

  test('should handle cleanup command', async () => {
    const handler = await createQemuTestHandler();

    // Create some VMs
    await handler.handleAddressCommand('create image=debian.qcow2 name=vm1');
    await handler.handleAddressCommand('create image=ubuntu.qcow2 name=vm2');

    // Stop one VM
    const vm1 = handler.activeVMs.get('vm1');
    vm1.status = 'stopped';

    // Cleanup stopped VMs
    const result = await handler.handleAddressCommand('cleanup');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('cleanup');
    expect(result.cleaned).toBe(1);
    expect(result.remaining).toBe(1);
  });

  test('should handle cleanup all command', async () => {
    const handler = await createQemuTestHandler();

    // Create some VMs
    await handler.handleAddressCommand('create image=debian.qcow2 name=vm1');
    await handler.handleAddressCommand('create image=ubuntu.qcow2 name=vm2');

    // Cleanup all VMs
    const result = await handler.handleAddressCommand('cleanup all=true');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('cleanup');
    expect(result.cleaned).toBe(2);
    expect(result.remaining).toBe(0);
  });

  test('should validate required parameters', async () => {
    const handler = await createQemuTestHandler();

    // Missing image parameter
    const result = await handler.handleAddressCommand('create name=test-vm');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: image');
  });

  test('should enforce VM limits', async () => {
    const handler = await createQemuTestHandler({ maxVMs: 1 });

    // Create first VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=vm1');

    // Try to create second VM
    const result = await handler.handleAddressCommand('create image=ubuntu.qcow2 name=vm2');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum VMs reached: 1');
  });

  test('should prevent duplicate VM names', async () => {
    const handler = await createQemuTestHandler();

    // Create first VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // Try to create VM with same name
    const result = await handler.handleAddressCommand('create image=ubuntu.qcow2 name=test-vm');

    expect(result.success).toBe(false);
    expect(result.error).toContain('VM name already exists: test-vm');
  });

});