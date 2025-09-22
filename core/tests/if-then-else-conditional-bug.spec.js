/**
 * Test case for IF-THEN-ELSE conditional evaluation bug
 * 
 * Issue: When RC is set to 0 by ADDRESS handlers, IF-THEN-ELSE blocks
 * seem to execute both branches incorrectly
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('IF-THEN-ELSE Conditional Evaluation', () => {
  let interpreter;
  let capturedOutput;

  beforeEach(() => {
    capturedOutput = [];
    
    const mockAddressSender = {
      send: jest.fn().mockImplementation((namespace, method, params) => {
        // Set RC to 0 for successful mock commands
        interpreter.variables.set('RC', 0);
        return 'mock-result';
      }),
    };
    
    interpreter = new RexxInterpreter(mockAddressSender, {
      output: (text) => {
        capturedOutput.push(text);
        console.log('OUTPUT:', text);
      }
    });
  });

  test('should execute only THEN branch when condition is true', async () => {
    const script = `
      RC = 0
      SAY "RC is:" RC
      
      IF RC = 0 THEN DO
        SAY "THEN-branch-executed"
      END
      ELSE DO
        SAY "ELSE-branch-executed"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);
    
    const output = capturedOutput.join('\n');
    console.log('Test output:', output);
    
    // Should only show THEN branch execution
    expect(output).toContain('THEN-branch-executed');
    expect(output).not.toContain('ELSE-branch-executed');
  });

  test('should execute only ELSE branch when condition is false', async () => {
    const script = `
      RC = 1
      SAY "RC is:" RC
      
      IF RC = 0 THEN DO
        SAY "THEN-branch-executed"
      END
      ELSE DO
        SAY "ELSE-branch-executed" 
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);
    
    const output = capturedOutput.join('\n');
    console.log('Test output:', output);
    
    // Should only show ELSE branch execution
    expect(output).not.toContain('THEN-branch-executed');
    expect(output).toContain('ELSE-branch-executed');
  });

  test('should handle RC variable set by mock ADDRESS handler', async () => {
    const script = `
      /* Mock ADDRESS handler that sets RC to 0 */
      ADDRESS MOCK
      "test-command"
      
      SAY "RC after ADDRESS:" RC
      
      IF RC = 0 THEN DO
        SAY "SUCCESS-PATH"
      END
      ELSE DO
        SAY "FAILURE-PATH"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);
    
    const output = capturedOutput.join('\n');
    console.log('Test output:', output);
    
    // Should only execute SUCCESS path
    expect(output).toContain('SUCCESS-PATH');
    expect(output).not.toContain('FAILURE-PATH');
  });

  test('should handle simple IF without ELSE', async () => {
    const script = `
      RC = 0
      
      IF RC = 0 THEN DO
        SAY "SIMPLE-IF-SUCCESS"
      END
      
      SAY "AFTER-IF"
    `;

    const commands = parse(script);
    await interpreter.run(commands);
    
    const output = capturedOutput.join('\n');
    console.log('Test output:', output);
    
    expect(output).toContain('SIMPLE-IF-SUCCESS');
    expect(output).toContain('AFTER-IF');
  });

  test('should handle comparison with different values', async () => {
    const script = `
      /* Test RC = 0 (should be true) */
      RC = 0
      IF RC = 0 THEN SAY "RC-ZERO-SUCCESS"
      
      /* Test RC = 1 (should be false for RC = 0) */
      RC = 1
      IF RC = 0 THEN SAY "RC-ONE-WRONG"
      IF RC = 1 THEN SAY "RC-ONE-SUCCESS"
    `;

    const commands = parse(script);
    await interpreter.run(commands);
    
    const output = capturedOutput.join('\n');
    console.log('Test output:', output);
    
    expect(output).toContain('RC-ZERO-SUCCESS');
    expect(output).toContain('RC-ONE-SUCCESS');
    expect(output).not.toContain('RC-ONE-WRONG');
  });
});