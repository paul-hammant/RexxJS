/**
 * ADDRESS HEREDOC aggregation E2E tests with a fake handler.
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS HEREDOC aggregation (fake handler)', () => {
  let interpreter;
  let fakeHandlerCalls;

  beforeEach(() => {
    fakeHandlerCalls = [];
    
    const fakeAddressHandler = async (payload, context, sourceContext) => {
      fakeHandlerCalls.push({ payload, context, sourceContext });
      return { success: true, operation: 'FAKE_OK' };
    };
    
    interpreter = new TestRexxInterpreter({}, {}, {});
    
    // Register fake address handler
    interpreter.addressTargets.set('fake', {
      handler: fakeAddressHandler,
      methods: {},
      metadata: { name: 'Fake Handler' }
    });
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Basic HEREDOC aggregation', () => {
    test('should aggregate content in HEREDOC blocks', async () => {
      const code = `
        ADDRESS fake
        <<BLOCK
        blah BLAH openParensNext (
          indented Blah blah commaNext,
          closeParens onNEXTLINE
        );
        BLOCK
      `;
      
      await executeRexxCode(code);
      
      expect(fakeHandlerCalls).toHaveLength(1);
      expect(fakeHandlerCalls[0].payload).toContain('blah BLAH openParensNext');
      expect(fakeHandlerCalls[0].payload).toContain('indented Blah blah commaNext');
      expect(fakeHandlerCalls[0].payload).toContain('closeParens onNEXTLINE');
      expect(fakeHandlerCalls[0].payload).toContain(');');
    });

    test('should handle multiline code blocks', async () => {
      const code = `
        ADDRESS fake
        <<CODE_BLOCK
        function example() {
          console.log("Hello World");
          return true;
        }
        CODE_BLOCK
      `;
      
      await executeRexxCode(code);
      
      expect(fakeHandlerCalls).toHaveLength(1);
      expect(fakeHandlerCalls[0].payload).toContain('function example()');
      expect(fakeHandlerCalls[0].payload).toContain('console.log("Hello World")');
      expect(fakeHandlerCalls[0].payload).toContain('return true;');
    });

    test('should preserve exact formatting and whitespace', async () => {
      const code = `ADDRESS fake
<<EXACT
  blah BLAH openParensNext (
    indented Blah blah commaNext,
    closeParens onNEXTLINE
  );
EXACT`;
      
      await executeRexxCode(code);
      
      expect(fakeHandlerCalls).toHaveLength(1);
      const payload = fakeHandlerCalls[0].payload;
      
      // Should preserve exact indentation and structure
      expect(payload).toContain('  blah BLAH openParensNext (');
      expect(payload).toContain('    indented Blah blah commaNext,');
      expect(payload).toContain('    closeParens onNEXTLINE');
      expect(payload).toContain('  );');
    });
  });

  describe('Complex content aggregation', () => {
    test('should handle nested structures', async () => {
      const code = `
        ADDRESS fake  
        <<NESTED
        {
          "level1": {
            "level2": {
              "data": "value"
            }
          }
        }
        NESTED
      `;
      
      await executeRexxCode(code);
      
      expect(fakeHandlerCalls).toHaveLength(1);
      expect(fakeHandlerCalls[0].payload).toContain('"level1"');
      expect(fakeHandlerCalls[0].payload).toContain('"level2"');
      expect(fakeHandlerCalls[0].payload).toContain('"data": "value"');
    });
  });
});