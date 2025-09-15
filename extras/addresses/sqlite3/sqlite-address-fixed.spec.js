/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Tests for sqlite-address.js ADDRESS target library
 * Each test is completely independent and self-contained
 */

const { Interpreter } = require('../../../core/src/interpreter');
const { parse } = require('../../../core/src/parser');

// Check if sqlite3 module is available
let sqlite3Available = false;
try {
  require('sqlite3');
  sqlite3Available = true;
} catch (e) {
  console.warn('sqlite3 module not available - some tests will be skipped');
}

describe('SQLite ADDRESS Library', () => {
  let interpreter;

  beforeEach(() => {
    // Clean up any existing global SQLite connection
    if (global._sqliteConnection) {
      global._sqliteConnection = null;
    }

    // Mock Address Sender for testing
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
  });

  afterEach(() => {
    // Clean up global SQLite connection after each test
    if (global._sqliteConnection) {
      try {
        global._sqliteConnection.close();
        global._sqliteConnection = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Library Loading and Registration', () => {
    test('should load sqlite-address library and register ADDRESS target', async () => {
      // Load the sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      // Verify ADDRESS target was registered
      expect(interpreter.addressTargets.has('sqlite3')).toBe(true);
      
      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      expect(sqlTarget).toBeDefined();
      expect(typeof sqlTarget.handler).toBe('function');
      expect(sqlTarget.methods).toBeDefined();
      expect(sqlTarget.metadata.libraryName).toBe('./sqlite-address.js');
      expect(sqlTarget.metadata.libraryMetadata.type).toBe('address-target');
      expect(sqlTarget.metadata.libraryMetadata.provides.addressTarget).toBe('sqlite3');
    });

    test('should expose proper metadata for sqlite-address', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      expect(sqlTarget).toBeDefined();
      expect(sqlTarget.handler).toBeDefined();
      expect(sqlTarget.metadata).toBeDefined();
      
      const metadata = sqlTarget.metadata.libraryMetadata;
      expect(metadata.name).toBe('SQLite Database Service');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.provides.commandSupport).toBe(true);
      expect(metadata.provides.methodSupport).toBe(true);
      expect(metadata.requirements.environment).toBe('nodejs');
      expect(metadata.requirements.modules).toContain('sqlite3');
    });
  });

  describe('ADDRESS Target Handler - Message Passing', () => {
    test('should handle method calls through ADDRESS mechanism', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      const script = `
        ADDRESS SQLITE3
        LET result = status()
      `;
      
      if (!sqlite3Available) {
        // Test should fail gracefully when sqlite3 not available
        await expect(interpreter.run(parse(script))).rejects.toThrow(/sqlite3 module/);
        return;
      }

      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.service).toBe('sqlite');
      expect(result.version).toBe('3.x');
      expect(result.methods).toContain('execute');
      expect(result.methods).toContain('query');
    });

    test('should handle command-string style ADDRESS calls via direct handler', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      if (!sqlite3Available) {
        // Test environment check
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        expect(() => {
          sqlTarget.handler('CREATE TABLE test (id INTEGER)', null);
        }).toThrow(/sqlite3 module/);
        return;
      }

      // Test via direct handler call
      const sqlTarget = interpreter.addressTargets.get('sqlite3');
      const result = await sqlTarget.handler('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      
      expect(result.operation).toBe('CREATE_TABLE');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Table created successfully');
    });

    test('should handle method parameters correctly', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      if (!sqlite3Available) {
        return; // Skip when sqlite3 not available
      }

      const script = `
        ADDRESS SQLITE3
        LET result = execute sql="CREATE TABLE products (id INTEGER, name TEXT)"
      `;

      await interpreter.run(parse(script));
      
      const result = interpreter.getVariable('result');
      expect(result).toBeDefined();
      expect(result.operation).toBe('CREATE_TABLE');
      expect(result.success).toBe(true);
    });

    test('should handle unknown methods gracefully', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      if (!sqlite3Available) {
        return;
      }

      const script = `
        ADDRESS SQLITE3
        LET result = unknown_method param="value"
      `;

      // Unknown methods should be treated as SQL commands
      await expect(interpreter.run(parse(script))).rejects.toThrow(/SQL execution failed/);
    });
  });

  if (sqlite3Available) {
    describe('SQLite Integration Tests', () => {
      test('should create table successfully', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        const script = `
          ADDRESS SQLITE3
          LET result = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
        `;

        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('result');
        expect(result.operation).toBe('CREATE_TABLE');
        expect(result.success).toBe(true);
        expect(result.sql).toContain('CREATE TABLE users');
      });

      test('should insert and query data', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        // Create table
        await interpreter.run(parse(`
          ADDRESS SQLITE3
          LET create_result = execute sql="CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
        `));

        // Insert data
        await interpreter.run(parse(`
          ADDRESS SQLITE3
          LET insert_result = execute sql="INSERT INTO users (name) VALUES ('John Doe')"
        `));

        // Query data
        await interpreter.run(parse(`
          ADDRESS SQLITE3  
          LET query_result = execute sql="SELECT * FROM users"
        `));

        const createResult = interpreter.getVariable('create_result');
        const insertResult = interpreter.getVariable('insert_result');
        const queryResult = interpreter.getVariable('query_result');

        expect(createResult.success).toBe(true);
        expect(insertResult.success).toBe(true);
        expect(insertResult.rowsAffected).toBe(1);
        expect(insertResult.lastInsertId).toBe(1);

        expect(queryResult.success).toBe(true);
        expect(queryResult.operation).toBe('SELECT');
        expect(queryResult.rows).toHaveLength(1);
        expect(queryResult.rows[0].name).toBe('John Doe');
        expect(queryResult.count).toBe(1);
      });

      test('should provide database status information', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        const script = `
          ADDRESS SQLITE3
          LET status = status()
        `;

        await interpreter.run(parse(script));
        
        const status = interpreter.getVariable('status');
        expect(status.service).toBe('sqlite');
        expect(status.version).toBe('3.x');
        expect(status.database).toBe(':memory:');
        expect(Array.isArray(status.methods)).toBe(true);
        expect(status.methods).toContain('execute');
        expect(status.methods).toContain('query');
        expect(status.methods).toContain('close');
        expect(status.timestamp).toBeDefined();
      });
    });

    describe('Classic Rexx ADDRESS Syntax', () => {
      test('should support classic quoted string commands', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        // Test classic Rexx ADDRESS syntax: ADDRESS SQLITE3 + "SQL command"
        const script = `
          ADDRESS SQLITE3
          "CREATE TABLE classic_test (id INTEGER PRIMARY KEY, value TEXT)"
        `;
        
        await interpreter.run(parse(script));
        
        // Check RC and RESULT variables were set
        expect(interpreter.getVariable('RC')).toBe(0);
        const result = interpreter.getVariable('RESULT');
        expect(result).toBeDefined();
        expect(result.operation).toBe('CREATE_TABLE');
        expect(result.success).toBe(true);
        
        // Test INSERT with classic syntax
        const insertScript = `"INSERT INTO classic_test (value) VALUES ('test data')"`;
        await interpreter.run(parse(insertScript));
        
        expect(interpreter.getVariable('RC')).toBe(0);
        const insertResult = interpreter.getVariable('RESULT');
        expect(insertResult.operation).toBe('INSERT');
        expect(insertResult.success).toBe(true);
        expect(insertResult.lastInsertId).toBe(1);
        expect(insertResult.rowsAffected).toBe(1);
      });

      test('should support both classic and modern styles together', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        // Classic style: quoted string command
        const classicScript = `
          ADDRESS SQLITE3
          "CREATE TABLE mixed_test (id INTEGER, name TEXT)"
        `;
        await interpreter.run(parse(classicScript));
        
        // Modern style: method call
        const modernScript = `
          LET insert_result = execute sql="INSERT INTO mixed_test (name) VALUES ('Test User')"
        `;
        await interpreter.run(parse(modernScript));
        
        // Verify both worked
        expect(interpreter.getVariable('RC')).toBe(0); // From classic style
        const classicResult = interpreter.getVariable('RESULT');
        expect(classicResult.operation).toBe('CREATE_TABLE');
        
        const modernResult = interpreter.getVariable('insert_result');
        expect(modernResult.operation).toBe('INSERT');
        expect(modernResult.lastInsertId).toBe(1);
      });
    });
  } else {
    describe('Environment Compatibility Tests', () => {
      test('should provide helpful error when sqlite3 not available', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        // Verify ADDRESS target was registered but sqlite3 not available
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        expect(sqlTarget).toBeDefined();
        expect(sqlTarget.metadata.libraryMetadata.sqlite3Available).toBe(false);
        
        // Test direct handler call (should throw sqlite3 error)
        expect(() => {
          sqlTarget.handler('status', null);
        }).toThrow(/sqlite3 module/);
        
        // Test via ADDRESS script (should also throw)
        const script = `
          ADDRESS SQLITE3
          LET result = status()
        `;

        await expect(interpreter.run(parse(script))).rejects.toThrow(/sqlite3 module/);
      });

      test('should detect Node.js environment requirement', async () => {
        // Load sqlite-address library
        await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
        
        const sqlTarget = interpreter.addressTargets.get('sqlite3');
        const metadata = sqlTarget.metadata.libraryMetadata;
        
        expect(metadata.requirements.environment).toBe('nodejs');
        expect(metadata.requirements.modules).toContain('sqlite3');
      });
    });
  }

  describe('ADDRESS Context Integration', () => {
    test('should share ADDRESS context with INTERPRET', async () => {
      // Load sqlite-address library
      await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
      
      if (!sqlite3Available) {
        return;
      }

      // Set up ADDRESS in main interpreter
      const addressCommands = parse('ADDRESS SQLITE3');
      await interpreter.run(addressCommands);
      
      expect(interpreter.address).toBe('sqlite3');
      
      // INTERPRET should inherit the address and execute SQL
      const rexxCode = 'execute sql="CREATE TABLE interpret_test (id INTEGER)"';
      const commands = parse(`INTERPRET "${rexxCode}"`);
      commands.push(...parse(`LET result = 1`)); // Set result to indicate success
      await interpreter.run(commands);
      
      // Should have executed SQL through ADDRESS target, not RPC
      expect(interpreter.addressSender.send).not.toHaveBeenCalled();
      expect(interpreter.variables.get('result')).toBe(1);
    });
  });
});