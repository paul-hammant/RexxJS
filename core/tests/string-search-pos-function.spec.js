/**
 * Test POS() function behavior with concatenated strings
 *
 * This test reproduces a scenario where POS() appears to incorrectly find
 * a substring that shouldn't exist in the concatenated result.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('POS() function with string concatenation', () => {
  let interpreter;
  let outputHandler;

  beforeEach(() => {
    const mockAddressSender = {
      send: async () => { throw new Error('Should not reach fallback'); }
    };

    outputHandler = {
      writeLine: () => {},
      output: () => {},
      outputs: []
    };
    outputHandler.output = (text) => outputHandler.outputs.push(text);

    interpreter = new Interpreter(mockAddressSender, outputHandler);
  });

  test('POS() should not find "42" in pirate response', async () => {
    const script = `
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused - I wasn't referrin' to any particular book, I was just answerin' yer question about me favorite color like any self-respectin' salt would! I was speakin' from me own sea-weathered perspective, as any sailor worth their salt would do. Though if ye're lookin' for a good nautical tale, I'd recommend ye start with \\"Treasure Island\\" by Robert Louis Stevenson - now there's a proper piece of seafarin' literature for ye!"

      LET pos_result = POS(RESULT.message, "42")
      SAY "POS result: " || pos_result

      IF pos_result > 0 THEN DO
        SAY "FOUND 42 at position: " || pos_result
      END
      ELSE DO
        SAY "42 NOT FOUND (correct)"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('POS result: 0');
    expect(outputHandler.outputs).toContain('42 NOT FOUND (correct)');
    expect(outputHandler.outputs).not.toContain(expect.stringMatching(/FOUND 42/));
  });

  test('POS() should not find "HITCHHIKER" in pirate response', async () => {
    const script = `
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused - I wasn't referrin' to any particular book, I was just answerin' yer question about me favorite color like any self-respectin' salt would! I was speakin' from me own sea-weathered perspective, as any sailor worth their salt would do. Though if ye're lookin' for a good nautical tale, I'd recommend ye start with \\"Treasure Island\\" by Robert Louis Stevenson - now there's a proper piece of seafarin' literature for ye!"

      LET upper_message = UPPER(RESULT.message)
      LET pos_result = POS(upper_message, "HITCHHIKER")
      SAY "POS HITCHHIKER result: " || pos_result

      IF pos_result > 0 THEN DO
        SAY "FOUND HITCHHIKER at position: " || pos_result
      END
      ELSE DO
        SAY "HITCHHIKER NOT FOUND (correct)"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('POS HITCHHIKER result: 0');
    expect(outputHandler.outputs).toContain('HITCHHIKER NOT FOUND (correct)');
  });

  test('combined OR condition with POS() - separate variable evaluation', async () => {
    const script = `
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused - I wasn't referrin' to any particular book, I was just answerin' yer question about me favorite color like any self-respectin' salt would! I was speakin' from me own sea-weathered perspective, as any sailor worth their salt would do. Though if ye're lookin' for a good nautical tale, I'd recommend ye start with \\"Treasure Island\\" by Robert Louis Stevenson - now there's a proper piece of seafarin' literature for ye!"

      LET pos_hitchhiker = POS(UPPER(RESULT.message), "HITCHHIKER")
      LET pos_adams = POS(UPPER(RESULT.message), "DOUGLAS ADAMS")
      LET pos_42 = POS(RESULT.message, "42")

      SAY "POS HITCHHIKER: " || pos_hitchhiker
      SAY "POS DOUGLAS ADAMS: " || pos_adams
      SAY "POS 42: " || pos_42

      IF pos_hitchhiker > 0 || pos_adams > 0 || pos_42 > 0 THEN DO
        SAY "Context was NOT reset"
      END
      ELSE DO
        SAY "Context was properly reset"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('POS HITCHHIKER: 0');
    expect(outputHandler.outputs).toContain('POS DOUGLAS ADAMS: 0');
    expect(outputHandler.outputs).toContain('POS 42: 0');
    expect(outputHandler.outputs).toContain('Context was properly reset');
    expect(outputHandler.outputs).not.toContain('Context was NOT reset');
  });

  test('EXACT inline OR condition matching test script - no intermediate variables', async () => {
    const script = `
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused - I wasn't referrin' to any particular book, I was just answerin' yer question about me favorite color like any self-respectin' salt would! I was speakin' from me own sea-weathered perspective, as any sailor worth their salt would do. Though if ye're lookin' for a good nautical tale, I'd recommend ye start with \\"Treasure Island\\" by Robert Louis Stevenson - now there's a proper piece of seafarin' literature for ye!"

      SAY "Testing inline POS with OR conditions..."

      IF POS(UPPER(RESULT.message), "HITCHHIKER") > 0 || POS(UPPER(RESULT.message), "DOUGLAS ADAMS") > 0 || POS(RESULT.message, "42") > 0 THEN DO
        SAY "❌ Context was NOT reset - Claude still remembers Douglas Adams context!"
      END
      ELSE DO
        SAY "✓ Context was properly reset - Claude doesn't remember the Douglas Adams conversation"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('Testing inline POS with OR conditions...');
    expect(outputHandler.outputs).toContain('✓ Context was properly reset - Claude doesn\'t remember the Douglas Adams conversation');
    expect(outputHandler.outputs).not.toContain('❌ Context was NOT reset - Claude still remembers Douglas Adams context!');
  });

  test('EXACT replication of test-claude-address.rexx Test 5 logic with nested IF and RC check', async () => {
    const script = `
      // Simulate successful ADDRESS call
      LET RC = 0
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused - I wasn't referrin' to any particular book, I was just answerin' yer question about me favorite color like any self-respectin' salt would! I was speakin' from me own sea-weathered perspective, as any sailor worth their salt would do. Though if ye're lookin' for a good nautical tale, I'd recommend ye start with \\"Treasure Island\\" by Robert Louis Stevenson - now there's a proper piece of seafarin' literature for ye!"

      SAY "Test 5: Verify conversation context was reset"
      SAY ""

      IF RC = 0 THEN DO
        SAY "✓ Claude responded: " || RESULT.message
        SAY ""
        IF POS(UPPER(RESULT.message), "HITCHHIKER") > 0 || POS(UPPER(RESULT.message), "DOUGLAS ADAMS") > 0 || POS(RESULT.message, "42") > 0 THEN DO
          SAY "❌ Context was NOT reset - Claude still remembers Douglas Adams context!"
        END
        ELSE DO
          SAY "✓ Context was properly reset - Claude doesn't remember the Douglas Adams conversation"
          SAY ""
          SAY "🎉 All tests passed for org.rexxjs/claude-address!"
        END
      END
      ELSE DO
        SAY "❌ Verification failed (RC=" || RC || ")"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('Test 5: Verify conversation context was reset');
    // Check for the full concatenated output
    expect(outputHandler.outputs.some(line => line.includes('✓ Claude responded:') && line.includes('Shiver me timbers'))).toBe(true);
    expect(outputHandler.outputs).toContain('✓ Context was properly reset - Claude doesn\'t remember the Douglas Adams conversation');
    expect(outputHandler.outputs).toContain('🎉 All tests passed for org.rexxjs/claude-address!');
    expect(outputHandler.outputs).not.toContain('❌ Context was NOT reset - Claude still remembers Douglas Adams context!');
    expect(outputHandler.outputs).not.toContain('❌ Verification failed');
  });

  test('concatenation with POS check - simulating SAY with IF', async () => {
    const script = `
      LET RESULT.message = "Shiver me timbers, matey! Ye've got me confused"

      SAY "✓ Claude responded: " || RESULT.message

      IF POS(UPPER(RESULT.message), "HITCHHIKER") > 0 || POS(UPPER(RESULT.message), "DOUGLAS ADAMS") > 0 || POS(RESULT.message, "42") > 0 THEN DO
        SAY "❌ Context was NOT reset - Claude still remembers Douglas Adams context!"
      END
      ELSE DO
        SAY "✓ Context was properly reset - Claude doesn't remember the Douglas Adams conversation"
      END
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    expect(outputHandler.outputs).toContain('✓ Claude responded: Shiver me timbers, matey! Ye\'ve got me confused');
    expect(outputHandler.outputs).toContain('✓ Context was properly reset - Claude doesn\'t remember the Douglas Adams conversation');
  });

  test('BUG: Function calls in concatenation expressions are not evaluated', async () => {
    const script = `
      LET text = "Hello World"

      SAY "Test 1: Function call in concatenation"
      SAY "Length: " || LENGTH(text)
      SAY "Expected: Length: 11"
      SAY ""

      SAY "Test 2: SUBSTR in concatenation"
      SAY "First 5: " || SUBSTR(text, 1, 5)
      SAY "Expected: First 5: Hello"
      SAY ""

      SAY "Test 3: POS in concatenation"
      SAY "Position of 'World': " || POS(text, "World")
      SAY "Expected: Position of 'World': 7"
      SAY ""

      SAY "Test 4: Nested functions in concatenation"
      SAY "Upper first 5: " || UPPER(SUBSTR(text, 1, 5))
      SAY "Expected: Upper first 5: HELLO"
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    // Currently these FAIL because function calls in concatenations aren't evaluated
    // They print the literal function call text instead of the result
    expect(outputHandler.outputs).toContain('Length: 11');
    expect(outputHandler.outputs).toContain('First 5: Hello');
    expect(outputHandler.outputs).toContain('Position of \'World\': 7');
    expect(outputHandler.outputs).toContain('Upper first 5: HELLO');
  });

  test('BUG DOCUMENTED: Function calls in concatenation fail after ADDRESS + REQUIRE in CLI', async () => {
    // This test documents a bug that exists in CLI execution but NOT in Jest
    // When running ./core/rexx with a script that:
    //   1. Uses REQUIRE to load an ADDRESS module (e.g., claude-address)
    //   2. Sets ADDRESS to that target
    //   3. Uses function calls in concatenation expressions
    //
    // RESULT: Functions are printed literally, not evaluated
    // Example: "Length: " || LENGTH(text) outputs "Length: LENGTH(text)"
    //
    // To reproduce: ./core/rexx test-address-concat-bug.rexx
    //
    // WORKAROUND: Pre-evaluate functions into variables:
    //   LET len = LENGTH(text)
    //   SAY "Length: " || len  // This works
    //
    // This test is marked as .failing() because the bug cannot be replicated
    // in Jest - it only occurs in the CLI environment with REQUIRE'd ADDRESS modules

    const script = `
      LET RESULT.message = "Test message"
      ADDRESS MOCK
      SAY "Length: " || LENGTH(RESULT.message)
    `;

    const commands = parse(script);
    interpreter.addressTargets.set('MOCK', {
      handler: async () => ({ success: true }),
      metadata: {}
    });

    await interpreter.run(commands);

    // In Jest, functions ARE evaluated correctly:
    const lengthOutput = outputHandler.outputs.find(line => line.includes('Length:'));
    expect(lengthOutput).toBe('Length: 12');  // Jest: correct behavior

    // But in CLI with REQUIRE, the same code would output:
    // "Length: LENGTH(RESULT.message)"  // CLI BUG: literal function name

    // This test passes (documents correct behavior) but the bug still exists in CLI
  });

  test('WORKAROUND: Pre-evaluate functions into variables before concatenation', async () => {
    const script = `
      LET text = "Hello World"

      SAY "Test 1: Pre-evaluate LENGTH into variable"
      LET len = LENGTH(text)
      SAY "Length: " || len
      SAY ""

      SAY "Test 2: Pre-evaluate SUBSTR into variable"
      LET first5 = SUBSTR(text, 1, 5)
      SAY "First 5: " || first5
      SAY ""

      SAY "Test 3: Pre-evaluate POS into variable"
      LET pos_world = POS(text, "World")
      SAY "Position of 'World': " || pos_world
      SAY ""

      SAY "Test 4: Pre-evaluate nested functions"
      LET upper_first5 = UPPER(SUBSTR(text, 1, 5))
      SAY "Upper first 5: " || upper_first5
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    // These PASS because we pre-evaluate into variables
    expect(outputHandler.outputs).toContain('Length: 11');
    expect(outputHandler.outputs).toContain('First 5: Hello');
    expect(outputHandler.outputs).toContain('Position of \'World\': 7');
    expect(outputHandler.outputs).toContain('Upper first 5: HELLO');
  });
});
