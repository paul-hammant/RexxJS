/**
 * IF ELSE DO syntax structure test
 * 
 * Tests the correct parsing of IF THEN DO ... ELSE DO ... END structures
 * to debug the parsing issue we encountered
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('IF ELSE DO Syntax Parsing', () => {
  let interpreter;
  let mockAddressSender;

  beforeEach(() => {
    mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
    };
    interpreter = new RexxInterpreter(mockAddressSender);
  });

  it('should parse simple IF THEN DO ... END structure', async () => {
    const script = `
      LET x = 5
      IF x > 0 THEN DO
        LET result = "positive"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('positive');
  });

  it('should parse IF THEN DO ... ELSE DO ... END structure', async () => {
    const script = `
      LET x = -5
      IF x > 0 THEN DO
        LET result = "positive"
      END
      ELSE DO
        LET result = "negative"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('negative');
  });

  it('should parse nested DO loops inside IF ELSE', async () => {
    const script = `
      LET target = "test"
      IF LENGTH(target) = 0 THEN DO
        LET result = "then"
      END
      ELSE DO
        LET result = "else"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('else');
  });

  it('should parse the problematic SUBROUTINES pattern', async () => {
    // Set up mock subroutines function - fix the undefined functions property
    if (!interpreter.functions) {
      interpreter.functions = new Map();
    }
    interpreter.functions.set('SUBROUTINES', () => ['TestSub1', 'TestSub2']);

    const script = `
      LET target = ""
      IF LENGTH(target) = 0 THEN DO
        LET result = "empty"
      END
      ELSE DO
        LET result = "not_empty"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('empty');
  });
});