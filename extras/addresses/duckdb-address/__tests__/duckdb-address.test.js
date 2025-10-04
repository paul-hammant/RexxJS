/* Copyright (c) 2025 RexxJS Project ... Licensed under the MIT License */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

describe('DuckDB ADDRESS Library (Native)', () => {
  let DUCKDB_ADDRESS_META, ADDRESS_DUCKDB_HANDLER;

  beforeAll(async () => {
    // Check if duckdb is available
    try {
      await execAsync('which duckdb');
    } catch (e) {
      console.warn('duckdb binary not found - skipping tests. Install from https://duckdb.org/docs/installation/');
      return;
    }

    // Load the library
    const lib = require('../src/duckdb-address.js');
    DUCKDB_ADDRESS_META = lib.DUCKDB_ADDRESS_META;
    ADDRESS_DUCKDB_HANDLER = lib.ADDRESS_DUCKDB_HANDLER;
  });

  test('should have correct metadata', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return; // Skip if duckdb not available
    }

    const metadata = DUCKDB_ADDRESS_META();

    expect(metadata.canonical).toBe('org.rexxjs/duckdb-address');
    expect(metadata.type).toBe('address-handler');
    expect(metadata.provides.addressTarget).toBe('duckdb');
    expect(metadata.provides.handlerFunction).toBe('ADDRESS_DUCKDB_HANDLER');
    expect(metadata.requirements.systemBinaries).toContain('duckdb');
  });

  test('should execute simple SELECT query', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    const result = await ADDRESS_DUCKDB_HANDLER('query', { sql: 'SELECT 42 AS answer;' });

    expect(result.success).toBe(true);
    expect(result.output).toEqual([{ answer: 42 }]);
    expect(result.rowCount).toBe(1);
    expect(result.errorCode).toBe(0);
  });

  test('should handle multiple rows', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    const sql = `SELECT * FROM (VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')) AS t(id, name);`;
    const result = await ADDRESS_DUCKDB_HANDLER('query', { sql });

    expect(result.success).toBe(true);
    expect(result.output.length).toBe(3);
    expect(result.output[0]).toEqual({ id: 1, name: 'Alice' });
    expect(result.output[2]).toEqual({ id: 3, name: 'Charlie' });
  });

  test('should handle analytical queries', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    const sql = `SELECT SUM(value) as total FROM (VALUES (10), (20), (30)) AS t(value);`;
    const result = await ADDRESS_DUCKDB_HANDLER('query', { sql });

    expect(result.success).toBe(true);
    expect(result.output[0].total).toBe(60);
  });

  test('should return status with version', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    const result = await ADDRESS_DUCKDB_HANDLER('status', {});

    expect(result.success).toBe(true);
    expect(result.service).toBe('duckdb');
    expect(result.implementation).toBe('native');
    expect(result.available).toBe(true);
    expect(result.version).toBeTruthy();
  });

  test('should handle query errors gracefully', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    const result = await ADDRESS_DUCKDB_HANDLER('query', { sql: 'SELECT * FROM nonexistent_table;' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('should handle db path methods', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    // Set db path
    const setResult = await ADDRESS_DUCKDB_HANDLER('setdb', { path: ':memory:' });
    expect(setResult.success).toBe(true);
    expect(setResult.path).toBe(':memory:');

    // Get db path
    const getResult = await ADDRESS_DUCKDB_HANDLER('getdb', {});
    expect(getResult.success).toBe(true);
    expect(getResult.path).toBe(':memory:');
  });

  test('should handle CREATE TABLE and INSERT', async () => {
    try {
      await execAsync('which duckdb');
    } catch (e) {
      return;
    }

    // Create table
    const createResult = await ADDRESS_DUCKDB_HANDLER('query', {
      sql: 'CREATE TABLE test_users (id INTEGER, name VARCHAR);'
    });
    expect(createResult.success).toBe(true);

    // Insert data
    const insertResult = await ADDRESS_DUCKDB_HANDLER('query', {
      sql: "INSERT INTO test_users VALUES (1, 'Alice'), (2, 'Bob');"
    });
    expect(insertResult.success).toBe(true);

    // Query data
    const selectResult = await ADDRESS_DUCKDB_HANDLER('query', {
      sql: 'SELECT * FROM test_users ORDER BY id;'
    });
    expect(selectResult.success).toBe(true);
    expect(selectResult.output.length).toBe(2);
    expect(selectResult.output[0]).toEqual({ id: 1, name: 'Alice' });
  });
});
