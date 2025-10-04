/* Copyright (c) 2025 RexxJS Project ... Licensed under the MIT License */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

describe('jq ADDRESS Library (Native)', () => {
  let JQ_ADDRESS_META, ADDRESS_JQ_HANDLER;

  beforeAll(async () => {
    // Check if jq is available
    try {
      await execAsync('which jq');
    } catch (e) {
      console.warn('jq binary not found - skipping tests. Install jq: apt install jq / brew install jq');
      return;
    }

    // Load the library
    const lib = require('../src/jq-address.js');
    JQ_ADDRESS_META = lib.JQ_ADDRESS_META;
    ADDRESS_JQ_HANDLER = lib.ADDRESS_JQ_HANDLER;
  });

  beforeEach(async () => {
    // Check if we can proceed
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    // Clear context before each test
    if (ADDRESS_JQ_HANDLER) {
      await ADDRESS_JQ_HANDLER('clearcontext', {});
    }
  });

  test('should have correct metadata', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return; // Skip if jq not available
    }

    const metadata = JQ_ADDRESS_META();

    expect(metadata.canonical).toBe('org.rexxjs/jq-address');
    expect(metadata.type).toBe('address-handler');
    expect(metadata.provides.addressTarget).toBe('jq');
    expect(metadata.provides.handlerFunction).toBe('ADDRESS_JQ_HANDLER');
    expect(metadata.requirements.systemBinaries).toContain('jq');
  });

  test('should execute simple jq query with data and query params', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"name": "RexxJS", "version": "1.0.0"}';
    const result = await ADDRESS_JQ_HANDLER('query', { data: testData, query: '.name' });

    expect(result.success).toBe(true);
    expect(result.output).toBe('RexxJS');
    expect(result.errorCode).toBe(0);
  });

  test('should execute query with context', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}';

    // Set context
    await ADDRESS_JQ_HANDLER('setcontext', { data: testData });

    // Query with context
    const result = await ADDRESS_JQ_HANDLER('.users[0].name');

    expect(result.success).toBe(true);
    expect(result.output).toBe('Alice');
  });

  test('should handle array queries', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"items": [1, 2, 3, 4, 5]}';
    const result = await ADDRESS_JQ_HANDLER('query', { data: testData, query: '.items | length' });

    expect(result.success).toBe(true);
    expect(result.output).toBe(5);
  });

  test('should handle keys method', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"name": "test", "value": 42}';
    const result = await ADDRESS_JQ_HANDLER('keys', { data: testData });

    expect(result.success).toBe(true);
    expect(result.output).toEqual(['name', 'value']);
  });

  test('should handle raw output', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"name": "RexxJS"}';
    const result = await ADDRESS_JQ_HANDLER('raw', { data: testData, query: '.name' });

    expect(result.success).toBe(true);
    expect(result.output).toBe('RexxJS');
    expect(typeof result.output).toBe('string');
  });

  test('should return status with version', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const result = await ADDRESS_JQ_HANDLER('status', {});

    expect(result.success).toBe(true);
    expect(result.service).toBe('jq');
    expect(result.implementation).toBe('native');
    expect(result.available).toBe(true);
    expect(result.version).toBeTruthy();
  });

  test('should handle context methods', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"test": true}';

    // Set context
    const setResult = await ADDRESS_JQ_HANDLER('setcontext', { data: testData });
    expect(setResult.success).toBe(true);
    expect(setResult.contextSet).toBe(true);

    // Get context
    const getResult = await ADDRESS_JQ_HANDLER('getcontext', {});
    expect(getResult.success).toBe(true);
    expect(getResult.hasContext).toBe(true);

    // Clear context
    const clearResult = await ADDRESS_JQ_HANDLER('clearcontext', {});
    expect(clearResult.success).toBe(true);

    // Verify cleared
    const getResult2 = await ADDRESS_JQ_HANDLER('getcontext', {});
    expect(getResult2.hasContext).toBe(false);
  });

  test('should handle query errors gracefully', async () => {
    try {
      await execAsync('which jq');
    } catch (e) {
      return;
    }

    const testData = '{"name": "test"}';
    const result = await ADDRESS_JQ_HANDLER('query', { data: testData, query: '..invalid' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('should throw error when jq not available', async () => {
    // This test would need to mock the jq check
    // Skipping for now as it requires more complex mocking
  });
});
