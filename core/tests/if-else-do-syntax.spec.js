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

  it('should parse complex nested IF ELSE DO with SUBROUTINES calls', async () => {
    if (!interpreter.functions) {
      interpreter.functions = new Map();
    }
    interpreter.functions.set('SUBROUTINES', (pattern) => {
      if (pattern === '.*Test$') return ['StringLengthTest', 'StringCaseTest'];
      return ['CustomTest'];
    });

    const script = `
      LET target_describe = ""
      IF LENGTH(target_describe) = 0 THEN DO
        LET items = ["test1", "test2"]
        DO item OVER items
          LET last_sub = item
        END
      END
      ELSE DO
        LET last_sub = "else_branch"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('last_sub')).toBe('test2');
  });

  it('should parse IF ELSE DO with INTERPRET statements', async () => {
    const script = `
      LET mode = "test"
      IF mode = "test" THEN DO
        INTERPRET "LET result = \"test_mode\""
      END
      ELSE DO
        INTERPRET "LET result = \"other_mode\""
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('test_mode');
  });

  it('should parse deeply nested IF ELSE DO structures', async () => {
    const script = `
      LET x = 5
      IF x > 0 THEN DO
        IF x < 10 THEN DO
          LET result = "small_positive"
        END
        ELSE DO
          LET result = "large_positive"
        END
      END
      ELSE DO
        IF x < 0 THEN DO
          LET result = "negative"
        END
        ELSE DO
          LET result = "zero"
        END
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('small_positive');
  });

  it('should parse IF ELSE DO with multiple nested DO loops', async () => {
    const script = `
      LET flag = true
      IF flag THEN DO
        LET items1 = ["a", "b"]
        DO item OVER items1
          LET first = item
        END
        LET items2 = ["c", "d"]
        DO item OVER items2
          LET second = item
        END
      END
      ELSE DO
        LET items3 = ["e", "f"]
        DO item OVER items3
          LET first = item
        END
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('first')).toBe('b');
    expect(interpreter.getVariable('second')).toBe('d');
  });

  it('should parse IF ELSE DO with mixed DO loop types', async () => {
    const script = `
      LET count = 3
      IF count > 0 THEN DO
        DO i = 1 TO count
          LET last_i = i
        END
        LET items = ["x", "y"]
        DO item OVER items
          LET last_item = item
        END
      END
      ELSE DO
        LET default_value = "none"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('last_i')).toBe(3);
    expect(interpreter.getVariable('last_item')).toBe('y');
  });

  it('should handle IF ELSE DO with function calls in conditions', async () => {
    const script = `
      LET text = "Hello World"
      IF LENGTH(text) > 5 THEN DO
        LET upper_text = UPPER(text)
        LET result = "long_text"
      END
      ELSE DO
        LET lower_text = LOWER(text)
        LET result = "short_text"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('result')).toBe('long_text');
    expect(interpreter.getVariable('upper_text')).toBe('HELLO WORLD');
  });

  it('should debug simple multiple DO case', async () => {
    const script = `
      IF true THEN DO
        DO i = 1 TO 2
          LET test1 = i
        END
        DO j = 3 TO 4  
          LET test2 = j
        END
      END
      ELSE DO
        LET test3 = "else"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(interpreter.getVariable('test1')).toBe(2);
    expect(interpreter.getVariable('test2')).toBe(4);
  });
});