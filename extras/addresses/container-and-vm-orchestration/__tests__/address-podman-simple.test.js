/**
 * Simplified ADDRESS PODMAN Handler Tests
 * Focus on getting basic functionality working with proper mock mode
 */

const { createTestHandler } = require('./test-helper');

describe('ADDRESS PODMAN Handler - Simple Tests', () => {
  
  test('should work with Jest mocking', async () => {
    const handler = await createTestHandler();
    
    const result = await handler.handleAddressCommand('create image=debian:stable name=test-container');
    
    expect(result.success).toBe(true);
    expect(result.operation).toBe('create');
    expect(result.container).toBe('test-container');
    expect(result.output).toContain('created successfully');
  });

  test('should handle status command', async () => {
    const handler = await createTestHandler();
    
    const result = await handler.handleAddressCommand('status');
    
    expect(result.success).toBe(true);
    expect(result.operation).toBe('status');
  });

  test('should handle list command', async () => {
    const handler = await createTestHandler();
    
    const result = await handler.handleAddressCommand('list');
    
    expect(result.success).toBe(true);
    expect(result.operation).toBe('list');
    expect(result.containers).toEqual([]);
  });

});