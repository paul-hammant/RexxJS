/*!
 * rexxjs/sqlite-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=SQLITE_ADDRESS_META
 */
/**
 * SQLite ADDRESS Library - Provides SQL database operations via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "sqlite-address" AS SQL
 *   ADDRESS SQL
 *   "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
 *   "INSERT INTO users (name) VALUES ('John')"
 *   "SELECT * FROM users"
 *
 * Note: Only works in Node.js environment (command-line mode)
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Try to import RexxJS interpolation config for variable interpolation
let interpolationConfig = null;
try {
  interpolationConfig = require('../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will work without interpolation
}

/**
 * Interpolate variables using RexxJS global interpolation pattern
 */
function interpolateVariables(str, variablePool) {
  if (!interpolationConfig || !variablePool) {
    return str;
  }

  const pattern = interpolationConfig.getCurrentPattern();
  if (!pattern.hasDelims(str)) {
    return str;
  }

  return str.replace(pattern.regex, (match) => {
    const varName = pattern.extractVar(match);
    if (varName in variablePool) {
      return variablePool[varName];
    }
    return match; // Variable not found - leave as-is
  });
}

// SQLite ADDRESS metadata function
function SQLITE_ADDRESS_META() {
  // Check sqlite3 availability without throwing during registration
  let sqlite3Available = false;
  try {
    require('sqlite3');
    sqlite3Available = true;
  } catch (e) {
    // Will be available as metadata for error handling
  }
  
  return {
    canonical: "org.rexxjs/sqlite3-address",
    type: 'address-handler',
    name: 'SQLite Database Service',
    version: '1.0.0',
    description: 'SQLite database operations via ADDRESS interface',
    provides: {
      addressTarget: 'sqlite3',
      handlerFunction: 'ADDRESS_SQLITE3_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: {
      "sqlite3": "^5.1.0"
    },
    nodeonly: true,
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['sqlite3']
    },
    sqlite3Available: sqlite3Available
  };
}

// ADDRESS target handler function with REXX variable management
function ADDRESS_SQLITE3_HANDLER(commandOrMethod, params) {
  // Check if we're in Node.js environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    throw new Error('SQLite ADDRESS library only available in Node.js environment');
  }

  try {
    const sqlite3 = require('sqlite3');
    
    // Initialize database connection if not exists
    if (!global._sqliteConnection) {
      // Use in-memory database for testing, could be configurable
      global._sqliteConnection = new sqlite3.Database(':memory:');
    }
    
    const db = global._sqliteConnection;

    // Apply RexxJS variable interpolation if command is a string
    const variablePool = params || {};
    const interpolatedCommand = typeof commandOrMethod === 'string'
      ? interpolateVariables(commandOrMethod, variablePool)
      : commandOrMethod;

    // Handle ADDRESS MATCHING pattern with multi-line input
    if (typeof interpolatedCommand === 'string' && params && params._addressMatchingPattern) {
      return handleMatchingPatternSQL(db, interpolatedCommand, params._addressMatchingPattern)
        .then(result => formatSQLResultForREXX(result))
        .catch(error => {
          const e = new Error(`${error.message} | SQL: ${interpolatedCommand.trim()}`);
          throw e;
        });
    }

    // Handle command-string style (traditional Rexx ADDRESS)
    if (typeof interpolatedCommand === 'string' && (!params || !params._addressMatchingPattern)) {
      // Handle special status command as string
      if (interpolatedCommand.toLowerCase().trim() === 'status') {
        const statusResult = {
          service: 'sqlite',
          version: '3.x',
          database: db.filename || ':memory:',
          methods: ['execute', 'run', 'query', 'close', 'status'],
          timestamp: new Date().toISOString(),
          success: true
        };
        return Promise.resolve(formatSQLResultForREXX(statusResult));
      }

      return handleSQLCommand(db, interpolatedCommand)
        .then(result => formatSQLResultForREXX(result))
        .catch(error => {
          const e = new Error(`${error.message} | SQL: ${interpolatedCommand.trim()}`);
          throw e; // include SQL text for debugging
        });
    }
    
    // Handle ADDRESS MATCHING multiline input
    if (typeof interpolatedCommand === 'string' && params && params._addressMatchingPattern) {
      // console.log('DEBUG: MATCHING pattern received:');
      // console.log('  interpolatedCommand:', JSON.stringify(interpolatedCommand));
      // console.log('  pattern:', params._addressMatchingPattern);
      // console.log('  contains newlines:', interpolatedCommand.includes('\n'));

      return handleMatchingPatternSQL(db, interpolatedCommand, params._addressMatchingPattern)
        .then(result => formatSQLResultForREXX(result))
        .catch(error => {
          const e = new Error(`${error.message} | SQL: ${interpolatedCommand.trim()}`);
          throw e;
        });
    }

    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (interpolatedCommand.toLowerCase()) {
      case 'execute':
      case 'run':
        const sql = interpolateVariables(params.sql || params.command || '', variablePool);
        resultPromise = handleSQLCommand(db, sql);
        break;

      case 'query':
        const querySql = interpolateVariables(params.sql || '', variablePool);
        resultPromise = handleSQLQuery(db, querySql, params.params);
        break;
        
      case 'close':
        resultPromise = handleClose(db);
        break;
        
      case 'status':
        const statusResult = {
          service: 'sqlite',
          version: '3.x',
          database: db.filename || ':memory:',
          methods: ['execute', 'run', 'query', 'close', 'status'],
          timestamp: new Date().toISOString(),
          success: true
        };
        // Debug: console.log('SQLite STATUS result:', JSON.stringify(statusResult, null, 2));
        resultPromise = Promise.resolve(statusResult);
        break;
        
      default:
        // Try to interpret as a direct SQL command
        resultPromise = handleSQLCommand(db, commandOrMethod);
        break;
    }
    
    // Enhance result with proper REXX variable fields and SQLCODE
    return resultPromise.then(result => {
      return formatSQLResultForREXX(result);
    }).catch(error => {
      // Include SQL when possible
      const sqlText = (typeof params === 'object' && (params.sql || params.command)) || String(commandOrMethod || '').trim();
      const e = new Error(`${error.message}${sqlText ? ` | SQL: ${sqlText}` : ''}`);
      throw e;
    });
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('SQLite ADDRESS library requires sqlite3 module: npm install sqlite3');
    }
    throw error;
  }
}

// Handle ADDRESS MATCHING multiline input (should receive complete SQL with newlines)
function handleMatchingPatternSQL(db, multilineSQL, matchingPattern) {
  return new Promise((resolve, reject) => {
    // console.log('DEBUG: Processing multiline SQL:', JSON.stringify(multilineSQL));
    
    // Clean up the SQL (remove extra whitespace, but preserve structure)
    const cleanSQL = multilineSQL.trim();
    
    if (!cleanSQL) {
      resolve({
        operation: 'EMPTY',
        success: true,
        message: 'Empty SQL from matching pattern',
        pattern: matchingPattern,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Execute the multiline SQL - use same logic as handleSQLCommand
    const upperSQL = cleanSQL.toUpperCase();
    
    if (upperSQL.startsWith('SELECT')) {
      // Use db.all for SELECT statements to get rows
      db.all(cleanSQL, (err, rows) => {
        if (err) {
          reject(new Error(`SELECT failed: ${err.message}`));
        } else {
          resolve({
            operation: 'SELECT',
            sql: cleanSQL,
            rows: rows,
            count: rows.length,
            success: true,
            pattern: matchingPattern,
            source: 'matching_pattern',
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      // Use db.run for non-SELECT statements
      db.run(cleanSQL, function(err) {
        if (err) {
          reject(new Error(`SQL execution failed: ${err.message}`));
        } else {
          const result = {
            operation: detectSQLOperation(cleanSQL),
            success: true,
            sql: cleanSQL,
            pattern: matchingPattern,
            source: 'matching_pattern',
            rowsAffected: this.changes || 0,
            lastInsertId: this.lastID || null,
            timestamp: new Date().toISOString()
          };
          resolve(result);
        }
      });
    }
  });
}

// Helper function to detect SQL operation type
function detectSQLOperation(sql) {
  const upperSQL = sql.toUpperCase().trim();
  if (upperSQL.startsWith('CREATE TABLE')) return 'CREATE_TABLE';
  if (upperSQL.startsWith('INSERT')) return 'INSERT';
  if (upperSQL.startsWith('SELECT')) return 'SELECT';
  if (upperSQL.startsWith('UPDATE')) return 'UPDATE';
  if (upperSQL.startsWith('DELETE')) return 'DELETE';
  if (upperSQL.startsWith('DROP')) return 'DROP_TABLE';
  return 'EXECUTE';
}

// Handle direct SQL command strings
function handleSQLCommand(db, sqlCommand) {
  return new Promise((resolve, reject) => {
    const sql = sqlCommand.trim();
    
    // Handle empty commands or semicolon-only
    if (!sql || sql === ';') {
      resolve({
        operation: 'NOOP',
        success: true,
        message: 'Empty or minimal SQL command - no operation performed',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Detect command type
    const upperSQL = sql.toUpperCase();
    
    if (upperSQL.startsWith('CREATE TABLE')) {
      db.run(sql, function(err) {
        if (err) {
          reject(new Error(`CREATE TABLE failed: ${err.message}`));
        } else {
          resolve({
            operation: 'CREATE_TABLE',
            sql: sql,
            success: true,
            message: 'Table created successfully',
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    else if (upperSQL.startsWith('INSERT')) {
      db.run(sql, function(err) {
        if (err) {
          reject(new Error(`INSERT failed: ${err.message}`));
        } else {
          const result = {
            operation: 'INSERT',
            sql: sql,
            rowsAffected: this.changes,
            lastInsertId: this.lastID,
            success: true,
            timestamp: new Date().toISOString()
          };
          // Debug: console.log('SQLite INSERT result:', JSON.stringify(result, null, 2));
          resolve(result);
        }
      });
    }
    else if (upperSQL.startsWith('SELECT')) {
      db.all(sql, (err, rows) => {
        if (err) {
          reject(new Error(`SELECT failed: ${err.message}`));
        } else {
          resolve({
            operation: 'SELECT',
            sql: sql,
            rows: rows,
            count: rows.length,
            success: true,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    else {
      // Generic SQL execution
      db.run(sql, function(err) {
        if (err) {
          reject(new Error(`SQL execution failed: ${err.message}`));
        } else {
          resolve({
            operation: 'EXECUTE',
            sql: sql,
            rowsAffected: this.changes || 0,
            success: true,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  });
}

// Handle parameterized queries
function handleSQLQuery(db, sql, parameters = []) {
  return new Promise((resolve, reject) => {
    if (sql.toUpperCase().trim().startsWith('SELECT')) {
      db.all(sql, parameters, (err, rows) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message}`));
        } else {
          resolve({
            operation: 'QUERY',
            sql: sql,
            parameters: parameters,
            rows: rows,
            count: rows.length,
            success: true,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      db.run(sql, parameters, function(err) {
        if (err) {
          reject(new Error(`Query execution failed: ${err.message}`));
        } else {
          resolve({
            operation: 'EXECUTE',
            sql: sql,
            parameters: parameters,
            rowsAffected: this.changes,
            lastInsertId: this.lastID || null,
            success: true,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  });
}

// Handle database close
function handleClose(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(new Error(`Database close failed: ${err.message}`));
      } else {
        global._sqliteConnection = null;
        resolve({
          operation: 'CLOSE',
          success: true,
          message: 'Database connection closed',
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

// ADDRESS target methods metadata
const ADDRESS_SQLITE3_METHODS = ["execute", "run", "query", "close", "status"];

// Format SQL result for proper REXX variable handling
function formatSQLResultForREXX(result) {
  // Set up result object with standard REXX fields
  // Set 'output' field to the full result so interpreter puts it in RESULT variable
  const rexxResult = {
    ...result, // Preserve original result structure (including operation, success, etc.)
    errorCode: 0,
    output: result, // This ensures RESULT variable gets the full result object
    // Request interpreter to set domain-specific variables
    rexxVariables: {
      SQLCODE: 0  // SQL-specific success code
    }
  };
  
  // Debug: console.log('formatSQLResultForREXX input:', JSON.stringify(result, null, 2));
  // Debug: console.log('formatSQLResultForREXX output:', JSON.stringify(rexxResult, null, 2));
  
  return rexxResult;
}

// Format SQL error for proper REXX variable handling
function formatSQLErrorForREXX(error) {
  const rexxResult = {
    operation: 'ERROR',
    success: false,
    errorCode: 1,
    errorMessage: error.message,
    output: error.message,
    timestamp: new Date().toISOString(),
    // Request interpreter to set domain-specific variables
    rexxVariables: {
      SQLCODE: -1  // SQL-specific error code
    }
  };
  
  return rexxResult;
}

// Export to global scope (required for REQUIRE system detection)
if (typeof window !== 'undefined') {
  // Browser environment (though this won't work due to sqlite3 dependency)
  window.SQLITE_ADDRESS_META = SQLITE_ADDRESS_META;
  window.SQLITE3_ADDRESS_BUNDLE_META = SQLITE_ADDRESS_META; // Bundle detection function
  window.ADDRESS_SQLITE3_HANDLER = ADDRESS_SQLITE3_HANDLER;
  window.ADDRESS_SQLITE3_METHODS = ADDRESS_SQLITE3_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.SQLITE_ADDRESS_META = SQLITE_ADDRESS_META;
  global.SQLITE3_ADDRESS_BUNDLE_META = SQLITE_ADDRESS_META; // Bundle detection function
  global.ADDRESS_SQLITE3_HANDLER = ADDRESS_SQLITE3_HANDLER;
  global.ADDRESS_SQLITE3_METHODS = ADDRESS_SQLITE3_METHODS;
}
