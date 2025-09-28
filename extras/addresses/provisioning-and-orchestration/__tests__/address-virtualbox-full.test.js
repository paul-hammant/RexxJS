/**
 * ADDRESS VIRTUALBOX Handler Full Feature Tests
 * Comprehensive testing of all VM lifecycle operations
 */

const { createVirtualBoxTestHandler } = require('./test-helper');

describe('ADDRESS VIRTUALBOX Handler - Full Feature Tests', () => {

  test('should handle complete VM lifecycle', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM
    const createResult = await handler.handleAddressCommand('create template=Ubuntu name=test-vm memory=2048 cpus=2');
    expect(createResult.success).toBe(true);
    expect(createResult.vm).toBe('test-vm');

    // Start VM
    const startResult = await handler.handleAddressCommand('start name=test-vm');
    expect(startResult.success).toBe(true);
    expect(startResult.status).toBe('running');

    // List VMs
    const listResult = await handler.handleAddressCommand('list');
    expect(listResult.success).toBe(true);
    expect(listResult.vms.length).toBe(1);
    expect(listResult.vms[0].name).toBe('test-vm');

    // Stop VM
    const stopResult = await handler.handleAddressCommand('stop name=test-vm');
    expect(stopResult.success).toBe(true);
    expect(stopResult.status).toBe('stopped');

    // Remove VM
    const removeResult = await handler.handleAddressCommand('remove name=test-vm');
    expect(removeResult.success).toBe(true);
  });

  test('should handle VM snapshots', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Create snapshot
    const snapshotResult = await handler.handleAddressCommand('snapshot name=test-vm snapshot_name=clean-state');
    expect(snapshotResult.success).toBe(true);
    expect(snapshotResult.snapshot).toBe('clean-state');

    // Restore snapshot
    const restoreResult = await handler.handleAddressCommand('restore name=test-vm snapshot_name=clean-state');
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.snapshot).toBe('clean-state');
  });

  test('should deploy and execute RexxJS binary', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Deploy RexxJS binary
    const deployResult = await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=/usr/local/bin/rexx');
    expect(deployResult.success).toBe(true);
    expect(deployResult.target).toBe('/usr/local/bin/rexx');

    // Execute RexxJS script
    const execResult = await handler.handleAddressCommand('execute_rexx vm=test-vm script="SAY \'Hello from RexxJS!\'"');
    expect(execResult.success).toBe(true);
    expect(execResult.stdout).toContain('Hello from RexxJS');
  });

  test('should execute commands in VM', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Execute command
    const execResult = await handler.handleAddressCommand('execute vm=test-vm command="echo Hello World"');
    expect(execResult.success).toBe(true);
    expect(execResult.stdout).toContain('Mock VM execution output');
  });

  test('should handle file copy operations', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Copy file to VM
    const copyToResult = await handler.handleAddressCommand('copy_to vm=test-vm local=/tmp/test.txt remote=/home/user/test.txt');
    expect(copyToResult.success).toBe(true);

    // Copy file from VM
    const copyFromResult = await handler.handleAddressCommand('copy_from vm=test-vm remote=/home/user/result.txt local=/tmp/result.txt');
    expect(copyFromResult.success).toBe(true);
  });

  test('should handle cleanup operations', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create multiple VMs
    await handler.handleAddressCommand('create template=Ubuntu name=vm1');
    await handler.handleAddressCommand('create template=Ubuntu name=vm2');
    await handler.handleAddressCommand('start name=vm1');

    // Stop one VM
    await handler.handleAddressCommand('stop name=vm1');

    // Cleanup stopped VMs only (both vm1-stopped and vm2-created will be cleaned)
    const cleanupResult = await handler.handleAddressCommand('cleanup all=false');
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.cleaned).toBe(2);
    expect(cleanupResult.remaining).toBe(0);

    // Cleanup all VMs
    const cleanupAllResult = await handler.handleAddressCommand('cleanup all=true');
    expect(cleanupAllResult.success).toBe(true);
    expect(cleanupAllResult.remaining).toBe(0);
  });

  test('should handle process monitoring', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Start monitoring
    const startResult = await handler.handleAddressCommand('start_monitoring');
    expect(startResult.success).toBe(true);
    expect(startResult.enabled).toBe(true);

    // Get process stats
    const statsResult = await handler.handleAddressCommand('process_stats');
    expect(statsResult.success).toBe(true);
    expect(statsResult.vms).toBeDefined();

    // Stop monitoring
    const stopResult = await handler.handleAddressCommand('stop_monitoring');
    expect(stopResult.success).toBe(true);
    expect(stopResult.enabled).toBe(false);
  });

  test('should configure health checks', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // Configure health check
    const healthResult = await handler.handleAddressCommand('configure_health_check vm=test-vm enabled=true interval=30000');
    expect(healthResult.success).toBe(true);
    expect(healthResult.configuration.enabled).toBe(true);
    expect(healthResult.configuration.interval).toBe(30000);
  });

  test('should handle checkpoint monitoring', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Get checkpoint status
    const statusResult = await handler.handleAddressCommand('checkpoint_status');
    expect(statusResult.success).toBe(true);
    expect(statusResult.enabled).toBe(true);
    expect(statusResult.activeVMs).toBeDefined();
  });

  test('should handle RexxJS execution with progress callback', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Deploy RexxJS
    await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=/usr/local/bin/rexx');

    // Execute with progress callback
    const execResult = await handler.handleAddressCommand('execute_rexx vm=test-vm script="SAY \'Hello from RexxJS!\'" progress_callback=true');
    expect(execResult.success).toBe(true);
    expect(execResult.stdout).toContain('Hello from RexxJS');
  });

  test('should handle VM with custom OS type', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('create template=Debian name=debian-vm ostype=Debian_64 memory=1024 cpus=1');

    expect(result.success).toBe(true);
    expect(result.vm).toBe('debian-vm');
    expect(result.memory).toBe('1024');
    expect(result.cpus).toBe('1');
    expect(result.osType).toBe('Debian_64');
  });

  test('should handle logs command', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // Get logs
    const logsResult = await handler.handleAddressCommand('logs vm=test-vm lines=100');
    expect(logsResult.success).toBe(true);
    expect(logsResult.output).toContain('Console logs for VM test-vm');
  });

  test('should handle error cases gracefully', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Try to start non-existent VM
    const startResult = await handler.handleAddressCommand('start name=non-existent');
    expect(startResult.success).toBe(false);
    expect(startResult.error).toContain('VM not found');

    // Try to execute in non-running VM
    await handler.handleAddressCommand('create template=Ubuntu name=stopped-vm');
    const execResult = await handler.handleAddressCommand('execute vm=stopped-vm command="echo test"');
    expect(execResult.success).toBe(false);
    expect(execResult.error).toContain('must be running');
  });

  test('should handle idempotent start_if_stopped', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // First start_if_stopped should start VM
    const result1 = await handler.handleAddressCommand('start_if_stopped name=test-vm');
    expect(result1.success).toBe(true);
    expect(result1.status).toBe('running');
    expect(result1.skipped).toBeUndefined();

    // Second start_if_stopped should skip (already running)
    const result2 = await handler.handleAddressCommand('start_if_stopped name=test-vm');
    expect(result2.success).toBe(true);
    expect(result2.status).toBe('running');
    expect(result2.skipped).toBe(true);
  });

  test('should handle idempotent stop_if_running', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
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
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Restart should stop then start
    const result = await handler.handleAddressCommand('restart name=test-vm');
    expect(result.success).toBe(true);
    expect(result.operation).toBe('restart');
    expect(result.status).toBe('running');

    const vm = handler.activeVMs.get('test-vm');
    expect(vm.status).toBe('running');
  });

  test('should handle restart on stopped VM', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM (not started)
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // Restart should just start it
    const result = await handler.handleAddressCommand('restart name=test-vm');
    expect(result.success).toBe(true);
    expect(result.status).toBe('running');
  });

  test('should handle pause and resume', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
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
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
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

  test('should fail pause on non-running VM', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM (not started)
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // Try to pause stopped VM
    const result = await handler.handleAddressCommand('pause name=test-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not running');
  });

  test('should fail resume on non-paused VM', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Try to resume running VM (not paused)
    const result = await handler.handleAddressCommand('resume name=test-vm');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not paused');
  });

});