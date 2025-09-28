/**
 * ADDRESS QEMU Handler Coverage Tests
 * Additional tests to ensure complete code coverage
 */

const { createQemuTestHandler } = require('./test-helper');

describe('ADDRESS QEMU Handler - Coverage Tests', () => {

  test('should handle initialize with existing instance', async () => {
    const handler = await createQemuTestHandler();

    // Initialize again - should not reinitialize
    await handler.initialize();
    expect(handler.initialized).toBe(true);
  });

  test('should handle VNC port allocation', async () => {
    const handler = await createQemuTestHandler();

    // Test getNextVNCPort method
    const port1 = handler.getNextVNCPort();
    expect(typeof port1).toBe('number');
    expect(port1).toBeGreaterThan(0);

    // Create a VM and check port allocation
    await handler.handleAddressCommand('create image=debian.qcow2 name=vnc-vm');
    const vm = handler.activeVMs.get('vnc-vm');
    vm.vncPort = port1; // Simulate port assignment

    const port2 = handler.getNextVNCPort();
    expect(port2).not.toBe(port1);
  });

  test('should handle VM health checking', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=health-vm');

    // Test health check method
    const health = await handler.getVMHealth('health-vm');
    expect(health.status).toBeDefined();
    expect(typeof health.running).toBe('boolean');
    expect(typeof health.pid).toBe('number');
  });

  test('should handle VM health check for non-existent VM', async () => {
    const handler = await createQemuTestHandler();

    const health = await handler.getVMHealth('non-existent-vm');
    expect(health.status).toBe('unknown');
    expect(health.running).toBe(false);
    expect(health.pid).toBe(0);
  });

  test('should handle checkpoint monitoring lifecycle', async () => {
    const handler = await createQemuTestHandler();

    // Test setup and cleanup
    const mockCallback = jest.fn();
    handler.setupCheckpointMonitoring('test-vm', mockCallback);

    expect(handler.checkpointMonitor.callbacks.has('test-vm')).toBe(true);
    expect(handler.checkpointMonitor.realtimeData.has('test-vm')).toBe(true);

    // Test process checkpoint data
    const checkpointData = { checkpoint: 'test', params: { progress: 50 } };
    handler.processCheckpointData('test-vm', checkpointData);

    expect(mockCallback).toHaveBeenCalledWith('test', { progress: 50 });

    // Test cleanup
    handler.cleanupCheckpointMonitoring('test-vm');
    expect(handler.checkpointMonitor.callbacks.has('test-vm')).toBe(false);
  });

  test('should handle wrapScriptWithCheckpoints', async () => {
    const handler = await createQemuTestHandler();

    const script = 'SAY "Hello World"';
    const wrapped = handler.wrapScriptWithCheckpoints(script, {});

    expect(typeof wrapped).toBe('string');
    expect(wrapped).toBe(script); // Basic implementation just returns script
  });

  test('should handle parseCheckpointOutput', async () => {
    const handler = await createQemuTestHandler();

    const mockCallback = jest.fn();
    const output = 'CHECKPOINT: test\nOther output';

    handler.parseCheckpointOutput(output, mockCallback);
    // This should call the shared utility function
  });

  test('should handle destroy method', async () => {
    const handler = await createQemuTestHandler();

    // Create some VMs and start monitoring
    await handler.handleAddressCommand('create image=debian.qcow2 name=destroy-vm');
    await handler.handleAddressCommand('start_monitoring');

    // Setup checkpoint monitoring
    handler.setupCheckpointMonitoring('destroy-vm', jest.fn());

    // Destroy handler
    handler.destroy();

    expect(handler.activeVMs.size).toBe(0);
    expect(handler.monitoringTimer).toBeNull();
    expect(handler.checkpointMonitor.callbacks.size).toBe(0);
    expect(handler.checkpointMonitor.realtimeData.size).toBe(0);
    expect(handler.auditLog.length).toBe(0);
  });

  test('should handle missing snapshot parameters', async () => {
    const handler = await createQemuTestHandler();

    // Test snapshot without parameters
    let result = await handler.handleAddressCommand('snapshot');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: name and snapshot_name');

    // Test restore without parameters
    result = await handler.handleAddressCommand('restore');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: name and snapshot_name');
  });

  test('should handle missing deploy_rexx parameters', async () => {
    const handler = await createQemuTestHandler();

    // Test without vm parameter
    let result = await handler.handleAddressCommand('deploy_rexx rexx_binary=/path/to/rexx');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: vm');

    // Test without rexx_binary parameter
    result = await handler.handleAddressCommand('deploy_rexx vm=test-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: rexx_binary');
  });

  test('should handle missing execute parameters', async () => {
    const handler = await createQemuTestHandler();

    // Test without vm parameter
    let result = await handler.handleAddressCommand('execute command="ls"');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: vm and command');

    // Test without command parameter
    result = await handler.handleAddressCommand('execute vm=test-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: vm and command');
  });

  test('should handle missing execute_rexx parameters', async () => {
    const handler = await createQemuTestHandler();

    // Test without vm parameter
    let result = await handler.handleAddressCommand('execute_rexx script="SAY \'Hello\'"');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: vm and (script or script_file)');

    // Test without script/script_file parameter
    result = await handler.handleAddressCommand('execute_rexx vm=test-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters: vm and (script or script_file)');
  });

  test('should handle missing copy parameters', async () => {
    const handler = await createQemuTestHandler();

    // Test copy_to without parameters
    let result = await handler.handleAddressCommand('copy_to vm=test-vm local=/path');
    expect(result.success).toBe(false);
    expect(result.error).toContain('copy_to requires vm, local, and remote parameters');

    // Test copy_from without parameters
    result = await handler.handleAddressCommand('copy_from vm=test-vm remote=/path');
    expect(result.success).toBe(false);
    expect(result.error).toContain('copy_from requires vm, remote, and local parameters');
  });

  test('should handle missing logs parameters', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('logs');
    expect(result.success).toBe(false);
    expect(result.error).toContain('logs requires vm parameter');
  });

  test('should handle operations on non-existent VMs', async () => {
    const handler = await createQemuTestHandler();

    // Test various operations on non-existent VM
    const operations = [
      'start name=non-existent',
      'stop name=non-existent',
      'remove name=non-existent',
      'deploy_rexx vm=non-existent rexx_binary=/path/to/rexx',
      'execute vm=non-existent command="ls"',
      'execute_rexx vm=non-existent script="SAY \'Hello\'"',
      'copy_to vm=non-existent local=/path remote=/path',
      'copy_from vm=non-existent remote=/path local=/path',
      'logs vm=non-existent',
      'snapshot name=non-existent snapshot_name=test',
      'restore name=non-existent snapshot_name=test'
    ];

    for (const operation of operations) {
      const result = await handler.handleAddressCommand(operation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('VM not found');
    }
  });

  test('should handle VM state validation', async () => {
    const handler = await createQemuTestHandler();

    // Create and stop a VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=state-vm');
    const vm = handler.activeVMs.get('state-vm');

    // Test operations that require running VM
    vm.status = 'stopped';

    const runningRequiredOps = [
      'deploy_rexx vm=state-vm rexx_binary=/path/to/rexx',
      'execute vm=state-vm command="ls"',
      'execute_rexx vm=state-vm script="SAY \'Hello\'"'
    ];

    for (const operation of runningRequiredOps) {
      const result = await handler.handleAddressCommand(operation);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be running');
    }

    // Test stop on already stopped VM
    let result = await handler.handleAddressCommand('stop name=state-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('is not running');

    // Test start on already running VM
    vm.status = 'running';
    result = await handler.handleAddressCommand('start name=state-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('is already running');
  });

  test('should handle RexxJS deployment without RexxJS', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=no-rexx-vm');

    // Try to execute RexxJS without deployment
    const result = await handler.handleAddressCommand('execute_rexx vm=no-rexx-vm script="SAY \'Hello\'"');
    expect(result.success).toBe(false);
    expect(result.error).toContain('RexxJS binary not deployed');
  });

  test('should handle configure_health_check validation', async () => {
    const handler = await createQemuTestHandler();

    // Test without vm parameter
    let result = await handler.handleAddressCommand('configure_health_check enabled=true');
    expect(result.success).toBe(false);
    expect(result.error).toContain('VM name required for health check configuration');

    // Test with non-existent VM
    result = await handler.handleAddressCommand('configure_health_check vm=non-existent enabled=true');
    expect(result.success).toBe(false);
    expect(result.error).toContain('VM not found: non-existent');
  });

  test('should handle unhealthy VM detection', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=unhealthy-vm');
    const vm = handler.activeVMs.get('unhealthy-vm');

    // Simulate unhealthy state
    const unhealthyState = { status: 'exited', running: false };
    await handler.handleUnhealthyVM('unhealthy-vm', vm, unhealthyState);

    expect(vm.status).toBe('exited');
  });

  test('should handle execInVMCommandWithProgress', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.execInVMCommandWithProgress('test-vm', 'echo "test"', {
      timeout: 5000,
      progressCallback: jest.fn()
    });

    expect(result.exitCode).toBe(0);
    expect(typeof result.stdout).toBe('string');
    expect(typeof result.stderr).toBe('string');
    expect(typeof result.duration).toBe('number');
  });

  test('should handle parseEnhancedCheckpointOutput', async () => {
    const handler = await createQemuTestHandler();

    const mockCallback = jest.fn();
    const output = 'CHECKPOINT: enhanced_test';

    handler.parseEnhancedCheckpointOutput('test-vm', output, mockCallback);
    // This should call the shared utility function
  });

  test('should handle VM counter increment', async () => {
    const handler = await createQemuTestHandler();

    // Create VMs without names to test counter
    await handler.handleAddressCommand('create image=debian.qcow2');
    await handler.handleAddressCommand('create image=debian.qcow2');

    const vmNames = Array.from(handler.activeVMs.keys());
    expect(vmNames).toContain('qemu-vm-1');
    expect(vmNames).toContain('qemu-vm-2');
  });

  test('should handle security policy access', async () => {
    const handler = await createQemuTestHandler();

    const auditResult = await handler.handleAddressCommand('security_audit');
    expect(auditResult.success).toBe(true);
    expect(auditResult.policies).toBeDefined();
    expect(auditResult.policies.maxMemory).toBe('8g');
    expect(auditResult.policies.maxCpus).toBe('8');
    expect(auditResult.policies.allowPrivileged).toBe(false);
  });

});