/**
 * Operation Syntax Tests
 *
 * Tests for operation calls without parentheses (imperative syntax)
 * vs function calls with parentheses (expression syntax)
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const bathhouseLib = require('./fixtures/bathhouse-library');

describe('Operation Syntax (No Parentheses)', () => {
  let interpreter;
  let consoleSpy;

  beforeEach(() => {
    const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Manually register bathhouse library
    Object.assign(interpreter.operations, bathhouseLib.operations);
    Object.assign(interpreter.externalFunctions, bathhouseLib.functions);

    // Reset bathhouse state
    bathhouseLib.resetBathhouse();
  });

  afterEach(() => {
    if (consoleSpy) consoleSpy.mockRestore();
  });

  describe('Basic operation calls without parentheses', () => {
    test('simple operation with single named parameter', async () => {
      const script = `
SERVE_GUEST guest="river_spirit"
SAY "Guest served"
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Guest served');

      // Verify side effect occurred
      const log = bathhouseLib.functions.GET_LOG();
      expect(log).toContain('Served river_spirit');
    });

    test('operation with multiple named parameters', async () => {
      const script = `
SERVE_GUEST guest="no_face" bath="herbal"
SAY "Herbal bath prepared"
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Herbal bath prepared');
    });

    test('multiple operations in sequence', async () => {
      const script = `
CLEAN_BATHHOUSE area="main_hall" intensity="deep"
FEED_SOOT_SPRITES treats="konpeito" amount=3
ISSUE_TOKEN worker="chihiro" task="cleaning"
SAY "Tasks complete"
      `;

      await interpreter.run(parse(script));

      const log = bathhouseLib.functions.GET_LOG();
      expect(log).toContain('Cleaned main_hall');
      expect(log).toContain('Fed soot sprites');
      expect(log).toContain('Issued token to chihiro');
    });
  });

  describe('Function calls with parentheses (expressions)', () => {
    test('function call returns value', async () => {
      const script = `
LET capacity = BATHHOUSE_CAPACITY()
SAY "Capacity: " || capacity
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Capacity: 50');
    });

    test('function with named parameters in expressions', async () => {
      // Now supported! External functions from REQUIRE'd libraries receive params objects
      const script = `
LET spirit = IDENTIFY_SPIRIT(description="muddy")
SAY "Identified: " || spirit
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Identified: river_spirit');
    });

    test('function with positional parameters in expressions', async () => {
      // Positional parameters should also work (converted via parameter-converter)
      const script = `
LET spirit = IDENTIFY_SPIRIT("hungry")
SAY "Identified: " || spirit
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Identified: no_face');
    });

    test('function call in condition', async () => {
      const script = `
CLEAN_BATHHOUSE area="boiler_room"
LET level = CLEANLINESS_LEVEL(area="boiler_room")
IF level > 50 THEN
  SAY "Boiler room is clean"
ELSE
  SAY "Needs more cleaning"
ENDIF
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Boiler room is clean');
    });
  });

  describe('Mixed operations and functions', () => {
    test('operation followed by function query', async () => {
      const script = `
FEED_SOOT_SPRITES treats="konpeito" amount=5
LET energy = SOOT_SPRITE_ENERGY()
SAY "Soot sprite energy: " || energy
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Soot sprite energy: 100');
    });

    test('function result used in operation', async () => {
      // Now supported! External functions from REQUIRE'd libraries receive params objects
      const script = `
LET spirit_name = IDENTIFY_SPIRIT(description="hungry")
SERVE_GUEST guest=spirit_name bath="luxury"
SAY "Served identified guest"
      `;

      await interpreter.run(parse(script));

      const log = bathhouseLib.functions.GET_LOG();
      expect(log).toContain('Served no_face');
    });

    test('conditional operations based on function results', async () => {
      const script = `
ISSUE_TOKEN worker="chihiro" task="cleaning"
ISSUE_TOKEN worker="lin" task="serving"
LET token_count = COUNT_TOKENS()
IF token_count > 1 THEN
  FEED_SOOT_SPRITES treats="reward" amount=2
  SAY "Workers rewarded"
ENDIF
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Workers rewarded');
    });
  });

  describe('Operations in loops and complex control flow', () => {
    test('operation in DO loop', async () => {
      const script = `
DO i = 1 TO 3
  ISSUE_TOKEN worker="worker" || i task="bath_prep"
END
LET total = COUNT_TOKENS()
SAY "Issued " || total || " tokens"
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Issued 3 tokens');
    });

    test('operation with string concatenation in parameters', async () => {
      const script = `
LET guest_type = "river"
LET full_name = guest_type || "_spirit"
SERVE_GUEST guest=full_name bath="purifying"
SAY "Served: " || full_name
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toBe('Served: river_spirit');
    });
  });

  describe('Error cases', () => {
    test.skip('operation name that does not exist (error handling TODO)', async () => {
      // TODO: Currently unknown commands pass through silently
      // Should add proper error handling for unrecognized operations
      const script = `
SUMMON_DRAGON power="max"
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    test('function without parentheses is treated as function call', async () => {
      // Parser recognizes BATHHOUSE_CAPACITY as function call even without parens
      // This is correct REXX behavior - functions can be called without parens
      const script = `
LET result = BATHHOUSE_CAPACITY
SAY result
      `;

      await interpreter.run(parse(script));
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      // Gets the function result, not the variable name
      expect(output).toBe('50');
    });
  });

  describe('REQUIRE with operations', () => {
    // These tests use a fresh interpreter without manual registration
    // to verify REQUIRE automatically loads both functions and operations

    test('DEBUG: REQUIRE with logging', async () => {
      // NO console mocking - we want to see the debug output
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);

      console.log('=== STARTING DEBUG TEST ===');
      const script = `
SAY "Before REQUIRE"
REQUIRE "cwd:tests/fixtures/bathhouse-library.js"
SAY "After REQUIRE"
SAY "About to call COUNT_TOKENS"
LET count = COUNT_TOKENS()
SAY "Token count: " || count
      `;

      try {
        await freshInterpreter.run(parse(script));
        console.log('=== TEST COMPLETED WITHOUT ERROR ===');
      } catch (error) {
        console.log('=== TEST FAILED WITH ERROR ===', error.message);
        throw error;
      }
    });

    test('REQUIRE loads operations from library', async () => {
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);
      const freshConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const script = `
REQUIRE "cwd:tests/fixtures/bathhouse-library.js"
SERVE_GUEST guest="river_spirit" bath="herbal"
LET log = GET_LOG()
SAY log
      `;

      await freshInterpreter.run(parse(script));
      const output = freshConsoleSpy.mock.calls.map(c => c[0]).join('\n');

      // Verify operation executed without manual registration
      expect(output).toContain('Served river_spirit in herbal bath');

      freshConsoleSpy.mockRestore();
    });

    test('REQUIRE loads both functions and operations', async () => {
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);
      const freshConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const script = `
REQUIRE "cwd:tests/fixtures/bathhouse-library.js"
ISSUE_TOKEN worker="chihiro" task="bath_prep"
ISSUE_TOKEN worker="lin" task="serving"
LET count = COUNT_TOKENS()
SAY "Token count: " || count
      `;

      await freshInterpreter.run(parse(script));
      const output = freshConsoleSpy.mock.calls.map(c => c[0]).join('\n');

      // Both operations and functions should work
      expect(output).toBe('Token count: 2');

      freshConsoleSpy.mockRestore();
    });

    test('REQUIRE AS aliases operations', async () => {
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);
      const freshConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const script = `
REQUIRE "cwd:tests/fixtures/bathhouse-library.js" AS bh_(.*)
bh_SERVE_GUEST guest="no_face" bath="luxury"
LET log = bh_GET_LOG()
SAY log
      `;

      await freshInterpreter.run(parse(script));
      const output = freshConsoleSpy.mock.calls.map(c => c[0]).join('\n');

      // Both operations and functions should be prefixed with bh_
      expect(output).toContain('Served no_face in luxury bath');

      freshConsoleSpy.mockRestore();
    });

    test('REQUIRE AS aliases both functions and operations', async () => {
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);
      const freshConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const script = `
REQUIRE "cwd:tests/fixtures/bathhouse-library.js" AS bath_(.*)
bath_CLEAN_BATHHOUSE area="main_hall" intensity="deep"
bath_FEED_SOOT_SPRITES treats="konpeito" amount=3
LET energy = bath_SOOT_SPRITE_ENERGY()
LET capacity = bath_BATHHOUSE_CAPACITY()
SAY "Energy: " || energy || ", Capacity: " || capacity
      `;

      await freshInterpreter.run(parse(script));
      const output = freshConsoleSpy.mock.calls.map(c => c[0]).join('\n');

      // Operations and functions with AS prefix should both work
      expect(output).toContain('Energy: 80, Capacity: 50');

      freshConsoleSpy.mockRestore();
    });

    test('multiple REQUIRE with different prefixes avoid name clashes', async () => {
      const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
      const freshInterpreter = new RexxInterpreter(mockRpc);
      const freshConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const script = `
REQUIRE "cwd:tests/fixtures/bathhouse-library.js" AS yubabaHouse_(.*)
REQUIRE "cwd:tests/fixtures/bathhouse-library.js" AS zenibaHouse_(.*)
yubabaHouse_SERVE_GUEST guest="chihiro"
zenibaHouse_SERVE_GUEST guest="haku"
LET log1 = yubabaHouse_GET_LOG()
LET log2 = zenibaHouse_GET_LOG()
SAY "Yubaba: " || log1
SAY "Zeniba: " || log2
      `;

      await freshInterpreter.run(parse(script));
      const output = freshConsoleSpy.mock.calls.map(c => c[0]).join('\n');

      // Both aliases access the same module instance (Node.js modules are singletons)
      // So both GET_LOG calls return the combined log
      expect(output).toContain('Yubaba:');
      expect(output).toContain('Served chihiro');
      expect(output).toContain('Zeniba:');
      expect(output).toContain('Served haku');

      freshConsoleSpy.mockRestore();
    });
  });
});
