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
      
      // Should receive each line as a separate call  
      expect(mockSQLHandler).toHaveBeenCalledTimes(3);
      
      // Verify each fragment is received individually
      expect(mockSQLHandler).toHaveBeenNthCalledWith(1,
        'CREATE TABLE test (', 
        expect.objectContaining({ _addressMatchingPattern: '  (.*)' }),
        expect.anything()
      );
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(2,
        'id INTEGER PRIMARY KEY,', 
        expect.objectContaining({ _addressMatchingPattern: '  (.*)' }),
        expect.anything()
      );
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(3,
        'name TEXT', 
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
      
      // Should receive 4 separate calls (ignoring blank lines)
      expect(mockSQLHandler).toHaveBeenCalledTimes(4);
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(1,
        'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)', 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(2,
        "INSERT INTO products (name) VALUES ('Widget')", 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(3,
        "INSERT INTO products (name) VALUES ('Gadget')", 
        expect.anything(),
        expect.anything()
      );
      
      expect(mockSQLHandler).toHaveBeenNthCalledWith(4,
        'SELECT COUNT(*) FROM products', 
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
      
      // Should only receive 3 calls (blank lines ignored)
      expect(mockSQLHandler).toHaveBeenCalledTimes(3);
      
      const receivedFragments = sqlCalls.map(call => call.fragment);
      expect(receivedFragments).toEqual([
        'CREATE TABLE test (id INTEGER)',
        'INSERT INTO test VALUES (1)',
        'SELECT * FROM test'
      ]);
    });
  });

  describe('SQL fragment accumulation contract', () => {
    test('demonstrates the need for fragment accumulation in SQL handlers', async () => {
      // This test documents that SQL handlers need to accumulate fragments
      // when they receive incomplete SQL from ADDRESS MATCHING
      
      const rexxCode = `
        ADDRESS sqlengine MATCHING("  (.*)")
        
          CREATE TABLE complex_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
      `;
      
      await executeRexxCode(rexxCode);
      
      // Handler receives 4 fragment calls
      expect(mockSQLHandler).toHaveBeenCalledTimes(4);
      
      // Each fragment by itself would be invalid SQL
      const fragments = sqlCalls.map(call => call.fragment);
      expect(fragments[0]).toBe('CREATE TABLE complex_table (');  // Incomplete
      expect(fragments[1]).toBe('id INTEGER PRIMARY KEY,');        // Invalid alone
      expect(fragments[2]).toBe('name TEXT NOT NULL,');            // Invalid alone  
      expect(fragments[3]).toBe('created_at TEXT DEFAULT CURRENT_TIMESTAMP'); // Invalid alone
      
      // But when accumulated, they form valid SQL:
      const completeSQL = fragments.join(' ') + ')';
      expect(completeSQL).toContain('CREATE TABLE complex_table');
      expect(completeSQL).toContain('id INTEGER PRIMARY KEY');
      expect(completeSQL).toContain('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
    });
  });
});