/**
 * Simplified ADDRESS VIRTUALBOX Handler Tests
 * Focus on getting basic functionality working with proper mock mode
 */

const { createVirtualBoxTestHandler } = require('./test-helper');

describe('ADDRESS VIRTUALBOX Handler - Simple Tests', () => {

  test('should work with Jest mocking', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('create template=Ubuntu name=test-vm');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.vm).toBe('test-vm');
    expect(result.output).toContain('created successfully');
  });

  test('should handle status command', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('status');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('status');
  });

  test('should handle list command', async () => {
    const handler = await createVirtualBoxTestHandler();

    const result = await handler.handleAddressCommand('list');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(result.vms).toEqual([]);
  });

});