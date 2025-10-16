/**
 * Test to reproduce: String concatenation with parenthesized expressions not being evaluated
 *
 * Bug: SAY "text" || (expr) outputs the literal string "(expr)" instead of evaluating the expression
 *
 * Example:
 *   LET a = 10
 *   LET b = 3
 *   SAY "Result: " || (a + b)
 *
 * Expected output: "Result: 13"
 * Actual output: "Result: (a + b)"
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('String Concatenation with Parenthesized Expressions', () => {
    let interpreter;
    let output = [];

    beforeEach(() => {
        output = [];
        const outputHandler = {
            writeLine: (text) => output.push(text),
            output: (text) => output.push(text)
        };
        const mockAddressSender = {
            send: async () => { throw new Error('Should not reach fallback'); }
        };
        interpreter = new Interpreter(mockAddressSender, outputHandler);
    });

    test('simple arithmetic expression in concatenation should be evaluated', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Addition: a + b = " || (a + b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        // Should output "Addition: a + b = 13", not "Addition: a + b = (a + b)"
        expect(output.join('')).toContain('13');
        expect(output.join('')).not.toMatch(/\(a \+ b\)/);
    });

    test('arithmetic within concatenation chain', async () => {
        const code = `
            LET x = 5
            LET y = 2
            SAY "x = " || x || ", y = " || y || ", x + y = " || (x + y)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        const result = output.join('');
        expect(result).toContain('x = 5');
        expect(result).toContain('y = 2');
        expect(result).toContain('7');
        expect(result).not.toMatch(/\(x \+ y\)/);
    });

    test('subtraction in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Subtraction: a - b = " || (a - b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('7');
        expect(output.join('')).not.toMatch(/\(a - b\)/);
    });

    test('multiplication in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Multiplication: a * b = " || (a * b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('30');
        expect(output.join('')).not.toMatch(/\(a \* b\)/);
    });

    test('division in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Division: a / b = " || (a / b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        // 10 / 3 = 3.333... in JavaScript, but REXX might round or truncate
        const result = output.join('');
        expect(result).not.toMatch(/\(a \/ b\)/);
        expect(result).toContain('3'); // at least has a number
    });

    test('modulo in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Modulo: a % b = " || (a % b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('1');
        expect(output.join('')).not.toMatch(/\(a % b\)/);
    });

    test('power in concatenation', async () => {
        const code = `
            LET a = 2
            SAY "Power: a ** 3 = " || (a ** 3)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('8');
        expect(output.join('')).not.toMatch(/\(a \*\* 3\)/);
    });

    test('function call in concatenation', async () => {
        const code = `
            LET a = 10
            SAY "ABS(-42) = " || ABS(-42)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('42');
    });

    test('nested expressions in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            LET c = 2
            SAY "Result: " || ((a + b) * c)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        // (10 + 3) * 2 = 26
        expect(output.join('')).toContain('26');
        expect(output.join('')).not.toMatch(/\(\(a \+ b\) \* c\)/);
    });

    test('function call with arguments in concatenation', async () => {
        const code = `
            SAY "MAX result: " || MAX(10, 5, 20, 3)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        expect(output.join('')).toContain('20');
    });

    test('comparison expression in concatenation', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Is a > b? " || (a > b)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        const result = output.join('');
        // Should be 1 (true) or similar truthy value
        expect(result).not.toMatch(/\(a > b\)/);
    });

    test('arithmetic from demo page - exact case from bug report', async () => {
        const code = `
            LET a = 10
            LET b = 3
            SAY "Basic Arithmetic:"
            SAY "  a = " || a || ", b = " || b
            SAY "  Addition: a + b = " || (a + b)
            SAY "  Subtraction: a - b = " || (a - b)
            SAY "  Multiplication: a * b = " || (a * b)
            SAY "  Division: a / b = " || (a / b)
            SAY "  Modulo (remainder): a % b = " || (a % b)
            SAY "  Power: a ** 2 = " || (a ** 2)
        `;

        const commands = parse(code);
        await interpreter.run(commands);

        const result = output.join('');

        // All these should be present, none should have literal expressions
        expect(result).toContain('Addition: a + b = 13');
        expect(result).toContain('Subtraction: a - b = 7');
        expect(result).toContain('Multiplication: a * b = 30');
        expect(result).not.toMatch(/\(a \+ b\)/);
        expect(result).not.toMatch(/\(a - b\)/);
        expect(result).not.toMatch(/\(a \* b\)/);
        expect(result).not.toMatch(/\(a \/ b\)/);
        expect(result).not.toMatch(/\(a % b\)/);
        expect(result).not.toMatch(/\(a \*\* 2\)/);
    });
});
