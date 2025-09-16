/*!
 * rexxjs/sqlite-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta {"namespace":"rexxjs","dependencies":{"sqlite3":"^5.1.0"},"envVars":[]}
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

// Primary detection function with ADDRESS target metadata
function SQLITE_ADDRESS_MAIN() {
  // Check sqlite3 availability without throwing during registration
  let sqlite3Available = false;
  try {
    require('sqlite3');
    sqlite3Available = true;
  } catch (e) {
    // Will be available as metadata for error handling
  }
  
  return {
    type: 'address-target',
    name: 'SQLite Database Service',
    version: '1.0.0',
    description: 'SQLite database operations via ADDRESS interface',
    provides: {
      addressTarget: 'sqlite3',
      handlerFunction: 'ADDRESS_SQLITE3_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: [],
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
    
    // Handle command-string style (traditional Rexx ADDRESS)
    if (typeof commandOrMethod === 'string' && !params) {
      return handleSQLCommand(db, commandOrMethod)
        .then(result => formatSQLResultForREXX(result))
        .catch(error => {
          const formattedError = formatSQLErrorForREXX(error);
          throw new Error(error.message); // Preserve original error throwing behavior
        });
    }
    
    // Handle method-call style (modern convenience)
    let resultPromise;
    switch (commandOrMethod.toLowerCase()) {
      case 'execute':
      case 'run':
        resultPromise = handleSQLCommand(db, params.sql || params.command);
        break;
        
      case 'query':
        resultPromise = handleSQLQuery(db, params.sql, params.params);
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
      // For certain errors (like SQL syntax errors), we should still throw
      const formattedError = formatSQLErrorForREXX(error);
      throw new Error(error.message); // Preserve original error throwing behavior
    });
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('SQLite ADDRESS library requires sqlite3 module: npm install sqlite3');
    }
    throw error;
  }
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
const ADDRESS_SQLITE3_METHODS = {
  execute: {
    description: "Execute a SQL statement",
    params: ["sql"],
    returns: "object with execution details"
  },
  run: {
    description: "Run a SQL statement (alias for execute)",
    params: ["sql"],
    returns: "object with execution details"
  },
  query: {
    description: "Execute a parameterized SQL query",
    params: ["sql", "params"],
    returns: "object with query results"
  },
  close: {
    description: "Close the database connection",
    params: [],
    returns: "object with close status"
  },
  status: {
    description: "Get database service status",
    params: [],
    returns: "object with service information"
  }
};

// Format SQL result for proper REXX variable handling
function formatSQLResultForREXX(result) {
  // Set up result object with standard REXX fields
  // Don't set 'output' field so interpreter uses full result for RESULT variable
  const rexxResult = {
    ...result, // Preserve original result structure (including operation, success, etc.)
    errorCode: 0,
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
  window.SQLITE_ADDRESS_MAIN = SQLITE_ADDRESS_MAIN;
  window.ADDRESS_SQLITE3_HANDLER = ADDRESS_SQLITE3_HANDLER;
  window.ADDRESS_SQLITE3_METHODS = ADDRESS_SQLITE3_METHODS;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.SQLITE_ADDRESS_MAIN = SQLITE_ADDRESS_MAIN;
  global.ADDRESS_SQLITE3_HANDLER = ADDRESS_SQLITE3_HANDLER;
  global.ADDRESS_SQLITE3_METHODS = ADDRESS_SQLITE3_METHODS;
}