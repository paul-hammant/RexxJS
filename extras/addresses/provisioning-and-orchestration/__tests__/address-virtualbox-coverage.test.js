/**
 * ADDRESS VIRTUALBOX Handler Coverage Tests
 * Edge cases and comprehensive coverage testing
 */

const { createVirtualBoxTestHandler } = require('./test-helper');

describe('ADDRESS VIRTUALBOX Handler - Coverage Tests', () => {

  test('should handle edge cases in VM creation', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing template parameter
    const noTemplateResult = await handler.handleAddressCommand('create name=test-vm');
    expect(noTemplateResult.success).toBe(false);
    expect(noTemplateResult.error).toContain('Missing required parameter: template');

    // Auto-generated VM name
    const autoNameResult = await handler.handleAddressCommand('create template=Ubuntu');
    expect(autoNameResult.success).toBe(true);
    expect(autoNameResult.vm).toMatch(/^vbox-vm-\d+$/);

    // Duplicate VM name
    await handler.handleAddressCommand('create template=Ubuntu name=duplicate');
    const duplicateResult = await handler.handleAddressCommand('create template=Ubuntu name=duplicate');
    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.error).toContain('VM name already exists');
  });

  test('should handle VM state validation', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    // Try to start already running VM
    await handler.handleAddressCommand('start name=test-vm');
    const startAgainResult = await handler.handleAddressCommand('start name=test-vm');
    expect(startAgainResult.success).toBe(false);
    expect(startAgainResult.error).toContain('already running');

    // Try to stop non-running VM
    await handler.handleAddressCommand('stop name=test-vm');
    const stopAgainResult = await handler.handleAddressCommand('stop name=test-vm');
    expect(stopAgainResult.success).toBe(false);
    expect(stopAgainResult.error).toContain('not running');
  });

  test('should handle missing parameters', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing VM name for start
    const startResult = await handler.handleAddressCommand('start');
    expect(startResult.success).toBe(false);
    expect(startResult.error).toContain('Missing required parameter: name');

    // Missing VM name for stop
    const stopResult = await handler.handleAddressCommand('stop');
    expect(stopResult.success).toBe(false);
    expect(stopResult.error).toContain('Missing required parameter: name');

    // Missing VM name for remove
    const removeResult = await handler.handleAddressCommand('remove');
    expect(removeResult.success).toBe(false);
    expect(removeResult.error).toContain('Missing required parameter: name');
  });

  test('should handle execute command edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing VM parameter
    const noVmResult = await handler.handleAddressCommand('execute command="echo test"');
    expect(noVmResult.success).toBe(false);
    expect(noVmResult.error).toContain('Missing required parameters');

    // Missing command parameter
    const noCmdResult = await handler.handleAddressCommand('execute vm=test-vm');
    expect(noCmdResult.success).toBe(false);
    expect(noCmdResult.error).toContain('Missing required parameters');

    // Non-existent VM
    const noVmExistsResult = await handler.handleAddressCommand('execute vm=non-existent command="echo test"');
    expect(noVmExistsResult.success).toBe(false);
    expect(noVmExistsResult.error).toContain('VM not found');
  });

  test('should handle RexxJS execution edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Missing RexxJS deployment
    const noRexxResult = await handler.handleAddressCommand('execute_rexx vm=test-vm script="SAY \'test\'"');
    expect(noRexxResult.success).toBe(false);
    expect(noRexxResult.error).toContain('RexxJS binary not deployed');

    // Missing script parameter
    const noScriptResult = await handler.handleAddressCommand('execute_rexx vm=test-vm');
    expect(noScriptResult.success).toBe(false);
    expect(noScriptResult.error).toContain('Missing required parameters');
  });

  test('should handle file copy edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing parameters for copy_to
    const copyToMissingResult = await handler.handleAddressCommand('copy_to vm=test-vm local=/tmp/file');
    expect(copyToMissingResult.success).toBe(false);
    expect(copyToMissingResult.error).toContain('copy_to requires vm, local, and remote parameters');

    // Missing parameters for copy_from
    const copyFromMissingResult = await handler.handleAddressCommand('copy_from vm=test-vm remote=/tmp/file');
    expect(copyFromMissingResult.success).toBe(false);
    expect(copyFromMissingResult.error).toContain('copy_from requires vm, remote, and local parameters');

    // Non-existent VM
    const copyToNoVmResult = await handler.handleAddressCommand('copy_to vm=non-existent local=/tmp/file remote=/tmp/file');
    expect(copyToNoVmResult.success).toBe(false);
    expect(copyToNoVmResult.error).toContain('VM not found');
  });

  test('should handle snapshot edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing parameters for snapshot
    const snapshotMissingResult = await handler.handleAddressCommand('snapshot name=test-vm');
    expect(snapshotMissingResult.success).toBe(false);
    expect(snapshotMissingResult.error).toContain('Missing required parameters');

    // Missing parameters for restore
    const restoreMissingResult = await handler.handleAddressCommand('restore name=test-vm');
    expect(restoreMissingResult.success).toBe(false);
    expect(restoreMissingResult.error).toContain('Missing required parameters');

    // Non-existent VM
    const snapshotNoVmResult = await handler.handleAddressCommand('snapshot name=non-existent snapshot_name=test');
    expect(snapshotNoVmResult.success).toBe(false);
    expect(snapshotNoVmResult.error).toContain('VM not found');
  });

  test('should handle deploy_rexx edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing VM parameter
    const noVmResult = await handler.handleAddressCommand('deploy_rexx rexx_binary=/usr/bin/rexx');
    expect(noVmResult.success).toBe(false);
    expect(noVmResult.error).toContain('Missing required parameter: vm');

    // Missing binary parameter
    const noBinaryResult = await handler.handleAddressCommand('deploy_rexx vm=test-vm');
    expect(noBinaryResult.success).toBe(false);
    expect(noBinaryResult.error).toContain('Missing required parameter: rexx_binary');

    // Non-existent VM
    const noVmExistsResult = await handler.handleAddressCommand('deploy_rexx vm=non-existent rexx_binary=/usr/bin/rexx');
    expect(noVmExistsResult.success).toBe(false);
    expect(noVmExistsResult.error).toContain('VM not found');
  });

  test('should handle health check configuration edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing VM parameter
    const noVmResult = await handler.handleAddressCommand('configure_health_check enabled=true');
    expect(noVmResult.success).toBe(false);
    expect(noVmResult.error).toContain('VM name required');

    // Non-existent VM
    const noVmExistsResult = await handler.handleAddressCommand('configure_health_check vm=non-existent enabled=true');
    expect(noVmExistsResult.success).toBe(false);
    expect(noVmExistsResult.error).toContain('VM not found');
  });

  test('should handle logs edge cases', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Missing VM parameter
    const noVmResult = await handler.handleAddressCommand('logs lines=50');
    expect(noVmResult.success).toBe(false);
    expect(noVmResult.error).toContain('logs requires vm parameter');

    // Non-existent VM
    const noVmExistsResult = await handler.handleAddressCommand('logs vm=non-existent');
    expect(noVmExistsResult.success).toBe(false);
    expect(noVmExistsResult.error).toContain('VM not found');
  });

  test('should handle unknown commands', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('unknown_command param=value');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown ADDRESS VIRTUALBOX command');
  });

  test('should handle empty commands', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown ADDRESS VIRTUALBOX command');
  });

  test('should handle security validation combinations', async () => {
    const handler = await createVirtualBoxTestHandler({
      securityMode: 'strict'
    });

    // Multiple security violations
    const result = await handler.handleAddressCommand('create template=Ubuntu name=test-vm memory=16384 cpus=16');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Security violations');
    expect(result.error).toContain('Memory limit');
    expect(result.error).toContain('CPU limit');
  });

  test('should handle interpolation in commands', async () => {
    const handler = await createVirtualBoxTestHandler();

    const context = { vm_name: 'interpolated-vm', mem_size: '1024' };
    const result = await handler.handleAddressCommand('create template=Ubuntu name={vm_name} memory={mem_size}', context);

    expect(result.success).toBe(true);
    expect(result.vm).toBe('interpolated-vm');
    expect(result.memory).toBe('1024');
  });

  test('should handle working directory in execute command', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Execute with working directory
    const result = await handler.handleAddressCommand('execute vm=test-vm command="pwd" working_dir="/tmp"');
    expect(result.success).toBe(true);
  });

  test('should handle timeout in execute command', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Execute with custom timeout
    const result = await handler.handleAddressCommand('execute vm=test-vm command="echo test" timeout=5000');
    expect(result.success).toBe(true);
  });

  test('should handle VM removal with running state', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Remove running VM (should stop first)
    const result = await handler.handleAddressCommand('remove name=test-vm');
    expect(result.success).toBe(true);
  });

  test('should handle script file execution', async () => {
    const handler = await createVirtualBoxTestHandler();

    // Create and start VM
    await handler.handleAddressCommand('create template=Ubuntu name=test-vm');
    await handler.handleAddressCommand('start name=test-vm');

    // Deploy RexxJS
    await handler.handleAddressCommand('deploy_rexx vm=test-vm rexx_binary=/usr/local/bin/rexx');

    // Execute script file
    const result = await handler.handleAddressCommand('execute_rexx vm=test-vm script_file=/tmp/test.rexx');
    expect(result.success).toBe(true);
  });

});