/**
 * ADDRESS HEREDOC with SQL statements
 * Tests that ADDRESS HEREDOC can handle SQL statements that span multiple lines
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS HEREDOC with multiline SQL statements', () => {
  let interpreter;
  let mockAddressSender;
  let sqlEngineHandler;
  let sqlEngineCalls;

  beforeEach(() => {
    sqlEngineCalls = [];
    
    sqlEngineHandler = jest.fn().mockImplementation(async (payload, context, sourceContext) => {
      sqlEngineCalls.push({ payload, context, sourceContext });
      return { success: true, operation: 'SQL_EXECUTED' };
    });
    
    mockAddressSender = {
      sendToAddress: jest.fn(),
      send: jest.fn().mockResolvedValue({ success: true, result: null })
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {});
    
    // Register SQL engine handler
    interpreter.addressTargets.set('sqlengine', {
      handler: sqlEngineHandler,
      methods: {},
      metadata: { name: 'SQL Engine' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('SQL HEREDOC handling', () => {
    test('should handle complex multiline SQL with HEREDOC', async () => {
      const rexxCode = `
        LET userId = 123
        LET minSalary = 50000
        
        ADDRESS sqlengine
        <<EMPLOYEE_QUERY
        SELECT 
          e.id,
          e.name,
          e.salary,
          d.department_name
        FROM employees e
        JOIN departments d ON e.department_id = d.id
        WHERE e.user_id = {userId}
          AND e.salary >= {minSalary}
        ORDER BY e.salary DESC
        LIMIT 10
        EMPLOYEE_QUERY
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(sqlEngineCalls).toHaveLength(1);
      const sqlPayload = sqlEngineCalls[0].payload;
      
      // Should receive complete SQL as one multiline string
      expect(sqlPayload).toContain('SELECT');
      expect(sqlPayload).toContain('FROM employees e');
      expect(sqlPayload).toContain('JOIN departments d');
      expect(sqlPayload).toContain('WHERE e.user_id = {userId}');
      expect(sqlPayload).toContain('ORDER BY e.salary DESC');
      expect(sqlPayload).toContain('LIMIT 10');
    });

    test('should handle SQL UPDATE with HEREDOC', async () => {
      const rexxCode = `
        ADDRESS sqlengine
        <<UPDATE_STMT
        UPDATE employees 
        SET salary = salary * 1.1,
            last_updated = NOW()
        WHERE department_id IN (
          SELECT id FROM departments 
          WHERE name = 'Engineering'
        )
        UPDATE_STMT
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(sqlEngineCalls).toHaveLength(1);
      expect(sqlEngineCalls[0].payload).toContain('UPDATE employees');
      expect(sqlEngineCalls[0].payload).toContain('SET salary = salary * 1.1');
      expect(sqlEngineCalls[0].payload).toContain('WHERE department_id IN');
    });

    test('demonstrates that ADDRESS HEREDOC delivers complete multiline SQL', async () => {
      const rexxCode = `
        ADDRESS sqlengine
        <<COMPLEX_QUERY
        WITH sales_summary AS (
          SELECT 
            customer_id,
            SUM(amount) as total_sales,
            COUNT(*) as order_count
          FROM orders 
          WHERE order_date >= '2024-01-01'
          GROUP BY customer_id
        )
        SELECT 
          c.name,
          c.email,
          ss.total_sales,
          ss.order_count,
          CASE 
            WHEN ss.total_sales > 10000 THEN 'Premium'
            WHEN ss.total_sales > 5000 THEN 'Gold'
            ELSE 'Standard'
          END as customer_tier
        FROM customers c
        JOIN sales_summary ss ON c.id = ss.customer_id
        ORDER BY ss.total_sales DESC
        COMPLEX_QUERY
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(sqlEngineCalls).toHaveLength(1);
      const payload = sqlEngineCalls[0].payload;
      
      // Verify all parts of the complex SQL are present
      expect(payload).toContain('WITH sales_summary AS');
      expect(payload).toContain('customer_id');
      expect(payload).toContain('FROM orders');
      expect(payload).toContain('GROUP BY customer_id');
      expect(payload).toContain('CASE');
      expect(payload).toContain('WHEN ss.total_sales > 10000');
      expect(payload).toContain('JOIN sales_summary ss');
      expect(payload).toContain('ORDER BY ss.total_sales DESC');
    });
  });
});