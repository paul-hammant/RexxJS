/**
 * Address Tests - Converted to HEREDOC
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');
const { mockAddressHandler } = require('../src/mock-address');

describe('ADDRESS HEREDOC functionality', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter({}, {}, {});
    
    // Register mock address handler
    interpreter.addressTargets.set('mockaddress', {
      handler: mockAddressHandler.handle.bind(mockAddressHandler),
      methods: ['execute'],
      metadata: { name: 'MOCK' }
    });
    
    // Clear mock history
    mockAddressHandler.clear();
  });

  const run = async (code) => {
    const cmds = parse(code);
    return await interpreter.run(cmds, code);
  };

  describe('Basic HEREDOC functionality', () => {
    test('should handle simple HEREDOC with ADDRESS', async () => {
      const code = `
        ADDRESS mockaddress
        <<SQL
        SELECT * FROM users WHERE active = 1
        SQL
      `;

      await run(code);

      const calls = mockAddressHandler.getCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0].payload).toBe('        SELECT * FROM users WHERE active = 1');
    });

    test('should handle multiline SQL without conflicts', async () => {
      const code = `
        ADDRESS mockaddress
        <<COMPLEX_QUERY
        SELECT
          department,
          COUNT(*) as employee_count,
          AVG(salary) as avg_salary
        FROM employees
        GROUP BY department
        ORDER BY avg_salary DESC
        COMPLEX_QUERY
      `;

      await run(code);

      const calls = mockAddressHandler.getCalls();
      expect(calls).toHaveLength(1);
      
      const expectedSQL = `        SELECT
          department,
          COUNT(*) as employee_count,
          AVG(salary) as avg_salary
        FROM employees
        GROUP BY department
        ORDER BY avg_salary DESC`;
      
      expect(calls[0].payload).toBe(expectedSQL);
    });
  });

  describe('HEREDOC with variables', () => {
    test('should handle variable substitution in HEREDOC', async () => {
      const code = `
        LET userId = 42
        LET tableName = "users"
        ADDRESS mockaddress
        <<QUERY
        SELECT * FROM {tableName} WHERE id = {userId}
        QUERY
      `;

      await run(code);

      const calls = mockAddressHandler.getCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0].payload).toBe('        SELECT * FROM {tableName} WHERE id = {userId}');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid HEREDOC delimiter', async () => {
      const code = `
        ADDRESS mockaddress
        <<INVALID
        Some content
        WRONG_DELIMITER
      `;

      // This should either error or handle gracefully
      await expect(run(code)).rejects.toThrow();
    });
  });
});