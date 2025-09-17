/**
 * ADDRESS MATCHING MULTILINE Test
 * Tests the new ADDRESS MATCHING MULTILINE functionality that collects
 * matching lines and sends them as multiline strings to the address handler.
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS MATCHING MULTILINE functionality', () => {
  let interpreter;
  let mockHandler;
  let receivedCalls;

  beforeEach(() => {
    receivedCalls = [];
    
    // Mock handler that records what it receives
    mockHandler = jest.fn().mockImplementation((content, context) => {
      receivedCalls.push(content);
      return { success: true };
    });
    
    interpreter = new TestRexxInterpreter({}, {}, {});
    
    // Register mock address target
    interpreter.addressTargets.set('testhandler', {
      handler: mockHandler,
      methods: ['execute'],
      metadata: { name: 'Test Handler' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Basic multiline collection', () => {
    test('should collect matching lines and send as multiline string', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"

  line one
  line two
  line three

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive one multiline call
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(receivedCalls[0]).toBe('line one\nline two\nline three');
    });

    test('should handle multiple multiline blocks separated by non-matching lines', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"

  line one
  line two
  line three
not_indented_line
  second block line one
  second block line two

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive 3 calls: first block, non-matching line, second block
      expect(mockHandler).toHaveBeenCalledTimes(3);
      expect(receivedCalls[0]).toBe('line one\nline two\nline three');
      expect(receivedCalls[1]).toBe('not_indented_line');
      expect(receivedCalls[2]).toBe('second block line one\nsecond block line two');
    });

    test('should flush remaining lines when ADDRESS changes', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"

  line one
  line two
  line three

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive one call for the collected lines
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(receivedCalls[0]).toBe('line one\nline two\nline three');
    });

    test('should flush remaining lines at end of program', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"

  line one
  line two
  line three`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive one call for the collected lines
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(receivedCalls[0]).toBe('line one\nline two\nline three');
    });

    test('should handle empty content gracefully', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"
ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should not receive any calls
      expect(mockHandler).toHaveBeenCalledTimes(0);
    });
  });

  describe('Pattern matching behavior', () => {
    test('should only collect lines that match the pattern', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "SQL: (.*)"

SQL: CREATE TABLE test (id INTEGER)
SQL: INSERT INTO test VALUES (1)
not_sql_line
SQL: SELECT * FROM test

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive 3 calls: first SQL block, non-matching line, second SQL block
      expect(mockHandler).toHaveBeenCalledTimes(3);
      expect(receivedCalls[0]).toBe('CREATE TABLE test (id INTEGER)\nINSERT INTO test VALUES (1)');
      expect(receivedCalls[1]).toBe('not_sql_line');
      expect(receivedCalls[2]).toBe('SELECT * FROM test');
    });

    test('should handle patterns without capture groups', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "PREFIX: .*"

PREFIX: line one
PREFIX: line two
not_prefixed
PREFIX: line three

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      // Should receive 1 call for the non-matching line
      // (matching lines without capture groups produce empty content and are ignored)
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(receivedCalls[0]).toBe('not_prefixed');
    });
  });

  describe('Context and metadata', () => {
    test('should pass correct context with multiline pattern', async () => {
      const rexxCode = `ADDRESS testhandler MATCHING MULTILINE "  (.*)"

  line one
  line two

ADDRESS default`;
      
      await executeRexxCode(rexxCode);
      
      expect(mockHandler).toHaveBeenCalledWith(
        'line one\nline two',
        expect.objectContaining({
          _addressMatchingPattern: '  (.*)'
        }),
        expect.anything()
      );
    });
  });
});