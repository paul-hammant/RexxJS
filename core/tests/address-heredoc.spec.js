/**
 * ADDRESS with HEREDOC tests
 * Tests the new HEREDOC-based approach for multiline ADDRESS commands
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');
const { mockAddressHandler } = require('./mock-address');

describe('ADDRESS with HEREDOC', () => {
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

    test('should handle multiline SQL without parser conflicts', async () => {
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
});