/**
 * ADDRESS QEMU Handler Full Tests
 * Comprehensive test coverage for all QEMU functionality
 */

const { createQemuTestHandler } = require('./test-helper');

describe('ADDRESS QEMU Handler - Full Tests', () => {

  test('should initialize with custom configuration', async () => {
    const config = {
      securityMode: 'strict',
      maxVMs: 5,
      defaultTimeout: 180000,
      allowedImages: ['custom.qcow2'],
      trustedBinaries: ['/custom/path/rexx']
    };

    const handler = await createQemuTestHandler(config);

    expect(handler.securityMode).toBe('strict');
    expect(handler.maxVMs).toBe(5);
    expect(handler.defaultTimeout).toBe(180000);
    expect(handler.allowedImages.has('custom.qcow2')).toBe(true);
    expect(handler.trustedBinaries.has('/custom/path/rexx')).toBe(true);
  });

  test('should handle VM lifecycle operations', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    let result = await handler.handleAddressCommand('create image=debian.qcow2 name=lifecycle-vm memory=4G cpus=4');
    expect(result.success).toBe(true);
    expect(result.vm).toBe('lifecycle-vm');
    expect(result.status).toBe('running');

    // List VMs
    result = await handler.handleAddressCommand('list');
    expect(result.success).toBe(true);
    expect(result.vms).toHaveLength(1);
    expect(result.vms[0].name).toBe('lifecycle-vm');
    expect(result.vms[0].memory).toBe('4G');
    expect(result.vms[0].cpus).toBe('4');

    // Stop VM
    result = await handler.handleAddressCommand('stop name=lifecycle-vm');
    expect(result.success).toBe(true);
    expect(result.status).toBe('stopped');

    // Start VM again
    result = await handler.handleAddressCommand('start name=lifecycle-vm');
    expect(result.success).toBe(true);
    expect(result.status).toBe('running');

    // Remove VM
    result = await handler.handleAddressCommand('remove name=lifecycle-vm');
    expect(result.success).toBe(true);
    expect(handler.activeVMs.has('lifecycle-vm')).toBe(false);
  });

  test('should handle copy operations', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=copy-vm');

    // Copy to VM
    let result = await handler.handleAddressCommand('copy_to vm=copy-vm local=/host/file.txt remote=/vm/file.txt');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('copy_to');
    expect(result.localPath).toBe('/host/file.txt');
    expect(result.remotePath).toBe('/vm/file.txt');

    // Copy from VM
    result = await handler.handleAddressCommand('copy_from vm=copy-vm remote=/vm/result.txt local=/host/result.txt');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('copy_from');
    expect(result.remotePath).toBe('/vm/result.txt');
    expect(result.localPath).toBe('/host/result.txt');
  });

  test('should handle snapshot operations', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=snapshot-vm');

    // Create snapshot
    let result = await handler.handleAddressCommand('snapshot name=snapshot-vm snapshot_name=backup-state');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('snapshot');
    expect(result.snapshot).toBe('backup-state');

    // Restore snapshot
    result = await handler.handleAddressCommand('restore name=snapshot-vm snapshot_name=backup-state');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('restore');
    expect(result.snapshot).toBe('backup-state');

    // Check VM status after restore
    const vm = handler.activeVMs.get('snapshot-vm');
    expect(vm.status).toBe('stopped'); // VM should be stopped after restore
  });

  test('should handle command execution', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=exec-vm');

    // Execute command
    const result = await handler.handleAddressCommand('execute vm=exec-vm command="ls -la" timeout=10000');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('execute');
    expect(result.vm).toBe('exec-vm');
    expect(result.command).toBe('ls -la');
    expect(typeof result.exitCode).toBe('number');
  });

  test('should handle RexxJS binary deployment', async () => {
    const handler = await createQemuTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=rexx-vm');
    await handler.handleAddressCommand('start name=rexx-vm');

    // Deploy RexxJS binary
    const result = await handler.handleAddressCommand('deploy_rexx vm=rexx-vm rexx_binary=/host/rexx target=/usr/local/bin/rexx');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('deploy_rexx');
    expect(result.binary).toBe('/host/rexx');
    expect(result.target).toBe('/usr/local/bin/rexx');

    // Check VM state
    const vm = handler.activeVMs.get('rexx-vm');
    expect(vm.rexxDeployed).toBe(true);
    expect(vm.rexxPath).toBe('/usr/local/bin/rexx');
  });

  test('should handle RexxJS script execution', async () => {
    const handler = await createQemuTestHandler();

    // Create, start VM and deploy RexxJS
    await handler.handleAddressCommand('create image=debian.qcow2 name=script-vm');
    await handler.handleAddressCommand('start name=script-vm');
    await handler.handleAddressCommand('deploy_rexx vm=script-vm rexx_binary=/host/rexx');

    // Execute RexxJS script
    const result = await handler.handleAddressCommand('execute_rexx vm=script-vm script="SAY \'Hello from QEMU VM\'"');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('execute_rexx');
    expect(result.vm).toBe('script-vm');
  });

  test('should handle process monitoring', async () => {
    const handler = await createQemuTestHandler();

    // Start monitoring
    let result = await handler.handleAddressCommand('start_monitoring');
    expect(result.success).toBe(true);
    expect(result.enabled).toBe(true);

    // Get process stats
    result = await handler.handleAddressCommand('process_stats');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('process_stats');
    expect(Array.isArray(result.vms)).toBe(true);
    expect(result.monitoringEnabled).toBe(true);

    // Stop monitoring
    result = await handler.handleAddressCommand('stop_monitoring');
    expect(result.success).toBe(true);
    expect(result.enabled).toBe(false);
  });

  test('should handle health check configuration', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=health-vm');

    // Configure health check
    const result = await handler.handleAddressCommand('configure_health_check vm=health-vm enabled=true interval=30000 retries=5');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('configure_health_check');
    expect(result.configuration.enabled).toBe(true);
    expect(result.configuration.interval).toBe(30000);
    expect(result.configuration.retries).toBe(5);
  });

  test('should handle checkpoint monitoring', async () => {
    const handler = await createQemuTestHandler();

    // Get checkpoint status
    const result = await handler.handleAddressCommand('checkpoint_status');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('checkpoint_monitoring_status');
    expect(result.enabled).toBe(true);
    expect(Array.isArray(result.activeVMs)).toBe(true);
  });

  test('should handle logs command', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=log-vm');

    // Get logs
    const result = await handler.handleAddressCommand('logs vm=log-vm lines=100');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('logs');
    expect(result.vm).toBe('log-vm');
    expect(result.lines).toBe(100);
  });

  test('should handle network configuration', async () => {
    const handler = await createQemuTestHandler();

    // Create VM with custom network
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=net-vm network=bridge');
    expect(result.success).toBe(true);
    expect(result.network).toBe('bridge');

    const vm = handler.activeVMs.get('net-vm');
    expect(vm.network).toBe('bridge');
  });

  test('should handle disk configuration', async () => {
    const handler = await createQemuTestHandler();

    // Create VM with custom disk
    const result = await handler.handleAddressCommand('create image=debian.qcow2 name=disk-vm disk=/tmp/custom-disk.qcow2');
    expect(result.success).toBe(true);
    expect(result.disk).toBe('/tmp/custom-disk.qcow2');

    const vm = handler.activeVMs.get('disk-vm');
    expect(vm.disk).toBe('/tmp/custom-disk.qcow2');
  });

  test('should handle error cases gracefully', async () => {
    const handler = await createQemuTestHandler();

    // Try to start non-existent VM
    let result = await handler.handleAddressCommand('start name=non-existent');
    expect(result.success).toBe(false);
    expect(result.error).toContain('VM not found: non-existent');

    // Try to stop non-running VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=stopped-vm');
    const vm = handler.activeVMs.get('stopped-vm');
    vm.status = 'stopped';

    result = await handler.handleAddressCommand('start name=stopped-vm');
    expect(result.success).toBe(true); // Should work

    // Try invalid operations
    result = await handler.handleAddressCommand('invalid_operation');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown ADDRESS QEMU command: invalid_operation');
  });

  test('should handle working directory for command execution', async () => {
    const handler = await createQemuTestHandler();

    // Create VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=workdir-vm');

    // Execute command with working directory
    const result = await handler.handleAddressCommand('execute vm=workdir-vm command="pwd" working_dir="/tmp"');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('execute');
  });

  test('should handle VM auto-naming', async () => {
    const handler = await createQemuTestHandler();

    // Create VM without specifying name
    const result = await handler.handleAddressCommand('create image=debian.qcow2');
    expect(result.success).toBe(true);
    expect(result.vm).toMatch(/qemu-vm-\d+/);
  });

  test('should handle concurrent operations', async () => {
    const handler = await createQemuTestHandler();

    // Create multiple VMs concurrently (simulated)
    const promises = [];
    for (let i = 1; i <= 3; i++) {
      promises.push(handler.handleAddressCommand(`create image=debian.qcow2 name=concurrent-vm-${i}`));
    }

    const results = await Promise.all(promises);
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.vm).toBe(`concurrent-vm-${index + 1}`);
    });

    expect(handler.activeVMs.size).toBe(3);
  });

  test('should handle idempotent start_if_stopped', async () => {
    const handler = await createQemuTestHandler();

    // Create VM (QEMU starts it automatically)
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');

    // First start_if_stopped should skip (already running after create)
    const result1 = await handler.handleAddressCommand('start_if_stopped name=test-vm');
    expect(result1.success).toBe(true);
    expect(result1.status).toBe('running');
    expect(result1.skipped).toBe(true);

    // Stop VM then try start_if_stopped
    await handler.handleAddressCommand('stop name=test-vm');
    const result2 = await handler.handleAddressCommand('start_if_stopped name=test-vm');
    expect(result2.success).toBe(true);
    expect(result2.status).toBe('running');
    expect(result2.skipped).toBeUndefined();
  });

  test('should handle idempotent stop_if_running', async () => {
    const handler = await createQemuTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // First stop_if_running should stop VM
    const result1 = await handler.handleAddressCommand('stop_if_running name=test-vm');
    expect(result1.success).toBe(true);
    expect(result1.status).toBe('stopped');
    expect(result1.skipped).toBeUndefined();

    // Second stop_if_running should skip (already stopped)
    const result2 = await handler.handleAddressCommand('stop_if_running name=test-vm');
    expect(result2.success).toBe(true);
    expect(result2.status).toBe('stopped');
    expect(result2.skipped).toBe(true);
  });

  test('should handle restart command', async () => {
    const handler = await createQemuTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Restart should stop then start
    const result = await handler.handleAddressCommand('restart name=test-vm');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('restart');
    expect(result.status).toBe('running');

    const vm = handler.activeVMs.get('test-vm');
    expect(vm.status).toBe('running');
  });

  test('should handle pause and resume', async () => {
    const handler = await createQemuTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Pause VM
    const pauseResult = await handler.handleAddressCommand('pause name=test-vm');
    expect(pauseResult.success).toBe(true);
    expect(pauseResult.operation).toBe('pause');
    expect(pauseResult.status).toBe('paused');

    const vm = handler.activeVMs.get('test-vm');
    expect(vm.status).toBe('paused');

    // Resume VM
    const resumeResult = await handler.handleAddressCommand('resume name=test-vm');
    expect(resumeResult.success).toBe(true);
    expect(resumeResult.operation).toBe('resume');
    expect(resumeResult.status).toBe('running');
    expect(vm.status).toBe('running');
  });

  test('should handle save_state and restore_state', async () => {
    const handler = await createQemuTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create image=debian.qcow2 name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Save state
    const saveResult = await handler.handleAddressCommand('save_state name=test-vm');
    expect(saveResult.success).toBe(true);
    expect(saveResult.operation).toBe('save_state');
    expect(saveResult.status).toBe('saved');

    const vm = handler.activeVMs.get('test-vm');
    expect(vm.status).toBe('saved');

    // Restore state
    const restoreResult = await handler.handleAddressCommand('restore_state name=test-vm');
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.operation).toBe('restore_state');
    expect(restoreResult.status).toBe('running');
    expect(vm.status).toBe('running');
  });

});