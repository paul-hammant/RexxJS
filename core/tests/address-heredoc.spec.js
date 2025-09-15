/**
 * Address HEREDOC Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS HEREDOC Support', () => {
    let interpreter;
    let addressCalls = [];

    beforeEach(() => {
        addressCalls = [];
        const mockAddressSender = {
            send: async (namespace, method, params) => {
                addressCalls.push({ namespace, method, params });
                return { 
                    success: true, 
                    result: `Executed: ${namespace}.${method}`, 
                    receivedContent: params.command || params 
                };
            }
        };
        interpreter = new Interpreter(mockAddressSender);
    });

    test('should handle ADDRESS with single-line HEREDOC', async () => {
        const script = `
            ADDRESS test
            <<SQL
SELECT * FROM users WHERE active = 1
SQL
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        // Should have made one call to ADDRESS
        expect(addressCalls).toHaveLength(1);
        expect(addressCalls[0].namespace).toBe('test');
        expect(addressCalls[0].method).toBe('execute');
        expect(addressCalls[0].params.command).toBe('SELECT * FROM users WHERE active = 1');
    });

    test('should handle ADDRESS with multi-line HEREDOC', async () => {
        const script = `
            ADDRESS pyodide
            <<PYTHON
import numpy as np
data = np.array([1, 2, 3, 4, 5])
result = np.mean(data)
print(f"Mean: {result}")
PYTHON
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(1);
        expect(addressCalls[0].namespace).toBe('pyodide');
        expect(addressCalls[0].method).toBe('execute');
        expect(addressCalls[0].params.command).toContain('import numpy as np');
        expect(addressCalls[0].params.command).toContain('data = np.array([1, 2, 3, 4, 5])');
        expect(addressCalls[0].params.command).toContain('result = np.mean(data)');
        expect(addressCalls[0].params.command).toContain('print(f"Mean: {result}")');
    });

    test('should handle variable interpolation in ADDRESS HEREDOC', async () => {
        const script = `
            LET table_name = "users"
            LET status = "active"
            ADDRESS sqlite
            <<SQL
SELECT * FROM {table_name} 
WHERE status = '{status}'
ORDER BY created_date DESC
SQL
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(1);
        expect(addressCalls[0].namespace).toBe('sqlite');
        expect(addressCalls[0].params.command).toContain('SELECT * FROM users');
        expect(addressCalls[0].params.command).toContain("WHERE status = 'active'");
        expect(addressCalls[0].params.command).toContain('ORDER BY created_date DESC');
    });

    test('should handle multiple ADDRESS HEREDOC blocks', async () => {
        const script = `
            ADDRESS sqlite
            <<CREATE_TABLE
CREATE TABLE users (id INTEGER, name TEXT)
CREATE_TABLE
            
            ADDRESS sqlite  
            <<INSERT_DATA
INSERT INTO users (name) VALUES ('Alice')
INSERT INTO users (name) VALUES ('Bob')
INSERT_DATA
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(2);
        
        // First call
        expect(addressCalls[0].namespace).toBe('sqlite');
        expect(addressCalls[0].params.command).toBe('CREATE TABLE users (id INTEGER, name TEXT)');
        
        // Second call
        expect(addressCalls[1].namespace).toBe('sqlite');
        expect(addressCalls[1].params.command).toContain("INSERT INTO users (name) VALUES ('Alice')");
        expect(addressCalls[1].params.command).toContain("INSERT INTO users (name) VALUES ('Bob')");
    });

    test('should handle ADDRESS with different delimiters', async () => {
        const script = `
            ADDRESS jq
            <<FILTER
.users[] | select(.active == true) | .name
FILTER
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(1);
        expect(addressCalls[0].namespace).toBe('jq');
        expect(addressCalls[0].params.command).toBe('.users[] | select(.active == true) | .name');
    });

    test('should handle ADDRESS HEREDOC with result assignment', async () => {
        const script = `
            ADDRESS pyodide
            <<PYTHON
x = 2
y = 8
result = x ** y
PYTHON
            LET my_result = run code="result"
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(2);
        
        // First call for HEREDOC
        expect(addressCalls[0].namespace).toBe('pyodide');
        expect(addressCalls[0].method).toBe('execute');
        expect(addressCalls[0].params.command).toContain('x = 2');
        expect(addressCalls[0].params.command).toContain('y = 8');
        expect(addressCalls[0].params.command).toContain('result = x ** y');
        
        // Second call for run command
        expect(addressCalls[1].namespace).toBe('pyodide');
        expect(addressCalls[1].method).toBe('run');
        expect(addressCalls[1].params.code).toBe('result');
    });

    test('should preserve indentation and formatting in ADDRESS HEREDOC', async () => {
        const script = `
            ADDRESS system
            <<BASH_SCRIPT
#!/bin/bash
if [ "$USER" = "root" ]; then
    echo "Running as root"
    ls -la /etc
else
    echo "Running as $USER"
    ls -la ~
fi
BASH_SCRIPT
        `;
        
        const commands = parse(script);
        await interpreter.run(commands);

        expect(addressCalls).toHaveLength(1);
        const command = addressCalls[0].params.command;
        expect(command).toContain('#!/bin/bash');
        expect(command).toContain('if [ "$USER" = "root" ]; then');
        expect(command).toContain('    echo "Running as root"');
        expect(command).toContain('    ls -la /etc');
        expect(command).toContain('else');
        expect(command).toContain('    echo "Running as $USER"');
        expect(command).toContain('fi');
    });
});