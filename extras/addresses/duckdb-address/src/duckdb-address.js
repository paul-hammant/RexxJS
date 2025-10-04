/*!
 * rexxjs/duckdb-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=DUCKDB_ADDRESS_META
 */
/**
 * DuckDB ADDRESS Library - Provides analytical database via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 * Uses system-installed duckdb binary for maximum performance
 *
 * Usage:
 *   REQUIRE "duckdb-address"
 *   ADDRESS DUCKDB
 *   LET sql = "SELECT 42 AS answer;"
 *   ADDRESS DUCKDB "query"
 *   SAY RESULT
 *
 * Note: Requires `duckdb` to be installed on the system
 * For portable pure-JS version, use duckdb-wasm-address instead
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Check if duckdb binary is available
let duckdbAvailable = null;
let dbPath = ':memory:'; // Default to in-memory

async function checkDuckDBAvailable() {
  if (duckdbAvailable !== null) return duckdbAvailable;

  try {
    await execAsync('which duckdb');
    duckdbAvailable = true;
  } catch (e) {
    duckdbAvailable = false;
  }
  return duckdbAvailable;
}

// DuckDB ADDRESS metadata function
function DUCKDB_ADDRESS_META() {
  return {
    canonical: "org.rexxjs/duckdb-address",
    type: 'address-handler',
    name: 'DuckDB Service (Native)',
    version: '1.0.0',
    description: 'In-process analytical database via system duckdb binary (fast, requires duckdb installed)',
    provides: {
      addressTarget: 'duckdb',
      handlerFunction: 'ADDRESS_DUCKDB_HANDLER',
      commandSupport: true,
      methodSupport: true
    },
    dependencies: {},
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      systemBinaries: ['duckdb']
    }
  };
}

// ADDRESS target handler function
async function ADDRESS_DUCKDB_HANDLER(commandOrMethod, params) {
  // Check if duckdb is available
  const available = await checkDuckDBAvailable();
  if (!available) {
    throw new Error('duckdb binary not found. Please install duckdb (https://duckdb.org/docs/installation/)');
  }

  try {
    const method = commandOrMethod.toLowerCase();
    let resultPromise;

    switch (method) {
      case 'query':
      case 'execute':
        if (params && params.sql) {
          resultPromise = executeQuery(params.sql);
        } else {
          throw new Error('SQL query required. Use: LET sql = "SELECT...", then ADDRESS DUCKDB "query"');
        }
        break;

      case 'setdb':
      case 'set_db':
        dbPath = params.path || params.db || ':memory:';
        resultPromise = Promise.resolve({
          operation: 'SET_DB',
          success: true,
          message: `Database path set to: ${dbPath}`,
          path: dbPath
        });
        break;

      case 'getdb':
      case 'get_db':
        resultPromise = Promise.resolve({
          operation: 'GET_DB',
          success: true,
          path: dbPath
        });
        break;

      case 'status':
        const version = await getDuckDBVersion();
        resultPromise = Promise.resolve({
          service: 'duckdb',
          version: version,
          available: true,
          implementation: 'native',
          dbPath: dbPath,
          methods: ['query', 'execute', 'setdb', 'getdb', 'status'],
          success: true
        });
        break;

      default:
        // Treat as SQL command
        if (typeof commandOrMethod === 'string' && commandOrMethod.trim()) {
          resultPromise = executeQuery(commandOrMethod);
        } else {
          throw new Error('Invalid command. Use ADDRESS DUCKDB "query" with LET sql = "SELECT..."');
        }
        break;
    }

    return resultPromise.then(result => formatResultForREXX(result));
  } catch (error) {
    throw error;
  }
}

// Execute SQL query via duckdb CLI
async function executeQuery(sql) {
  try {
    const sqlStr = String(sql).trim();

    if (!sqlStr) {
      throw new Error('Empty SQL query');
    }

    // Escape single quotes in SQL
    const escapedSQL = sqlStr.replace(/'/g, "'\\''");

    // Execute query with JSON output
    const cmd = `duckdb ${dbPath} -json -c "${escapedSQL}"`;

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

    if (stderr && stderr.trim() && !stderr.includes('warning')) {
      throw new Error(stderr.trim());
    }

    // Parse JSON result
    let result;
    const output = stdout.trim();

    if (!output) {
      result = [];
    } else {
      try {
        // DuckDB outputs one JSON object per line for result rows
        const lines = output.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          result = [];
        } else if (lines.length === 1) {
          result = [JSON.parse(lines[0])];
        } else {
          result = lines.map(line => JSON.parse(line));
        }
      } catch (e) {
        // If not JSON, return as text
        result = output;
      }
    }

    return {
      operation: 'QUERY',
      success: true,
      sql: sqlStr,
      result: result,
      rowCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      message: 'Query executed successfully',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      operation: 'QUERY',
      success: false,
      sql: sql,
      error: error.message,
      message: `Query failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Get DuckDB version
async function getDuckDBVersion() {
  try {
    const { stdout } = await execAsync('duckdb --version');
    return stdout.trim().split(' ')[0]; // Extract version number
  } catch (e) {
    return 'unknown';
  }
}

// Format result for REXX variables
function formatResultForREXX(result) {
  return {
    ...result,
    // Standard REXX ADDRESS variables
    output: result.result !== undefined ? result.result : result,
    errorCode: result.success === false ? 1 : 0,
    errorMessage: result.error || result.message
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DUCKDB_ADDRESS_META,
    ADDRESS_DUCKDB_HANDLER
  };
}

// Make functions globally available
if (typeof global !== 'undefined') {
  global.DUCKDB_ADDRESS_META = DUCKDB_ADDRESS_META;
  global.ADDRESS_DUCKDB_HANDLER = ADDRESS_DUCKDB_HANDLER;
} else if (typeof window !== 'undefined') {
  window.DUCKDB_ADDRESS_META = DUCKDB_ADDRESS_META;
  window.ADDRESS_DUCKDB_HANDLER = ADDRESS_DUCKDB_HANDLER;
}
