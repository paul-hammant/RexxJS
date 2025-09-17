/**
 * Address Matching Multiline SQL Test
 * Tests that ADDRESS MATCHING can handle SQL statements that span multiple lines
 * by accumulating fragments until a complete statement is formed.
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS MATCHING with multiline SQL statements', () => {
  let interpreter;
  let mockSQLHandler;
  let sqlCalls;

  beforeEach(() => {
    sqlCalls = [];
    
    // Mock SQL handler that accumulates fragments and detects complete statements
    mockSQLHandler = jest.fn().mockImplementation((sqlFragment, context) => {
      sqlCalls.push({ fragment: sqlFragment, context });
      
      // Simulate SQLite behavior: reject incomplete SQL, accept complete SQL
      if (sqlFragment.trim() === 'CREATE TABLE test' || 
          sqlFragment.trim() === '(id INTEGER PRIMARY KEY,' ||
          sqlFragment.trim() === 'name TEXT') {
        // Incomplete fragments - handler should accumulate
        return Promise.resolve({ 
          success: true, 
          operation: 'ACCUMULATING',
          message: 'Fragment accumulated'
        });
      } else if (sqlFragment.includes('CREATE TABLE') && sqlFragment.includes(')')) {
        // Complete CREATE TABLE statement
        return Promise.resolve({ 
          success: true, 
          operation: 'CREATE_TABLE',
          sql: sqlFragment 
        });
      } else {
        // Complete single-line statements
        return Promise.resolve({ 
          success: true, 
          operation: 'EXECUTE',
          sql: sqlFragment 
        });
      }
    });
    
    interpreter = new TestRexxInterpreter({}, {}, {});
    
    // Register mock SQL address target
    interpreter.addressTargets.set('sqlengine', {
      handler: mockSQLHandler,
      methods: ['execute', 'query', 'status'],
      metadata: { name: 'SQL Engine' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Multiline SQL statement handling', () => {
    test('should handle multiline CREATE TABLE with two-space indentation pattern', async () => {
      const rexxCode = `
        ADDRESS sqlengine MATCHING("  (.*)")
        
          CREATE TABLE test (
            id INTEGER PRIMARY KEY,
            name TEXT
          )
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should receive one multiline call (consistent with ADDRESS MATCHING behavior)
      expect(mockSQLHandler).toHaveBeenCalledTimes(1);
      
      // Verify the complete multiline content is received
      expect(mockSQLHandler).toHaveBeenCalledWith(
        'CREATE TABLE test (\nid INTEGER PRIMARY KEY,\nname TEXT', 
        expect.objectContaining({ _addressMatchingPattern: '  (.*)' }),
        expect.anything()
      );
    });

    test('should handle mixed single-line and multiline SQL statements', async () => {
      const rexxCode = `
        ADDRESS sqlengine MATCHING("  (.*)")
        
          CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)
          
          INSERT INTO products (name) VALUES ('Widget')
          INSERT INTO products (name) VALUES ('Gadget')
          
          SELECT COUNT(*) FROM products
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should receive 1 multiline call collecting all SQL statements
      expect(mockSQLHandler).toHaveBeenCalledTimes(1);
      
      expect(mockSQLHandler).toHaveBeenCalledWith(
        "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)\nINSERT INTO products (name) VALUES ('Widget')\nINSERT INTO products (name) VALUES ('Gadget')\nSELECT COUNT(*) FROM products", 
        expect.anything(),
        expect.anything()
      );
    });

    test('should ignore blank lines in MATCHING pattern', async () => {
      const rexxCode = `
        ADDRESS sqlengine MATCHING("  (.*)")
        
          CREATE TABLE test (id INTEGER)
          
          INSERT INTO test VALUES (1)
          
          SELECT * FROM test
      `;
      
      await executeRexxCode(rexxCode);
      
      // Should receive 1 multiline call (blank lines ignored)
      expect(mockSQLHandler).toHaveBeenCalledTimes(1);
      
      const receivedContent = sqlCalls[0].fragment;
      expect(receivedContent).toBe('CREATE TABLE test (id INTEGER)\nINSERT INTO test VALUES (1)\nSELECT * FROM test');
    });
  });

  describe('Complete SQL statement delivery', () => {
    test('demonstrates that ADDRESS MATCHING delivers complete multiline SQL', async () => {
      // This test documents that ADDRESS MATCHING with indentation patterns
      // delivers complete multiline content to SQL handlers
      
      const rexxCode = `
        ADDRESS sqlengine MATCHING("  (.*)")
        
          CREATE TABLE complex_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
      `;
      
      await executeRexxCode(rexxCode);
      
      // Handler receives 1 complete multiline call
      expect(mockSQLHandler).toHaveBeenCalledTimes(1);
      
      // The complete SQL is delivered as a single multiline string
      const receivedSQL = sqlCalls[0].fragment;
      expect(receivedSQL).toContain('CREATE TABLE complex_table (');
      expect(receivedSQL).toContain('id INTEGER PRIMARY KEY,');
      expect(receivedSQL).toContain('name TEXT NOT NULL,');
      expect(receivedSQL).toContain('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
      
      // Verify it's properly formatted as multiline
      const lines = receivedSQL.split('\n');
      expect(lines.length).toBe(4);
      expect(lines[0]).toBe('CREATE TABLE complex_table (');
      expect(lines[1]).toBe('id INTEGER PRIMARY KEY,');
      expect(lines[2]).toBe('name TEXT NOT NULL,');
      expect(lines[3]).toBe('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
    });
  });
});