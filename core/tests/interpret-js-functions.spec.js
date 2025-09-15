/**
 * Interpret JS Functions Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

// Mock browser environment for testing
global.window = {};

describe('INTERPRET_JS and JS_EVAL Functions', () => {
    let interpreter;
    
    beforeEach(() => {
        interpreter = new Interpreter(null);
    });

    describe('INTERPRET_JS Function', () => {
        test('should execute simple JavaScript code', async () => {
            const script = `
                INTERPRET_JS("var testVar = 42; return testVar * 2;")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            // The function should execute without errors
            expect(true).toBe(true);
        });

        test('should execute JavaScript code that modifies global variables', async () => {
            const script = `
                INTERPRET_JS("globalThis.testValue = 'Hello World';")
                LET result = INTERPRET_JS("globalThis.testValue")
                SAY result
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('result')).toBe('Hello World');
        });

        test('should handle JavaScript code with return values', async () => {
            const script = `
                LET jsResult = INTERPRET_JS("Math.max(10, 20, 5)")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('jsResult')).toBe(20);
        });

        test('should throw error for invalid JavaScript', async () => {
            const script = `
                INTERPRET_JS("invalid javascript syntax here !@#$")
            `;
            
            const commands = parse(script);
            
            await expect(interpreter.run(commands)).rejects.toThrow('INTERPRET_JS failed');
        });

        test('should handle empty JavaScript code', async () => {
            const script = `
                LET result = INTERPRET_JS("")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('result')).toBeNull();
        });

        test('should execute JavaScript function calls', async () => {
            const script = `
                INTERPRET_JS("globalThis.testFunction = function(x) { return x * 3; };")
                LET funcResult = INTERPRET_JS("globalThis.testFunction(7)")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('funcResult')).toBe(21);
        });
    });

    describe('INTERPRET_JS with Expression Mode', () => {
        test('should evaluate simple JavaScript expressions', async () => {
            const script = `
                LET mathResult = INTERPRET_JS("5 + 3 * 2", "expression")
                LET stringResult = INTERPRET_JS("'Hello' + ' ' + 'World'", "expression")
                LET boolResult = INTERPRET_JS("true", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('mathResult')).toBe(11);
            expect(interpreter.getVariable('stringResult')).toBe('HelloWorld');
            expect(interpreter.getVariable('boolResult')).toBe(true);
        });

        test('should handle boolean return values correctly', async () => {
            const script = `
                LET trueVal = INTERPRET_JS("10 > 5", "expression")
                LET falseVal = INTERPRET_JS("3 > 10", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('trueVal')).toBe(true);
            expect(interpreter.getVariable('falseVal')).toBe(false);
        });

        test('should handle null and undefined values', async () => {
            const script = `
                LET nullVal = INTERPRET_JS("null", "expression")
                LET undefinedVal = INTERPRET_JS("undefined", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('nullVal')).toBe(null);
            // Note: JavaScript undefined becomes null in this implementation
            expect(interpreter.getVariable('undefinedVal')).toBeNull();
        });

        test('should evaluate JavaScript object property access', async () => {
            const script = `
                INTERPRET_JS("globalThis.testObj = {name: 'Test', value: 123};")
                LET objName = INTERPRET_JS("globalThis.testObj.name", "expression")
                LET objValue = INTERPRET_JS("globalThis.testObj.value", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('objName')).toBe('Test');
            expect(interpreter.getVariable('objValue')).toBe(123);
        });

        test('should handle array access and methods', async () => {
            const script = `
                INTERPRET_JS("globalThis.testArray = [1, 2, 3, 4, 5];")
                LET arrayLength = INTERPRET_JS("globalThis.testArray.length", "expression")
                LET firstItem = INTERPRET_JS("globalThis.testArray[0]", "expression")
                LET joinedItems = INTERPRET_JS("globalThis.testArray.join('-')", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('arrayLength')).toBe(5);
            expect(interpreter.getVariable('firstItem')).toBe(1);
            expect(interpreter.getVariable('joinedItems')).toBe('1-2-3-4-5');
        });

        test('should throw error for invalid JavaScript expressions', async () => {
            const script = `
                INTERPRET_JS("invalid.syntax.here.!", "expression")
            `;
            
            const commands = parse(script);
            
            await expect(interpreter.run(commands)).rejects.toThrow('INTERPRET_JS failed');
        });
    });

    describe('Integration Tests', () => {
        test('should work together for calculator-like operations', async () => {
            const script = `
                -- Setup calculator functions (single line JS)
                INTERPRET_JS("globalThis.display = '0'; globalThis.button_number = function(num) { if (globalThis.display === '0') { globalThis.display = String(num); } else { globalThis.display += String(num); } }; globalThis.calculate = function() { try { globalThis.display = String(eval(globalThis.display)); } catch(e) { globalThis.display = 'Error'; } };")
                
                -- Use the simulated calculator
                INTERPRET_JS("globalThis.button_number(5)")
                INTERPRET_JS("globalThis.button_number('+')")
                INTERPRET_JS("globalThis.button_number(3)")
                INTERPRET_JS("globalThis.calculate()")
                
                LET calculatorResult = INTERPRET_JS("globalThis.display", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('calculatorResult')).toBe('8');
        });

        test('should handle complex DOM-like operations', async () => {
            const script = `
                -- Simulate DOM elements (single line JS)
                INTERPRET_JS("globalThis.document = { getElementById: function(id) { if (id === 'testbox') { return { textContent: 'initial', value: 'initial_value' }; } return null; } };")
                
                LET elementContent = INTERPRET_JS("globalThis.document.getElementById('testbox').textContent", "expression")
                LET elementValue = INTERPRET_JS("globalThis.document.getElementById('testbox').value", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('elementContent')).toBe('initial');
            expect(interpreter.getVariable('elementValue')).toBe('initial_value');
        });
    });

    describe('Error Handling', () => {
        test('should handle non-string parameters gracefully', async () => {
            const script = `
                INTERPRET_JS(42)
            `;
            
            const commands = parse(script);
            
            await expect(interpreter.run(commands)).rejects.toThrow('INTERPRET_JS requires a string parameter');
        });

        test('should handle non-string parameters with type parameter gracefully', async () => {
            const script = `
                INTERPRET_JS(42, "expression")
            `;
            
            const commands = parse(script);
            
            await expect(interpreter.run(commands)).rejects.toThrow('INTERPRET_JS requires a string parameter');
        });
    });

    describe('Type Parameter Tests', () => {
        test('should force expression mode', async () => {
            const script = `
                LET result = INTERPRET_JS("5 + 3", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('result')).toBe(8);
        });

        test('should force statement mode', async () => {
            const script = `
                INTERPRET_JS("globalThis.testVar = 42", "statement")
                LET result = INTERPRET_JS("globalThis.testVar", "expression")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('result')).toBe(42);
        });

        test('should use auto mode by default', async () => {
            const script = `
                LET result1 = INTERPRET_JS("Math.max(10, 20)")
                INTERPRET_JS("globalThis.autoVar = 'test'")
                LET result2 = INTERPRET_JS("globalThis.autoVar")
            `;
            
            const commands = parse(script);
            await interpreter.run(commands);
            
            expect(interpreter.getVariable('result1')).toBe(20);
            expect(interpreter.getVariable('result2')).toBe('test');
        });
    });

    describe('NOINTERPRET Support', () => {
        test('should block INTERPRET_JS when NOINTERPRET is active', async () => {
            const script = `
                NO-INTERPRET
                INTERPRET_JS("5 + 3")
            `;
            
            const commands = parse(script);
            
            await expect(interpreter.run(commands)).rejects.toThrow('INTERPRET_JS is blocked by NO-INTERPRET directive');
        });
    });
});